"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useModalContext } from "@/app/context/QuickViewModalContext";
import { updateQuickView } from "@/redux/features/quickView-slice";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import type { AppDispatch } from "@/redux/store";
import type { Product, Variant } from "@/data/types";
import { pickI18n } from "@/data/types";

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const fmt = (v: any, currency = "ARS") => {
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
const pct = (v: any) => {
  const x = Math.round(n(v));
  return x > 0 ? x : 0;
};
const sumStock = (v?: Variant) => {
  if (!v) return 0;
  if (typeof (v as any).stock === "number") return (v as any).stock;
  const levels = Array.isArray((v as any)?.inventory_levels)
    ? (v as any).inventory_levels
    : [];
  return levels.reduce((acc: number, it: any) => acc + n(it?.stock), 0);
};
const buildHref = (p: Product, fallback = "/shop-details") => {
  const slug = pickI18n((p as any).handle).trim();
  if (!slug) return fallback;
  return `/shop/${encodeURIComponent(slug)}`;
};
const sortByPos = <T extends { position?: number | null }>(xs: any): T[] => {
  const arr = Array.isArray(xs) ? (xs as T[]) : [];
  return arr
    .slice()
    .sort(
      (a, b) =>
        (Number(a?.position ?? 0) || 0) - (Number(b?.position ?? 0) || 0),
    );
};
const variantLabel = (v: Variant) => {
  const values = Array.isArray((v as any)?.values) ? (v as any).values : [];
  if (values.length) {
    const parts = values
      .flatMap((x: any) =>
        x && typeof x === "object"
          ? Object.values(x)
              .map((y) => String(y ?? ""))
              .filter(Boolean)
          : [],
      )
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  if ((v as any)?.sku) return `SKU ${String((v as any).sku)}`;
  return `Variante #${String((v as any)?.id ?? "")}`;
};
const computeVariantUnitPrice = (v?: Variant) => {
  if (!v) return 0;
  const promo =
    (v as any)?.promotional_price != null ? n((v as any).promotional_price) : 0;
  const price = n((v as any)?.price ?? (v as any)?.price_without_taxes);
  const compare = n((v as any)?.compare_at_price);
  return promo > 0 ? promo : price > 0 ? price : compare;
};
const computeVariantBasePrice = (v?: Variant) => {
  if (!v) return 0;
  const compare = n((v as any)?.compare_at_price);
  const price = n((v as any)?.price ?? (v as any)?.price_without_taxes);
  const promo =
    (v as any)?.promotional_price != null ? n((v as any).promotional_price) : 0;
  const discounted = promo > 0 ? promo : price > 0 ? price : compare;
  return compare > 0 ? compare : price > 0 ? price : discounted;
};
const getVariantImageSrc = (p: Product, v: Variant | undefined) => {
  const imgs = Array.isArray((p as any)?.images) ? (p as any).images : [];
  const byId = new Map<number, any>(
    imgs.filter((x: any) => x?.id != null).map((x: any) => [Number(x.id), x]),
  );
  const imgByVariant =
    v?.image_id != null ? byId.get(Number((v as any).image_id)) : null;
  const src =
    String(imgByVariant?.src ?? "").trim() ||
    String((p as any)?.image?.src ?? "").trim() ||
    String((p as any)?.imgs?.previews?.[0] ?? "").trim() ||
    String(imgs?.[0]?.src ?? "").trim();
  return src || "/images/placeholder.png";
};
const collectPreviewImages = (p: Product, v: Variant | undefined) => {
  const imgs = sortByPos<any>((p as any)?.images);
  const vSrc = getVariantImageSrc(p, v);
  const srcs = imgs
    .map((x: any) => String(x?.src ?? "").trim())
    .filter(Boolean);
  const merged = [vSrc, ...srcs.filter((s) => s !== vSrc)];
  const uniq = Array.from(new Set(merged)).filter(Boolean);
  return uniq.length ? uniq.slice(0, 8) : ["/images/placeholder.png"];
};
const pickBestVariantId = (p: Product) => {
  const variants = sortByPos<Variant>((p as any)?.variants).filter(
    (v) => v?.id != null && (v as any)?.visible !== false,
  );
  return variants?.[0]?.id != null ? Number((variants[0] as any).id) : null;
};

const ProductItem = ({ item }: { item: Product }) => {
  const { openModal } = useModalContext();
  const dispatch = useDispatch<AppDispatch>();
  const [busy, setBusy] = useState<null | "cart" | "wish">(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => pickBestVariantId(item),
  );
  const [slide, setSlide] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const ptr = useRef<{
    id: number | null;
    x: number;
    w: number;
    active: boolean;
  }>({ id: null, x: 0, w: 0, active: false });

  const currency = "ARS";
  const href = useMemo(() => buildHref(item), [item]);
  const title = useMemo(
    () => pickI18n((item as any).name).trim() || "Producto",
    [item],
  );
  const variants = useMemo(
    () => sortByPos<Variant>((item as any)?.variants),
    [item],
  );
  const visibleVariants = useMemo(
    () =>
      variants.filter((v) => v?.id != null && (v as any)?.visible !== false),
    [variants],
  );
  const selectedVariant = useMemo(() => {
    if (selectedVariantId == null) return undefined;
    return visibleVariants.find(
      (v) => Number((v as any).id) === Number(selectedVariantId),
    );
  }, [selectedVariantId, visibleVariants]);

  const hasVariants = visibleVariants.length > 0;
  const mustPickVariant = hasVariants && selectedVariantId == null;

  const unitPrice = useMemo(
    () => computeVariantUnitPrice(selectedVariant),
    [selectedVariant],
  );
  const basePrice = useMemo(
    () => computeVariantBasePrice(selectedVariant),
    [selectedVariant],
  );
  const discountPercent = useMemo(() => {
    if (!basePrice || !unitPrice || unitPrice >= basePrice) return 0;
    return pct(((basePrice - unitPrice) / basePrice) * 100);
  }, [basePrice, unitPrice]);

  const stock = useMemo(() => sumStock(selectedVariant), [selectedVariant]);
  const isOut = hasVariants ? stock <= 0 : true;

  const previews = useMemo(
    () => collectPreviewImages(item, selectedVariant),
    [item, selectedVariant],
  );
  const canNav = previews.length > 1;
  const safeSlide = Math.min(
    Math.max(0, slide),
    Math.max(0, previews.length - 1),
  );
  const bgImg = previews[safeSlide] ?? "/images/placeholder.png";

  useEffect(() => {
    setSlide(0);
  }, [selectedVariantId]);
  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1400);
    return () => window.clearTimeout(t);
  }, [added]);

  const handleQuickViewUpdate = () => {
    dispatch(
      updateQuickView({
        id: Number((item as any)?.id),
        title,
        price: basePrice,
        discountedPrice: unitPrice,
        discountPercent,
        currency,
        href,
        imgs: { previews },
        stock,
        product: item,
        variant: selectedVariant,
      } as any),
    );
  };
  const handleProductDetails = () => {
    dispatch(
      updateproductDetails({
        id: Number((item as any)?.id),
        title,
        price: unitPrice,
        basePrice,
        discountedPrice: unitPrice,
        discountPercent,
        currency,
        href,
        imgs: { previews },
        stock,
        product: item,
        variant: selectedVariant,
      } as any),
    );
  };

  const handleAddToCart = async () => {
    if (busy || mustPickVariant || !selectedVariant?.id || stock <= 0) return;
    setBusy("cart");
    dispatch(
      addItemToCart({
        id: Number((selectedVariant as any).id),
        title: `${title || ""} - ${variantLabel(selectedVariant) || ""}`
          .trim()
          .replace(/\s+-\s*$/, ""),
        price: n(basePrice),
        discountedPrice: n(unitPrice),
        quantity: 1,
        imgs: { thumbnails: previews.slice(0, 6), previews },
      } as any),
    );
    setAdded(true);
    setTimeout(() => setBusy(null), 450);
  };

  const handleItemToWishList = async () => {
    if (busy) return;
    setBusy("wish");
    dispatch(
      addItemToWishlist({
        id: Number((item as any)?.id),
        title,
        price: unitPrice,
        basePrice,
        discountedPrice: unitPrice,
        discountPercent,
        currency,
        href,
        imgs: { previews },
        stock,
        product: item,
        variant: selectedVariant,
        status: stock > 0 ? "available" : "out_of_stock",
        quantity: 1,
      } as any),
    );
    setTimeout(() => setBusy(null), 450);
  };

  const prev = () => {
    if (!canNav) return;
    setSlide((s) => (s - 1 + previews.length) % previews.length);
  };
  const next = () => {
    if (!canNav) return;
    setSlide((s) => (s + 1) % previews.length);
  };
  const onImgPtrDown = (e: React.PointerEvent) => {
    if (!canNav) return;
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    ptr.current = { id: e.pointerId, x: e.clientX, w: r.width, active: true };
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  };
  const onImgPtrUp = (e: React.PointerEvent) => {
    if (!canNav || !ptr.current.active || ptr.current.id !== e.pointerId)
      return;
    const dx = e.clientX - ptr.current.x;
    const abs = Math.abs(dx);
    ptr.current.active = false;
    const th = Math.max(18, ptr.current.w * 0.08);
    if (abs >= th) {
      dx < 0 ? next() : prev();
      return;
    }
    const local =
      e.clientX -
      (e.currentTarget as HTMLDivElement).getBoundingClientRect().left;
    local < ptr.current.w / 2 ? prev() : next();
  };
  const onImgPtrCancel = (e: React.PointerEvent) => {
    if (ptr.current.id === e.pointerId) ptr.current.active = false;
  };

  return (
    <article className="group h-full">
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.10)]"
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="relative flex-1">
          <div className="relative w-full aspect-[2/3] sm:aspect-[3/4] overflow-hidden bg-[#F6F7FB]">
            <div
              className="absolute inset-0 touch-pan-y"
              onPointerDown={onImgPtrDown}
              onPointerUp={onImgPtrUp}
              onPointerCancel={onImgPtrCancel}
              aria-label="Carrusel de imágenes"
            >
              <Image
                src={bgImg}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
                priority={false}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

            <div className="absolute left-3 top-3 flex items-center gap-2">
              {discountPercent ? (
                <span className="inline-flex items-center rounded-full bg-[#fe62b2] px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
                  -{discountPercent}%
                </span>
              ) : null}
            </div>

            <div className="absolute right-3 top-3 flex items-center gap-2">
              {added ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-[#fe62b2] backdrop-blur-md shadow-sm">
                  <i className="bi bi-check2-circle text-[13px] leading-none" />
                  Añadido
                </span>
              ) : null}
              <button
                onClick={handleItemToWishList}
                aria-label="Agregar a favoritos"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white/60 text-[#fe62b2] shadow-sm backdrop-blur-md transition hover:bg-white/75 active:scale-[0.98] disabled:opacity-60"
                type="button"
                disabled={busy !== null}
              >
                <i
                  className={`bi ${busy === "wish" ? "bi-hourglass-split" : "bi-heart"} text-[15px] leading-none`}
                />
              </button>
            </div>

            {canNav ? (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/65 px-3 py-1.5 backdrop-blur-md shadow-sm">
                  {previews.map((_, i) => (
                    <span
                      key={i}
                      className={[
                        "h-1.5 w-1.5 rounded-full transition",
                        i === safeSlide ? "bg-[#fe62b2]" : "bg-[#fe62b2]/30",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 p-2.5">
              <div className="rounded-2xl border border-black/5 bg-white/70 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.18)] overflow-hidden">
                <div className="px-2.5 pt-2.5 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-xs font-semibold text-[#fe62b2]">
                      <Link
                        href={href}
                        onClick={handleProductDetails as any}
                        className="transition hover:opacity-90"
                        aria-label={title}
                      >
                        {title}
                      </Link>
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpanded((v) => !v)}
                        aria-label="Más opciones"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-black/5 bg-white/70 text-[#fe62b2] transition hover:bg-white/85 active:scale-[0.98]"
                        type="button"
                      >
                        <i
                          className={`bi ${expanded ? "bi-chevron-down" : "bi-chevron-up"} text-[12px] leading-none`}
                        />
                      </button>
                      {expanded ? (
                        <button
                          onClick={() => {
                            openModal();
                            handleQuickViewUpdate();
                          }}
                          aria-label="Vista rápida"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-black/5 bg-white/70 text-[#fe62b2] transition hover:bg-white/85 active:scale-[0.98]"
                          type="button"
                        >
                          <i className="bi bi-eye text-[15px] leading-none" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-semibold tracking-tight text-[#fe62b2]">
                        {mustPickVariant
                          ? "Elegí variante"
                          : fmt(unitPrice, currency)}
                      </span>
                      {!mustPickVariant &&
                      basePrice > 0 &&
                      unitPrice > 0 &&
                      unitPrice < basePrice ? (
                        <span className="text-sm font-semibold text-[#fe62b2]/55 line-through">
                          {fmt(basePrice, currency)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  className={`transition-[max-height,opacity] duration-300 ease-out ${expanded ? "max-h-[210px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="px-3 pb-3 pt-0">
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <div className="relative w-full">
                        <select
                          value={selectedVariantId ?? ""}
                          onChange={(e) =>
                            setSelectedVariantId(
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                          className="h-9 w-full appearance-none rounded-xl border border-black/5 bg-white/70 px-3 pr-9 text-xs font-semibold text-[#fe62b2] outline-none transition focus:border-[#fe62b2]/35 focus:ring-4 focus:ring-[#fe62b2]/20"
                          aria-label="Seleccionar variante"
                        >
                          <option value="" className="text-slate-900">
                            Seleccioná una variante
                          </option>
                          {visibleVariants.map((v) => {
                            const id = Number((v as any).id);
                            const label = variantLabel(v);
                            const price = computeVariantUnitPrice(v);
                            const oos = sumStock(v) <= 0;
                            return (
                              <option
                                key={id}
                                value={id}
                                disabled={oos}
                                className="text-slate-900"
                              >
                                {label} · {fmt(price, currency)}
                                {oos ? " · Sin stock" : ""}
                              </option>
                            );
                          })}
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#fe62b2]/70">
                          <i className="bi bi-chevron-down text-[13px] leading-none" />
                        </span>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-2 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(254,98,178,.22)] transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60"
                        type="button"
                        disabled={busy !== null || mustPickVariant || isOut}
                        aria-label="Agregar al carrito"
                      >
                        <span>
                          {isOut
                            ? "Sin stock"
                            : mustPickVariant
                              ? "Elegí una variante"
                              : "Añadir"}
                        </span>
                        <i
                          className={`bi ${busy === "cart" ? "bi-hourglass-split" : "bi-cart-plus"} text-[16px] leading-none`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductItem;
