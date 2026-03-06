"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, A11y } from "swiper/modules";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useStore } from "@/app/(site)/StoreDataProvider";

const isUrl = (v: any) => typeof v === "string" && v.trim().length > 0;

const HeroCarousal = () => {
  const store = useStore();
  const heroRow = store.get<any>("hero", {});
  const headerRow = store.get<any>("header", {});
  const hero = heroRow?.data ?? heroRow;
  const header = headerRow?.data ?? headerRow;

  useEffect(() => {
    console.log("[HeroCarousal] store.hero", heroRow);
    console.log("[HeroCarousal] store.hero.data", (heroRow as any)?.data);
  }, [heroRow]);

  const resolvedUiColors = useMemo(() => {
    const v = (header as any)?.ui?.colors;
    return typeof v === "object" && v ? v : undefined;
  }, [header]);

  const primary = useMemo(() => resolvedUiColors?.primary ?? "#fe62b2", [resolvedUiColors?.primary]);

  const slides = useMemo(() => (Array.isArray(hero?.heroCarrousel) ? hero.heroCarrousel : []), [hero?.heroCarrousel]);

  return (
    <section className="relative" style={{ ["--brand-primary" as any]: primary } as any}>
      <Swiper
        spaceBetween={16}
        centeredSlides
        autoplay={false}
        pagination={{ clickable: true }}
        navigation
        modules={[Pagination, Navigation, A11y]}
        className="hero-carousel [&_.swiper-pagination]:!block [&_.swiper-pagination]:!opacity-100 [&_.swiper-pagination]:!bottom-3 [&_.swiper-pagination-bullet]:!bg-[color:var(--brand-primary,#fe62b2)]/30 [&_.swiper-pagination-bullet-active]:!bg-[color:var(--brand-primary,#fe62b2)] [&_.swiper-button-prev]:!h-10 [&_.swiper-button-prev]:!w-10 [&_.swiper-button-next]:!h-10 [&_.swiper-button-next]:!w-10 [&_.swiper-button-prev]:!rounded-2xl [&_.swiper-button-next]:!rounded-2xl [&_.swiper-button-prev]:!bg-white/80 [&_.swiper-button-next]:!bg-white/80 [&_.swiper-button-prev]:!backdrop-blur-md [&_.swiper-button-next]:!backdrop-blur-md [&_.swiper-button-prev]:!shadow-sm [&_.swiper-button-next]:!shadow-sm [&_.swiper-button-prev:after]:!text-[14px] [&_.swiper-button-next:after]:!text-[14px] [&_.swiper-button-prev:after]:!font-bold [&_.swiper-button-next:after]:!font-bold [&_.swiper-button-prev]:!text-[color:var(--brand-primary,#fe62b2)] [&_.swiper-button-next]:!text-[color:var(--brand-primary,#fe62b2)]"
      >
        {slides
          .filter((s: any) => isUrl(s?.lg) || isUrl(s?.sm))
          .map((s: any, idx: number) => {
            const lg = String(s?.lg ?? "").trim();
            const sm = String(s?.sm ?? "").trim();
            return (
              <SwiperSlide key={`${lg}-${sm}-${idx}`} className="!h-auto">
                <div className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] overflow-hidden rounded-[28px]">
                  {sm ? (
                    <Image
                      src={sm}
                      alt="Hero slide"
                      fill
                      sizes="(max-width: 768px) 100vw, 900px"
                      className="object-cover object-center md:hidden"
                      priority={idx === 0}
                    />
                  ) : null}
                  {lg ? (
                    <Image
                      src={lg}
                      alt="Hero slide"
                      fill
                      sizes="(max-width: 768px) 100vw, 900px"
                      className="object-cover object-center hidden md:block"
                      priority={idx === 0}
                    />
                  ) : null}
                </div>
              </SwiperSlide>
            );
          })}
      </Swiper>
    </section>
  );
};

export default HeroCarousal;