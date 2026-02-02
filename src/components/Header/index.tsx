"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import CustomSelect from "./CustomSelect";
import Dropdown from "./Dropdown";
import { useAppSelector } from "@/redux/store";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { getHeader, getGlobal } from "@/data/store";

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
    "group flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25";
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
}) => (
  <div className="max-w-[475px] w-full mx-auto">
    <form>
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

const Header = () => {
  const header = getHeader();
  const global = getGlobal();

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

  const primary = useMemo(
    () => header.ui?.colors?.primary ?? global.colors?.primary ?? "#fe62b2",
    [header.ui?.colors?.primary, global.colors?.primary],
  );
  const secondary = useMemo(
    () => header.ui?.colors?.secondary ?? global.colors?.secondary ?? "#ffaed7",
    [header.ui?.colors?.secondary, global.colors?.secondary],
  );

  const topPad = stickyMenu ? "py-4" : "py-6";
  const navPad = stickyMenu ? "xl:py-4" : "xl:py-6";

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
                <Link
                  href={header.links.account.href}
                  className="flex items-center gap-2.5 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 px-3 h-10"
                >
                  <i
                    className={`bi ${header.links.account.icon ?? "bi-person"} text-[22px] leading-none`}
                  />
                  <div className="hidden lg:block leading-tight">
                    <span className="block text-2xs text-dark-4 uppercase">
                      {header.links.account.kicker}
                    </span>
                    <p className="font-medium text-custom-sm text-dark">
                      {header.links.account.label}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={openCartModal}
                  className="flex items-center gap-2.5 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 px-3 h-10"
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
                  aria-label={header.search.ariaOpen}
                  className="hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)] ease-in duration-200 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 cursor-pointer"
                >
                  <i className="bi bi-search text-[18px] leading-none" />
                </label>
              </div>
            </div>

            <div className="col-span-1 flex justify-center lg:order-2 lg:flex-1">
              <Link
                className="flex-shrink-0 flex justify-center w-full"
                href={header.logo.href}
              >
                <Image
                  src={header.logo.src}
                  alt={header.logo.alt}
                  width={header.logo.width}
                  height={header.logo.height}
                  className={header.logo.className ?? ""}
                />
              </Link>
            </div>

            <div className="col-span-1 flex justify-end items-center gap-7.5 lg:col-auto lg:order-3">
              {header.support ? (
                <div className="hidden xl:flex items-center gap-3.5">
                  <i
                    className={`bi ${header.support.icon ?? "bi-headset"} text-[24px] text-[color:var(--brand-primary,#fe62b2)]`}
                  />
                  <div>
                    <span className="block text-2xs text-dark-4 uppercase">
                      {header.support.kicker}
                    </span>
                    <p className="font-medium text-custom-sm text-dark">
                      {header.support.value}
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
                        href={header.actions.recent.href}
                        ariaLabel={header.actions.recent.ariaLabel}
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
                      href={header.links.wishlist.href}
                      ariaLabel={header.links.wishlist.ariaLabel}
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
              categories={header.search.categories}
              placeholder={header.search.placeholder}
              ariaSubmit={header.search.ariaSubmit}
              query={searchQuery}
              setQuery={setSearchQuery}
            />
          </div>

          <div className="hidden w-full pt-4 lg:pt-5 lg:hidden lg:peer-checked:block">
            <SearchBar
              categories={header.search.categories}
              placeholder={header.search.placeholder}
              ariaSubmit={header.search.ariaSubmit}
              ariaClose={header.search.ariaClose}
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
                  {header.menu.map((menuItem, i) =>
                    menuItem.submenu ? (
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
                      {header.menu.map((menuItem, i) =>
                        menuItem.submenu ? (
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
