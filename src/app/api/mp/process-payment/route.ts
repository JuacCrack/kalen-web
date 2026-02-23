// src/app/api/mp/process-payment/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const safeText = async (res: Response) => {
  try {
    return await res.text();
  } catch {
    return "";
  }
};

const safeJson = async (res: Response) => {
  const t = await safeText(res);
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return { raw: t };
  }
};

export async function POST(req: Request) {
  try {
    if (!ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, message: "MP_ACCESS_TOKEN no configurado" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, message: "Body inválido" }, { status: 400 });

    const amount = n(body.amount);
    const preferenceId = typeof body.preferenceId === "string" ? body.preferenceId.trim() : "";
    const selectedPaymentMethod = body.selectedPaymentMethod ?? null;
    const formData = body.formData ?? null;
    const payload = body.payload ?? null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, message: "Monto inválido" }, { status: 400 });
    }

    const selectedId = String(
      selectedPaymentMethod?.id ?? selectedPaymentMethod?.payment_method_id ?? selectedPaymentMethod ?? "",
    ).trim();

    if (selectedId === "wallet_purchase" || selectedId === "mercado_pago") {
      return NextResponse.json({
        ok: false,
        message: "Este método (dinero en cuenta) no se procesa por /process-payment. Usá preferenceId + redirect.",
        detail: { selectedPaymentMethod },
      });
    }

    const token = String(formData?.token ?? "").trim();
    const payment_method_id = String(formData?.payment_method_id ?? "").trim();
    const issuer_id = formData?.issuer_id != null ? String(formData.issuer_id).trim() : undefined;
    const installments = formData?.installments != null ? Number(formData.installments) : undefined;

    const payerEmail =
      String(formData?.payer?.email ?? payload?.client?.email ?? payload?.payer?.email ?? "").trim() || undefined;

    const idType = String(formData?.payer?.identification?.type ?? "").trim() || undefined;
    const idNumber = String(formData?.payer?.identification?.number ?? "").trim() || undefined;

    if (!token || !payment_method_id || !payerEmail) {
      return NextResponse.json(
        {
          ok: false,
          message: "Faltan datos para procesar el pago con tarjeta (token/payment_method_id/email).",
          detail: {
            hasToken: !!token,
            hasPaymentMethodId: !!payment_method_id,
            hasEmail: !!payerEmail,
          },
        },
        { status: 400 },
      );
    }

    const externalReference =
      String(payload?.order?.orderId ?? payload?.orderId ?? payload?.external_reference ?? "").trim() ||
      (preferenceId ? `pref:${preferenceId}` : `tmp:${crypto.randomUUID()}`);

    const mpBody: any = {
      transaction_amount: amount,
      token,
      payment_method_id,
      payer: {
        email: payerEmail,
        ...(idType && idNumber ? { identification: { type: idType, number: idNumber } } : {}),
      },
      ...(issuer_id ? { issuer_id } : {}),
      ...(Number.isFinite(installments as any) ? { installments } : {}),
      external_reference: externalReference,
      metadata: {
        preferenceId: preferenceId || null,
        externalReference,
      },
    };

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(mpBody),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error_description ||
        data?.error ||
        "El pago no pudo procesarse. Revisá los datos e intentá nuevamente.";
      return NextResponse.json({ ok: false, message: msg, detail: data }, { status: res.status });
    }

    const status = String(data?.status ?? "").trim();
    const id = data?.id ?? null;

    const ok = status === "approved" || status === "in_process" || status === "pending";
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "El pago no quedó en un estado válido.", detail: data },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, status, id, detail: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "Error procesando el pago", detail: e },
      { status: 500 },
    );
  }
}
