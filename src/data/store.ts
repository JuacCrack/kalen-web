import raw from "./store.json";

export type IconRef = string;
export type LinkTarget = "_self" | "_blank";

export type TextLink = {
  text: string;
  icon?: IconRef;
  href?: string;
  target?: LinkTarget;
  rel?: string;
};

export type SocialLink = {
  label: string;
  href: string;
  icon?: IconRef;
  target?: LinkTarget;
  rel?: string;
};

export type Store = {
  global: {
    brandName: string;
    colors?: { primary: string; secondary: string };
  };
  footer: {
    brandHref: string;
    description: string;
    contact: TextLink[];
    socials: SocialLink[];
    trust: { title: string; items: TextLink[]; badges: string[] };
    bottom: { copyright: string; highlights: TextLink[] };
  };
};

const store = raw as unknown as Store;

export const getStore = () => store;
export const getBlock = <K extends keyof Store>(key: K) => store[key];

export const getGlobal = () => store.global;
export const getFooter = () => store.footer;

export const getYear = () => new Date().getFullYear();

export const formatTemplate = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

export type Product = {
  id: number;
  title: string;
  reviews: number;
  price: number;
  discountedPrice: number;
  imgs: { thumbnails: string[]; previews: string[] };
};

export type ProductsBlock = { items: Product[] };

export type NewArrivalsBlock = {
  kicker: string;
  title: string;
  viewAll: { label: string; href: string };
  productIds: number[];
};

export const getAnyBlock = <T = unknown>(key: string) => (getStore() as any)[key] as T;

export const getProducts = () => getAnyBlock<ProductsBlock>("products");

export const getHomeNewArrivals = () =>
  (getAnyBlock<any>("home")?.newArrivals ?? ({} as NewArrivalsBlock)) as NewArrivalsBlock;

export const resolveProductsByIds = (ids: number[], items: Product[]) => {
  const map = new Map(items.map((p) => [p.id, p] as const));
  return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
};

export type HeroSlide = {
  badgeLeft: string;
  badgeRight: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string; width: number; height: number };
};

export type HeroSliderBlock = {
  swiper: {
    spaceBetween?: number;
    centeredSlides?: boolean;
    autoplay?: { delay?: number; disableOnInteraction?: boolean };
    pagination?: { clickable?: boolean };
  };
  slides: HeroSlide[];
};

export const getHeroSlider = () => getAnyBlock<HeroSliderBlock>("heroSlider");

export type HeroFeatureItem = { icon: string; title: string; description: string };
export type HeroFeatureBlock = { items: HeroFeatureItem[] };
export const getHeroFeature = () => getAnyBlock<HeroFeatureBlock>("heroFeature");

export type HeroImage = { src: string; alt: string; width: number; height: number };

export type HeroRightCard = {
  badgeLeft: string;
  badgeRight: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  image: HeroImage;
};

export type HeroBlock = {
  sectionBg?: string;
  left?: { bgShapesImage?: HeroImage };
  rightCards: HeroRightCard[];
};

export const getHero = () => getAnyBlock<HeroBlock>("hero");

export type HeaderNavLink = { title: string; path: string };
export type HeaderNavItem = HeaderNavLink & { submenu?: HeaderNavLink[] };

export type HeaderBlock = {
  links: {
    account: { href: string; kicker: string; label: string; icon?: string };
    wishlist: { href: string; ariaLabel: string; icon?: string };
  };
  logo: { href: string; src: string; alt: string; width: number; height: number; className?: string };
  support?: { kicker: string; value: string; icon?: string };
  actions?: { recent?: { href: string; ariaLabel: string; icon?: string } };
  search: {
    placeholder: string;
    ariaOpen: string;
    ariaClose: string;
    ariaSubmit: string;
    categories: { label: string; value: string }[];
  };
  menu: HeaderNavItem[];
  ui?: { stickyShadow?: boolean; colors?: { primary?: string; secondary?: string } };
};

export const getHeader = () => getAnyBlock<HeaderBlock>("header");
