import React from "react";
import HeroCarousel from "./HeroCarousel";
import HeroFeature from "./HeroFeature";
import Image from "next/image";
import { getHero } from "@/data/store";
import { HeroRightCards } from "./HeroCards";

const Hero = () => {
  const hero = getHero();
  const bg = hero.sectionBg ?? "#E5EAF4";
  const bgImg = hero.left?.bgShapesImage;
  const cards = hero.rightCards ?? [];

  return (
    <section
      className="overflow-hidden pb-10 lg:pb-12.5 xl:pb-15 pt-57.5 sm:pt-45 lg:pt-30 xl:pt-51.5"
      style={{ backgroundColor: bg }}
    >
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="flex flex-wrap gap-5 xl:items-stretch">
          <div className="xl:max-w-[757px] w-full">
            <div className="relative z-1 rounded-[10px] bg-white overflow-hidden xl:h-[520px]">
              {bgImg ? (
                <Image
                  src={bgImg.src}
                  alt={bgImg.alt}
                  className="absolute right-0 bottom-0 -z-1"
                  width={bgImg.width}
                  height={bgImg.height}
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
