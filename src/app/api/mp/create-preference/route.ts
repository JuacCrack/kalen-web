// src/app/api/mp/create-preference/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";

const ORIGIN = "https://www.kalenindumentaria.com.ar";
const BACK_URLS = {
  success: `${ORIGIN}?paystatus=success`,
  pending: `${ORIGIN}?paystatus=pending`,
  failure: `${ORIGIN}?paystatus=failure`,
};
const NOTIFICATION_URL = `${ORIGIN}/api/mp/webhook`;

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function POST(req: Request) {
  try {
    if (!ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, message: "MP_ACCESS_TOKEN no configurado" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, message: "Body inválido" }, { status: 400 });

    const amount = n(body.amount);
    const client = body.client ?? {};
    const payload = body.payload ?? null;
    const order = body.order ?? {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, message: "Monto inválido" }, { status: 400 });
    }

    const itemsRaw = Array.isArray(payload?.items) ? payload.items : [];
    const currency = String(payload?.currency || "ARS");

    const items =
      itemsRaw.length > 0
        ? itemsRaw.map((it: any) => ({
            title: String(it?.title ?? "Producto"),
            quantity: Math.max(1, n(it?.quantity) || 1),
            unit_price: Math.max(0, n(it?.unitPrice) || 0),
            currency_id: currency,
          }))
        : [{ title: "Compra", quantity: 1, unit_price: amount, currency_id: currency }];

    const externalReference =
      order?.orderId != null && String(order.orderId).trim()
        ? `order:${String(order.orderId).trim()}`
        : `tmp:${crypto.randomUUID()}`;

    const mp = await import("mercadopago");
    const MercadoPagoConfig = (mp as any).default;
    const Preference = (mp as any).Preference;

    const mpClient = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const pref = new Preference(mpClient);

    const preferenceBody: any = {
      items,
      external_reference: externalReference,
      payer: {
        email: client?.email ? String(client.email).trim() : undefined,
        name: client?.firstName ? String(client.firstName).trim() : undefined,
        surname: client?.lastName ? String(client.lastName).trim() : undefined,
      },
      back_urls: BACK_URLS,
      auto_return: "approved",
      notification_url: NOTIFICATION_URL,
      metadata: {
        externalReference,
        order: {
          orderId: order?.orderId ?? null,
          orderPublicId: order?.orderPublicId ?? null,
        },
      },
    };

    const created = await pref.create({ body: preferenceBody });

    const prefId = String(created?.id || "").trim();
    if (!prefId) {
      return NextResponse.json({ ok: false, message: "No se pudo obtener preferenceId", created }, { status: 500 });
    }

    return NextResponse.json({ ok: true, preferenceId: prefId, externalReference });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Error creando preferencia", detail: e },
      { status: 500 },
    );
  }
}
