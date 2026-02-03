"use client";
import React, { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "../Common/Breadcrumb";
import CustomSelect from "./CustomSelect";
import CategoryDropdown from "./CategoryDropdown";
import GenderDropdown from "./GenderDropdown";
import SizeDropdown from "./SizeDropdown";
import ColorsDropdwon from "./ColorsDropdwon";
import PriceDropdown from "./PriceDropdown";
import SingleGridItem from "../Shop/SingleGridItem";
import SingleListItem from "../Shop/SingleListItem";
import { getCategories, getGlobal, getProducts, type Product } from "@/data/store";

type CategoryUIItem = { name: string; products: number; isRefined: boolean; value?: string; href?: string };
type GenderUIItem = { name: string; products: number; value?: string; href?: string };

const asNumber = (v: string | null) => {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const asString = (v: string | null) => (v == null ? undefined : String(v));

const toShopItem = (p: Product) => {
  const price = Number(p.price ?? 0);
  const discountedPrice =
    typeof p.discountPercent === "number" && p.discountPercent > 0
      ? Math.max(0, Math.round(price * (1 - p.discountPercent / 100)))
      : (p as any).discountedPrice ?? price;

  const imgs =
    (p as any).imgs ??
    ({
      thumbnails: [p.image?.src ?? ""].filter(Boolean),
      previews: [p.image?.src ?? ""].filter(Boolean),
    } as any);

  return {
    ...(p as any),
    id: p.id,
    title: p.title,
    price,
    discountedPrice,
    reviews: (p as any).reviews ?? 0,
    imgs,
  };
};

const ShopWithSidebar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [estiloProductos, setEstiloProductos] = useState("grid");
  const [sidebarProductos, setSidebarProductos] = useState(false);
  const [menuPegajoso, setMenuPegajoso] = useState(false);

  const manejarMenuPegajoso = () => {
    if (window.scrollY >= 80) setMenuPegajoso(true);
    else setMenuPegajoso(false);
  };

  const opciones = [
    { label: "Productos más recientes", value: "0" },
    { label: "Más vendidos", value: "1" },
    { label: "Productos antiguos", value: "2" },
  ];

  const global = useMemo(() => getGlobal(), []);
  const shopPath = global?.store?.routes?.shop ?? "/shop-with-sidebar";
  const categoryQueryKey = global?.store?.routes?.categoryQueryKey ?? "cat";

  const qpCat = asString(searchParams.get(categoryQueryKey));
  const qpGender = asString(searchParams.get("gender"));
  const qpSize = asString(searchParams.get("size"));
  const qpColor = asString(searchParams.get("color"));
  const qpMin = asNumber(searchParams.get("min"));
  const qpMax = asNumber(searchParams.get("max"));
  const qpSort = asString(searchParams.get("sort")) ?? "0";
  const qpPage = Math.max(1, asNumber(searchParams.get("page")) ?? 1);

  const { categories, products, maps } = useMemo(() => {
    const cs = getCategories().items;
    const ps = getProducts().items;

    const slugToId = new Map<string, string>(cs.map((c) => [c.slug, c.id] as const));
    const idToSlug = new Map<string, string>(cs.map((c) => [c.id, c.slug] as const));
    const catIdFromParam = qpCat ? slugToId.get(qpCat) ?? qpCat : undefined;

    const byCatCount = new Map<string, number>();
    const byGenderCount = new Map<string, number>();

    for (const p of ps) {
      const cid = p.categoryId;
      if (cid) byCatCount.set(cid, (byCatCount.get(cid) ?? 0) + 1);

      const g = String((p as any).gender ?? "");
      if (g) byGenderCount.set(g, (byGenderCount.get(g) ?? 0) + 1);
    }

    const categoriesUI: CategoryUIItem[] = cs.map((c) => {
      const isRefined = !!catIdFromParam && (catIdFromParam === c.id || qpCat === c.slug);
      const href = `${shopPath}?${categoryQueryKey}=${encodeURIComponent(c.slug)}`;
      return {
        name: c.title,
        products: byCatCount.get(c.id) ?? 0,
        isRefined,
        value: c.slug,
        href,
      };
    });

    const gendersUI: GenderUIItem[] = Array.from(byGenderCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        products: count,
        value: name.toLowerCase(),
        href: `${shopPath}?gender=${encodeURIComponent(name.toLowerCase())}`,
      }));

    return {
      categories: { items: cs, ui: categoriesUI, slugToId, idToSlug, catIdFromParam },
      products: ps,
      maps: { byCatCount, byGenderCount },
    };
  }, [qpCat, qpGender, qpSize, qpColor, qpMin, qpMax, qpSort, qpPage, shopPath, categoryQueryKey]);

  const filtered = useMemo(() => {
    const catIdFromParam = categories.catIdFromParam;

    const matchCategory = (p: Product) => {
      if (!catIdFromParam) return true;
      return p.categoryId === catIdFromParam;
    };

    const matchGender = (p: Product) => {
      if (!qpGender) return true;
      const g = String((p as any).gender ?? "").toLowerCase();
      return !g ? true : g === qpGender.toLowerCase();
    };

    const matchSize = (p: Product) => {
      if (!qpSize) return true;
      const sizes = (p as any).sizes as string[] | undefined;
      if (!Array.isArray(sizes) || !sizes.length) return true;
      return sizes.map((s) => String(s).toLowerCase()).includes(qpSize.toLowerCase());
    };

    const matchColor = (p: Product) => {
      if (!qpColor) return true;
      const colors = (p as any).colors as string[] | undefined;
      if (!Array.isArray(colors) || !colors.length) return true;
      return colors.map((c) => String(c).toLowerCase()).includes(qpColor.toLowerCase());
    };

    const matchPrice = (p: Product) => {
      const price = Number(p.price ?? 0);
      if (typeof qpMin === "number" && price < qpMin) return false;
      if (typeof qpMax === "number" && price > qpMax) return false;
      return true;
    };

    const xs = products.filter((p) => matchCategory(p) && matchGender(p) && matchSize(p) && matchColor(p) && matchPrice(p));

    const sortKey = qpSort;
    const sorted = xs.slice().sort((a, b) => {
      if (sortKey === "1") {
        const sa = Number((a as any).soldCount ?? 0);
        const sb = Number((b as any).soldCount ?? 0);
        return sb - sa;
      }
      if (sortKey === "2") {
        const da = new Date((a as any).createdAt ?? 0).getTime();
        const db = new Date((b as any).createdAt ?? 0).getTime();
        return da - db;
      }
      const da = new Date((a as any).createdAt ?? 0).getTime();
      const db = new Date((b as any).createdAt ?? 0).getTime();
      return db - da;
    });

    return sorted.map(toShopItem);
  }, [products, categories.catIdFromParam, qpGender, qpSize, qpColor, qpMin, qpMax, qpSort]);

  const pageSize = 9;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(qpPage, totalPages);
  const pageItems = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const setQuery = (patch: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, String(v));
    }
    const qs = params.toString();
    router.push(qs ? `${shopPath}?${qs}` : shopPath);
  };

  const limpiarTodo = () => router.push(shopPath);

  useEffect(() => {
    window.addEventListener("scroll", manejarMenuPegajoso);

    function manejarClickFuera(event: any) {
      if (!event.target.closest(".sidebar-content")) setSidebarProductos(false);
    }

    if (sidebarProductos) document.addEventListener("mousedown", manejarClickFuera);

    return () => {
      document.removeEventListener("mousedown", manejarClickFuera);
      window.removeEventListener("scroll", manejarMenuPegajoso);
    };
  });

  return (
    <>
      <Breadcrumb title={"Explorar todos los productos"} pages={["tienda", "/", "tienda con sidebar"]} />
      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28 bg-[#f3f4f6]">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex gap-7.5">
            <div
              className={`sidebar-content fixed xl:z-1 z-9999 left-0 top-0 xl:translate-x-0 xl:static max-w-[310px] xl:max-w-[270px] w-full ease-out duration-200 ${
                sidebarProductos ? "translate-x-0 bg-white p-5 h-screen overflow-y-auto" : "-translate-x-full"
              }`}
            >
              <button
                onClick={() => setSidebarProductos(!sidebarProductos)}
                aria-label="botón para alternar el sidebar de productos"
                className={`xl:hidden absolute -right-12.5 sm:-right-8 flex items-center justify-center w-8 h-8 rounded-md bg-white shadow-1 ${
                  menuPegajoso ? "lg:top-20 sm:top-34.5 top-35" : "lg:top-24 sm:top-39 top-37"
                }`}
              >
                <i className="bi bi-funnel"></i>
              </button>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-6">
                  <div className="bg-white shadow-1 rounded-lg py-4 px-5">
                    <div className="flex items-center justify-between">
                      <p>Filtros:</p>
                      <button type="button" onClick={limpiarTodo} className="text-blue">
                        Limpiar todo
                      </button>
                    </div>
                  </div>

                  <CategoryDropdown categories={categories.ui} />
                  <GenderDropdown genders={maps.byGenderCount.size ? categories.ui.length ? (() => {
                    const byGenderCount = maps.byGenderCount;
                    return Array.from(byGenderCount.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, count]) => ({
                        name,
                        products: count,
                      }));
                  })() : [] : []} />
                  <SizeDropdown />
                  <ColorsDropdwon />
                  <PriceDropdown />
                </div>
              </form>
            </div>

            <div className="xl:max-w-[870px] w-full">
              <div className="rounded-lg bg-white shadow-1 pl-3 pr-2.5 py-2.5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <CustomSelect options={opciones} />

                    <p>
                      Mostrando{" "}
                      <span className="text-dark">
                        {Math.min(page * pageSize, total)} de {total}
                      </span>{" "}
                      productos
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setEstiloProductos("grid")}
                      aria-label="botón para vista en grilla"
                      className={`${
                        estiloProductos === "grid" ? "bg-blue border-blue text-white" : "text-dark bg-gray-1 border-gray-3"
                      } flex items-center justify-center w-10.5 h-9 rounded-[5px] border ease-out duration-200 hover:bg-blue hover:border-blue hover:text-white`}
                    >
                      <i className="bi bi-grid-3x3-gap-fill text-lg leading-none" />
                    </button>

                    <button
                      onClick={() => setEstiloProductos("list")}
                      aria-label="botón para vista en lista"
                      className={`${
                        estiloProductos === "list" ? "bg-blue border-blue text-white" : "text-dark bg-gray-1 border-gray-3"
                      } flex items-center justify-center w-10.5 h-9 rounded-[5px] border ease-out duration-200 hover:bg-blue hover:border-blue hover:text-white`}
                    >
                      <i className="bi bi-list-ul text-lg leading-none" />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`${
                  estiloProductos === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7.5 gap-y-9"
                    : "flex flex-col gap-7.5"
                }`}
              >
                {pageItems.map((item, key) =>
                  estiloProductos === "grid" ? <SingleGridItem item={item} key={key} /> : <SingleListItem item={item} key={key} />
                )}
              </div>

              <div className="flex justify-center mt-15">
                <div className="bg-white shadow-1 rounded-md p-2">
                  <ul className="flex items-center">
                    <li>
                      <button
                        id="paginationLeft"
                        aria-label="botón para paginación anterior"
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setQuery({ page: page - 1 })}
                        className="flex items-center justify-center w-8 h-9 ease-out duration-200 rounded-[3px disabled:text-gray-4"
                      >
                        <i className="bi bi-chevron-left text-lg leading-none" />
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                      <li key={p}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setQuery({ page: p });
                          }}
                          className={`flex py-1.5 px-3.5 duration-200 rounded-[3px] ${
                            p === page ? "bg-blue text-white hover:text-white hover:bg-blue" : "hover:text-white hover:bg-blue"
                          }`}
                        >
                          {p}
                        </a>
                      </li>
                    ))}

                    <li>
                      <button
                        id="paginationLeft"
                        aria-label="botón para paginación siguiente"
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setQuery({ page: page + 1 })}
                        className="flex items-center justify-center w-8 h-9 ease-out duration-200 rounded-[3px] hover:text-white hover:bg-blue disabled:text-gray-4"
                      >
                        <i className="bi bi-chevron-right text-lg leading-none" />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopWithSidebar;
