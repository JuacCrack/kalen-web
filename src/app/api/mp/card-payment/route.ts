import { NextResponse } from "next/server";

type CardData = {
  token: string;
  issuer_id?: string;
  payment_method_id: string;
  transaction_amount: number;
  payment_method_option_id?: string | null;
  processing_mode?: string | null;
  installments: number;
  payer: {
    email: string;
    identification?: { type?: string; number?: string };
  };
};

type Body = {
  cardData: CardData;
  metadata?: any;
  external_reference?: string | null;
  description?: string | null;
  expected?: {
    amount: number;
    currency: string;
    installments?: number;
  };
  orderPayload?: any;
};

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function POST(req: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const storeUrl = process.env.CREATE_ORDER_API_URL;
  const storeToken = process.env.STORE_API_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "MP_ACCESS_TOKEN missing" }, { status: 500 });
  }
  if (!storeUrl || !storeToken) {
    return NextResponse.json({ ok: false, error: "STORE_API_URL/STORE_API_TOKEN missing" }, { status: 500 });
  }

  const body = (await req.json()) as Body;

  const cardData = body?.cardData;
  if (
    !cardData?.token ||
    !cardData?.payment_method_id ||
    !cardData?.transaction_amount ||
    !cardData?.installments ||
    !cardData?.payer?.email
  ) {
    return NextResponse.json({ ok: false, error: "Missing required cardData fields" }, { status: 400 });
  }

  const externalReference = (body?.external_reference ?? "").trim();
  if (!externalReference) {
    return NextResponse.json({ ok: false, error: "external_reference_required" }, { status: 400 });
  }

  const expectedAmount = n(body?.expected?.amount ?? cardData.transaction_amount);
  const expectedCurrency = (body?.expected?.currency ?? "ARS").trim() || "ARS";
  const expectedInstallments = n(body?.expected?.installments ?? 1) || 1;

  const mpPayload: any = {
    token: cardData.token,
    transaction_amount: n(cardData.transaction_amount),
    installments: n(cardData.installments),
    payment_method_id: cardData.payment_method_id,
    payer: {
      email: cardData.payer.email,
      identification: cardData.payer.identification,
    },
    issuer_id: cardData.issuer_id,
    payment_method_option_id: cardData.payment_method_option_id ?? null,
    processing_mode: cardData.processing_mode ?? null,
    description: body?.description ?? "Compra",
    external_reference: externalReference,
    metadata: body?.metadata ?? undefined,
  };

  const idempotencyKey = crypto.randomUUID();

  const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(mpPayload),
  });

  const mpJson = await mpRes.json();

  if (!mpRes.ok) {
    return NextResponse.json({ ok: false, error: "mp_payment_failed", details: mpJson }, { status: mpRes.status });
  }

  const status = String(mpJson?.status ?? "");
  const statusDetail = String(mpJson?.status_detail ?? "");
  const captured = Boolean(mpJson?.captured);
  const currency = String(mpJson?.currency_id ?? "");
  const amount = n(mpJson?.transaction_amount);
  const installments = n(mpJson?.installments);
  const paymentType = String(mpJson?.payment_type_id ?? "");
  const paymentId = mpJson?.id;

  const isCard = paymentType === "credit_card" || paymentType === "debit_card";

  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "mp_missing_payment_id", raw: mpJson }, { status: 502 });
  }

  if (status !== "approved" || statusDetail !== "accredited" || !captured || !isCard) {
    return NextResponse.json(
      {
        ok: false,
        error: "mp_payment_not_approved",
        payment: { id: paymentId, status, status_detail: statusDetail, captured, payment_type_id: paymentType },
        raw: mpJson,
      },
      { status: 402 }
    );
  }

  if (currency !== expectedCurrency) {
    return NextResponse.json(
      { ok: false, error: "currency_mismatch", expected: expectedCurrency, got: currency, raw: mpJson },
      { status: 400 }
    );
  }

  if (amount !== expectedAmount) {
    return NextResponse.json(
      { ok: false, error: "amount_mismatch", expected: expectedAmount, got: amount, raw: mpJson },
      { status: 400 }
    );
  }

  if (installments !== expectedInstallments) {
    return NextResponse.json(
      { ok: false, error: "installments_mismatch", expected: expectedInstallments, got: installments, raw: mpJson },
      { status: 400 }
    );
  }

  const orderEndpoint = storeUrl.endsWith("/") ? `${storeUrl}orders` : `${storeUrl}/orders`;

  const orderPayload = {
    ...(body?.orderPayload ?? {}),
    mp: {
      id: paymentId,
      status,
      status_detail: statusDetail,
      transaction_amount: amount,
      currency_id: currency,
      installments,
      payment_type_id: paymentType,
      payment_method_id: mpJson?.payment_method_id ?? null,
      authorization_code: mpJson?.authorization_code ?? null,
      date_approved: mpJson?.date_approved ?? null,
      external_reference: externalReference,
      raw: mpJson,
    },
  };

  const storeRes = await fetch(orderEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${storeToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": String(paymentId),
    },
    body: JSON.stringify(orderPayload),
  });

  const storeJson = await storeRes.json().catch(() => null);

  if (!storeRes.ok) {
    return NextResponse.json(
      { ok: false, error: "store_order_create_failed", details: storeJson, payment: { id: paymentId, status, status_detail: statusDetail }, raw: mpJson },
      { status: 502 }
    );
  }

  const orderRef = storeJson?.orderRef ?? storeJson?.data?.orderRef ?? storeJson ?? null;

  return NextResponse.json({
    ok: true,
    payment: { id: paymentId, status, status_detail: statusDetail },
    orderRef,
    raw: mpJson,
  });
}
