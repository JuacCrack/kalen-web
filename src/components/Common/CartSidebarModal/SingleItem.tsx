"use client";
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import Image from "next/image";
import { updateCartItemQuantity } from "@/redux/features/cart-slice";

import { useAuth } from "@/app/context/AuthContext";

type Props = { item: any; removeItemFromCart: (id: number | string) => any };
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
const SingleItem = ({ item, removeItemFromCart }: Props) => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const id = Number(item?.variantId ?? item?.id);
  const qty = Math.max(1, n(item?.quantity ?? 1));
  const unit = n(item?.discountedPrice ?? item?.price ?? 0);
  const subtotal = useMemo(() => unit * qty, [unit, qty]);
  const thumb =
    item?.imgs?.thumbnails?.[0] ??
    item?.imgs?.previews?.[0] ??
    item?.image?.src ??
    "/images/placeholder.png";
  const onRemove = () => dispatch(removeItemFromCart(id) as any);
  const setQty = (q: number) =>
    dispatch(updateCartItemQuantity({ id, quantity: Math.max(1, q) }) as any);
  const onDec = () => setQty(qty - 1);
  const onInc = () => setQty(qty + 1);
  return (
    <div className="border-b border-slate-100 pb-4">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={thumb}
            alt={String(item?.title ?? "Producto")}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">
                {item?.title}
              </div>
              <div className="mt-1 flex items-baseline gap-3 text-xs text-slate-600">
                <span>{fmtMoney(unit)}</span>
                {/* <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-900">
                  {fmtMoney(subtotal)}
                </span> */}
              </div>
            </div>
            <button
              onClick={() => {
                const variantId = String(item?.id ?? "");
                const value = Number(item?.discountedPrice ?? item?.price ?? 0);
                const qty = Number(item?.quantity ?? 1);
                const event_source_url =
                  typeof window !== "undefined"
                    ? window.location.href
                    : undefined;
                const event_id = (
                  globalThis.crypto?.randomUUID?.() ??
                  `${Date.now()}-${Math.random()}`
                ).toString();

                fetch("/api/meta/capi", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    event_name: "RemoveFromCart",
                    event_id,
                    event_source_url,
                    custom_data: {
                      currency: "ARS",
                      value: value * qty,
                      content_type: "product",
                      content_ids: [variantId],
                      contents: [
                        { id: variantId, quantity: qty, item_price: value },
                      ],
                    },
                    ...(isAuthenticated && user?.email
                      ? { user: { email: user.email } }
                      : {}),
                  }),
                  keepalive: true,
                }).catch(() => {});

                window.fbq?.(
                  "track",
                  "RemoveFromCart",
                  {
                    currency: "ARS",
                    value: value * qty,
                    content_type: "product",
                    content_ids: [variantId],
                    contents: [
                      { id: variantId, quantity: qty, item_price: value },
                    ],
                  },
                  { eventID: event_id },
                );

                onRemove();
              }}
              type="button"
              aria-label="Quitar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <i className="bi bi-trash3 text-[16px] leading-none" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={onDec}
                disabled={qty <= 1}
                className="inline-flex h-10 w-10 items-center justify-center text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="bi bi-dash-lg text-[14px] leading-none" />
              </button>
              <div className="min-w-10 px-2 text-center text-sm font-semibold text-slate-900">
                {qty}
              </div>
              <button
                type="button"
                onClick={onInc}
                className="inline-flex h-10 w-10 items-center justify-center text-slate-900 transition hover:bg-slate-50"
              >
                <i className="bi bi-plus-lg text-[14px] leading-none" />
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900 mt-4">
                {fmtMoney(subtotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SingleItem;
