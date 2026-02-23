"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { HeaderNavItem } from "@/data/store";

type SubmenuItem = { title: string; path: string };

const hasSubmenu = (x: HeaderNavItem): x is HeaderNavItem & { submenu: SubmenuItem[] } =>
  !!x && typeof x === "object" && "submenu" in x && Array.isArray((x as any).submenu);

const Dropdown = ({ menuItem }: { menuItem: HeaderNavItem; stickyMenu: boolean }) => {
  const [open, setOpen] = useState(false);
  const pathUrl = usePathname();
  const ref = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const submenu = hasSubmenu(menuItem) ? menuItem.submenu : [];

  const isActive =
    submenu.some((s) => s.path === pathUrl) ||
    pathUrl.toLowerCase().includes(String((menuItem as any).title ?? "").toLowerCase());

  return (
    <li ref={ref} className="relative border-b border-gray-2/60 xl:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full xl:w-auto flex items-center justify-between xl:justify-center gap-2 py-4 xl:py-0 text-left xl:text-center text-[color:var(--brand-primary,#fe62b2)] font-semibold xl:font-medium text-base xl:text-custom-sm ${
          isActive ? "opacity-100" : "opacity-95"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="capitalize">{(menuItem as any).title}</span>
        <i className={`bi bi-chevron-down text-[12px] leading-none transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <ul className={`${open ? "block" : "hidden"} pb-3 xl:pb-0 xl:hidden`}>
        {submenu.map((item, i) => (
          <li key={i} className="pl-3">
            <Link
              href={item.path}
              className={`flex py-3 px-3 rounded-md text-[color:var(--brand-primary,#fe62b2)] hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 transition ${
                pathUrl === item.path ? "bg-[color:var(--brand-secondary,#ffaed7)]/25" : ""
              }`}
              onClick={() => setOpen(false)}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>

      <div className={`hidden xl:block absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50 ${open ? "" : "pointer-events-none opacity-0"}`}>
        <div className={`relative bg-white border border-gray-3 rounded-xl shadow-lg min-w-[240px] overflow-hidden transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}>
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-l border-t border-gray-3" />
          <ul className="py-2">
            {submenu.map((item, i) => {
              const active = pathUrl === item.path;
              return (
                <li key={i}>
                  <Link
                    href={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm text-[color:var(--brand-primary,#fe62b2)] hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 transition ${
                      active ? "bg-[color:var(--brand-secondary,#ffaed7)]/25" : ""
                    }`}
                  >
                    <span>{item.title}</span>
                    <i className="bi bi-arrow-right text-[14px] leading-none opacity-70" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
};

export default Dropdown;