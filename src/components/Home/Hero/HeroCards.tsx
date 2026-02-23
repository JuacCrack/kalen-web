"use client";
import React,{useMemo}from"react";
import Image from"next/image";
import Link from"next/link";
import{useStoreData}from"@/app/(site)/StoreDataProvider";
import{flatten2,pickI18n,resolveProductHeroImage,type Product}from"@/data/types";
const getByPath=(o:any,p:string)=>{if(!o||!p)return;const a=String(p).split(".").filter(Boolean);let c=o;for(const k of a){if(c==null)return;c=c[k]}return c};
const resolveTplString=(v:any,r:any)=>{if(v==null)return"";if(typeof v!=="string")return String(v);return v.replace(/{{\s*([^}]+)\s*}}/g,(_a,p1)=>{const x=getByPath(r,String(p1).trim());if(x==null)return"";if(typeof x==="object")return"";return String(x)})};
const ensureImgDim=(n:any,f:number)=>{const x=typeof n==="number"?n:Number(n);return Number.isFinite(x)&&x>0?x:f};
const stripParagraphTags=(s:any)=>String(s??"").replace(/<\/?p[^>]*>/gi,"").replace(/\s+/g," ").trim();
type HeroCardView={productId:number;badgeLeft:string;badgeRight:string;title:string;description:string;cta:{label:string;href:string};image?:{src:string;alt:string;width:number;height:number}};
const pickI18nSafe=(v:any)=>pickI18n(v);
const buildProductHref=(store:any,p?:Product)=>{if(!p)return"#";const slug=pickI18nSafe(p.handle).trim();if(!slug)return"#";const shop=String(store?.global?.store?.routes?.shop??"").trim();if(shop){const base=shop.startsWith("/")?shop:`/${shop}`;return`${base.replace(/\/+$/,"")}/${encodeURIComponent(slug)}`}return`/${encodeURIComponent(slug)}`};
export const HeroRightCards=({cards}:{cards:any[]})=>{const store=useStoreData();const{global,products}=store;const brand=global.colors?.primary??"#fe62b2";const productMap=useMemo(()=>{const m=new Map<number,Product>();const ps=flatten2<Product>(products?.items);for(const p of ps)if(p?.id!=null)m.set(Number(p.id),p);return m},[products?.items]);const viewCards:HeroCardView[]=useMemo(()=>{const xs=Array.isArray(cards)?cards:[];return xs.map((c:any)=>{const pid=Number(c?.productId);const p=Number.isFinite(pid)?productMap.get(pid):undefined;const hrefFromTpl=resolveTplString(c?.cta?.href,store).trim();const href=hrefFromTpl||buildProductHref(store,p);const pImg=p?resolveProductHeroImage(p):undefined;const imgSrc=String(c?.image?.src??pImg?.src??"").trim();const imgAlt=String(c?.image?.alt??pImg?.alt??(p?pickI18nSafe(p.name):"")??"").trim();const w=ensureImgDim(c?.image?.width??pImg?.width,600);const h=ensureImgDim(c?.image?.height??pImg?.height,600);const titleTpl=resolveTplString(c?.title,store).trim();const descTpl=resolveTplString(c?.description,store).trim();const title=titleTpl||(p?pickI18nSafe(p.name).trim():"");const description=stripParagraphTags(descTpl||(p?pickI18nSafe(p.description).trim():""));return{productId:pid,badgeLeft:resolveTplString(c?.badgeLeft,store),badgeRight:resolveTplString(c?.badgeRight,store),title,description,cta:{label:resolveTplString(c?.cta?.label,store),href},image:imgSrc?{src:imgSrc,alt:imgAlt,width:w,height:h}:undefined}})},[cards,productMap,store]);return(
    <div
      className="w-full xl:max-w-[393px]"
      style={{ ["--brand" as any]: brand } as React.CSSProperties}
    >
      <div className="flex flex-col gap-3 sm:gap-4 xl:h-[520px] xl:overflow-hidden">
        {viewCards.map((c) => (
          <HeroRightCard key={`${c.productId}-${c.cta.href}`} card={c} />
        ))}
      </div>
    </div>
  )};
export const HeroRightCard=({card:c}:{card:HeroCardView})=>{const href=c.cta.href||"#";return(
    <Link
      href={href}
      aria-label={c.title || c.cta.label || "Ver producto"}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand,#fe62b2)] focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="relative rounded-2xl bg-white overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-transform duration-200 active:scale-[0.99] sm:hover:-translate-y-0.5 max-h-[180px] sm:max-h-[200px] md:max-h-[240px]">
        <div className="absolute -right-10 -bottom-10 w-[65%] h-[85%] bg-[#E5EAF4] opacity-50 rounded-[48px] rotate-6" />
        <div className="relative flex items-stretch gap-3 p-3 sm:p-4 md:grid md:grid-cols-2 md:gap-0">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 md:p-2 md:pl-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-[color:var(--brand,#fe62b2)] leading-none text-2xl sm:text-3xl">
                {c.badgeLeft}
              </span>
              <span className="text-[color:var(--brand,#fe62b2)] text-[11px] sm:text-xs leading-tight whitespace-pre-line line-clamp-2">
                {c.badgeRight}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-dark text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[color:var(--brand,#fe62b2)] transition-colors">
                {c.title}
              </h2>
              <p className="mt-0.5 text-dark/70 text-[11px] sm:text-xs leading-snug line-clamp-2">
                {c.description}
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--brand,#fe62b2)] text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 w-fit shadow-[0_10px_24px_rgba(254,98,178,0.25)] group-hover:brightness-95">
                {c.cta.label}
              </span>
            </div>
          </div>
          <div className="shrink-0 md:flex md:items-center md:justify-end md:p-2">
            <div className="relative w-[112px] h-[132px] sm:w-[128px] sm:h-[150px] md:w-full md:h-[220px] max-h-full overflow-hidden rounded-2xl bg-black/[0.02]">
              {c.image ? (
                <Image
                  src={c.image.src}
                  alt={c.image.alt}
                  fill
                  sizes="(max-width: 768px) 140px, 260px"
                  className="object-contain p-2 drop-shadow-[0_18px_28px_rgba(0,0,0,0.10)]"
                  priority
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )};
