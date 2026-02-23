"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import ProductItem from "@/components/Common/ProductItem";
import { useStoreData } from "@/app/(site)/StoreDataProvider";
import type { Category, Product } from "@/data/types";
import { flatten2, pickI18n } from "@/data/types";

type SortKey = "relevance" | "newest" | "oldest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const asString = (v: string | null) => (v == null ? undefined : String(v));
const asNumber = (v: string | null) => {
  if (v == null) return undefined;
  const x = Number(v);
  return Number.isFinite(x) ? x : undefined;
};

const safeDate = (v: any) => {
  const t = new Date(v ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

const sortByPos = <T extends { position?: number | null }>(xs: any): T[] => {
  const arr = Array.isArray(xs) ? (xs as T[]) : [];
  return arr.slice().sort((a, b) => (Number(a?.position ?? 0) || 0) - (Number(b?.position ?? 0) || 0));
};

const unitPriceFromVariant = (v: any) => {
  const promo = v?.promotional_price != null ? n(v.promotional_price) : 0;
  const price = n(v?.price ?? v?.price_without_taxes);
  const compare = n(v?.compare_at_price);
  return promo > 0 ? promo : price > 0 ? price : compare;
};

const bestUnitPrice = (p: any) => {
  const vs = sortByPos<any>(p?.variants).filter((v) => v?.id != null && v?.visible !== false);
  if (!vs.length) return 0;
  const prices = vs.map(unitPriceFromVariant).filter((x) => x > 0);
  return prices.length ? Math.min(...prices) : 0;
};

const productText = (p: any) => {
  const name = pickI18n(p?.name).trim();
  const desc = pickI18n(p?.description).trim();
  const handle = pickI18n(p?.handle).trim();
  return `${name} ${desc} ${handle}`.toLowerCase();
};

const productCategoryHandles = (p: any) => {
  const pcs = Array.isArray(p?.categories) ? p.categories : [];
  const out: string[] = [];
  for (const c of pcs) {
    const h = pickI18n(c?.handle).trim();
    if (h) out.push(h.toLowerCase());
  }
  return out;
};

const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const Chip = ({ active, label, onClick }: { active?: boolean; label: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      "inline-flex h-9 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition active:scale-[0.99]",
      active ? "border-black/10 bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]" : "border-black/10 bg-white text-slate-800 hover:bg-black/5",
    )}
    aria-pressed={!!active}
  >
    <span className="whitespace-nowrap">{label}</span>
  </button>
);

const PillInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cx(
      "h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition",
      "focus:border-black/20 focus:ring-4 focus:ring-black/5",
      props.className,
    )}
  />
);

const PillSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cx(
      "h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition",
      "focus:border-black/20 focus:ring-4 focus:ring-black/5",
      props.className,
    )}
  />
);

const IconBtn = ({
  label,
  onClick,
  disabled,
  children,
  kind,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  kind?: "primary" | "ghost";
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={cx(
      "inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50",
      kind === "primary" ? "bg-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] hover:opacity-90" : "border border-black/10 bg-white text-slate-800 hover:bg-black/5",
    )}
  >
    {children}
  </button>
);

const ShopWithSidebar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeData = useStoreData();

  const shopPath = storeData?.global?.store?.routes?.shop ?? "/shop-with-sidebar";
  const categoryQueryKey = storeData?.global?.store?.routes?.categoryQueryKey ?? "cat";

  const qpQ = asString(searchParams.get("q")) ?? "";
  const qpCat = asString(searchParams.get(categoryQueryKey)) ?? "";
  const qpSort = (asString(searchParams.get("sort")) as SortKey | undefined) ?? "relevance";
  const qpPage = Math.max(1, asNumber(searchParams.get("page")) ?? 1);

  const setQuery = (patch: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    const qs = params.toString();
    router.push(qs ? `${shopPath}?${qs}` : shopPath);
  };

  const clearAll = () => router.push(shopPath);

  const { categories, products, categoryFacets } = useMemo(() => {
    const csNested = storeData?.categories?.items ?? [];
    const psNested = storeData?.products?.items ?? [];

    const catsFlat = flatten2<Category>(csNested);
    const prodsFlat = flatten2<Product>(psNested);

    const catBySlug = new Map<string, Category>();
    for (const c of catsFlat) {
      const slug = String((c as any)?.slug ?? "").trim();
      if (slug) catBySlug.set(slug.toLowerCase(), c);
    }

    const countByHandle = new Map<string, number>();
    for (const p of prodsFlat as any[]) {
      const handles = productCategoryHandles(p);
      for (const h of handles) countByHandle.set(h, (countByHandle.get(h) ?? 0) + 1);
    }

    const uniqueHandles = Array.from(countByHandle.entries())
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([h]) => h);

    const facets = [
      { slug: "", title: "Todas", count: prodsFlat.length },
      ...uniqueHandles.slice(0, 18).map((h) => {
        const c = catBySlug.get(h);
        const title = String((c as any)?.title ?? (c as any)?.label ?? h).trim() || h;
        return { slug: h, title, count: countByHandle.get(h) ?? 0 };
      }),
    ];

    return { categories: catsFlat, products: prodsFlat, categoryFacets: facets };
  }, [storeData]);

  const filtered = useMemo(() => {
    const q = qpQ.trim().toLowerCase();
    const cat = qpCat.trim().toLowerCase();

    const xs = (products as any[]).filter((p) => {
      if (q) {
        const t = productText(p);
        if (!t.includes(q)) return false;
      }
      if (cat) {
        const handles = productCategoryHandles(p);
        if (!handles.includes(cat)) return false;
      }
      return true;
    });

    const sortKey = qpSort;

    const relevanceScore = (p: any) => {
      if (!q) return 0;
      const t = productText(p);
      const name = pickI18n(p?.name).trim().toLowerCase();
      const handle = pickI18n(p?.handle).trim().toLowerCase();
      const exactName = name === q ? 60 : 0;
      const startsName = name.startsWith(q) ? 25 : 0;
      const handleBoost = handle === q || handle.startsWith(q) ? 18 : 0;
      const contains = t.includes(q) ? 6 : 0;
      return exactName + startsName + handleBoost + contains;
    };

    const getTime = (p: any) => safeDate((p as any)?.created_at ?? (p as any)?.createdAt ?? (p as any)?.updated_at ?? (p as any)?.updatedAt ?? 0);
    const getName = (p: any) => pickI18n(p?.name).trim().toLowerCase();
    const getPrice = (p: any) => bestUnitPrice(p);

    xs.sort((a, b) => {
      if (sortKey === "relevance") {
        const ra = relevanceScore(a);
        const rb = relevanceScore(b);
        if (rb !== ra) return rb - ra;
        return getTime(b) - getTime(a);
      }
      if (sortKey === "newest") return getTime(b) - getTime(a);
      if (sortKey === "oldest") return getTime(a) - getTime(b);
      if (sortKey === "price_asc") return getPrice(a) - getPrice(b);
      if (sortKey === "price_desc") return getPrice(b) - getPrice(a);
      if (sortKey === "name_asc") return getName(a).localeCompare(getName(b));
      if (sortKey === "name_desc") return getName(b).localeCompare(getName(a));
      return 0;
    });

    return xs as Product[];
  }, [products, qpQ, qpCat, qpSort]);

  const pageSize = 12;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(qpPage, totalPages);
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const [qInput, setQInput] = useState(qpQ);
  useEffect(() => setQInput(qpQ), [qpQ]);

  const sortOptions: Array<{ label: string; value: SortKey }> = [
    { label: "Relevancia", value: "relevance" },
    { label: "Más nuevos", value: "newest" },
    { label: "Más antiguos", value: "oldest" },
    { label: "Precio: menor a mayor", value: "price_asc" },
    { label: "Precio: mayor a menor", value: "price_desc" },
    { label: "Nombre: A → Z", value: "name_asc" },
    { label: "Nombre: Z → A", value: "name_desc" },
  ];

  const pagesWindow = useMemo(() => {
    const maxBtns = 7;
    const half = Math.floor(maxBtns / 2);
    let from = Math.max(1, page - half);
    let to = Math.min(totalPages, from + maxBtns - 1);
    from = Math.max(1, to - maxBtns + 1);
    const xs: number[] = [];
    for (let i = from; i <= to; i++) xs.push(i);
    return xs;
  }, [page, totalPages]);

  return (
    <>
      <Breadcrumb title={"Explorar todos los productos"} pages={["tienda", "/", "tienda"]} />

      <section className="relative overflow-hidden bg-[#f3f4f6] pb-20 pt-5 lg:pt-20 xl:pt-28">
        <div className="mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="mb-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="relative p-4 sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,0,0,0.05),transparent_55%)]" />
              <div className="relative flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="relative w-full sm:w-[360px]">
                      <PillInput
                        value={qInput}
                        onChange={(e) => setQInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setQuery({ q: qInput.trim() || null, page: 1 });
                          }
                        }}
                        placeholder="Buscar por nombre, descripción o handle…"
                        aria-label="Buscar"
                        className="pl-9"
                      />
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="bi bi-search text-[14px] leading-none" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuery({ q: qInput.trim() || null, page: 1 })}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 items-center justify-center rounded-xl border border-black/10 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-black/5 active:scale-[0.99]"
                        aria-label="Aplicar búsqueda"
                      >
                        Buscar
                      </button>
                    </div>

                    <div className="w-full sm:w-[260px]">
                      <PillSelect value={qpSort} onChange={(e) => setQuery({ sort: e.target.value as SortKey, page: 1 })} aria-label="Orden">
                        {sortOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </PillSelect>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                    <IconBtn label="Limpiar filtros" kind="ghost" onClick={clearAll}>
                      <i className="bi bi-x-circle text-[15px] leading-none" />
                      <span>Limpiar</span>
                    </IconBtn>

                    <IconBtn label="Volver a relevancia" kind="primary" onClick={() => setQuery({ sort: "relevance", page: 1 })} disabled={qpSort === "relevance"}>
                      <i className="bi bi-stars text-[15px] leading-none" />
                      <span>Relevancia</span>
                    </IconBtn>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {categoryFacets.map((c) => (
                      <Chip
                        key={c.slug || "all"}
                        active={(qpCat || "") === c.slug}
                        label={c.slug ? `${c.title} (${c.count})` : c.title}
                        onClick={() => setQuery({ [categoryQueryKey]: c.slug || null, page: 1 })}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Mostrando <span className="text-slate-900">{total ? `${Math.min(page * pageSize, total)} de ${total}` : "0"}</span> productos
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      Página <span className="text-slate-700">{page}</span> / <span className="text-slate-700">{totalPages}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {total === 0 ? (
            <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-slate-700">
                <i className="bi bi-inboxes text-[20px] leading-none" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No encontramos productos</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">Probá con otra búsqueda o limpiá los filtros.</p>
              <div className="mt-4 flex justify-center">
                <IconBtn label="Limpiar" kind="primary" onClick={clearAll}>
                  <span>Limpiar filtros</span>
                </IconBtn>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p) => (
                  <ProductItem key={Number((p as any)?.id ?? Math.random())} item={p as any} />
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-3xl border border-black/5 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setQuery({ page: page - 1 })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-slate-800 transition hover:bg-black/5 active:scale-[0.99] disabled:opacity-50"
                    aria-label="Anterior"
                  >
                    <i className="bi bi-chevron-left text-lg leading-none" />
                  </button>

                  {pagesWindow[0] > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuery({ page: 1 })}
                        className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-extrabold text-slate-800 transition hover:bg-black/5 active:scale-[0.99]"
                        aria-label="Página 1"
                      >
                        1
                      </button>
                      <span className="px-1 text-sm font-extrabold text-slate-400">…</span>
                    </>
                  ) : null}

                  {pagesWindow.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setQuery({ page: p })}
                      className={cx(
                        "inline-flex h-10 min-w-[40px] items-center justify-center rounded-2xl border px-3 text-sm font-extrabold transition active:scale-[0.99]",
                        p === page ? "border-black/10 bg-black text-white" : "border-black/10 bg-white text-slate-800 hover:bg-black/5",
                      )}
                      aria-label={`Página ${p}`}
                    >
                      {p}
                    </button>
                  ))}

                  {pagesWindow.at(-1)! < totalPages ? (
                    <>
                      <span className="px-1 text-sm font-extrabold text-slate-400">…</span>
                      <button
                        type="button"
                        onClick={() => setQuery({ page: totalPages })}
                        className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-extrabold text-slate-800 transition hover:bg-black/5 active:scale-[0.99]"
                        aria-label={`Página ${totalPages}`}
                      >
                        {totalPages}
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setQuery({ page: page + 1 })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-slate-800 transition hover:bg-black/5 active:scale-[0.99] disabled:opacity-50"
                    aria-label="Siguiente"
                  >
                    <i className="bi bi-chevron-right text-lg leading-none" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ShopWithSidebar;
