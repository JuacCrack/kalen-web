import React from "react";
import Link from "next/link";
import ProductItem from "@/components/Common/ProductItem";
import {
  getHomeNewArrivals,
  getProducts,
  resolveProductsByIds,
} from "@/data/store";

const NewArrival = () => {
  const cfg = getHomeNewArrivals();
  const { items } = getProducts();
  const products = resolveProductsByIds(cfg.productIds, items);

  const kicker = (cfg.kicker ?? "").trim() || "Novedades";
  const title = (cfg.title ?? "").trim() || "Productos destacados";
  const viewAllHref = cfg.viewAll?.href || "/shop-with-sidebar";
  const viewAllLabel = (cfg.viewAll?.label ?? "").trim() || "Ver todo";

  return (
    <section className="relative overflow-hidden py-10 sm:py-14 lg:py-18">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-28 h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-3xl opacity-40 bg-[#fe62b2]" />
        <div className="absolute -bottom-28 -right-28 h-64 w-64 sm:h-80 sm:w-80 rounded-full blur-3xl opacity-35 bg-[#ffaed7]" />
        <div className="absolute inset-0 bg-white" />
      </div>

      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-0">
        <div className="mb-7 sm:mb-9 flex flex-col gap-4 sm:gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/85 px-3 py-1 text-xs sm:text-sm font-semibold text-slate-900 shadow-sm backdrop-blur">
              <i
                className="bi bi-stars text-[15px] sm:text-[16px] leading-none text-[#fe62b2]"
                aria-hidden="true"
              />
              <span className="leading-none">{kicker}</span>
            </span>

            <h2 className="mt-3 text-balance font-semibold text-[22px] leading-tight sm:text-3xl lg:text-[34px] text-slate-900">
              {title}
            </h2>

            <div className="mt-3 h-1 w-20 sm:w-24 rounded-full bg-gradient-to-r from-[#fe62b2] to-[#ffaed7]" />
          </div>

          <div className="flex items-start md:justify-end pt-[2px]">
            <Link
              href={viewAllHref}
              className="inline-flex w-full xs:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.99] bg-[#fe62b2]"
            >
              <i className="bi bi-bag" aria-hidden="true" />
              {viewAllLabel}
            </Link>
          </div>
        </div>

        {products.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-6 lg:gap-x-7.5 gap-y-5 sm:gap-y-8 lg:gap-y-9">
            {products.map((item) => (
              <div key={(item as any).id} className="h-full">
                <ProductItem item={item as any} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/5 bg-white/85 p-6 sm:p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto mb-3 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#ffaed7]/40 text-slate-900">
              <i
                className="bi bi-bag-x text-[20px] sm:text-[22px] leading-none"
                aria-hidden="true"
              />
            </div>

            <p className="text-base sm:text-lg font-semibold text-slate-900">
              Todavía no hay productos para mostrar.
            </p>
            <p className="mt-1 text-sm sm:text-base text-slate-600">
              Volvé en unos minutos o explorá la tienda completa.
            </p>

            <div className="mt-5 flex flex-col xs:flex-row gap-3 justify-center">
              <Link
                href={viewAllHref}
                className="inline-flex w-full xs:w-auto items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md active:scale-[0.99] bg-[#fe62b2]"
              >
                <i className="bi bi-shop" aria-hidden="true" />
                Ir a la tienda
              </Link>

              <Link
                href="/"
                className="inline-flex w-full xs:w-auto items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-black hover:text-white"
              >
                <i className="bi bi-house" aria-hidden="true" />
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrival;
