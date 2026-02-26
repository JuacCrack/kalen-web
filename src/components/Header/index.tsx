"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import CustomSelect from "./CustomSelect";
import Dropdown from "./Dropdown";
import { useAppSelector } from "@/redux/store";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { useStoreData } from "@/app/(site)/StoreDataProvider";
import AccountAuthModal from "./AccountAuthModal";

import { useAuth } from "@/app/context/AuthContext";

const getByPath = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  const parts = String(path).split(".").filter(Boolean);
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
    if (v == null || typeof v === "object") return "";
    return String(v);
  });
};

const flatten2 = <T,>(x: any): T[] =>
  Array.isArray(x)
    ? x.flatMap((v) => flatten2<T>(v))
    : x != null
      ? [x as T]
      : [];
const uniqBy = <T, K extends string | number>(arr: T[], key: (t: T) => K) => {
  const s = new Set<K>();
  return arr.filter((x) => {
    const k = key(x);
    if (s.has(k)) return false;
    s.add(k);
    return true;
  });
};

const IconBtn = ({
  as = "button",
  href,
  onClick,
  ariaLabel,
  children,
  className = "",
}: {
  as?: "button" | "link";
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const base =
    "group flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 active:scale-[0.98]";
  if (as === "link" && href)
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${base} ${className}`}
      >
        {children}
      </Link>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${base} ${className}`}
    >
      {children}
    </button>
  );
};

const SearchBar = ({
  categories,
  placeholder,
  ariaSubmit,
  query,
  setQuery,
  withClose,
  ariaClose,
}: {
  categories: any[];
  placeholder: string;
  ariaSubmit: string;
  query: string;
  setQuery: (v: string) => void;
  withClose?: boolean;
  ariaClose?: string;
}) => {
  const { user, isAuthenticated, loading, logout } = useAuth();

  return (
    <div className="max-w-[475px] w-full mx-auto">
      <form
        action="/shop-whith-sidebar"
        role="search"
        aria-label="Buscar productos"
        onSubmit={(e) => {
          const q = query.trim();
          if (!q) return;

          const event_source_url =
            typeof window !== "undefined" ? window.location.href : undefined;
          const event_id = (
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}`
          ).toString();

          fetch("/api/meta/capi", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              event_name: "Search",
              event_id,
              event_source_url,
              custom_data: { search_string: q },
              ...(isAuthenticated && user?.email
                ? { user: { email: user.email } }
                : {}),
            }),
            keepalive: true,
          }).catch(() => {});

          window.fbq?.(
            "track",
            "Search",
            { search_string: q },
            { eventID: event_id },
          );
        }}
      >
        <div className="flex items-center">
          <CustomSelect options={categories} />
          <div className="relative max-w-[333px] sm:min-w-[333px] w-full">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 inline-block w-px h-5.5 bg-gray-4" />
            <input
              onChange={(e) => setQuery(e.target.value)}
              value={query}
              type="search"
              name="search"
              id="search"
              placeholder={placeholder}
              autoComplete="off"
              className="custom-search w-full rounded-r-[5px] bg-gray-1 !border-l-0 border border-gray-3 py-2.5 pl-4 pr-20 outline-none ease-in duration-200 focus:border-[color:var(--brand-primary,#fe62b2)] focus:ring-4 focus:ring-[color:var(--brand-secondary,#ffaed7)]/40"
            />
            <button
              id="search-btn"
              aria-label={ariaSubmit}
              type="submit"
              className="flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 ease-in duration-200 hover:text-[color:var(--brand-primary,#fe62b2)]"
            >
              <i className="bi bi-search text-[18px] leading-none" />
            </button>

            {withClose ? (
              <label
                htmlFor="mobile-search-toggle"
                aria-label={ariaClose}
                className="hidden lg:peer-checked:inline-flex items-center justify-center absolute right-11 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-gray-3 bg-white text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 cursor-pointer"
              >
                <i className="bi bi-x-lg text-[14px] leading-none" />
              </label>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
};

const Header = () => {
  const store = useStoreData();
  const { header, global, products, categories } = store;

  useEffect(() => {
    console.log("[Header] store data:", {
      header,
      global,
      products,
      categories,
    });
  }, [store, header, global, products, categories]);

  const [searchQuery, setSearchQuery] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const { openCartModal } = useCartModalContext();

  const product = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);

  useEffect(() => {
    const onScroll = () => setStickyMenu(window.scrollY >= 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

  useEffect(() => {
    const src = resolveTplValue<any>(header.search?.categoriesSource, store);
    const raw = {
      headerMenu: header.menu,
      headerItem0: Array.isArray(header.menu) ? header.menu[0] : undefined,
      categoriesSourceRaw: header.search?.categoriesSource,
      categoriesSourceResolved: src,
      resolvedIsArray: Array.isArray(src),
      resolvedLen: Array.isArray(src) ? src.length : 0,
      categoriesBlock: categories,
      categoriesItems: categories?.items,
      categoriesItemsIsArray: Array.isArray(categories?.items),
      categoriesItemsShape: Array.isArray(categories?.items)
        ? categories.items.map((r: any) =>
            Array.isArray(r) ? r.length : typeof r,
          )
        : null,
      sampleFirstRow: Array.isArray(categories?.items)
        ? categories.items?.[0]
        : undefined,
      sampleFirstCategory: Array.isArray(categories?.items?.[0])
        ? categories.items?.[0]?.[0]
        : undefined,
      sampleFirstSub: Array.isArray(categories?.items?.[0]?.[0]?.sub)
        ? categories.items?.[0]?.[0]?.sub
        : undefined,
      productsItemsShape: Array.isArray(products?.items)
        ? products.items.map((r: any) =>
            Array.isArray(r) ? r.length : typeof r,
          )
        : null,
    };
  }, [
    store,
    header.menu,
    header.search?.categoriesSource,
    categories,
    products,
  ]);

  const resolvedUiColors = useMemo(() => {
    const v = resolveTplValue<any>(header.ui?.colors, store);
    return typeof v === "object" && v ? v : undefined;
  }, [header.ui?.colors, store]);

  const primary = useMemo(
    () => resolvedUiColors?.primary ?? global.colors?.primary ?? "#fe62b2",
    [resolvedUiColors?.primary, global.colors?.primary],
  );

  const secondary = useMemo(
    () => resolvedUiColors?.secondary ?? global.colors?.secondary ?? "#ffaed7",
    [resolvedUiColors?.secondary, global.colors?.secondary],
  );

  const categoriesOptions = useMemo(() => {
    const cfg = header.search?.categoriesConfig;
    const labelKey = cfg?.labelKey ?? "label";
    const valueKey = cfg?.valueKey ?? "slug";

    const src = resolveTplValue<any>(header.search?.categoriesSource, store);
    const items = Array.isArray(src) ? src : [];

    const onlyTop = items
      .map((it: any) => ({
        label: it?.[labelKey],
        value: it?.[valueKey],
      }))
      .map((o: any) => ({
        label: typeof o?.label === "string" ? o.label.trim() : "",
        value: o?.value,
      }))
      .filter((o: any) => o.label && o.value != null);

    const out = uniqBy(onlyTop, (o) => `${o.label}::${String(o.value)}`);

    if (cfg?.includeAll)
      return [
        { label: cfg.allLabel ?? "Todas", value: cfg.allValue ?? "all" },
        ...out,
      ];

    return out;
  }, [header.search?.categoriesSource, header.search?.categoriesConfig, store]);

  const menuResolved = useMemo(() => {
    const menu = Array.isArray(header.menu) ? header.menu : [];
    return menu.flatMap((mi: any) => {
      const title = mi.title;
      const path = resolveTplString(mi.path, store);

      if (mi.submenu && Array.isArray(mi.submenu)) {
        return [
          {
            ...mi,
            title,
            path,
            submenu: mi.submenu
              .map((s: any) => ({
                title: String(s.title ?? "").trim(),
                path: resolveTplString(s.path, store),
              }))
              .filter((s: any) => s.title && s.path),
          },
        ];
      }

      if (mi.submenuSource && mi.submenuConfig) {
        const src = resolveTplValue<any>(mi.submenuSource, store);
        const items = flatten2<any>(src);
        const cfg = mi.submenuConfig;
        const tpl = resolveTplString(cfg.pathTemplate, store);
        const mkPath = (value: any) =>
          tpl.replaceAll("{value}", encodeURIComponent(String(value)));

        return items
          .map((cat: any) => {
            const catLabel = String(
              cat?.[cfg.labelKey] ?? cat?.title ?? "",
            ).trim();
            const catValue = cat?.[cfg.valueKey] ?? cat?.slug ?? cat?.id;
            if (!catLabel || catValue == null) return null;

            const subs = Array.isArray(cat?.sub) ? cat.sub : [];
            const submenu = subs
              .map((sub: any) => {
                const subLabel = String(
                  sub?.[cfg.labelKey] ?? sub?.title ?? "",
                ).trim();
                const subValue = sub?.[cfg.valueKey] ?? sub?.slug ?? sub?.id;
                if (!subLabel || subValue == null) return null;
                return { title: subLabel, path: mkPath(subValue) };
              })
              .filter(Boolean);

            return {
              ...mi,
              id: String(cat?.id ?? catValue),
              title: catLabel,
              path: mkPath(catValue),
              ...(submenu.length ? { submenu } : {}),
            };
          })
          .filter(Boolean);
      }

      return [{ ...mi, title, path }];
    });
  }, [header.menu, store]);

  const supportKicker = useMemo(
    () =>
      header.support ? resolveTplString(header.support.kicker, store) : "",
    [header.support, store],
  );
  const supportValue = useMemo(
    () => (header.support ? resolveTplString(header.support.value, store) : ""),
    [header.support, store],
  );
  const supportIcon = useMemo(
    () =>
      header.support?.icon ? resolveTplString(header.support.icon, store) : "",
    [header.support?.icon, store],
  );

  const topPad = stickyMenu ? "py-4" : "py-6";
  const navPad = stickyMenu ? "xl:py-4" : "xl:py-6";

  const logoHref = header.logo?.href || "/";
  const logoSrc = header.logo?.src?.trim() ? header.logo.src : null;

  return (
    <header
      className={`fixed left-0 top-0 w-full z-9999 bg-white transition-all ease-in-out duration-300 ${
        stickyMenu && header.ui?.stickyShadow ? "shadow" : ""
      }`}
      style={
        {
          ["--brand-primary" as any]: primary,
          ["--brand-secondary" as any]: secondary,
        } as React.CSSProperties
      }
    >
      <div className="max-w-[1170px] mx-auto px-4 sm:px-7.5 xl:px-0">
        <div className={`ease-out duration-200 ${topPad}`}>
          <input
            id="mobile-search-toggle"
            type="checkbox"
            className="peer sr-only"
            defaultChecked
          />

          <div className="grid grid-cols-3 items-center gap-4 lg:flex lg:flex-row lg:gap-5 lg:items-center xl:justify-between">
            <div className="col-span-1 flex items-center gap-4 lg:col-auto lg:order-1 lg:w-auto">
              <div className="flex items-center gap-3">
                <AccountAuthModal
                  kicker={resolveTplString(header.links.account.kicker, store)}
                  label={resolveTplString(header.links.account.label, store)}
                  icon={header.links.account.icon ?? "bi-person"}
                />

                <button
                  onClick={openCartModal}
                  className="flex items-center gap-2.5 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 px-3 h-10 active:scale-[0.98]"
                  type="button"
                  aria-label="Abrir carrito"
                >
                  <span className="inline-block relative">
                    <i className="bi bi-cart3 text-[20px] leading-none" />
                    <span className="flex items-center justify-center font-medium text-2xs absolute -right-2 -top-2.5 bg-[color:var(--brand-primary,#fe62b2)] w-4.5 h-4.5 rounded-full text-white">
                      {product.length}
                    </span>
                  </span>

                  <div className="hidden lg:block leading-tight">
                    <span className="block text-2xs text-dark-4 uppercase">
                      carrito
                    </span>
                    <p className="font-medium text-custom-sm text-dark">
                      ${totalPrice}
                    </p>
                  </div>
                </button>

                <label
                  htmlFor="mobile-search-toggle"
                  aria-label={resolveTplString(header.search.ariaOpen, store)}
                  className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 cursor-pointer active:scale-[0.98]"
                >
                  <i className="bi bi-search text-[18px] leading-none" />
                </label>
              </div>
            </div>

            <div className="col-span-1 flex justify-center lg:order-2 lg:flex-1">
              <Link
                className="flex-shrink-0 flex justify-center w-full"
                href={logoHref}
                aria-label="Ir al inicio"
              >
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt={header.logo.alt}
                    width={header.logo.width}
                    height={header.logo.height}
                    className={header.logo.className ?? ""}
                    priority
                  />
                ) : null}
              </Link>
            </div>

            <div className="col-span-1 flex justify-end items-center gap-7.5 lg:col-auto lg:order-3">
              {header.support ? (
                <div className="hidden xl:flex items-center gap-3.5">
                  <i
                    className={`bi ${supportIcon || "bi-headset"} text-[24px] text-[color:var(--brand-primary,#fe62b2)]`}
                  />
                  <div>
                    <span className="block text-2xs text-dark-4 uppercase">
                      {supportKicker}
                    </span>
                    <p className="font-medium text-custom-sm text-dark">
                      {supportValue}
                    </p>
                  </div>
                </div>
              ) : null}

              <span className="hidden xl:block w-px h-7.5 bg-gray-4" />

              <div className="hidden xl:block">
                <ul className="flex items-center gap-2">
                  {header.actions?.recent ? (
                    <li>
                      <IconBtn
                        as="link"
                        href={resolveTplString(
                          header.actions.recent.href,
                          store,
                        )}
                        ariaLabel={resolveTplString(
                          header.actions.recent.ariaLabel,
                          store,
                        )}
                      >
                        <i
                          className={`bi ${header.actions.recent.icon ?? "bi-clock-history"} text-[18px] leading-none`}
                        />
                      </IconBtn>
                    </li>
                  ) : null}

                  <li>
                    <IconBtn
                      as="link"
                      href={resolveTplString(header.links.wishlist.href, store)}
                      ariaLabel={resolveTplString(
                        header.links.wishlist.ariaLabel,
                        store,
                      )}
                    >
                      <i
                        className={`bi ${header.links.wishlist.icon ?? "bi-heart"} text-[18px] leading-none`}
                      />
                    </IconBtn>
                  </li>
                </ul>
              </div>

              <div className="flex w-full lg:w-auto justify-end items-center gap-5 xl:hidden">
                <button
                  id="Toggle"
                  aria-label="Toggler"
                  className="xl:hidden block"
                  onClick={() => setNavigationOpen((v) => !v)}
                  type="button"
                >
                  <span className="block relative cursor-pointer w-5.5 h-5.5">
                    <span className="du-block absolute right-0 w-full h-full">
                      <span
                        className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-[0] ${
                          !navigationOpen && "!w-full delay-300"
                        }`}
                      />
                      <span
                        className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-150 ${
                          !navigationOpen && "!w-full delay-400"
                        }`}
                      />
                      <span
                        className={`block relative top-0 left-0 bg-dark rounded-sm w-0 h-0.5 my-1 ease-in-out duration-200 delay-200 ${
                          !navigationOpen && "!w-full delay-500"
                        }`}
                      />
                    </span>

                    <span className="block absolute right-0 w-full h-full rotate-45">
                      <span
                        className={`block bg-dark rounded-sm ease-in-out duration-200 delay-300 absolute left-2.5 top-0 w-0.5 h-full ${
                          !navigationOpen && "!h-0 delay-[0] "
                        }`}
                      />
                      <span
                        className={`block bg-dark rounded-sm ease-in-out duration-200 delay-400 absolute left-0 top-2.5 w-full h-0.5 ${
                          !navigationOpen && "!h-0 dealy-200"
                        }`}
                      />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="block w-full pt-4 lg:pt-5 lg:hidden">
            <SearchBar
              categories={categoriesOptions}
              placeholder={resolveTplString(header.search.placeholder, store)}
              ariaSubmit={resolveTplString(header.search.ariaSubmit, store)}
              query={searchQuery}
              setQuery={setSearchQuery}
            />
          </div>

          <div className="hidden w-full pt-4 lg:pt-5 lg:hidden lg:peer-checked:block">
            <SearchBar
              categories={categoriesOptions}
              placeholder={resolveTplString(header.search.placeholder, store)}
              ariaSubmit={resolveTplString(header.search.ariaSubmit, store)}
              ariaClose={resolveTplString(header.search.ariaClose, store)}
              withClose
              query={searchQuery}
              setQuery={setSearchQuery}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-3">
        <div className="max-w-[1170px] mx-auto px-4 sm:px-7.5 xl:px-0">
          <div className="flex items-center justify-center">
            <div className="hidden xl:flex items-center justify-center xl:static xl:w-auto">
              <nav className="overflow-visible">
                <ul className="flex xl:items-center flex-col xl:flex-row gap-5 xl:gap-6 overflow-visible">
                  {menuResolved.map((menuItem: any, i: number) =>
                    menuItem.submenu &&
                    Array.isArray(menuItem.submenu) &&
                    menuItem.submenu.length ? (
                      <li
                        key={i}
                        className="group relative overflow-visible before:w-0 before:h-[3px] before:bg-[color:var(--brand-primary,#fe62b2)] before:absolute before:left-0 before:top-0 before:rounded-b-[3px] before:ease-out before:duration-200 hover:before:w-full"
                      >
                        <button
                          type="button"
                          className={`hover:text-[color:var(--brand-primary,#fe62b2)] text-custom-sm font-medium text-dark flex items-center gap-1 ${navPad}`}
                          aria-haspopup="menu"
                        >
                          {menuItem.title}
                          <i className="bi bi-chevron-down text-[12px] leading-none transition-transform duration-200 group-hover:rotate-180" />
                        </button>

                        <div className="absolute top-full left-0 -mt-4 z-50 hidden group-hover:block group-focus-within:block">
                          <div className="relative pt-3">
                            <span className="absolute top-0 left-5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[8px] border-b-white drop-shadow-[0_-1px_0_rgba(0,0,0,0.10)]" />
                            <div className="bg-white border border-gray-3 rounded-2xl shadow-xl min-w-[260px] py-2 overflow-hidden">
                              {menuItem.submenu.map(
                                (subItem: any, j: number) => (
                                  <Link
                                    key={j}
                                    href={subItem.path}
                                    className="group flex items-center justify-between gap-4 px-4 py-2.5 text-sm text-[color:var(--brand-primary,#fe62b2)] transition hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 hover:text-[color:var(--brand-primary,#fe62b2)]"
                                  >
                                    <span>{subItem.title}</span>
                                    <i className="bi bi-arrow-right text-[14px] leading-none opacity-60 transition-transform duration-150 group-hover:translate-x-0.5" />
                                  </Link>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ) : (
                      <li
                        key={i}
                        className="group relative before:w-0 before:h-[3px] before:bg-[color:var(--brand-primary,#fe62b2)] before:absolute before:left-0 before:top-0 before:rounded-b-[3px] before:ease-out before:duration-200 hover:before:w-full"
                      >
                        <Link
                          href={menuItem.path}
                          className={`hover:text-[color:var(--brand-primary,#fe62b2)] text-custom-sm font-medium text-dark flex ${navPad}`}
                        >
                          {menuItem.title}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </nav>
            </div>

            <div
              className={`xl:hidden fixed inset-0 z-[9999] bg-white transition-opacity duration-200 ${
                navigationOpen ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
              role="dialog"
              aria-modal="true"
              aria-hidden={!navigationOpen}
            >
              <div className="h-full w-full flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-3">
                  <span className="text-[color:var(--brand-primary,#fe62b2)] font-semibold text-base tracking-wide">
                    Menú
                  </span>

                  <button
                    type="button"
                    onClick={() => setNavigationOpen(false)}
                    aria-label="Cerrar menú"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-1 transition"
                  >
                    <i className="bi bi-x-lg text-[18px] leading-none text-[color:var(--brand-primary,#fe62b2)]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <nav>
                    <ul className="flex flex-col">
                      {menuResolved.map((menuItem: any, i: number) =>
                        menuItem.submenu &&
                        Array.isArray(menuItem.submenu) &&
                        menuItem.submenu.length ? (
                          <Dropdown
                            key={i}
                            menuItem={menuItem}
                            stickyMenu={stickyMenu}
                          />
                        ) : (
                          <li key={i} className="border-b border-gray-2/60">
                            <Link
                              href={menuItem.path}
                              onClick={() => setNavigationOpen(false)}
                              className="flex items-center justify-between py-4 text-[color:var(--brand-primary,#fe62b2)] font-semibold text-base"
                            >
                              <span>{menuItem.title}</span>
                              <i className="bi bi-arrow-right text-[18px] leading-none text-[color:var(--brand-primary,#fe62b2)]" />
                            </Link>
                          </li>
                        ),
                      )}
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
