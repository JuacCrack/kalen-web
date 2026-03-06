"use client";

import React from "react";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import { HeroRightCards } from "./HeroCards";
import { useStore } from "@/app/(site)/StoreDataProvider";

const Hero = () => {
  const store = useStore();
  const hero = store.get<any>("hero", {});
  const cards = Array.isArray(hero?.heroCards) ? hero.heroCards : [];

  return (
    <section className="overflow-hidden pb-10 lg:pb-12.5 xl:pb-15 pt-57.5 sm:pt-45 lg:pt-30 xl:pt-51.5 bg-[#E5EAF4]">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="flex flex-wrap gap-5 xl:items-stretch">
          <div className="xl:max-w-[757px] w-full">
            <div className="relative z-1 rounded-[10px] bg-white overflow-hidden xl:h-[520px] border border-gray-2/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
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