"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ShippingMethod = "pickup" | "shipping";
type PaymentMethod = "mercadopago" | "transfer" | "cash";
type AccordionKey = "client" | "shipping" | "payment" | null;

type CotizarPayload = Record<string, unknown>;
type Cotizacion = {
  ok: true;
  provider: "mock" | "correo-argentino";
  currency: "ARS";
  total: number;
  breakdown: { label: string; amount: number }[];
  serviceType: string;
  deliveryType: "homeDelivery" | "agency" | "locker";
  etaDays: { min: number; max: number };
  raw?: unknown;
};
type CotizarError = {
  ok: false;
  provider: "mock" | "correo-argentino";
  message: string;
  status?: number;
  raw?: unknown;
};

const AR_PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán",
] as const;

const normalizeCP = (v: string) =>
  String(v ?? "")
    .replace(/[^\d]/g, "")
    .slice(0, 8);

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  disabled,
  as = "input",
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  as?: "input" | "select";
  options?: { label: string; value: string }[];
}) => (
  <label className="block">
    <div className="text-xs font-semibold text-slate-900">{label}</div>
    {as === "select" ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-pink-200/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
      >
        {(options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-pink-200/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
      />
    )}
  </label>
);

const CardRadio = ({
  active,
  title,
  desc,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  icon: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "w-full rounded-2xl border px-4 py-3 text-left transition",
      "hover:shadow-sm active:scale-[0.99]",
      active
        ? "border-[#fe62b2]/50 bg-[#fe62b2]/5 ring-4 ring-[#fe62b2]/10"
        : "border-slate-200 bg-white hover:border-[#fe62b2]/30",
    ].join(" ")}
    aria-pressed={active}
  >
    <div className="flex items-start gap-3">
      <div
        className={[
          "mt-[2px] inline-flex h-9 w-9 items-center justify-center rounded-xl",
          active ? "bg-[#fe62b2]/10" : "bg-slate-100",
        ].join(" ")}
      >
        <i
          className={[
            "bi",
            icon,
            "text-[18px] leading-none",
            active ? "text-[#fe62b2]" : "text-slate-700",
          ].join(" ")}
        />
      </div>
      <div className="min-w-0">
        <div
          className={[
            "text-sm font-semibold",
            active ? "text-[#fe62b2]" : "text-slate-900",
          ].join(" ")}
        >
          {title}
        </div>
        <div
          className={[
            "mt-0.5 text-xs",
            active ? "text-[#fe62b2]/80" : "text-slate-600",
          ].join(" ")}
        >
          {desc}
        </div>
      </div>
      <div className="ml-auto pl-2">
        <span
          className={[
            "inline-flex h-5 w-5 items-center justify-center rounded-md border",
            active
              ? "border-[#fe62b2] bg-[#fe62b2] text-white"
              : "border-slate-200 bg-white text-transparent",
          ].join(" ")}
        >
          <i className="bi bi-check-lg text-[14px] leading-none" />
        </span>
      </div>
    </div>
  </button>
);

const Section = ({
  open,
  onToggle,
  title,
  leftIcon,
  done,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  leftIcon: string;
  done: boolean;
  children: React.ReactNode;
}) => {
  const stateStyles = done
    ? {
        wrap: "border-emerald-200 bg-emerald-50/20",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: "bi-check-lg",
        ring: "focus-visible:ring-emerald-200/60",
      }
    : {
        wrap: "border-slate-200 bg-white",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        icon: "bi-chevron-right",
        ring: "focus-visible:ring-pink-200/40",
      };
  return (
    <div
      className={["rounded-2xl border shadow-sm", stateStyles.wrap].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex w-full items-center justify-between gap-3 px-4 py-4 text-left outline-none focus-visible:ring-4 rounded-2xl",
          stateStyles.ring,
        ].join(" ")}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <i className={["bi", leftIcon].join(" ")} />
          {title}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
              stateStyles.badge,
            ].join(" ")}
          >
            <i
              className={[
                "bi",
                stateStyles.icon,
                "text-[14px] leading-none",
              ].join(" ")}
            />
          </span>
          <span
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition",
              open ? "rotate-180" : "",
            ].join(" ")}
          >
            <i className="bi bi-chevron-down text-[16px] leading-none" />
          </span>
        </div>
      </button>
      <div className={[open ? "grid" : "hidden", "px-4 pb-4"].join(" ")}>
        {children}
      </div>
    </div>
  );
};

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const fmtMoney = (v: any, currency = "ARS") => {
  const val = n(v);
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  } catch {
    return `$${val}`;
  }
};

const calcWeightGrams = (items: any[]) => {
  let total = 0;
  for (const it of items ?? []) {
    const q = Math.max(1, n(it?.quantity));
    const w =
      n(it?.weightGrams) ||
      n(it?.weight_g) ||
      n(it?.weight) ||
      n(it?.variant?.weightGrams) ||
      n(it?.variant?.weight_g) ||
      n(it?.variant?.weight) ||
      0;
    total += q * w;
  }
  return total > 0 ? total : 1000;
};

const pickOriginCp = (p: any) =>
  normalizeCP(
    String(
      p?.originPostalCode ??
        p?.postalCodeOrigin ??
        p?.cpOrigin ??
        p?.cpOrigen ??
        p?.originCp ??
        p?.origenCp ??
        "",
    ),
  );

const buildCotizarPayload = (args: {
  originCp: string;
  destCp: string;
  items: any[];
}) => {
  const postalCodeOrigin = normalizeCP(args.originCp);
  const postalCodeDestination = normalizeCP(args.destCp);
  const deliveredType = "D";
  const weight = calcWeightGrams(args.items);
  return {
    postalCodeOrigin,
    postalCodeDestination,
    deliveredType,
    dimensions: { weight },
  } as CotizarPayload;
};

async function cotizarViaApi(
  payload: CotizarPayload,
): Promise<Cotizacion | CotizarError> {
  const res = await fetch("/api/correoArgentino/cotizar", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const raw = await res.json().catch(() => null);
  if (raw && typeof raw === "object" && "ok" in (raw as any))
    return raw as Cotizacion | CotizarError;
  if (!res.ok)
    return {
      ok: false,
      provider: "correo-argentino",
      message: "Quote request failed",
      status: res.status,
      raw,
    };
  return {
    ok: false,
    provider: "correo-argentino",
    message: "Invalid response",
    status: 500,
    raw,
  };
}

const QuoteUx = ({
  state,
  currency,
}: {
  state:
    | { kind: "idle"; hint: string }
    | { kind: "loading"; origin: string; dest: string }
    | { kind: "ok"; quote: Cotizacion }
    | { kind: "error"; msg: string };
  currency: string;
}) => {
  const pill =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm";
  const shimmer =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(90deg,transparent,rgba(15,23,42,.06),transparent)] before:animate-[shimmer_1.2s_infinite]";
  if (state.kind === "idle") {
    return (
      <div className={`${pill} border-slate-200 bg-slate-50 text-slate-700`}>
        <i className="bi bi-info-circle text-[12px] leading-none text-slate-500" />
        <span>{state.hint}</span>
      </div>
    );
  }
  if (state.kind === "loading") {
    return (
      <div
        className={`${pill} ${shimmer} border-slate-200 bg-white text-slate-700`}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300/70 border-t-slate-600 animate-spin" />
        </span>
        <span>Calculando envío…</span>
        <span className="ml-1 tabular-nums text-slate-500">
          {state.origin} → {state.dest}
        </span>
      </div>
    );
  }
  if (state.kind === "ok") {
    const q = state.quote;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`${pill} border-emerald-200 bg-emerald-50/40 text-emerald-800`}
        >
          <i className="bi bi-truck text-[12px] leading-none text-emerald-700" />
          <span>Envío {fmtMoney(q.total, q.currency || currency)}</span>
        </div>
        <div className={`${pill} border-slate-200 bg-white text-slate-700`}>
          <i className="bi bi-clock text-[12px] leading-none text-slate-500" />
          <span>
            {q.etaDays.min}-{q.etaDays.max} días
          </span>
        </div>
        {q.serviceType ? (
          <div className={`${pill} border-slate-200 bg-white text-slate-700`}>
            <i className="bi bi-tag text-[12px] leading-none text-slate-500" />
            <span className="truncate max-w-[220px]">{q.serviceType}</span>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div className={`${pill} border-rose-200 bg-rose-50/40 text-rose-800`}>
      <i className="bi bi-exclamation-triangle text-[12px] leading-none text-rose-700" />
      <span className="truncate">{state.msg}</span>
    </div>
  );
};

const CheckoutStep = ({
  openKey,
  toggle,
  client,
  setClient,
  shippingMethod,
  setShippingMethod,
  shipping,
  setShipping,
  paymentMethod,
  setPaymentMethod,
  clientDone,
  shippingDone,
  paymentDone,
  totalPrice,
  currency,
  shippingsMetods,
  onShippingCostChange,
  onShippingSelectionChange,
}: {
  onShippingSelectionChange?: (p: {
    key: string;
    title: string;
    cost: number;
    type: "pickup" | "shipping";
  }) => void;
  openKey: AccordionKey;
  toggle: (k: Exclude<AccordionKey, null>) => void;
  client: { firstName: string; lastName: string; email: string; phone: string };
  setClient: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }>
  >;
  shippingMethod: ShippingMethod;
  setShippingMethod: React.Dispatch<React.SetStateAction<ShippingMethod>>;
  shipping: {
    country: string;
    province: string;
    city: string;
    street: string;
    number: string;
    postalCode: string;
    notes: string;
  };
  setShipping: React.Dispatch<
    React.SetStateAction<{
      country: string;
      province: string;
      city: string;
      street: string;
      number: string;
      postalCode: string;
      notes: string;
    }>
  >;
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  clientDone: boolean;
  shippingDone: boolean;
  paymentDone: boolean;
  totalPrice: any;
  currency: string;
  shippingsMetods?: any[];
  onShippingCostChange?: (
    v: number,
    meta?: { methodKey?: string; shippingPickupType?: string; method?: any },
  ) => void;
}) => {
  const sections = useMemo(
    () => (Array.isArray(shippingsMetods) ? shippingsMetods : []),
    [shippingsMetods],
  );
  const pickupSection = useMemo(
    () =>
      sections.find(
        (s: any) =>
          String(s?.shipping_pickup_type || "").toLowerCase() === "pickup",
      ),
    [sections],
  );
  const shipSection = useMemo(
    () =>
      sections.find((s: any) =>
        ["ship", "shipping"].includes(
          String(s?.shipping_pickup_type || "").toLowerCase(),
        ),
      ),
    [sections],
  );
  const pickupMethods = useMemo(
    () => (Array.isArray(pickupSection?.methods) ? pickupSection.methods : []),
    [pickupSection],
  );
  const shipMethods = useMemo(
    () => (Array.isArray(shipSection?.methods) ? shipSection.methods : []),
    [shipSection],
  );
  const [selectedPickupKey, setSelectedPickupKey] = useState<string>("");
  const [selectedShipKey, setSelectedShipKey] = useState<string>("");
  const pickupTitle = String(pickupSection?.section_title || "Retirar por");
  const shipTitle = String(shipSection?.section_title || "Envío a domicilio");
  const getCost = (m: any) =>
    n(m?.order?.shipping_cost_customer ?? m?.order?.shipping_cost ?? 0);

  const [originCp, setOriginCp] = useState<string>(() =>
    pickOriginCp((globalThis as any)?.__PURCHASE__ ?? null),
  );
  const [quote, setQuote] = useState<Cotizacion | null>(null);
  const [quoteState, setQuoteState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [quoteMsg, setQuoteMsg] = useState<string>(
    "Ingresá tu CP para calcular el envío",
  );
  const reqIdRef = useRef(0);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (!paymentMethod) setPaymentMethod("transfer");
  }, [paymentMethod, setPaymentMethod]);

  useEffect(() => {
    if (shippingMethod === "pickup") {
      if (!selectedPickupKey && pickupMethods[0]?.key != null)
        setSelectedPickupKey(String(pickupMethods[0].key));
    } else {
      if (!selectedShipKey && shipMethods[0]?.key != null)
        setSelectedShipKey(String(shipMethods[0].key));
    }
  }, [
    shippingMethod,
    pickupMethods,
    shipMethods,
    selectedPickupKey,
    selectedShipKey,
  ]);

  useEffect(() => {
    if (shippingMethod === "shipping" && paymentMethod === "cash")
      setPaymentMethod("transfer");
  }, [shippingMethod, paymentMethod, setPaymentMethod]);

  const selectedMethod = useMemo(
    () =>
      shippingMethod === "pickup"
        ? pickupMethods.find(
            (m: any) => String(m?.key || "") === selectedPickupKey,
          )
        : shipMethods.find(
            (m: any) => String(m?.key || "") === selectedShipKey,
          ),
    [
      shippingMethod,
      pickupMethods,
      shipMethods,
      selectedPickupKey,
      selectedShipKey,
    ],
  );

  const shippingCostFromCms = useMemo(
    () => (selectedMethod ? getCost(selectedMethod) : 0),
    [selectedMethod],
  );

  const destCp = useMemo(
    () => normalizeCP(shipping.postalCode),
    [shipping.postalCode],
  );
  const originCpNorm = useMemo(() => normalizeCP(originCp), [originCp]);

  const canQuote = useMemo(
    () =>
      shippingMethod === "shipping" && Boolean(destCp) && Boolean(originCpNorm),
    [shippingMethod, destCp, originCpNorm],
  );

  const payload = useMemo(
    () =>
      buildCotizarPayload({
        originCp: originCpNorm,
        destCp,
        items: (selectedMethod?.order?.items ??
          selectedMethod?.items ??
          []) as any[],
      }),
    [originCpNorm, destCp, selectedMethod],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (shippingMethod !== "shipping") {
      setQuote(null);
      setQuoteState("idle");
      setQuoteMsg("Elegí un método de envío");
      return;
    }

    if (!originCpNorm || !destCp) {
      setQuote(null);
      setQuoteState("idle");
      setQuoteMsg(
        !originCpNorm
          ? "Ingresá CP de origen"
          : "Ingresá tu CP para calcular el envío",
      );
      return;
    }

    setQuoteState("loading");
    setQuoteMsg("");

    debounceRef.current = setTimeout(async () => {
      const myId = ++reqIdRef.current;
      const out = await cotizarViaApi(payload);
      if (myId !== reqIdRef.current) return;

      if (out.ok) {
        setQuote(out);
        setQuoteState("ok");
      } else {
        setQuote(null);
        setQuoteState("error");
        setQuoteMsg(
          ("message" in out ? out.message : undefined) ||
            "No pudimos cotizar el envío",
        );
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [shippingMethod, originCpNorm, destCp, payload]);

  const effectiveShippingCost = useMemo(() => {
    if (shippingMethod !== "shipping") return 0;
    if (quoteState === "ok" && quote?.ok) return n(quote.total);
    return n(shippingCostFromCms);
  }, [shippingMethod, quoteState, quote, shippingCostFromCms]);

  useEffect(() => {
    onShippingCostChange?.(n(effectiveShippingCost), {
      methodKey: String(selectedMethod?.key ?? ""),
      shippingPickupType: String(
        selectedMethod?.order?.shipping_pickup_type ??
          (shippingMethod === "pickup" ? "pickup" : "ship"),
      ),
      method: selectedMethod,
    });
  }, [
    effectiveShippingCost,
    onShippingCostChange,
    selectedMethod,
    shippingMethod,
  ]);

  useEffect(() => {
    if (!selectedMethod) return;
    const ui = selectedMethod?.ui ?? {};
    const title = String(ui?.title || selectedMethod?.key || "");
    onShippingSelectionChange?.({
      key: String(selectedMethod?.key ?? ""),
      title,
      cost: n(effectiveShippingCost),
      type: shippingMethod,
    });
  }, [
    selectedMethod,
    effectiveShippingCost,
    shippingMethod,
    onShippingSelectionChange,
  ]);

  const finalTotal = useMemo(
    () => n(totalPrice) + n(effectiveShippingCost),
    [totalPrice, effectiveShippingCost],
  );

  const renderMethod = (
    m: any,
    active: boolean,
    onClick: () => void,
    icon: string,
  ) => {
    const ui = m?.ui ?? {};
    const title = String(ui?.title || m?.key || "");
    const descParts = [
      ui?.desc,
      ui?.hours
        ? Array.isArray(ui.hours)
          ? ui.hours.join(" · ")
          : String(ui.hours)
        : null,
    ]
      .filter(Boolean)
      .map(String);
    const desc = descParts.join(" · ") || "";
    const priceLabel = String(ui?.price_label || "");
    const cost = getCost(m);
    const showCost =
      cost > 0 && !priceLabel ? fmtMoney(cost, currency) : priceLabel;

    return (
      <button
        key={String(m?.key || title)}
        type="button"
        onClick={onClick}
        className={[
          "w-full rounded-2xl border px-4 py-3 text-left transition",
          "hover:shadow-sm active:scale-[0.99]",
          active
            ? "border-[#fe62b2]/50 bg-[#fe62b2]/5 ring-4 ring-[#fe62b2]/10"
            : "border-slate-200 bg-white hover:border-[#fe62b2]/30",
        ].join(" ")}
        aria-pressed={active}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-[2px] inline-flex h-9 w-9 items-center justify-center rounded-xl",
              active ? "bg-[#fe62b2]/10" : "bg-slate-100",
            ].join(" ")}
          >
            <i
              className={[
                "bi",
                icon,
                "text-[18px] leading-none",
                active ? "text-[#fe62b2]" : "text-slate-700",
              ].join(" ")}
            />
          </div>
          <div className="min-w-0">
            <div
              className={[
                "text-sm font-semibold",
                active ? "text-[#fe62b2]" : "text-slate-900",
              ].join(" ")}
            >
              {title}
            </div>
            {desc ? (
              <div
                className={[
                  "mt-0.5 text-xs",
                  active ? "text-[#fe62b2]/80" : "text-slate-600",
                ].join(" ")}
              >
                {desc}
              </div>
            ) : null}
            {showCost ? (
              <div
                className={[
                  "mt-1 text-xs font-semibold",
                  active ? "text-[#fe62b2]" : "text-slate-900",
                ].join(" ")}
              >
                {showCost}
              </div>
            ) : null}
          </div>
          <div className="ml-auto pl-2">
            <span
              className={[
                "inline-flex h-5 w-5 items-center justify-center rounded-md border",
                active
                  ? "border-[#fe62b2] bg-[#fe62b2] text-white"
                  : "border-slate-200 bg-white text-transparent",
              ].join(" ")}
            >
              <i className="bi bi-check-lg text-[14px] leading-none" />
            </span>
          </div>
        </div>
      </button>
    );
  };

  const pickupMissing = shippingMethod === "pickup" && !selectedPickupKey;
  const shipMissing = shippingMethod === "shipping" && !selectedShipKey;

  const provinceOptions = useMemo(
    () => [
      { label: "Seleccionar", value: "" },
      ...AR_PROVINCES.map((p) => ({ label: p, value: p })),
    ],
    [],
  );

  const quoteUxState = useMemo(() => {
    if (shippingMethod !== "shipping")
      return { kind: "idle", hint: "Elegí un método de envío" } as const;
    if (!originCpNorm || !destCp)
      return {
        kind: "idle",
        hint: !originCpNorm
          ? "Ingresá CP de origen"
          : "Ingresá tu CP para calcular el envío",
      } as const;
    if (quoteState === "loading")
      return { kind: "loading", origin: originCpNorm, dest: destCp } as const;
    if (quoteState === "ok" && quote?.ok) return { kind: "ok", quote } as const;
    if (quoteState === "error")
      return {
        kind: "error",
        msg: quoteMsg || "No pudimos cotizar el envío",
      } as const;
    return {
      kind: "idle",
      hint: "Ingresá tu CP para calcular el envío",
    } as const;
  }, [shippingMethod, originCpNorm, destCp, quoteState, quote, quoteMsg]);

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="flex flex-col gap-6 pb-2">
        <div className="space-y-4">
          <Section
            open={openKey === "client"}
            onToggle={() => toggle("client")}
            title="Cliente"
            leftIcon="bi-person"
            done={clientDone}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Nombre"
                value={client.firstName}
                onChange={(v) => setClient((s) => ({ ...s, firstName: v }))}
                autoComplete="given-name"
              />
              <Field
                label="Apellido"
                value={client.lastName}
                onChange={(v) => setClient((s) => ({ ...s, lastName: v }))}
                autoComplete="family-name"
              />
              <Field
                label="Email"
                type="email"
                value={client.email}
                onChange={(v) => setClient((s) => ({ ...s, email: v }))}
                autoComplete="email"
              />
              <Field
                label="Teléfono"
                value={client.phone}
                onChange={(v) => setClient((s) => ({ ...s, phone: v }))}
                autoComplete="tel"
              />
            </div>
          </Section>

          <Section
            open={openKey === "shipping"}
            onToggle={() => toggle("shipping")}
            title="Envío"
            leftIcon="bi-truck"
            done={shippingDone && !pickupMissing && !shipMissing}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CardRadio
                active={shippingMethod === "pickup"}
                title="Retiro"
                desc="Elegí una opción"
                icon="bi-shop"
                onClick={() => setShippingMethod("pickup")}
              />
              <CardRadio
                active={shippingMethod === "shipping"}
                title="Envío"
                desc="Elegí método"
                icon="bi-geo-alt"
                onClick={() => setShippingMethod("shipping")}
              />
            </div>

            {shippingMethod === "pickup" ? (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-900">
                    {pickupTitle}
                  </div>
                  {pickupMissing ? (
                    <div className="text-xs font-semibold text-rose-600">
                      Elegí una opción
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3">
                  {pickupMethods.length ? (
                    pickupMethods.map((m: any) =>
                      renderMethod(
                        m,
                        selectedPickupKey === String(m?.key || ""),
                        () => setSelectedPickupKey(String(m?.key || "")),
                        "bi-shop",
                      ),
                    )
                  ) : (
                    <div className="text-xs text-slate-600">
                      No hay opciones.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {shippingMethod === "shipping" ? (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-900">
                    {shipTitle}
                  </div>
                  {shipMissing ? (
                    <div className="text-xs font-semibold text-rose-600">
                      Elegí una opción
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3">
                  {shipMethods.length ? (
                    shipMethods.map((m: any) =>
                      renderMethod(
                        m,
                        selectedShipKey === String(m?.key || ""),
                        () => setSelectedShipKey(String(m?.key || "")),
                        "bi-truck",
                      ),
                    )
                  ) : (
                    <div className="text-xs text-slate-600">
                      No hay opciones.
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="País"
                    as="select"
                    disabled
                    value={shipping.country}
                    onChange={(v) => setShipping((s) => ({ ...s, country: v }))}
                    options={[{ label: "Argentina", value: "AR" }]}
                  />
                  <Field
                    label="Provincia"
                    as="select"
                    value={shipping.province}
                    onChange={(v) =>
                      setShipping((s) => ({ ...s, province: v }))
                    }
                    options={provinceOptions}
                  />
                  <Field
                    label="Ciudad"
                    value={shipping.city}
                    onChange={(v) => setShipping((s) => ({ ...s, city: v }))}
                  />
                  <div className="grid grid-cols-[1fr_120px] gap-3 sm:col-span-2">
                    <Field
                      label="Calle"
                      value={shipping.street}
                      onChange={(v) =>
                        setShipping((s) => ({ ...s, street: v }))
                      }
                    />
                    <Field
                      label="Número"
                      value={shipping.number}
                      onChange={(v) =>
                        setShipping((s) => ({ ...s, number: v }))
                      }
                    />
                  </div>

                  <Field
                    label="CP Origen"
                    value={originCp}
                    onChange={(v) => setOriginCp(v)}
                    placeholder="Ej: 1425"
                    autoComplete="postal-code"
                  />

                  <Field
                    label="Código postal"
                    value={shipping.postalCode}
                    onChange={(v) =>
                      setShipping((s) => ({ ...s, postalCode: v }))
                    }
                    placeholder="Ej: 1425"
                    autoComplete="postal-code"
                  />

                  <div className="sm:col-span-2">
                    <div className="mt-1">
                      <QuoteUx
                        state={quoteUxState as any}
                        currency={currency}
                      />
                    </div>
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Envío</span>
                        <span className="tabular-nums font-semibold">
                          {fmtMoney(effectiveShippingCost, currency)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                        <span className="font-semibold">Total</span>
                        <span className="tabular-nums font-semibold">
                          {fmtMoney(finalTotal, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <label className="block sm:col-span-2">
                    <div className="text-xs font-semibold text-slate-900">
                      Notas
                    </div>
                    <textarea
                      value={shipping.notes}
                      onChange={(e) =>
                        setShipping((s) => ({ ...s, notes: e.target.value }))
                      }
                      className="mt-2 w-full min-h-[92px] resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-pink-200/40"
                      placeholder="Timbre, piso, referencias, etc."
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </Section>

          <Section
            open={openKey === "payment"}
            onToggle={() => toggle("payment")}
            title="Método de pago"
            leftIcon="bi-credit-card"
            done={paymentDone}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CardRadio
                active={paymentMethod === "transfer"}
                title="Transferencia"
                desc="Datos al finalizar"
                icon="bi-bank"
                onClick={() => setPaymentMethod("transfer")}
              />
              <CardRadio
                active={paymentMethod === "mercadopago"}
                title="Mercado Pago"
                desc="Tarjeta o saldo"
                icon="bi-shield-check"
                onClick={() => setPaymentMethod("mercadopago")}
              />
              {shippingMethod === "pickup" ? (
                <CardRadio
                  active={paymentMethod === "cash"}
                  title="Efectivo"
                  desc="Pagás al retirar"
                  icon="bi-cash-coin"
                  onClick={() => setPaymentMethod("cash")}
                />
              ) : null}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default CheckoutStep;
