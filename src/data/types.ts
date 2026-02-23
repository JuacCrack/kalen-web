export type IconRef = string;
export type LinkTarget = "_self" | "_blank";
export type Tpl<T = string> = T | `{{${string}}}`;
export type I18n<T = string> = Partial<Record<string, T>>;
export type Nested<T> = T[][];

export type StoreRow<K extends string = string, D = unknown> = {
  component: K;
  key: string;
  order: number;
  data: D;
};

export type GlobalBlock = {
  brandName: string;
  colors?: { primary: string; secondary: string };
  store?: {
    shippings_metods?: any[];
    minimumPurchase?: number;
    support?: { kicker: string; value: string; icon?: IconRef };
    contact?: {
      hours?: string;
      whatsapp?: { value?: string; href?: string };
      email?: { value?: string; href?: string };
      address?: string;
    };
    socials?: { instagram?: string; tiktok?: string };
    routes?: { shop?: string; categoryQueryKey?: string };
  };
};

export type Category = {
  id: string;
  title: string;
  label: string;
  slug: string;
  sub?: Category[];
};

export type CategoriesBlock = { items: Category[][] };

export type InventoryLevel = {
  id: number;
  variant_id: number;
  location_id: string;
  stock: number;
};

export type Variant = {
  id: number;
  image_id: number | null;
  product_id: number;
  position?: number;
  price?: string;
  price_without_taxes?: string;
  compare_at_price?: string | null;
  promotional_price?: string | null;
  stock_management?: boolean;
  stock?: number;
  weight?: string;
  width?: string;
  height?: string;
  depth?: string;
  sku?: string;
  values?: Array<I18n<string>>;
  barcode?: string | null;
  mpn?: string | null;
  age_group?: string | null;
  gender?: string | null;
  created_at?: string;
  updated_at?: string;
  cost?: string | null;
  visible?: boolean;
  inventory_levels?: InventoryLevel[];
};

export type ProductImage = {
  id: number;
  product_id: number;
  src: string;
  position?: number;
  alt?: unknown[] | I18n<string>;
  height?: number | null;
  width?: number | null;
  thumbnails_generated?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProductCategory = {
  id: number;
  name?: I18n<string>;
  description?: I18n<string>;
  handle?: I18n<string>;
  parent?: number | null;
  subcategories?: number[];
  seo_title?: I18n<string>;
  seo_description?: I18n<string>;
  google_shopping_category?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: number;
  name?: I18n<string>;
  description?: I18n<string>;
  handle?: I18n<string>;
  published?: boolean;
  variants?: Variant[];
  images?: ProductImage[];
  categories?: ProductCategory[];
};

export type ProductsBlock = { items: Nested<Product> };

export type ProductImageById = Record<number, ProductImage>;
export type ProductWithIndex = Product & { imagesById?: ProductImageById };

export const indexProductImagesById = <P extends Product>(
  p: P,
): ProductWithIndex => {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const imagesById = imgs.reduce<ProductImageById>((acc, img) => {
    if (img?.id != null) acc[Number(img.id)] = img;
    return acc;
  }, {});
  return { ...(p as any), imagesById };
};

export const resolveVariantImage = (p: ProductWithIndex, v: Variant) => {
  const byId =
    p.imagesById ??
    (Array.isArray(p.images)
      ? indexProductImagesById(p).imagesById
      : undefined);
  const id = v.image_id;
  return id != null ? byId?.[Number(id)] : undefined;
};

export type NewArrivalsBlock = {
  kicker: string;
  title: string;
  viewAll: { label: string; href: Tpl<string> };
  productIds: number[];
};

export type HomeBlock = { newArrivals?: NewArrivalsBlock };

export type HeroImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type HeroRightCard = {
  productId: number;
  badgeLeft: string;
  badgeRight: string;
  cta: { label: string; href?: string };
  image?: HeroImage;
};

export type HeroBlock = {
  sectionBg?: string;
  left?: { bgShapesImage?: HeroImage };
  rightCards: HeroRightCard[];
};

export type HeroSlide = {
  productId?: number;
  badgeLeft: string;
  badgeRight: string;
  cta: { label: string; href?: string };
  title?: string;
  description?: string;
  image?: HeroImage;
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

export type HeroFeatureItem = {
  icon: IconRef;
  title: string;
  description: Tpl<string>;
};
export type HeroFeatureBlock = { items: HeroFeatureItem[] };

export type HeaderNavLink = { title: string; path: Tpl<string> };

export type HeaderSubmenuConfig = {
  labelKey: string;
  valueKey: string;
  pathTemplate: Tpl<string>;
};

export type HeaderNavItem =
  | (HeaderNavLink & { submenu?: HeaderNavLink[] })
  | (HeaderNavLink & {
      submenuSource: Tpl<string>;
      submenuConfig: HeaderSubmenuConfig;
    });

export type HeaderSearchConfig = {
  includeAll?: boolean;
  allLabel?: string;
  allValue?: string;
  labelKey: string;
  valueKey: string;
};

export type HeaderBlock = {
  logo: {
    href: string;
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  };
  menu: HeaderNavItem[];
  search: {
    placeholder: string;
    ariaOpen: string;
    ariaClose: string;
    ariaSubmit: string;
    categoriesSource: Tpl<string>;
    categoriesConfig: HeaderSearchConfig;
  };
  links: {
    account: { href: string; kicker: string; label: string; icon?: IconRef };
    wishlist: { href: string; ariaLabel: string; icon?: IconRef };
  };
  actions?: { recent?: { href: string; ariaLabel: string; icon?: IconRef } };
  support?: { kicker: Tpl<string>; value: Tpl<string>; icon?: Tpl<IconRef> };
  ui?: {
    stickyShadow?: boolean;
    colors?: Tpl<{ primary: string; secondary: string }>;
  };
};

export type TextLink = {
  text: Tpl<string>;
  icon?: IconRef;
  href?: Tpl<string>;
  target?: LinkTarget;
  rel?: string;
};

export type SocialLink = {
  label: string;
  href: Tpl<string>;
  icon?: IconRef;
  target?: LinkTarget;
  rel?: string;
};

export type FooterBlock = {
  brandHref: string;
  description: string;
  contact: TextLink[];
  socials: SocialLink[];
  trust: { title: string; items: TextLink[]; badges: string[] };
  bottom: { copyright: string; highlights: TextLink[] };
};

export type StoreDataRow =
  | StoreRow<"global", GlobalBlock>
  | StoreRow<"categories", CategoriesBlock>
  | StoreRow<"products", ProductsBlock>
  | StoreRow<"header", HeaderBlock>
  | StoreRow<"hero", HeroBlock>
  | StoreRow<"heroSlider", HeroSliderBlock>
  | StoreRow<"heroFeature", HeroFeatureBlock>
  | StoreRow<"home", HomeBlock>
  | StoreRow<"footer", FooterBlock>;

export type StoreData = StoreDataRow[];

export const flatten2 = <T>(x: any): T[] =>
  Array.isArray(x)
    ? x.flatMap((v) => flatten2<T>(v))
    : x != null
      ? [x as T]
      : [];

export const pickI18n = (v: any) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.es ?? v["es-AR"] ?? v["es_AR"] ?? "";
  return String(v);
};

export const getBestProductImage = (p: Product) => {
  const imgs = Array.isArray(p.images) ? [...p.images] : [];
  imgs.sort(
    (a, b) => (Number(a.position ?? 0) || 0) - (Number(b.position ?? 0) || 0),
  );
  return imgs[0];
};

export const getBestVisibleVariant = (p: Product) => {
  const vs = Array.isArray(p.variants) ? [...p.variants] : [];
  vs.sort(
    (a, b) => (Number(a.position ?? 0) || 0) - (Number(b.position ?? 0) || 0),
  );
  return vs.find((v) => v?.visible) ?? vs[0];
};

export const resolveProductHeroImage = (p: Product) => {
  const pw = indexProductImagesById(p) as ProductWithIndex;
  const v = getBestVisibleVariant(p);
  const vi = v ? resolveVariantImage(pw, v) : undefined;
  const pi = vi ?? getBestProductImage(p);
  if (!pi?.src) return undefined;
  const alt = typeof pi.alt === "object" ? pickI18n(pi.alt) : "";
  return {
    src: pi.src,
    alt,
    width: Number(pi.width ?? 0) || 0,
    height: Number(pi.height ?? 0) || 0,
  };
};

export const hydrateHeroSlider = (
  heroSlider: HeroSliderBlock,
  products: ProductsBlock,
): HeroSliderBlock => {
  const byId = new Map<number, Product>(
    flatten2<Product>(products?.items)
      .filter(Boolean)
      .map((p) => [Number(p.id), p]),
  );
  const slides = (
    Array.isArray(heroSlider?.slides) ? heroSlider.slides : []
  ).map((s) => {
    const pid = s?.productId != null ? Number(s.productId) : undefined;
    const p = pid != null ? byId.get(pid) : undefined;
    const image = s?.image?.src
      ? s.image
      : p
        ? resolveProductHeroImage(p)
        : undefined;
    const title = s?.title?.trim?.() ? s.title : p ? pickI18n(p.name) : s.title;
    const description = s?.description?.trim?.()
      ? s.description
      : p
        ? pickI18n(p.description)
        : s.description;
    return { ...s, title, description, image };
  });
  return { ...heroSlider, slides };
};
