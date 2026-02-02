"use client";
import React from "react";
import Link from "next/link";
import { getFooter, getGlobal, formatTemplate, getYear } from "@/data/store";

const Footer = () => {
  const year = getYear();
  const footer = getFooter();
  const global = getGlobal();

  return (
    <footer className="border-t border-gray-3 bg-white">
      <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2">
          <div className="max-w-[520px]">
            <Link href={footer.brandHref} className="inline-flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-dark">{global.brandName}</span>
            </Link>

            <p className="mt-4 text-sm text-dark-3">{footer.description}</p>

            <ul className="mt-6 flex flex-col gap-3 text-sm text-dark-2">
              {footer.contact.map((c) => (
                <li key={`${c.icon ?? ""}-${c.text}`} className="flex gap-3">
                  {c.icon ? <i className={`bi ${c.icon} brand-primary mt-[2px] leading-none`} /> : null}
                  {c.href ? (
                    <a
                      className="hover:underline"
                      href={c.href}
                      target={c.target}
                      rel={c.rel}
                    >
                      {c.text}
                    </a>
                  ) : (
                    <span>{c.text}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              {footer.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.target}
                  rel={s.rel}
                  className="footer-social inline-flex items-center justify-center rounded-full border border-gray-3 bg-gray-1 text-dark-2"
                  aria-label={s.label}
                >
                  {s.icon ? <i className={`bi ${s.icon} text-[16px] leading-none`} /> : null}
                </a>
              ))}
            </div>
          </div>

          <div className="md:justify-self-end w-full md:max-w-[420px]">
            <div className="rounded-2xl border border-gray-3 bg-gray-1 p-6 sm:p-7">
              <h3 className="text-base font-semibold text-dark">{footer.trust.title}</h3>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-dark-2">
                {footer.trust.items.map((t) => (
                  <div key={`${t.icon ?? ""}-${t.text}`} className="flex items-start gap-3">
                    {t.icon ? <i className={`bi ${t.icon} brand-primary mt-[2px] leading-none`} /> : null}
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {footer.trust.badges.map((b) => (
                  <span key={b} className="badge">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-3 bg-gray-1">
        <div className="mx-auto max-w-[1170px] px-4 py-5 sm:px-8 xl:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-dark-3">
              {formatTemplate(footer.bottom.copyright, { year })}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-dark-3">
              {footer.bottom.highlights.map((h, i) => (
                <React.Fragment key={`${h.icon ?? ""}-${h.text}`}>
                  <span className="inline-flex items-center gap-2">
                    {h.icon ? <i className={`bi ${h.icon} brand-primary leading-none`} /> : null}
                    {h.text}
                  </span>
                  {i < footer.bottom.highlights.length - 1 ? <span className="text-dark-5">·</span> : null}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .brand-primary {
          color: ${global.colors?.primary ?? "#fe62b2"};
        }
        .footer-social {
          width: 40px;
          height: 40px;
          transition:
            background 200ms ease,
            border-color 200ms ease,
            color 200ms ease,
            transform 200ms ease;
        }
        .footer-social:hover {
          background: rgba(255, 174, 215, 0.25);
          border-color: rgba(254, 98, 178, 0.4);
          color: ${global.colors?.primary ?? "#fe62b2"};
          transform: translateY(-1px);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          border-radius: 9999px;
          padding: 6px 10px;
          font-size: 12px;
          color: #495270;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
