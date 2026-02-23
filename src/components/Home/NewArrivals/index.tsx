"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import ProductItem from "@/components/Common/ProductItem";
import { useStoreData } from "@/app/(site)/StoreDataProvider";
import type { Product } from "@/data/types";
import { flatten2 } from "@/data/types";
import { Swiper, SwiperSlide } from "swiper/react";

const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  const parts = path.split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

const resolveTplValue = <T,>(value: any, root: any): T => {
  if (typeof value !== "string") return value as T;
  const m = value.trim().match(/^{{\s*([^}]+)\s*}}$/);
  if (!m) return value as T;
  return getByPath(root, m[1].trim()) as T;
};

const resolveTplString = (value: any, root: any) => {
  if (value == null) return "";
  if (typeof value !== "string") return String(value);
  return value.replace(/{{\s*([^}]+)\s*}}/g, (_all, p1) => {
    const v = getByPath(root, String(p1).trim());
    if (v == null) return "";
    if (typeof v === "object") return "";
    return String(v);
  });
};

const resolveProductsByIds = (ids: number[], items: Product[]) => {
  const map = new Map<number, Product>(items.map((p) => [Number(p.id), p] as const));
  const out: Product[] = [];
  for (const id of ids) {
    const p = map.get(Number(id));
    if (p) out.push(p);
  }
  return { out, map };
};

const isObj = (v: any): v is Record<string, any> => typeof v === "object" && v !== null;

const useIsSm = () => {
  const [isSm, setIsSm] = React.useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsSm(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);
  return isSm;
};

const NewArrival = () => {
  const store = useStoreData();
  const { home, products: productsBlock, header, global } = store;

  const cfgRaw = home?.newArrivals ?? { kicker: "", title: "", viewAll: { label: "", href: "" }, productIds: [] };

  const cfg = useMemo(() => {
    const productIds = resolveTplValue<any>((cfgRaw as any).productIds, store);
    const ids = Array.isArray(productIds) ? productIds.map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];
    return {
      kicker: resolveTplString((cfgRaw as any).kicker, store),
      title: resolveTplString((cfgRaw as any).title, store),
      viewAll: {
        label: resolveTplString((cfgRaw as any).viewAll?.label, store),
        href: resolveTplString((cfgRaw as any).viewAll?.href, store),
      },
      productIds: ids,
    };
  }, [cfgRaw, store]);

  const items = useMemo(() => flatten2<Product>(productsBlock?.items), [productsBlock?.items]);
  const { out: products } = useMemo(() => resolveProductsByIds(cfg.productIds, items), [cfg.productIds, items]);

  const resolvedUiColors = useMemo(() => {
    const v = resolveTplValue<any>(header.ui?.colors, store);
    return isObj(v) ? v : undefined;
  }, [header.ui?.colors, store]);

  const primary = resolvedUiColors?.primary ?? global.colors?.primary ?? "#fe62b2";
  const secondary = resolvedUiColors?.secondary ?? global.colors?.secondary ?? "#ffaed7";

  const kicker = (cfg.kicker ?? "").trim() || "Novedades";
  const title = (cfg.title ?? "").trim() || "Productos destacados";
  const viewAllHref = (cfg.viewAll?.href ?? "").trim() || "/shop-with-sidebar";
  const viewAllLabel = (cfg.viewAll?.label ?? "").trim() || "Ver todo";

  const isSm = useIsSm();

  return (
    <section
      className="relative overflow-hidden py-10 sm:py-14 lg:py-18"
      style={
        {
          ["--brand-primary" as any]: primary,
          ["--brand-secondary" as any]: secondary,
        } as React.CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-3xl opacity-40 bg-[color:var(--brand-primary,#fe62b2)]" />
        <div className="absolute -bottom-28 -right-28 h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-3xl opacity-35 bg-[color:var(--brand-secondary,#ffaed7)]" />
        <div className="absolute inset-0 bg-white" />
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-0">
        <div className="mb-7 sm:mb-9 flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/85 px-3 py-1 text-xs sm:text-sm font-semibold text-slate-900 shadow-sm backdrop-blur">
              <i className="bi bi-stars text-[15px] sm:text-[16px] leading-none text-[color:var(--brand-primary,#fe62b2)]" aria-hidden="true" />
              <span className="leading-none">{kicker}</span>
            </span>

            <h2 className="mt-3 text-balance font-semibold text-[22px] leading-tight sm:text-3xl lg:text-[34px] text-slate-900">{title}</h2>

            <div className="mt-3 h-1 w-20 sm:w-24 rounded-full bg-gradient-to-r from-[color:var(--brand-primary,#fe62b2)] to-[color:var(--brand-secondary,#ffaed7)]" />
          </div>

          <div className="flex items-start md:justify-end pt-[2px]">
            <Link
              href={viewAllHref}
              className="inline-flex w-full xs:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.99] bg-[color:var(--brand-primary,#fe62b2)]"
            >
              <i className="bi bi-bag" aria-hidden="true" />
              {viewAllLabel}
            </Link>
          </div>
        </div>

        {!products.length ? (
          <div className="text-center text-sm font-semibold text-slate-700">No hay productos</div>
        ) : isSm ? (
          <div className="-mx-4 px-4">
            <Swiper slidesPerView={1.25} spaceBetween={12}>
              {products.map((item) => (
                <SwiperSlide key={item.id}>
                  <ProductItem item={item as any} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-7.5 gap-y-8 lg:gap-y-9">
            {products.map((item) => (
              <div key={item.id} className="h-full">
                <ProductItem item={item as any} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrival;
