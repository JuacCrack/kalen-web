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

export type Category = {
  id: string;
  title: string;
  label: string;
  slug: string;
};

export type CategoriesBlock = { items: Category[] };

export type Product = {
  id: number;
  title: string;
  categoryId?: string;
  href: string;
  currency?: string;
  price?: number;
  discountPercent?: number;
  badges?: string[];
  shortDescription?: string;
  imgs?: { previews?: string[] };
  image?: { src: string; alt: string; width: number; height: number };
};

export type ProductsBlock = { items: Product[] };

export type NewArrivalsBlock = {
  kicker: string;
  title: string;
  viewAll: { label: string; href: string };
  productIds: number[];
};

export type HeroImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type HeroSlide = {
  badgeLeft: string;
  badgeRight: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  image: HeroImage;
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
  icon: string;
  title: string;
  description: string;
};
export type HeroFeatureBlock = { items: HeroFeatureItem[] };

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

export type HeaderNavLink = { title: string; path: string };
export type HeaderNavItem = HeaderNavLink & { submenu?: HeaderNavLink[] };

export type HeaderBlock = {
  links: {
    account: { href: string; kicker: string; label: string; icon?: string };
    wishlist: { href: string; ariaLabel: string; icon?: string };
  };
  logo: {
    href: string;
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  };
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
  ui?: {
    stickyShadow?: boolean;
    colors?: { primary?: string; secondary?: string };
  };
};

export type Store = {
  global: {
    brandName: string;
    colors?: { primary: string; secondary: string };
    store?: {
      minimumPurchase?: number;
      support?: { kicker: string; value: string; icon?: string };
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
  footer: {
    brandHref: string;
    description: string;
    contact: TextLink[];
    socials: SocialLink[];
    trust: { title: string; items: TextLink[]; badges: string[] };
    bottom: { copyright: string; highlights: TextLink[] };
  };
  categories?: CategoriesBlock;
  products?: ProductsBlock;
  home?: { newArrivals?: NewArrivalsBlock };
  heroSlider?: HeroSliderBlock;
  heroFeature?: HeroFeatureBlock;
  hero?: HeroBlock;
  header?: HeaderBlock;
};

export type StoreRow = {
  component: string;
  key: string;
  order: number;
  data: unknown;
};

const rows = raw as unknown as StoreRow[];

const pick = <T>(value: T | null | undefined, fallback: T) =>
  (value ?? fallback) as T;

const sortByOrder = <T extends { order: number }>(xs: T[]) =>
  xs.slice().sort((a, b) => a.order - b.order);

const byKey = (key: string) => (r: StoreRow) => r.key === key;
const byComponent = (component: string) => (r: StoreRow) =>
  r.component === component;

const rowData = <T>(r?: StoreRow) => (r?.data as T) ?? (undefined as any);

const one = <T>(key: string) => rowData<T>(rows.find(byKey(key)));

const lastOne = <T>(key: string) => {
  const xs = sortByOrder(rows.filter(byKey(key)));
  return rowData<T>(xs.at(-1));
};

const many = <T>(key: string) =>
  sortByOrder(rows.filter(byKey(key))).map((r) => r.data as T);

const materializeComponent = (component: string) => {
  const group = sortByOrder(rows.filter(byComponent(component)));
  const out: any = {};
  for (const r of group) {
    const parts = r.key.split(".");
    parts.shift();
    const rest = parts;

    if (!rest.length) {
      Object.assign(out, r.data);
      continue;
    }

    let cur = out;
    for (let i = 0; i < rest.length - 1; i++) {
      const k = rest[i];
      cur[k] ??= {};
      cur = cur[k];
    }
    cur[rest[rest.length - 1]] = r.data;
  }
  return out;
};

const deepCtx: {
  global: any;
  categories: { items: Category[] };
  products: { items: Product[] };
} = {
  global: pick(one<any>("global"), {}),
  categories: { items: [] },
  products: { items: [] },
};

const getPath = (path: string) => {
  const parts = path
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return undefined;

  let cur: any = (deepCtx as any)[parts[0]];
  for (let i = 1; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
};

const resolveTemplates = <T>(value: T): T => {
  if (value == null) return value;

  if (typeof value === "string") {
    const s = value.trim();
    const exact = s.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (exact) return resolveTemplates(getPath(exact[1]) as any) as any;

    return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p1) => {
      const v = resolveTemplates(getPath(String(p1)) as any);
      return v == null ? "" : String(v);
    }) as any;
  }

  if (Array.isArray(value))
    return value.map((v) => resolveTemplates(v as any)) as any;

  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any))
      out[k] = resolveTemplates(v as any);
    return out;
  }

  return value;
};

(() => {
  const categories = resolveTemplates(lastOne<CategoriesBlock>("categories"));
  const products = resolveTemplates(lastOne<ProductsBlock>("products"));

  deepCtx.categories.items = pick(categories?.items, []) as Category[];
  deepCtx.products.items = pick(products?.items, []) as Product[];

  if (!deepCtx.products.items.length) {
    deepCtx.products.items = resolveTemplates(
      many<Product>("products.items"),
    ) as Product[];
  }

  if (!deepCtx.categories.items.length) {
    deepCtx.categories.items = resolveTemplates(
      many<Category>("categories.items"),
    ) as Category[];
  }
})();

export const getStore = () => rows;

export const getBlock = <K extends keyof Store>(key: K) =>
  materializeComponent(String(key)) as Store[K];

export const getGlobal = () => {
  const data = resolveTemplates(one<Store["global"]>("global"));
  return pick(data, { brandName: "", colors: undefined, store: undefined });
};

export const getCategories = () => {
  const data = resolveTemplates(lastOne<CategoriesBlock>("categories"));
  if (data?.items?.length) return data;
  return {
    items: resolveTemplates(many<Category>("categories.items")) as Category[],
  };
};

export const getFooter = () => {
  const data = resolveTemplates(lastOne<Store["footer"]>("footer"));
  return pick(data, {
    brandHref: "/",
    description: "",
    contact: [],
    socials: [],
    trust: { title: "", items: [], badges: [] },
    bottom: { copyright: "", highlights: [] },
  } satisfies Store["footer"]);
};

export const getYear = () => new Date().getFullYear();

export const formatTemplate = (
  template: string,
  vars: Record<string, string | number>,
) => template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

export const getAnyBlock = <T = unknown>(key: string) => {
  if (key === "global") return getGlobal() as unknown as T;
  if (key === "footer") return getFooter() as unknown as T;
  if (key === "categories") return getCategories() as unknown as T;
  if (key === "products") return getProducts() as unknown as T;
  if (key === "home")
    return { newArrivals: getHomeNewArrivals() } as unknown as T;
  if (key === "heroSlider") return getHeroSlider() as unknown as T;
  if (key === "heroFeature") return getHeroFeature() as unknown as T;
  if (key === "hero") return getHero() as unknown as T;
  if (key === "header") return getHeader() as unknown as T;
  return resolveTemplates(materializeComponent(key)) as T;
};

export const getProducts = () => {
  const data = resolveTemplates(lastOne<ProductsBlock>("products"));
  if (data?.items?.length) return data;
  return {
    items: resolveTemplates(many<Product>("products.items")) as Product[],
  };
};

export const getHomeNewArrivals = () => {
  const raw = resolveTemplates(one<any>("home.newArrivals"));
  const data = (raw?.newArrivals ?? raw) as
    | Partial<NewArrivalsBlock>
    | undefined;

  return pick(data as any, {
    kicker: "",
    title: "",
    viewAll: { label: "", href: "#" },
    productIds: [],
  });
};

export const resolveProductsByIds = (ids: number[], items: Product[]) => {
  const map = new Map<number, Product>(items.map((p) => [p.id, p] as const));
  return ids.flatMap((id) => {
    const p = map.get(id);
    return p ? [p] : [];
  });
};

const buildCategoriesFromSource = (source: any, cfg: any) => {
  const items: any[] = Array.isArray(source) ? source : [];
  const labelKey = String(cfg?.labelKey ?? "label");
  const valueKey = String(cfg?.valueKey ?? "slug");

  const out = items.map((x) => ({
    label: String(x?.[labelKey] ?? ""),
    value: String(x?.[valueKey] ?? ""),
  }));

  if (cfg?.includeAll) {
    out.unshift({
      label: String(cfg?.allLabel ?? "Todas"),
      value: String(cfg?.allValue ?? "all"),
    });
  }

  return out.filter((x) => x.label && x.value !== "");
};

const buildSubmenuFromSource = (source: any, cfg: any) => {
  const items: any[] = Array.isArray(source) ? source : [];
  const labelKey = String(cfg?.labelKey ?? "label");
  const valueKey = String(cfg?.valueKey ?? "slug");
  const pathTemplate = String(cfg?.pathTemplate ?? "{value}");

  return items
    .map((x) => {
      const title = String(x?.[labelKey] ?? "");
      const value = String(x?.[valueKey] ?? "");
      const path = pathTemplate.replace(/\{value\}/g, value);
      return title && path ? { title, path } : null;
    })
    .filter(Boolean) as HeaderNavLink[];
};

export const getHeroSlider = () => {
  const base = resolveTemplates(lastOne<any>("heroSlider")) ?? {};
  const swiper = (base?.swiper ?? {}) as HeroSliderBlock["swiper"];
  const slidesRaw = (Array.isArray(base?.slides) ? base.slides : []) as any[];

  const products = getProducts().items as Product[];
  const pmap: Map<number, Product> = new Map(
    products.map((p) => [p.id, p] as const),
  );

  const slides: HeroSlide[] = slidesRaw.flatMap((s: any) => {
    const productId = Number(s?.productId);
    const p = pmap.get(productId);
    if (!p) return [];

    const image: HeroImage = p.image ?? {
      src: String(p?.imgs?.previews?.[0] ?? ""),
      alt: String(p.title ?? ""),
      width: 0,
      height: 0,
    };

    return [
      {
        badgeLeft: String(s?.badgeLeft ?? ""),
        badgeRight: String(s?.badgeRight ?? ""),
        title: String(p.title ?? ""),
        description: String(p.shortDescription ?? ""),
        cta: {
          label: String(s?.cta?.label ?? ""),
          href: String(p.href ?? "#"),
        },
        image,
      },
    ];
  });

  return { swiper, slides } satisfies HeroSliderBlock;
};

export const getHeroFeature = () => {
  const base = resolveTemplates(lastOne<any>("heroFeature")) ?? {};
  const items = Array.isArray(base?.items)
    ? (base.items as HeroFeatureItem[])
    : [];
  return { items } satisfies HeroFeatureBlock;
};

export const getHero = () => {
  const base = resolveTemplates(pick(lastOne<any>("hero"), {})) as any;
  const rightCardsRaw = (
    Array.isArray(base?.rightCards) ? base.rightCards : []
  ) as any[];

  const products = getProducts().items as Product[];
  const pmap: Map<number, Product> = new Map(
    products.map((p) => [p.id, p] as const),
  );

  const rightCards: HeroRightCard[] = rightCardsRaw.flatMap((c: any) => {
    const productId = Number(c?.productId);
    const p = pmap.get(productId);
    if (!p) return [];

    const image: HeroImage = p.image ?? {
      src: String(p?.imgs?.previews?.[0] ?? ""),
      alt: String(p.title ?? ""),
      width: 0,
      height: 0,
    };

    return [
      {
        badgeLeft: String(c?.badgeLeft ?? ""),
        badgeRight: String(c?.badgeRight ?? ""),
        title: String(p.title ?? ""),
        description: String(p.shortDescription ?? ""),
        cta: {
          label: String(c?.cta?.label ?? ""),
          href: String(p.href ?? "#"),
        },
        image,
      },
    ];
  });

  return {
    sectionBg: base?.sectionBg,
    left: base?.left,
    rightCards,
  } as HeroBlock;
};

export const getHeader = () => {
  const base = resolveTemplates(lastOne<any>("header")) ?? {};

  const logo = pick(base?.logo, {
    href: "",
    src: "",
    alt: "",
    width: 0,
    height: 0,
  }) as HeaderBlock["logo"];

  const menuRaw = Array.isArray(base?.menu) ? (base.menu as any[]) : [];

  const searchRaw = (base?.search ?? {}) as any;
  const search = {
    placeholder: String(searchRaw.placeholder ?? ""),
    ariaOpen: String(searchRaw.ariaOpen ?? ""),
    ariaClose: String(searchRaw.ariaClose ?? ""),
    ariaSubmit: String(searchRaw.ariaSubmit ?? ""),
    categories: Array.isArray(searchRaw.categories)
      ? (searchRaw.categories as { label: string; value: string }[])
      : buildCategoriesFromSource(
          resolveTemplates(searchRaw.categoriesSource),
          resolveTemplates(searchRaw.categoriesConfig),
        ),
  } satisfies HeaderBlock["search"];

  const menu: HeaderNavItem[] = menuRaw.map((m: any) => {
    const title = String(m?.title ?? "");
    const path = String(m?.path ?? "");
    const baseItem: HeaderNavItem = { title, path };

    if (m?.submenuSource && m?.submenuConfig) {
      const src = resolveTemplates(m.submenuSource);
      const cfg = resolveTemplates(m.submenuConfig);
      const submenu = buildSubmenuFromSource(src, cfg);
      return { ...baseItem, submenu };
    }

    if (Array.isArray(m?.submenu)) {
      const submenu = resolveTemplates(m.submenu) as HeaderNavLink[];
      return { ...baseItem, submenu };
    }

    return baseItem;
  });

  const account = pick(base?.links?.account, {
    href: "",
    kicker: "",
    label: "",
  }) as HeaderBlock["links"]["account"];
  const wishlist = pick(base?.links?.wishlist, {
    href: "",
    ariaLabel: "",
  }) as HeaderBlock["links"]["wishlist"];

  const recent = base?.actions?.recent as
    | NonNullable<HeaderBlock["actions"]>["recent"]
    | undefined;
  const support = base?.support as HeaderBlock["support"] | undefined;
  const ui = base?.ui as HeaderBlock["ui"] | undefined;

  return {
    logo: resolveTemplates(logo),
    menu: resolveTemplates(menu),
    search: resolveTemplates(search),
    links: {
      account: resolveTemplates(account),
      wishlist: resolveTemplates(wishlist),
    },
    actions: recent ? { recent: resolveTemplates(recent) } : undefined,
    support: support ? resolveTemplates(support) : undefined,
    ui: ui ? resolveTemplates(ui) : undefined,
  } as HeaderBlock;
};
