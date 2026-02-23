"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";

export type OrderStage =
  | "review"
  | "mp"
  | "transfer"
  | "cash"
  | "success"
  | "error";

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

function MpCardPaymentForm(props: {
  amount: number;
  currency: string;
  client: { firstName: string; lastName: string; email: string; phone: string };
  orderRef: { orderId?: string | number | null; orderPublicId?: string | null };
  setSubmit: (fn: (() => Promise<any>) | null) => void;
  setPlacing: (v: boolean) => void;
  onPaid: (r: any) => void;
  onFail: (msg: string) => void;
}) {
  const {
    amount,
    currency,
    client,
    orderRef,
    setSubmit,
    setPlacing,
    onPaid,
    onFail,
  } = props;

  const [ready, setReady] = useState(false);
  const initializedRef = useRef(false);
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  useEffect(() => {
    setSubmit(null);
    return () => setSubmit(null);
  }, [setSubmit]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!publicKey) return;
    initMercadoPago(publicKey, { locale: "es-AR" });
    initializedRef.current = true;
  }, [publicKey]);

  const initialization = useMemo(() => {
    const payerEmail = (client?.email ?? "").trim();
    return {
      amount: n(amount),
      payer: payerEmail ? { email: payerEmail } : undefined,
    };
  }, [amount, client?.email]);

  const customization = useMemo(() => {
    return {
      paymentMethods: {
        minInstallments: 1,
        maxInstallments: 1,
        types: {
          included: ["credit_card", "debit_card"],
        },
      },
    };
  }, []);

  const onSubmit = useMemo(() => {
    return (cardData: any, additionalData?: any) => {
      return new Promise<void>(async (resolve, reject) => {
        setPlacing(true);
        try {
          const payload = {
            cardData,
            external_reference:
              orderRef?.orderPublicId ??
              (orderRef?.orderId ? String(orderRef.orderId) : null),
            description: "Compra",
            metadata: {
              orderId: orderRef?.orderId ?? null,
              orderPublicId: orderRef?.orderPublicId ?? null,
              additionalData: additionalData ?? null,
              payer: {
                firstName: client?.firstName ?? "",
                lastName: client?.lastName ?? "",
                email: client?.email ?? "",
                phone: client?.phone ?? "",
              },
            },
          };

          const r = await fetch("/api/mp/card-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const json = await r.json();

          if (!r.ok || !json?.ok) {
            const msg =
              json?.details?.message ||
              json?.details?.error ||
              json?.error ||
              "No se pudo procesar el pago.";
            onFail(String(msg));
            reject(new Error(String(msg)));
            return;
          }

          const status = json?.payment?.status;

          if (status && status !== "approved") {
            const msg = `Pago no aprobado: ${status}`;
            onFail(msg);
            reject(new Error(msg));
            return;
          }

          onPaid({ ok: true, provider: "mercadopago", ...json });
          resolve();
        } catch (e: any) {
          const msg = e?.message
            ? String(e.message)
            : "Error procesando el pago.";
          onFail(msg);
          reject(e);
        } finally {
          setPlacing(false);
        }
      });
    };
  }, [client, orderRef, onFail, onPaid, setPlacing]);

  return (
    <div className="h-full overflow-y-auto">
      <CardPayment
        initialization={initialization as any}
        customization={customization as any}
        onSubmit={onSubmit as any}
        onReady={() => setReady(true)}
        onError={(error: any) => {
          const msg =
            error?.message || "Error en el formulario de Mercado Pago.";
          onFail(String(msg));
        }}
      />
    </div>
  );
}

function TransferPanel(props: {
  currency: string;
  totalWithExtras: number;
  transferProof: File | null;
  setTransferProof: (f: File | null) => void;
}) {
  const { currency, totalWithExtras, transferProof, setTransferProof } = props;
  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="pb-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-900">
              <i className="bi bi-bank text-[20px] leading-none" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900">
                Datos para transferir
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Hacé la transferencia y subí el comprobante (PDF o imagen).
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-[13px] text-slate-700">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Banco</span>
              <span className="font-semibold text-slate-900">
                BANCO GALICIA
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">N° cuenta</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                4051049-1027-1
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">CBU</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                00700276-30004051049110
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Alias</span>
              <span className="font-semibold text-slate-900">KALEN.PABLO</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Titular</span>
              <span className="font-semibold text-slate-900">
                JUAN PABLO OH
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {fmtMoney(totalWithExtras, currency)}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block">
              <div className="text-xs font-semibold text-slate-900">
                Comprobante (JPG/PNG/PDF)
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setTransferProof(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-pink-200/40"
              />
              {transferProof ? (
                <div className="mt-2 text-xs text-slate-600 truncate">
                  {transferProof.name}
                </div>
              ) : null}
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">
              Enviá el comprobante por WhatsApp
            </div>
            <div className="mt-1 text-slate-600">
              Aclarando nombre y número de orden.
            </div>
            <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <i className="bi bi-whatsapp text-[16px] leading-none" />
              +54 9 1164652075
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CashPanel(props: {
  currency: string;
  totalWithExtras: number;
  selectedShippingTitle: string;
}) {
  const { currency, totalWithExtras, selectedShippingTitle } = props;
  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="pb-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-900">
              <i className="bi bi-cash-coin text-[20px] leading-none" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900">
                Pago en efectivo
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Pagás al retirar. Te mostramos el punto seleccionado.
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
            <div className="text-xs font-semibold text-slate-700">Retiro</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {selectedShippingTitle?.trim()
                ? selectedShippingTitle.trim()
                : "Punto de retiro"}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>Total</span>
              <span className="tabular-nums font-semibold text-slate-900">
                {fmtMoney(totalWithExtras, currency)}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <i className="bi bi-whatsapp text-[16px] leading-none" />
              Coordinamos por WhatsApp
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Si necesitás horarios o ubicación exacta, escribinos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmStagePanels(props: {
  stage: OrderStage;
  currency: string;
  amount: number;
  client: { firstName: string; lastName: string; email: string; phone: string };
  orderRef: { orderId?: string | number | null; orderPublicId?: string | null };
  selectedShippingTitle: string;
  totalWithExtras: number;
  transferProof: File | null;
  setTransferProof: (f: File | null) => void;
  placing: boolean;
  setPlacing: (v: boolean) => void;
  purchasePayload: any;
  setMpSubmit: (fn: (() => Promise<any>) | null) => void;
  onPaid: (r?: any) => void;
  onFail: (msg: string) => void;
}) {
  const {
    stage,
    currency,
    amount,
    client,
    orderRef,
    selectedShippingTitle,
    totalWithExtras,
    transferProof,
    setTransferProof,
    setPlacing,
    setMpSubmit,
    onPaid,
    onFail,
  } = props;

  if (stage === "mp") {
    return (
      <MpCardPaymentForm
        amount={n(amount)}
        currency={currency}
        client={client}
        orderRef={orderRef}
        setSubmit={setMpSubmit}
        setPlacing={setPlacing}
        onPaid={(r) => onPaid(r)}
        onFail={(msg) => onFail(msg)}
      />
    );
  }

  if (stage === "transfer") {
    return (
      <TransferPanel
        currency={currency}
        totalWithExtras={totalWithExtras}
        transferProof={transferProof}
        setTransferProof={setTransferProof}
      />
    );
  }

  return (
    <CashPanel
      currency={currency}
      totalWithExtras={totalWithExtras}
      selectedShippingTitle={selectedShippingTitle}
    />
  );
}
