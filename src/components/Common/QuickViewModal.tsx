"use client";
import React,{useEffect,useMemo,useState}from"react";
import Image from"next/image";
import{useModalContext}from"@/app/context/QuickViewModalContext";
import{addItemToCart}from"@/redux/features/cart-slice";
import{AppDispatch,useAppSelector}from"@/redux/store";
import{useDispatch}from"react-redux";

type AnyImage={id?:number|string;src?:string;position?:number|null;alt?:any;width?:number|null;height?:number|null};
type AnyInventoryLevel={stock?:number|string|null};
type AnyVariant={id?:number|string;position?:number|null;visible?:boolean;sku?:string|null;values?:Array<Record<string,any>>|null;image_id?:number|string|null;price?:number|string|null;compare_at_price?:number|string|null;promotional_price?:number|string|null;stock_management?:boolean|null;stock?:number|string|null;inventory_levels?:AnyInventoryLevel[]|null};

const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:0};
const safeNum=(v:any,fallback:number)=>{const x=Number(v);return Number.isFinite(x)&&x>0?x:fallback};
const fmt=(v:any,currency="ARS")=>{const val=n(v);try{return new Intl.NumberFormat("es-AR",{style:"currency",currency,maximumFractionDigits:0}).format(val)}catch{return`$${val}`}};
const pickI18n=(v:any)=>{if(v==null)return"";if(typeof v==="string")return v;if(typeof v==="object")return v.es??v["es-AR"]??v["es_AR"]??"";return String(v)};
const sortByPos=<T extends{position?:number|null}>(xs:unknown):T[]=>{const arr=Array.isArray(xs)?(xs as T[]):[];return arr.slice().sort((a,b)=>(Number(a?.position??0)||0)-(Number(b?.position??0)||0))};
const indexImagesById=(images:AnyImage[])=>{const m:Record<number,AnyImage>={};for(const img of images){const id=img?.id;if(id!=null)m[Number(id)]=img}return m};
const computeStock=(v:AnyVariant|undefined)=>{if(!v)return null;if(v?.stock_management===false)return null;if(v?.stock!=null)return n(v.stock);const levels=Array.isArray(v?.inventory_levels)?v.inventory_levels:[];if(!levels.length)return null;return levels.reduce((acc:number,x:AnyInventoryLevel)=>acc+n(x?.stock),0)};
const getVariantLabel=(v:AnyVariant)=>{const values=Array.isArray(v?.values)?v.values:[];if(values.length){const parts=values.flatMap((x)=>x&&typeof x==="object"?Object.values(x).map((y)=>String(y??"")).filter(Boolean):[]).map((s)=>s.trim()).filter(Boolean);if(parts.length)return parts.join(" · ")}if(v?.sku)return`SKU ${String(v.sku)}`;return`Variante #${String(v?.id??"")}`};

const QuickViewModal=()=>{
  const{isModalOpen,closeModal}=useModalContext();
  const dispatch=useDispatch<AppDispatch>();
  const product=useAppSelector((state)=>state.quickViewReducer.value);
  const root=useMemo(()=>((product as any)?.product?(product as any).product:product),[product]);

  const[quantity,setQuantity]=useState(1);
  const[activePreview,setActivePreview]=useState(0);
  const[selectedVariantId,setSelectedVariantId]=useState<number|null>(null);

  const images=useMemo<AnyImage[]>(()=>sortByPos<AnyImage>((root as any)?.images),[root]);
  const variants=useMemo<AnyVariant[]>(()=>sortByPos<AnyVariant>((root as any)?.variants),[root]);

  const heroImage=useMemo(()=>{
    const byId=indexImagesById(images);
    const vi=selectedVariantId!=null?(()=>{const v=variants.find((x)=>Number(x?.id)===Number(selectedVariantId));return v?.image_id!=null?byId?.[Number(v.image_id)]:undefined})():undefined;
    const pi=vi??images[0];
    const fallback=(product as any)?.imgs?.previews?.[0]??(product as any)?.image?.src??(product as any)?.imgs?.thumbnails?.[0]??"";
    const src=(pi?.src?String(pi.src):String(fallback)).trim();if(!src)return undefined;
    const alt=(typeof pi?.alt==="object"?pickI18n(pi.alt):pi?.alt?String(pi.alt):"")||pickI18n((root as any)?.name)||String((product as any)?.title??"")||pickI18n((root as any)?.handle)||"Producto";
    return{src,alt:String(alt||"Producto"),width:safeNum(pi?.width??(pi as any)?.width,900),height:safeNum(pi?.height??(pi as any)?.height,900)};
  },[images,product,root,selectedVariantId,variants]);

  const previews=useMemo(()=>{
    const srcs=images.map((x)=>String(x?.src??"")).filter(Boolean);
    const legacy=Array.isArray((product as any)?.imgs?.previews)?(product as any).imgs.previews:[];
    const main=heroImage?.src?[heroImage.src]:[];
    const merged=[...main,...srcs.filter((s)=>!main.includes(s)),...legacy.filter((s:any)=>typeof s==="string")];
    const uniq=Array.from(new Set(merged.map((s)=>String(s).trim()).filter(Boolean)));
    return uniq.length?uniq:["/images/placeholder.png"];
  },[heroImage,images,product]);

  const thumbs=useMemo(()=>previews.slice(0,10),[previews]);
  const safeActive=Math.min(activePreview,Math.max(0,previews.length-1));
  const mainImg=previews?.[safeActive]??"/images/placeholder.png";
  const canNav=previews.length>1;

  const title=useMemo(()=>{const t=pickI18n((root as any)?.name)||String((product as any)?.title??"")||pickI18n((root as any)?.handle)||"Producto";return String(t).trim()||"Producto"},[product,root]);
  const description=useMemo(()=>{const d=pickI18n((root as any)?.description)||String((product as any)?.shortDescription??"");const out=String(d??"").trim();return out||"Descripción no disponible."},[product,root]);
  const currency=useMemo(()=>{const c=(product as any)?.currency;return(typeof c==="string"&&c.trim()?c.trim():"ARS") as string},[product]);

  const selectedVariant=useMemo<AnyVariant|undefined>(()=>{if(selectedVariantId==null)return undefined;return variants.find((v)=>v?.id!=null&&Number(v.id)===Number(selectedVariantId))},[selectedVariantId,variants]);
  const basePrice=useMemo(()=>{const v=selectedVariant;const fromVariant=n(v?.compare_at_price??v?.price);if(fromVariant>0)return fromVariant;const rootBase=n((product as any)?.price);return rootBase>0?rootBase:0},[product,selectedVariant]);
  const currentPrice=useMemo(()=>{const v=selectedVariant;const fromVariant=n(v?.promotional_price??v?.price);if(fromVariant>0)return fromVariant;return 0},[selectedVariant]);
  const canShowStrike=basePrice>0&&currentPrice>0&&currentPrice<basePrice;
  const discountPct=canShowStrike?Math.max(0,Math.round(((basePrice-currentPrice)/basePrice)*100)):0;

  const stock=useMemo(()=>computeStock(selectedVariant),[selectedVariant]);
  const isOut=typeof stock==="number"?stock<=0:false;

  const variantOptions=useMemo(()=>variants.filter((v)=>v?.id!=null).map((v)=>{const price=n(v?.promotional_price??v?.price??0);const st=computeStock(v);return{id:Number(v.id),label:getVariantLabel(v),price,stock:st,visible:v?.visible!==false}}),[variants]);
  const mustPickVariant=variants.length>0&&selectedVariantId==null;

  const handleAddToCart=()=>{if(!selectedVariantId||isOut)return;dispatch(addItemToCart({id:Number(selectedVariantId),title,price:n(basePrice),discountedPrice:n(currentPrice),quantity:Math.max(1,n(quantity)),imgs:{thumbnails:thumbs,previews}} as any));closeModal()};
  const prevImg=()=>{if(!canNav)return;setActivePreview((i)=>(i-1+previews.length)%previews.length)};
  const nextImg=()=>{if(!canNav)return;setActivePreview((i)=>(i+1)%previews.length)};

  useEffect(()=>{
    const onKeyDown=(e:KeyboardEvent)=>{if(e.key==="Escape")closeModal()};
    const handleClickOutside=(event:MouseEvent)=>{const target=event.target as HTMLElement|null;if(!target?.closest(".modal-content"))closeModal()};
    if(isModalOpen){document.addEventListener("keydown",onKeyDown);document.addEventListener("mousedown",handleClickOutside);document.body.style.overflow="hidden"}
    return()=>{document.removeEventListener("keydown",onKeyDown);document.removeEventListener("mousedown",handleClickOutside);document.body.style.overflow="";setQuantity(1);setActivePreview(0);setSelectedVariantId(null)}
  },[isModalOpen,closeModal]);

  useEffect(()=>{if(!isModalOpen)return;setSelectedVariantId(null)},[isModalOpen,product]);

  return(
    <div className={`fixed inset-0 ${isModalOpen?"z-[99999]":"hidden"} bg-black/55 backdrop-blur-sm overflow-y-auto`} role="dialog" aria-modal="true">
      <div className="min-h-full w-full px-3 py-4 sm:px-6 sm:py-10 flex items-end sm:items-center justify-center">
        <div className="modal-content relative w-full max-w-[980px] overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,.30)] ring-1 ring-black/5">
          <button onClick={closeModal} aria-label="Cerrar" className="absolute right-3 top-3 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-900 ring-1 ring-black/10 shadow-sm backdrop-blur-sm transition hover:bg-white active:scale-[0.98]" type="button"><i className="bi bi-x-lg text-[18px] leading-none"/></button>

          <div className="relative p-4 sm:p-6 lg:p-7 pt-14 sm:pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] gap-5 lg:gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-[76px_minmax(0,1fr)] gap-3 sm:gap-4">
                <div className="order-2 sm:order-1">
                  <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible no-scrollbar pb-1 sm:pb-0">
                    {thumbs.map((img:string,key:number)=>(
                      <button onClick={()=>setActivePreview(key)} key={`${img}-${key}`} aria-label={`Imagen ${key+1}`} className={`relative shrink-0 h-16 w-16 overflow-hidden rounded-2xl bg-[#F6F7FB] ring-1 transition ${safeActive===key?"ring-black/30":"ring-black/10 hover:ring-black/20"}`} type="button">
                        <Image src={img||""} alt="Miniatura" width={76} height={76} className="h-full w-full object-cover"/>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="order-1 sm:order-2">
                  <div className="relative overflow-hidden rounded-3xl bg-[#F6F7FB] ring-1 ring-black/10">
                    {discountPct?(<div className="absolute left-3 top-3 z-20"><span className="inline-flex items-center rounded-full bg-[#fe62b2] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">-{discountPct}%</span></div>):null}
                    {canNav?(
                      <>
                        <button type="button" onClick={(e)=>{e.stopPropagation();prevImg()}} aria-label="Anterior" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 ring-1 ring-black/10 shadow-sm backdrop-blur-sm transition hover:bg-white active:scale-[0.98]"><i className="bi bi-chevron-left text-[18px] leading-none"/></button>
                        <button type="button" onClick={(e)=>{e.stopPropagation();nextImg()}} aria-label="Siguiente" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 ring-1 ring-black/10 shadow-sm backdrop-blur-sm transition hover:bg-white active:scale-[0.98]"><i className="bi bi-chevron-right text-[18px] leading-none"/></button>
                      </>
                    ):null}
                    <div className="relative aspect-square min-h-[260px] sm:min-h-[420px] lg:min-h-[500px]">
                      {mainImg?(<Image src={mainImg} alt={title} fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" priority/>):(<div className="absolute inset-0 flex items-center justify-center text-slate-500"><span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-black/10"><i className="bi bi-image text-[16px] leading-none"/>Sin imagen</span></div>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-balance text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
                  {selectedVariant?.sku?(<span className="shrink-0 inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-slate-700">SKU {String(selectedVariant.sku)}</span>):null}
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{selectedVariantId!=null?fmt(currentPrice,currency):(basePrice>0?fmt(basePrice,currency):"")}</div>
                  {selectedVariantId!=null&&canShowStrike?(<div className="text-base sm:text-lg font-semibold text-slate-400 line-through">{fmt(basePrice,currency)}</div>):null}
                  {selectedVariantId!=null&&discountPct?(<span className="inline-flex items-center rounded-full border border-[#fe62b2]/25 bg-[#fe62b2]/10 px-2.5 py-1 text-xs font-semibold text-[#fe62b2]">Ahorrás {fmt(basePrice-currentPrice,currency)}</span>):null}
                </div>

                <div className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{__html:description}}/>

                {variantOptions.length>0?(
                  <div className="mt-5">
                    <div className="mt-2 flex flex-wrap gap-2">
                      {variantOptions.slice(0,10).map((opt)=>{const active=Number(selectedVariantId)===opt.id;const oos=typeof opt.stock==="number"?opt.stock<=0:false;return(
                        <button key={opt.id} type="button" onClick={()=>setSelectedVariantId(opt.id)} className={["inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",active?"bg-white text-[#fe62b2] ring-[#fe62b2]/60":"bg-white text-slate-900 ring-black/10 hover:ring-black/20",oos?"opacity-50":"",].join(" ")} aria-pressed={active} disabled={!opt.visible} title={opt.label}>
                          <span className="max-w-[22ch] truncate">{opt.label}</span>
                          {opt.price>0?(<span className={active?"text-[#fe62b2]/80":"text-slate-500"}>{fmt(opt.price,currency)}</span>):null}
                          {oos?(<span className={active?"text-[#fe62b2]/80":"text-rose-600"}>Sin stock</span>):null}
                        </button>
                      )})}
                    </div>
                  </div>
                ):null}

                <div className="mt-5 flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/10">
                    <button onClick={()=>setQuantity((q)=>Math.max(1,q-1))} aria-label="Restar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900 ring-1 ring-black/10 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50" type="button" disabled={quantity<=1}><i className="bi bi-dash-lg text-[14px] leading-none"/></button>
                    <div className="min-w-[44px] text-center font-semibold text-slate-900">{quantity}</div>
                    <button onClick={()=>setQuantity((q)=>q+1)} aria-label="Sumar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-900 ring-1 ring-black/10 transition hover:bg-slate-50 active:scale-[0.98]" type="button" disabled={mustPickVariant||isOut}><i className="bi bi-plus-lg text-[14px] leading-none"/></button>
                  </div>

                  <button disabled={mustPickVariant||isOut} onClick={handleAddToCart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#fe62b2] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(254,98,178,.25)] transition hover:brightness-95 active:scale-[0.99] disabled:opacity-60" type="button">
                    <i className="bi bi-bag-plus text-[18px] leading-none"/>
                    {isOut?"Sin stock":mustPickVariant?"Elegí una variante":"Agregar al carrito"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
