"use client";
import React from "react";
import Image from "next/image";

type HeroImg = { lg: string; sm: string };

const isUrl = (v: any) => typeof v === "string" && v.trim().length > 0;

export const HeroRightCards = ({ cards }: { cards: any[] }) => {
  const xs: HeroImg[] = Array.isArray(cards) ? (cards as any) : [];
  return (
    <div className="w-full xl:max-w-[393px]">
      <div className="flex flex-col gap-3 sm:gap-4 xl:h-[520px] xl:overflow-hidden">
        {xs
          .filter((c) => isUrl(c?.lg) || isUrl(c?.sm))
          .map((c, i) => (
            <HeroRightCard key={`${c?.lg ?? ""}-${c?.sm ?? ""}-${i}`} card={c} />
          ))}
      </div>
    </div>
  );
};

export const HeroRightCard = ({ card: c }: { card: HeroImg }) => {
  const lg = String(c?.lg ?? "").trim();
  const sm = String(c?.sm ?? "").trim();
  const alt = "Hero card";

  return (
    <div className="group block rounded-2xl">
      <div className="relative rounded-2xl bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] max-h-[180px] sm:max-h-[200px] md:max-h-[240px]">
        <div className="relative w-full h-[180px] sm:h-[200px] md:h-[240px]">
          {sm ? (
            <Image
              src={sm}
              alt={alt}
              fill
              sizes="(max-width: 1023px) 100vw, 393px"
              className="object-cover md:hidden"
              priority
            />
          ) : null}
          {lg ? (
            <Image
              src={lg}
              alt={alt}
              fill
              sizes="(max-width: 1023px) 100vw, 393px"
              className="object-cover hidden md:block"
              priority
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};