"use client";
import{Swiper,SwiperSlide}from"swiper/react";
import{Pagination,Navigation,A11y}from"swiper/modules";
import"swiper/css/pagination";
import"swiper/css/navigation";
import"swiper/css";
import Image from"next/image";
import Link from"next/link";
import{useMemo}from"react";
import{useStoreData}from"@/app/(site)/StoreDataProvider";
const getByPath=(o:any,p:string)=>{if(!o||!p)return;const a=p.split(".").filter(Boolean);let c=o;for(const k of a){if(c==null)return;c=c[k]}return c};
const resolveTplValue=<T,>(v:any,r:any):T=>{if(typeof v!=="string")return v as T;const m=v.trim().match(/^{{\s*([^}]+)\s*}}$/);if(!m)return v as T;return getByPath(r,m[1].trim()) as T};
const resolveTplString=(v:any,r:any)=>{if(v==null)return"";if(typeof v!=="string")return String(v);return v.replace(/{{\s*([^}]+)\s*}}/g,(_a,p1)=>{const x=getByPath(r,String(p1).trim());if(x==null||typeof x==="object")return"";return String(x)})};
const imgDim=(v:any,f:number)=>{const n=typeof v==="number"?v:Number(v);return Number.isFinite(n)&&n>0?n:f};

const HeroCarousal=()=>{
  const store=useStoreData();
  const{heroSlider,header,global}=store;
  const swiperRaw=heroSlider.swiper??{};
  const swiper=useMemo(()=>resolveTplValue<any>(swiperRaw,store)??{},[swiperRaw,store]);
  const slidesRaw=heroSlider.slides??[];
  const slides=useMemo(()=>slidesRaw.map((s:any)=>{const src=resolveTplString(s.image?.src,store);const alt=resolveTplString(s.image?.alt,store);const width=imgDim(resolveTplValue<any>(s.image?.width,store),1024);const height=imgDim(resolveTplValue<any>(s.image?.height,store),1024);return{...s,badgeLeft:resolveTplString(s.badgeLeft,store),badgeRight:resolveTplString(s.badgeRight,store),title:resolveTplString(s.title,store),description:resolveTplString(s.description,store),cta:{label:resolveTplString(s.cta?.label,store),href:resolveTplString(s.cta?.href,store)},image:src?.trim()?{src,alt,width,height}:undefined}}),[slidesRaw,store]);
  const resolvedUiColors=useMemo(()=>{const v=resolveTplValue<any>(header.ui?.colors,store);return typeof v==="object"&&v?v:undefined},[header.ui?.colors,store]);
  const primary=useMemo(()=>resolvedUiColors?.primary??global.colors?.primary??"#fe62b2",[resolvedUiColors?.primary,global.colors?.primary]);
  const secondary=useMemo(()=>resolvedUiColors?.secondary??global.colors?.secondary??"#ffaed7",[resolvedUiColors?.secondary,global.colors?.secondary]);

  return(
    <section style={{["--brand-primary" as any]:primary,["--brand-secondary" as any]:secondary}as any} className="relative">
      <Swiper
        spaceBetween={swiper.spaceBetween??16}
        centeredSlides={swiper.centeredSlides??true}
        autoplay={false}
        pagination={{clickable:true}}
        navigation
        modules={[Pagination,Navigation,A11y]}
        className="hero-carousel [&_.swiper-pagination]:!block [&_.swiper-pagination]:!opacity-100 [&_.swiper-pagination]:!bottom-3 [&_.swiper-pagination-bullet]:!bg-[color:var(--brand-primary,#fe62b2)]/30 [&_.swiper-pagination-bullet-active]:!bg-[color:var(--brand-primary,#fe62b2)] [&_.swiper-button-prev]:!h-10 [&_.swiper-button-prev]:!w-10 [&_.swiper-button-next]:!h-10 [&_.swiper-button-next]:!w-10 [&_.swiper-button-prev]:!rounded-2xl [&_.swiper-button-next]:!rounded-2xl [&_.swiper-button-prev]:!bg-white/80 [&_.swiper-button-next]:!bg-white/80 [&_.swiper-button-prev]:!backdrop-blur-md [&_.swiper-button-next]:!backdrop-blur-md [&_.swiper-button-prev]:!shadow-sm [&_.swiper-button-next]:!shadow-sm [&_.swiper-button-prev:after]:!text-[14px] [&_.swiper-button-next:after]:!text-[14px] [&_.swiper-button-prev:after]:!font-bold [&_.swiper-button-next:after]:!font-bold [&_.swiper-button-prev]:!text-[color:var(--brand-primary,#fe62b2)] [&_.swiper-button-next]:!text-[color:var(--brand-primary,#fe62b2)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/80 to-transparent"/>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent"/>
        {slides.map((s:any,idx:number)=>{const href=s.cta?.href?.trim()?s.cta.href:"#";const imgSrc=s.image?.src?.trim()?s.image.src:null;const imgW=imgDim(s.image?.width,1024);const imgH=imgDim(s.image?.height,1024);const canImg=!!imgSrc;const desc=String(s.description??"").replace(/<\/?p[^>]*>/gi,"").trim();return(
          <SwiperSlide key={`${s.title||"slide"}-${href}-${idx}`}>
            <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
              <div className="relative overflow-hidden rounded-3xl bg-white/80 shadow-[0_18px_60px_rgba(0,0,0,0.10)] backdrop-blur-md">
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[color:var(--brand-secondary,#ffaed7)]/30 blur-3xl"/>
                <div className="absolute -left-28 -bottom-28 h-72 w-72 rounded-full bg-[color:var(--brand-primary,#fe62b2)]/20 blur-3xl"/>
                <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 p-5 sm:p-8 lg:p-10">
                  <div className="order-2 md:order-1">
                    <div className="flex flex-wrap items-start gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                      <span className="inline-flex items-center justify-center rounded-full border border-[color:var(--brand-primary,#fe62b2)]/25 bg-[color:var(--brand-secondary,#ffaed7)]/25 px-3 py-1 text-[color:var(--brand-primary,#fe62b2)] font-semibold text-[11px] sm:text-sm">{s.badgeLeft}</span>
                      <span className="block max-w-[34ch] sm:max-w-[48ch] text-slate-600 text-[11px] sm:text-sm whitespace-pre-line">{s.badgeRight}</span>
                    </div>
                    <h1 className="font-semibold tracking-tight text-slate-900 text-[28px] leading-[1.05] sm:text-4xl lg:text-5xl mb-3 sm:mb-4">
                      <Link href={href} className="transition hover:text-[color:var(--brand-primary,#fe62b2)]">{s.title}</Link>
                    </h1>
                    {desc?(<p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm sm:text-base max-w-[52ch]">{desc}</p>):null}
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <Link href={href} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[color:var(--brand-primary,#fe62b2)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(254,98,178,0.25)] transition hover:brightness-95 active:scale-[0.98]">{s.cta?.label||""}<i className="bi bi-arrow-right-short text-[18px] leading-none"/></Link>
                    </div>
                  </div>
                  <div className="order-1 md:order-2 flex justify-center md:justify-end">
                    <div className="relative w-full max-w-[340px] sm:max-w-[420px]">
                      <div className="absolute inset-0 rounded-[28px] bg-[color:var(--brand-secondary,#ffaed7)]/15 blur-2xl"/>
                      {canImg?(<Image src={imgSrc as string} alt={s.image?.alt??""} width={imgW} height={imgH} className="relative h-auto w-full max-h-[380px] sm:max-h-[440px] md:max-h-[520px] object-contain drop-shadow-[0_28px_60px_rgba(0,0,0,0.14)]" priority/>):null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        )})}
      </Swiper>
    </section>
  );
};

export default HeroCarousal;
