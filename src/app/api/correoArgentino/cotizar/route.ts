import { NextResponse } from "next/server"

export type CotizarPayload = Record<string, unknown>

export type Cotizacion = {
  ok: true
  provider: "mock" | "correo-argentino"
  currency: "ARS"
  total: number
  breakdown: { label: string; amount: number }[]
  serviceType: string
  deliveryType: "homeDelivery" | "agency" | "locker"
  etaDays: { min: number; max: number }
  raw?: unknown
}

export type CotizarError = {
  ok: false
  provider: "mock" | "correo-argentino"
  message: string
  status?: number
  raw?: unknown
}

const getEnv = (key: string) => {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env: ${key}`)
  return v
}

const getEnvOpt = (key: string) => process.env[key] ?? undefined

const toBool = (v: any, fallback = false) => {
  if (typeof v === "boolean") return v
  const s = String(v ?? "").trim().toLowerCase()
  if (!s) return fallback
  if (["1", "true", "yes", "y", "on"].includes(s)) return true
  if (["0", "false", "no", "n", "off"].includes(s)) return false
  return fallback
}

const n = (v: any) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

const MOCK = toBool(getEnvOpt("CORREO_ARGENTINO_MOCK"), true)

const base64 = (s: string) => Buffer.from(s, "utf8").toString("base64")

const mockQuote = (payload: CotizarPayload): Cotizacion => {
  const deliveryType =
    (payload?.["order"] as any)?.["deliveryType"] ??
    (payload?.["deliveryType"] as any) ??
    "homeDelivery"

  return {
    ok: true,
    provider: "mock",
    currency: "ARS",
    total: 7490,
    breakdown: [
      { label: "base", amount: 5900 },
      { label: "handling", amount: 990 },
      { label: "insurance", amount: 600 },
    ],
    serviceType:
      (payload?.["order"] as any)?.["serviceType"] ??
      (payload?.["serviceType"] as any) ??
      "CP",
    deliveryType,
    etaDays: { min: 2, max: 5 },
    raw: { simulated: true },
  }
}

const safeJson = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const safeText = async (res: Response) => {
  try {
    return await res.text()
  } catch {
    return ""
  }
}

const withTimeout = (ms: number) => {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, clear: () => clearTimeout(t) }
}

const getToken = async (baseUrl: string) => {
  const user = getEnv("CORREO_ARGENTINO_MCORREO_USER")
  const password = getEnv("CORREO_ARGENTINO_MCORREO_PASSWORD")
  const timeoutMs = Number(getEnvOpt("CORREO_ARGENTINO_TIMEOUT_MS") ?? "15000") || 15000
  const { signal, clear } = withTimeout(timeoutMs)

  try {
    const res = await fetch(`${baseUrl}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64(`${user}:${password}`)}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    })

    if (!res.ok) {
      const raw = (await safeJson(res)) ?? (await safeText(res))
      return { ok: false as const, status: res.status, raw }
    }

    const raw = await safeJson(res)
    const token = String((raw as any)?.token ?? "")
    if (!token) return { ok: false as const, status: 500, raw }
    return { ok: true as const, token, raw }
  } finally {
    clear()
  }
}

const getCustomerId = async (baseUrl: string, bearer: string) => {
  const existing = getEnvOpt("CORREO_ARGENTINO_MCORREO_CUSTOMER_ID")
  if (existing) return { ok: true as const, customerId: existing, raw: { customerId: existing } }

  const email = getEnvOpt("CORREO_ARGENTINO_MCORREO_ACCOUNT_EMAIL") ?? getEnv("CORREO_ARGENTINO_MCORREO_USER")
  const password =
    getEnvOpt("CORREO_ARGENTINO_MCORREO_ACCOUNT_PASSWORD") ?? getEnv("CORREO_ARGENTINO_MCORREO_PASSWORD")

  const timeoutMs = Number(getEnvOpt("CORREO_ARGENTINO_TIMEOUT_MS") ?? "15000") || 15000
  const { signal, clear } = withTimeout(timeoutMs)

  try {
    const res = await fetch(`${baseUrl}/users/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal,
    })

    const raw = (await safeJson(res)) ?? (await safeText(res))
    if (!res.ok) return { ok: false as const, status: res.status, raw }

    const customerId = String((raw as any)?.customerId ?? "")
    if (!customerId) return { ok: false as const, status: 500, raw }
    return { ok: true as const, customerId, raw }
  } finally {
    clear()
  }
}

const pickBestRate = (rates: any[]) => {
  const norm = rates
    .map((r) => {
      const price = Number(r?.price ?? r?.amount ?? r?.total) || 0
      return { r, price }
    })
    .filter((x) => x.price > 0)

  if (!norm.length) return null
  norm.sort((a, b) => a.price - b.price)
  return norm[0]?.r ?? null
}

const normalizePayload = (payload: CotizarPayload) => {
  const p: any = { ...(payload as any) }

  const origin = String(p.postalCodeOrigin ?? p.cpOrigin ?? p.originPostalCode ?? p.origin?.postalCode ?? "").trim()
  p.postalCodeOrigin = origin || "1406"

  const dest = String(p.postalCodeDestination ?? p.postalCode ?? p.cp ?? p.destinationPostalCode ?? p.destination?.postalCode ?? "").trim()
  if (dest) p.postalCodeDestination = dest

  const deliveredType = String(p.deliveredType ?? p.deliveryType ?? "D").trim().toUpperCase()
  p.deliveredType = deliveredType === "S" ? "S" : "D"

  const w =
    n(p?.dimensions?.weight) ||
    n(p?.weight) ||
    n(p?.weightGrams) ||
    n(p?.grams) ||
    n(p?.pesoGramos) ||
    0

  p.dimensions = typeof p.dimensions === "object" && p.dimensions ? { ...(p.dimensions as any) } : {}
  p.dimensions.weight = Math.max(1, w || 100)

  return p as CotizarPayload
}

const cotizarCorreoArgentino = async (payload: CotizarPayload): Promise<Cotizacion | CotizarError> => {
  if (MOCK) return mockQuote(payload)

  const baseUrl = (process.env.CORREO_ARGENTINO_MCORREO_BASE_URL ?? "https://apitest.correoargentino.com.ar/micorreo/v1")
    .replace(/\/$/, "")

  const tokenRes = await getToken(baseUrl)
  if (!tokenRes.ok) {
    return { ok: false, provider: "correo-argentino", message: "Auth failed", status: tokenRes.status, raw: tokenRes.raw }
  }

  const customerRes = await getCustomerId(baseUrl, tokenRes.token)
  if (!customerRes.ok) {
    return {
      ok: false,
      provider: "correo-argentino",
      message: "Customer validation failed",
      status: customerRes.status,
      raw: customerRes.raw,
    }
  }

  const timeoutMs = Number(getEnvOpt("CORREO_ARGENTINO_TIMEOUT_MS") ?? "15000") || 15000
  const { signal, clear } = withTimeout(timeoutMs)

  try {
    const normalized = normalizePayload(payload)
    const reqBody = { ...(normalized as any), customerId: customerRes.customerId }

    if (!String((reqBody as any)?.postalCodeDestination ?? "").trim()) {
      return { ok: false, provider: "correo-argentino", message: "Missing postalCodeDestination", status: 400, raw: reqBody }
    }

    const res = await fetch(`${baseUrl}/rates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenRes.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(reqBody),
      cache: "no-store",
      signal,
    })

    const raw = (await safeJson(res)) ?? (await safeText(res))

    if (!res.ok) {
      return { ok: false, provider: "correo-argentino", message: "Quote request failed", status: res.status, raw }
    }

    const rates = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.rates) ? (raw as any)?.rates : []
    const best = pickBestRate(rates) ?? (rates[0] ?? null)

    const total = Number(best?.price ?? (raw as any)?.price ?? (raw as any)?.total ?? 0) || 0
    const deliveredType = String(best?.deliveredType ?? (reqBody as any)?.deliveredType ?? "D")
    const deliveryType = deliveredType === "S" ? "agency" : "homeDelivery"
    const etaMin = Number(best?.deliveryTimeMin ?? best?.etaMin ?? 2) || 2
    const etaMax = Number(best?.deliveryTimeMax ?? best?.etaMax ?? 5) || 5
    const serviceType = String(best?.productType ?? best?.productName ?? (reqBody as any)?.serviceType ?? "CP")

    return {
      ok: true,
      provider: "correo-argentino",
      currency: "ARS",
      total,
      breakdown: total ? [{ label: "total", amount: total }] : [],
      serviceType,
      deliveryType: deliveryType as any,
      etaDays: { min: etaMin, max: etaMax },
      raw,
    }
  } finally {
    clear()
  }
}

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => null)) as CotizarPayload | null
    if (!payload || typeof payload !== "object") {
      const out: CotizarError = { ok: false, provider: "correo-argentino", message: "Invalid JSON body", status: 400 }
      return NextResponse.json(out, { status: 400 })
    }

    const out = await cotizarCorreoArgentino(payload)
    const status = out.ok ? 200 : ("status" in out ? out.status ?? 500 : 500)
    return NextResponse.json(out, { status })
  } catch (e: any) {
    const out: CotizarError = {
      ok: false,
      provider: "correo-argentino",
      message: e?.message || "Unexpected error",
      status: 500,
    }
    return NextResponse.json(out, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, provider: "correo-argentino", endpoints: { POST: "/api/correoArgentino/cotizar" } },
    { status: 200 }
  )
}
