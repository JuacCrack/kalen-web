import React from "react";
import Image from "next/image";
import { getGlobal } from "@/data/store";
import type { HeroRightCard as HeroRightCardType } from "@/data/store";

export const HeroRightCards = ({ cards }: { cards: HeroRightCardType[] }) => {
  const global = getGlobal();
  const brand = global.colors?.primary ?? "#fe62b2";

  return (
    <div className="xl:max-w-[393px] w-full" style={{ ["--brand" as any]: brand } as React.CSSProperties}>
      <div className="flex flex-col gap-5 xl:h-[520px]">
        {cards.map((c) => (
          <HeroRightCard key={`${c.title}-${c.cta.href}`} card={c} />
        ))}
      </div>
    </div>
  );
};

export const HeroRightCard = ({ card: c }: { card: HeroRightCardType }) => {
  return (
    <div className="relative z-1 rounded-[10px] bg-white overflow-hidden flex-1">
      <div className="absolute right-0 bottom-0 -z-1 w-[55%] h-[70%] bg-[#E5EAF4] opacity-40 rounded-tl-[80px]" />

      <div className="h-full grid grid-cols-1 md:grid-cols-2">
        <div className="min-w-0 flex flex-col justify-center gap-2 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="flex items-center gap-2">
            <span className="block font-semibold text-xl sm:text-2xl md:text-3xl text-[color:var(--brand,#fe62b2)] leading-none">
              {c.badgeLeft}
            </span>
            <span className="block text-[color:var(--brand,#fe62b2)] text-[10px] sm:text-xs leading-tight whitespace-pre-line">
              {c.badgeRight}
            </span>
          </div>

          <h2 className="font-semibold text-[color:var(--brand,#fe62b2)] text-sm sm:text-base leading-tight">
            <a href={c.cta.href}>{c.title}</a>
          </h2>

          <p className="text-[color:var(--brand,#fe62b2)] text-[10px] sm:text-xs leading-tight line-clamp-2">
            {c.description}
          </p>

          <a
            href={c.cta.href}
            className="inline-flex w-fit font-semibold text-[color:var(--brand,#fe62b2)] text-[10px] sm:text-xs underline underline-offset-4 hover:opacity-80"
          >
            {c.cta.label}
          </a>
        </div>

        <div className="h-full flex items-center justify-end p-0">
          <Image
            src={c.image.src}
            alt={c.image.alt}
            width={c.image.width}
            height={c.image.height}
            className="w-full md:w-auto h-[160px] sm:h-[180px] md:h-full md:max-h-[260px] object-contain"
          />
        </div>
      </div>
    </div>
  );
};
