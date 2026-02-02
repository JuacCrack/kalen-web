"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css/pagination";
import "swiper/css";
import Image from "next/image";
import { getHeroSlider } from "@/data/store";

const HeroCarousal = () => {
  const { swiper, slides } = getHeroSlider();

  return (
    <Swiper
      spaceBetween={swiper.spaceBetween ?? 30}
      centeredSlides={swiper.centeredSlides ?? true}
      autoplay={{
        delay: swiper.autoplay?.delay ?? 2500,
        disableOnInteraction: swiper.autoplay?.disableOnInteraction ?? false,
      }}
      pagination={{ clickable: swiper.pagination?.clickable ?? true }}
      modules={[Autoplay, Pagination]}
      className="hero-carousel"
    >
      {slides.map((s) => (
        <SwiperSlide key={`${s.title}-${s.cta.href}`}>
          <div className="pt-6 sm:pt-0 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <div className="max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
              <div className="flex items-center gap-4 mb-7.5 sm:mb-10">
                <span className="block font-semibold text-heading-3 sm:text-heading-1 text-[#fe62b2]">
                  {s.badgeLeft}
                </span>
                <span className="block text-dark text-sm sm:text-custom-1 sm:leading-[24px] whitespace-pre-line">
                  {s.badgeRight}
                </span>
              </div>

              <h1 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
                <a href={s.cta.href}>{s.title}</a>
              </h1>

              <p className="text-dark/80 whitespace-pre-line">{s.description}</p>

              <a
                href={s.cta.href}
                className="inline-flex font-medium text-white text-custom-sm rounded-md bg-dark py-3 px-9 ease-out duration-200 hover:bg-[#fe62b2] mt-10"
              >
                {s.cta.label}
              </a>
            </div>

            <div className="flex justify-center md:justify-end">
              <Image
                src={s.image.src}
                alt={s.image.alt}
                width={s.image.width}
                height={s.image.height}
                className="h-auto w-full max-w-[351px] object-contain"
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroCarousal;
