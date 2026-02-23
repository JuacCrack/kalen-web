"use client";
import React,{useMemo}from"react";

type ShippingMethod="pickup"|"shipping";
type PaymentMethod="mercadopago"|"transfer"|"cash"|"card"|"other";
type OrderStage="review"|"success"|"error";

const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:0};
const fmtMoney=(v:any,currency="ARS")=>{const val=n(v);try{return new Intl.NumberFormat("es-AR",{style:"currency",currency,maximumFractionDigits:0}).format(val)}catch{return`$${val}`}};
const payLabel=(m:PaymentMethod)=>m==="mercadopago"?"Mercado Pago":m==="cash"?"Efectivo":"Transferencia";
const shipLabel=(m:ShippingMethod)=>m==="pickup"?"Retiro":"Envío";

const ConfirmStep=({
  confirmStage,
  confirmMsg,
  placing,
  client,
  shippingMethod,
  shipping,
  paymentMethod,
  cartItems,
  totalPrice,
  currency,
  shippingCost=0,
  totalWithExtras,
  selectedShippingKey="",
  selectedShippingTitle="",
  purchasePayload,
  backFromConfirmToCheckout,
  goToCartAfterFail,
  onPlaceOrder,
}:{
  confirmStage:OrderStage;
  confirmMsg:string;
  placing:boolean;
  client:{firstName:string;lastName:string;email:string;phone:string};
  shippingMethod:ShippingMethod;
  shipping:{country:string;province:string;city:string;street:string;number:string;postalCode:string;notes:string};
  paymentMethod:"mercadopago"|"transfer"|"cash";
  cartItems:any[];
  totalPrice:any;
  currency:string;
  shippingCost?:number;
  totalWithExtras?:number;
  selectedShippingKey?:string;
  selectedShippingTitle?:string;
  purchasePayload?:any;
  backFromConfirmToCheckout:()=>void;
  goToCartAfterFail:()=>void;
  onPlaceOrder:()=>void|Promise<void>;
})=>{
  const safeShipTitle=useMemo(()=>{
    const fromPayload=String(purchasePayload?.shippingTitle??"").trim();
    return (selectedShippingTitle||fromPayload).trim();
  },[selectedShippingTitle,purchasePayload]);

  const totalFinal=useMemo(()=>{
    const base=typeof totalWithExtras!=="undefined"?totalWithExtras:n(totalPrice)+n(shippingCost);
    return n(base);
  },[totalWithExtras,totalPrice,shippingCost]);

  if(confirmStage==="review"){
    return(
      <div className="h-full overflow-y-auto pr-1">
        <div className="pb-2">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="absolute left-0 top-10 h-px w-full bg-[repeating-linear-gradient(to_right,rgba(15,23,42,.10)_0,rgba(15,23,42,.10)_6px,transparent_6px,transparent_12px)]"/>
            <div className="absolute bottom-[92px] left-0 h-px w-full bg-[repeating-linear-gradient(to_right,rgba(15,23,42,.10)_0,rgba(15,23,42,.10)_6px,transparent_6px,transparent_12px)]"/>

            <div className="px-4 pt-4">
              <div className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-slate-400">RESUMEN</div>

              <div className="mt-3 grid gap-4">
                <div className="flex items-start gap-3">
                  <i className="bi bi-person mt-[1px] text-[14px] leading-none text-slate-500"/>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{client.firstName.trim()} {client.lastName.trim()}</div>
                    <div className="mt-1 grid gap-1 text-[11px] text-slate-600">
                      <div className="flex min-w-0 items-center gap-2">
                        <i className="bi bi-envelope text-[12px] leading-none text-slate-400"/>
                        <span className="truncate">{client.email.trim()}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <i className="bi bi-telephone text-[12px] leading-none text-slate-400"/>
                        <span className="truncate">{client.phone.trim()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <i className={["bi",shippingMethod==="pickup"?"bi-shop":"bi-truck","mt-[1px] text-[14px] leading-none text-slate-500"].join(" ")}/>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-700">
                      {shipLabel(shippingMethod)}
                      {safeShipTitle?` · ${safeShipTitle}`:""}
                    </div>
                    {shippingMethod==="shipping"?(
                      <div className="mt-1 text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-900">{shipping.street.trim()} {shipping.number.trim()}</div>
                        <div className="mt-0.5">{[shipping.city.trim(),shipping.province.trim()].filter(Boolean).join(", ")} · {shipping.postalCode.trim()} · {shipping.country==="AR"?"AR":shipping.country}</div>
                        {shipping.notes?.trim()?<div className="mt-1">{shipping.notes.trim()}</div>:null}
                      </div>
                    ):(
                      <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-600">
                        <i className="bi bi-whatsapp text-[14px] leading-none text-slate-500"/>
                        Coordinamos por WhatsApp
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <i className={["bi",paymentMethod==="mercadopago"?"bi-shield-check":paymentMethod==="cash"?"bi-cash-coin":"bi-bank","text-[14px] leading-none text-slate-500"].join(" ")}/>
                  <div className="text-[11px] font-semibold text-slate-700">{payLabel(paymentMethod)}</div>
                </div>
              </div>
            </div>

            <div className="px-4 pt-4">
              <div className="flex items-center justify-between text-[10px] font-semibold tracking-[0.18em] text-slate-400">
                <span>ITEM</span>
                <span className="tabular-nums">IMPORTE</span>
              </div>
              <div className="mt-3 space-y-3">
                {cartItems.map((it:any,idx:number)=>{
                  const q=Math.max(1,n(it?.quantity));
                  const u=n(it?.discountedPrice??it?.price??0);
                  const s=u*q;
                  return(
                    <div key={`${it?.variantId??it?.id??idx}`} className="grid grid-cols-[1fr_auto] gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-slate-900">{String(it?.title??"Producto")}</div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="tabular-nums">{q}×{fmtMoney(u,currency)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="tabular-nums">{fmtMoney(s,currency)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="tabular-nums text-[13px] font-semibold text-slate-900">{fmtMoney(s,currency)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pb-4 pt-4">
              <div className="grid gap-2 text-[11px] text-slate-600">
                <div className="flex items-center justify-between"><span>Items</span><span className="tabular-nums">{fmtMoney(totalPrice,currency)}</span></div>
                <div className="flex items-center justify-between">
                  <span>Envío</span>
                  {n(shippingCost)>0?<span className="tabular-nums">{fmtMoney(shippingCost,currency)}</span>:<span className="inline-flex items-center gap-1 font-semibold text-slate-700"><i className="bi bi-check2 text-[12px] leading-none"/>0</span>}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">TOTAL</span>
                  <span className="tabular-nums text-lg font-semibold text-slate-900">{fmtMoney(totalFinal,currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {placing?(
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="inline-flex h-5 w-5 items-center justify-center"><span className="h-4 w-4 rounded-full border-2 border-slate-300/60 border-t-slate-600 animate-spin"/></span>
              Procesando…
            </div>
          ):null}
        </div>
      </div>
    );
  }

  if(confirmStage==="success"){
    return(
      <div className="h-full overflow-y-auto pr-1">
        <div className="flex flex-col gap-4 pb-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-700">
                <i className="bi bi-check2 text-[22px] leading-none"/>
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900">Orden creada</div>
                <div className="mt-1 text-sm leading-snug text-slate-600">{confirmMsg||"Recibimos tu pedido correctamente. Te vamos a contactar para coordinar el envío o retiro."}</div>
              </div>
            </div>
          </div>
          <button type="button" onClick={goToCartAfterFail} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]">
            <i className="bi bi-house"/>
            <span>Inicio</span>
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="h-full overflow-y-auto pr-1">
      <div className="flex flex-col gap-3 pb-2">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-700">
              <i className="bi bi-x-lg text-[18px] leading-none"/>
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900">No pudimos crear la orden</div>
              <div className="mt-1 text-sm leading-snug text-slate-600">{confirmMsg||"Revisá tus datos e intentá nuevamente."}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={goToCartAfterFail} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,.25)] transition hover:brightness-95 active:scale-[0.99]">
            <i className="bi bi-arrow-left-circle"/>
            <span>Carrito</span>
          </button>
          <button type="button" onClick={backFromConfirmToCheckout} className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]">
            <i className="bi bi-pencil-square"/>
            <span>Editar</span>
          </button>
        </div>
        {placing?<div className="mt-1 text-center text-xs text-slate-500">Procesando…</div>:null}
      </div>
    </div>
  );
};

export default ConfirmStep;
