"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import { HeroRightCards } from "./HeroCards";
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

const Hero = () => {
  const store = useStoreData();
  const { hero } = store;

  const bg = useMemo(() => resolveTplString(hero.sectionBg ?? "#E5EAF4", store), [hero.sectionBg, store]);
  const bgImg = hero.left?.bgShapesImage;
  const cards = Array.isArray(hero.rightCards) ? hero.rightCards : [];

  const bgResolved = useMemo(() => resolveTplValue<any>(bgImg, store), [bgImg, store]);
  const bgSrc = typeof bgResolved?.src === "string" && bgResolved.src.trim() ? bgResolved.src : null;
  const bgAlt = typeof bgResolved?.alt === "string" && bgResolved.alt.trim() ? bgResolved.alt : "";
  const bgW = Number(bgResolved?.width ?? 0);
  const bgH = Number(bgResolved?.height ?? 0);
  const canRenderBg = !!bgSrc && bgW > 0 && bgH > 0;

  return (
    <section
      className="overflow-hidden pb-10 lg:pb-12.5 xl:pb-15 pt-57.5 sm:pt-45 lg:pt-30 xl:pt-51.5"
      style={{ backgroundColor: bg }}
    >
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="flex flex-wrap gap-5 xl:items-stretch">
          <div className="xl:max-w-[757px] w-full">
            <div className="relative z-1 rounded-[10px] bg-white overflow-hidden xl:h-[520px] border border-gray-2/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              {canRenderBg ? (
                <Image
                  src={bgSrc}
                  alt={bgAlt}
                  className="absolute right-0 bottom-0 -z-1 select-none pointer-events-none"
                  width={bgW}
                  height={bgH}
                  priority
                />
              ) : null}
              <div className="h-full">
                <HeroCarousel />
              </div>
            </div>
          </div>

          <HeroRightCards cards={cards} />
        </div>
      </div>

      <HeroFeature />
    </section>
  );
};

export default Hero;
