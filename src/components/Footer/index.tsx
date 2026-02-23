"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useStoreData } from "@/app/(site)/StoreDataProvider";

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

const formatTemplate = (
  template: string,
  vars: Record<string, string | number>,
) => template.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k] ?? `{${k}}`));

const Footer = () => {
  const store = useStoreData();
  const { footer, global, header } = store;
  const year = useMemo(() => new Date().getFullYear(), []);

  const resolvedUiColors = useMemo(() => {
    const v = resolveTplValue<any>(header.ui?.colors, store);
    return typeof v === "object" && v ? v : undefined;
  }, [header.ui?.colors, store]);

  const primary =
    resolvedUiColors?.primary ?? global.colors?.primary ?? "#fe62b2";
  const secondary =
    resolvedUiColors?.secondary ?? global.colors?.secondary ?? "#ffaed7";

  return (
    <footer
      className="border-t border-gray-3 bg-white"
      style={
        {
          ["--brand-primary" as any]: primary,
          ["--brand-secondary" as any]: secondary,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2">
          <div className="max-w-[520px]">
            <Link
              href={resolveTplString(footer.brandHref || "/", store)}
              className="inline-flex items-center gap-2"
            >
              <span className="text-xl font-semibold tracking-tight text-dark">
                {resolveTplString(global.brandName, store)}
              </span>
            </Link>

            <p className="mt-4 text-sm text-dark-3">
              {resolveTplString(footer.description, store)}
            </p>

            <ul className="mt-6 flex flex-col gap-3 text-sm text-dark-2">
              {(Array.isArray(footer.contact) ? footer.contact : []).map(
                (c) => {
                  const text = resolveTplString(c.text, store);
                  const href = c.href
                    ? resolveTplString(c.href, store).trim()
                    : "";
                  return (
                    <li key={`${c.icon ?? ""}-${text}`} className="flex gap-3">
                      {c.icon ? (
                        <i
                          className={`bi ${c.icon} mt-[2px] leading-none text-[color:var(--brand-primary,#fe62b2)]`}
                        />
                      ) : null}
                      {href ? (
                        <a
                          className="hover:underline"
                          href={href}
                          target={c.target}
                          rel={c.rel}
                        >
                          {text}
                        </a>
                      ) : (
                        <span>{text}</span>
                      )}
                    </li>
                  );
                },
              )}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              {(Array.isArray(footer.socials) ? footer.socials : []).map(
                (s) => {
                  const href = resolveTplString(s.href, store).trim();
                  return (
                    <a
                      key={s.label}
                      href={href}
                      target={s.target}
                      rel={s.rel}
                      className="inline-flex items-center justify-center rounded-full border border-gray-3 bg-gray-1 text-dark-2 h-10 w-10 transition hover:bg-[color:var(--brand-secondary,#ffaed7)]/25 hover:border-[color:var(--brand-primary,#fe62b2)]/40 hover:text-[color:var(--brand-primary,#fe62b2)] active:scale-[0.98]"
                      aria-label={s.label}
                    >
                      {s.icon ? (
                        <i
                          className={`bi ${s.icon} text-[16px] leading-none`}
                        />
                      ) : null}
                    </a>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-3 bg-gray-1">
        <div className="mx-auto max-w-[1170px] px-4 py-5 sm:px-8 xl:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-dark-3">
              {formatTemplate(
                resolveTplString(footer.bottom?.copyright, store) ||
                  "© {year}",
                { year },
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
