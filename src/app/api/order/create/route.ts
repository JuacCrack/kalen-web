import { NextResponse } from "next/server";

const API_DOMAIN = process.env.TIENDANUBE_API_DOMAIN || "https://api.tiendanube.com";
const API_VERSION = process.env.TIENDANUBE_API_VERSION || "2025-03";
const STORE_ID = process.env.TIENDANUBE_STORE_ID || "";
const ACCESS_TOKEN = process.env.TIENDANUBE_ACCESS_TOKEN || "";
const USER_AGENT = process.env.TIENDANUBE_USER_AGENT || "API-KALEN";
const STOREFRONT = process.env.TIENDANUBE_STOREFRONT || "";

const strv = (v: any) => String(v ?? "").trim();
const intv = (v: any) => (Number.isFinite(Number(v)) ? parseInt(String(v), 10) : 0);

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    },
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    if (!STORE_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Missing TIENDANUBE_STORE_ID or TIENDANUBE_ACCESS_TOKEN" },
        { status: 500, headers: corsHeaders },
      );
    }

    const inb = await req.json().catch(() => null);
    if (!inb || typeof inb !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const client = (inb as any).client ?? null;
    const items = (inb as any).items ?? null;

    const shippingMethod = strv((inb as any).shippingMethod ?? "shipping");
    let addrIn = (inb as any).shippingAddress ?? null;

    if (!client || typeof client !== "object" || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: client, items" },
        { status: 422, headers: corsHeaders },
      );
    }

    if (shippingMethod === "shipping" && (!addrIn || typeof addrIn !== "object")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required field: shippingAddress (required when shippingMethod=shipping)",
        },
        { status: 422, headers: corsHeaders },
      );
    }

    if (shippingMethod !== "shipping") {
      addrIn = {
        country: "AR",
        province: "N/A",
        city: "N/A",
        street: "Pickup",
        number: "0",
        postalCode: "N/A",
        notes: "pickup",
      };
    }

    const firstName = strv((client as any).firstName);
    const lastName = strv((client as any).lastName);
    const email = strv((client as any).email);
    const phone = strv((client as any).phone);

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { ok: false, error: "client.firstName, client.lastName, client.email are required" },
        { status: 422, headers: corsHeaders },
      );
    }

    const shippingPickupType = shippingMethod === "pickup" ? "pickup" : "ship";

    const shippingCost = intv((inb as any).shippingCost ?? 0);
    if (shippingCost < 0) {
      return NextResponse.json({ ok: false, error: "shippingCost must be >= 0" }, { status: 422, headers: corsHeaders });
    }

    let gateway = strv((inb as any).gateway ?? "not-provided");
    if (!gateway) gateway = "not-provided";

    const country = strv((addrIn as any).country);
    const province = strv((addrIn as any).province);
    const city = strv((addrIn as any).city);
    const street = strv((addrIn as any).street);
    const number = strv((addrIn as any).number);
    const postalCode = strv((addrIn as any).postalCode);
    const notes = strv((addrIn as any).notes);

    const required: Record<string, string> = {
      "shippingAddress.country": country,
      "shippingAddress.province": province,
      "shippingAddress.city": city,
      "shippingAddress.street": street,
      "shippingAddress.number": number,
      "shippingAddress.postalCode": postalCode,
    };

    for (const [k, v] of Object.entries(required)) {
      if (!v) return NextResponse.json({ ok: false, error: `${k} is required` }, { status: 422, headers: corsHeaders });
    }

    const address = {
      first_name: firstName,
      last_name: lastName,
      address: street,
      number,
      city,
      province,
      zipcode: postalCode,
      country,
      phone,
      comment: notes,
    };

    const products: any[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      if (!it || typeof it !== "object") continue;

      const variantId = (it as any).variantId;
      if (!Number.isFinite(Number(variantId))) {
        return NextResponse.json(
          { ok: false, error: `items[${idx}].variantId must be numeric (Tiendanube variant_id)` },
          { status: 422, headers: corsHeaders },
        );
      }

      const qty = intv((it as any).quantity ?? 0);
      if (qty <= 0) {
        return NextResponse.json(
          { ok: false, error: `items[${idx}].quantity must be > 0` },
          { status: 422, headers: corsHeaders },
        );
      }

      const line: any = { variant_id: parseInt(String(variantId), 10), quantity: qty };

      if ((it as any).unitPrice != null && Number.isFinite(Number((it as any).unitPrice))) {
        line.price = String(parseInt(String((it as any).unitPrice), 10));
      }

      products.push(line);
    }

    const shippingOption = shippingPickupType === "pickup" ? "Retiro" : "Envío";

    const orderPayload = {
      gateway,
      status: "open",
      payment_status: "pending",
      customer: {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
      },
      billing_address: address,
      shipping_address: address,
      shipping_pickup_type: shippingPickupType,
      shipping: "not-provided",
      shipping_option: shippingOption,
      shipping_cost_customer: shippingCost,
      products,
      inventory_behaviour: "bypass",
      send_confirmation_email: false,
      send_fulfillment_email: false,
    };

    const url = `${API_DOMAIN.replace(/\/+$/, "")}/${API_VERSION}/${STORE_ID}/orders/`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authentication: `bearer ${ACCESS_TOKEN}`,
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const td = await r.json().catch(async () => ({ raw: await r.text().catch(() => "") }));

    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: "Tiendanube API error creating order", tiendanube: td },
        { status: r.status || 500, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { ok: true, storefront: STOREFRONT, order: td },
      { status: 201, headers: corsHeaders },
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Unhandled error", message: e?.message ? String(e.message) : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
}