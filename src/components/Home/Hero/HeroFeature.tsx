"use client";

import React, { useMemo } from "react";
import { useStore } from "@/app/(site)/StoreDataProvider";

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
    if (v == null || typeof v === "object") return "";
    return String(v);
  });
};

const HeroFeature = () => {
  const store = useStore();
  const heroRow = store.get<any>("hero", {});
  const globalRow = store.get<any>("global", {});
  const headerRow = store.get<any>("header", {});
  const hero = heroRow?.data ?? heroRow;
  const global = globalRow?.data ?? globalRow;
  const header = headerRow?.data ?? headerRow;

  const items = Array.isArray(hero?.heroFeature) ? hero.heroFeature : [];

  const resolvedUiColors = useMemo(() => {
    const v = resolveTplValue<any>((header as any)?.ui?.colors, store);
    return typeof v === "object" && v ? v : undefined;
  }, [header, store]);

  const primary = useMemo(
    () => resolvedUiColors?.primary ?? global.colors?.primary ?? "#fe62b2",
    [resolvedUiColors?.primary, global.colors?.primary],
  );

  const renderedItems = useMemo(
    () =>
      items.map((it: any) => ({
        icon: resolveTplString(it?.icon, store),
        title: resolveTplString(it?.title, store),
        description: resolveTplString(it?.description, store),
      })),
    [items, store],
  );

  return (
    <div
      className="max-w-[1060px] w-full mx-auto px-4 sm:px-8 xl:px-0"
      style={{ ["--brand-primary" as any]: primary } as React.CSSProperties}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7.5 xl:gap-12.5 mt-10">
        {renderedItems.map((item) => (
          <div
            className="flex items-center gap-4 rounded-2xl border border-gray-2/60 bg-white/70 backdrop-blur px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            key={`${item.icon}-${item.title}`}
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-3 bg-gray-1 text-[color:var(--brand-primary,#fe62b2)]">
              <i className={`bi ${item.icon} text-[20px] leading-none`} />
            </span>

            <div className="min-w-0">
              <h3 className="font-semibold text-[15px] leading-tight text-dark truncate">
                {item.title}
              </h3>
              <p className="text-sm text-dark-3 leading-snug line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroFeature;