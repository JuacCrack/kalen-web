export type {
  Category,
  CategoriesBlock,
  FooterBlock,
  GlobalBlock,
  HeaderBlock,
  HeaderNavItem,
  HeroBlock,
  HeroFeatureBlock,
  HeroFeatureItem,
  HeroSliderBlock,
  NewArrivalsBlock,
  Product,
  ProductsBlock,
  StoreRow,
  StoreDataRow,
} from "./types";

import type {
  Category,
  CategoriesBlock,
  FooterBlock,
  GlobalBlock,
  HeaderBlock,
  HeaderNavItem,
  HeroBlock,
  HeroFeatureBlock,
  HeroFeatureItem,
  HeroSliderBlock,
  NewArrivalsBlock,
  Product,
  ProductsBlock,
  StoreRow,
  StoreDataRow,
} from "./types";

import { flatten2, hydrateHeroSlider } from "./types";
let rows: StoreRow[] = [];

export const setStoreRows = (nextRows: StoreRow[]) => {
  rows = Array.isArray(nextRows) ? nextRows : [];
  initDeepCtx();
};

const pick = <T,>(value: T | null | undefined, fallback: T) => (value ?? fallback) as T;

const sortByOrder = <T extends { order: number }>(xs: T[]) => xs.slice().sort((a, b) => a.order - b.order);
const byKey = (key: string) => (r: StoreRow) => r.key === key;
const byComponent = (component: string) => (r: StoreRow) => r.component === component;

const rowData = <T,>(r?: StoreRow) => (r?.data as T) ?? (undefined as any);

const one = <T,>(key: string) => rowData<T>(rows.find(byKey(key)));

const lastOne = <T,>(key: string) => {
  const xs = sortByOrder(rows.filter(byKey(key)));
  return rowData<T>(xs.at(-1));
};

const many = <T,>(key: string) => sortByOrder(rows.filter(byKey(key))).map((r) => r.data as T);

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
  global: {},
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

const resolveTemplates = <T,>(value: T): T => {
  if (value == null) return value;

  if (typeof value === "string") {
    const s = value.trim();
    const exact = s.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (exact) return resolveTemplates(getPath(exact[1]) as any) as any;

    return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_all, p1) => {
      const v = resolveTemplates(getPath(String(p1)) as any);
      if (v == null) return "";
      if (typeof v === "object") return "";
      return String(v);
    }) as any;
  }

  if (Array.isArray(value)) return value.map((v) => resolveTemplates(v as any)) as any;

  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) out[k] = resolveTemplates(v as any);
    return out;
  }

  return value;
};

const normalizeNested = <T,>(x: any): T[][] => {
  if (!Array.isArray(x)) return [];
  if (x.length === 0) return [];
  return Array.isArray(x[0]) ? (x as T[][]) : ([x] as T[][]);
};

const listOrManyItems = <T extends { items?: any[] }>(lastKey: string, manyKey: string): T => {
  const data = resolveTemplates(lastOne<T>(lastKey));
  const items = (data as any)?.items;

  if (Array.isArray(items) && items.length) {
    if (lastKey === "products" || lastKey === "categories") {
      return { ...(data as any), items: normalizeNested<any>(items) } as T;
    }
    return data as T;
  }

  const manyItems = resolveTemplates(many<any>(manyKey));
  if (lastKey === "products" || lastKey === "categories") {
    return { items: normalizeNested<any>(manyItems) } as T;
  }
  return { items: manyItems } as T;
};

const initDeepCtx = () => {
  deepCtx.global = pick(one<any>("global"), {});

  const categories = resolveTemplates(lastOne<CategoriesBlock>("categories"));
  const products = resolveTemplates(lastOne<ProductsBlock>("products"));

  deepCtx.categories.items = flatten2<Category>(pick(categories?.items, []));
  deepCtx.products.items = flatten2<Product>(pick(products?.items, []));

  if (!deepCtx.products.items.length) deepCtx.products.items = flatten2<Product>(resolveTemplates(many<any>("products.items")));
  if (!deepCtx.categories.items.length) deepCtx.categories.items = flatten2<Category>(resolveTemplates(many<any>("categories.items")));
};

initDeepCtx();

export const getStore = () => rows;

export const getBlock = <T = unknown>(component: StoreDataRow["component"]) =>
  resolveTemplates(materializeComponent(String(component))) as T;

export const getGlobal = (): GlobalBlock => {
  const data = resolveTemplates(one<GlobalBlock>("global"));
  return pick(data, { brandName: "", colors: undefined, store: undefined });
};

export const getCategories = (): CategoriesBlock =>
  listOrManyItems<CategoriesBlock>("categories", "categories.items");

export const getProducts = (): ProductsBlock =>
  listOrManyItems<ProductsBlock>("products", "products.items");

export const getFooter = (): FooterBlock => {
  const data = resolveTemplates(lastOne<FooterBlock>("footer"));
  return pick(data, {
    brandHref: "/",
    description: "",
    contact: [],
    socials: [],
    trust: { title: "", items: [], badges: [] },
    bottom: { copyright: "", highlights: [] },
  } satisfies FooterBlock);
};

export const getHomeNewArrivals = (): NewArrivalsBlock => {
  const raw = resolveTemplates(one<any>("home.newArrivals"));
  const data = (raw?.newArrivals ?? raw) as Partial<NewArrivalsBlock> | undefined;

  return pick(data as any, {
    kicker: "",
    title: "",
    viewAll: { label: "", href: "#" },
    productIds: [],
  });
};

export const getHeroSlider = (): HeroSliderBlock => {
  const base = resolveTemplates(lastOne<HeroSliderBlock>("heroSlider")) ?? ({ swiper: {}, slides: [] } as any);
  const products = getProducts();
  return hydrateHeroSlider(base, products);
};

export const getHeroFeature = (): HeroFeatureBlock => {
  const base = resolveTemplates(lastOne<any>("heroFeature")) ?? {};
  const items = Array.isArray(base?.items) ? (base.items as HeroFeatureItem[]) : [];
  return { items } satisfies HeroFeatureBlock;
};

export const getHero = (): HeroBlock => {
  const base = resolveTemplates(lastOne<HeroBlock>("hero"));
  return pick(base, { sectionBg: undefined, left: undefined, rightCards: [] } satisfies HeroBlock);
};

export const getHeader = (): HeaderBlock => {
  const base = resolveTemplates(lastOne<any>("header")) ?? {};

  const logo = pick(base?.logo, {
    href: "/",
    src: "",
    alt: "",
    width: 0,
    height: 0,
    className: undefined,
  }) as HeaderBlock["logo"];

  const menu = (Array.isArray(base?.menu) ? base.menu : []) as HeaderNavItem[];

  const searchRaw = (base?.search ?? {}) as any;
  const search = {
    placeholder: String(searchRaw.placeholder ?? ""),
    ariaOpen: String(searchRaw.ariaOpen ?? ""),
    ariaClose: String(searchRaw.ariaClose ?? ""),
    ariaSubmit: String(searchRaw.ariaSubmit ?? ""),
    categoriesSource: (searchRaw.categoriesSource ?? "{{categories.items}}") as any,
    categoriesConfig: pick(searchRaw.categoriesConfig, {
      includeAll: true,
      allLabel: "Todas",
      allValue: "all",
      labelKey: "label",
      valueKey: "slug",
    }),
  } satisfies HeaderBlock["search"];

  const links = pick(base?.links, {
    account: { href: "/", kicker: "", label: "", icon: undefined },
    wishlist: { href: "/", ariaLabel: "", icon: undefined },
  }) as HeaderBlock["links"];

  const actions = base?.actions as HeaderBlock["actions"] | undefined;
  const support = base?.support as HeaderBlock["support"] | undefined;
  const ui = base?.ui as HeaderBlock["ui"] | undefined;

  return {
    logo: resolveTemplates(logo),
    menu: resolveTemplates(menu),
    search: resolveTemplates(search),
    links: resolveTemplates(links),
    actions: actions ? resolveTemplates(actions) : undefined,
    support: support ? resolveTemplates(support) : undefined,
    ui: ui ? resolveTemplates(ui) : undefined,
  } as HeaderBlock;
};

export const getAnyBlock = <T = unknown>(key: string) => {
  if (key === "global") return getGlobal() as unknown as T;
  if (key === "footer") return getFooter() as unknown as T;
  if (key === "categories") return getCategories() as unknown as T;
  if (key === "products") return getProducts() as unknown as T;
  if (key === "home") return ({ newArrivals: getHomeNewArrivals() } as any) as T;
  if (key === "heroSlider") return getHeroSlider() as unknown as T;
  if (key === "heroFeature") return getHeroFeature() as unknown as T;
  if (key === "hero") return getHero() as unknown as T;
  if (key === "header") return getHeader() as unknown as T;
  return resolveTemplates(materializeComponent(key)) as T;
};
