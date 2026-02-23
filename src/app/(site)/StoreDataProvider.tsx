"use client";

import React, { createContext, useContext } from "react";
import type {
  CategoriesBlock,
  FooterBlock,
  GlobalBlock,
  HeaderBlock,
  HeroBlock,
  HeroFeatureBlock,
  HeroSliderBlock,
  HomeBlock,
  ProductsBlock,
  StoreData as StoreRows,
  StoreDataRow,
} from "@/data/types";

export type StoreData = {
  global: GlobalBlock;
  footer: FooterBlock;
  header: HeaderBlock;
  hero: HeroBlock;
  heroSlider: HeroSliderBlock;
  heroFeature: HeroFeatureBlock;
  products: ProductsBlock;
  categories: CategoriesBlock;
  home: HomeBlock;
};

const pick = <K extends StoreDataRow["component"]>(
  rows: StoreRows,
  component: K
): Extract<StoreDataRow, { component: K }>["data"] => {
  const row = rows.find((r) => r.component === component);
  if (!row) throw new Error(`Missing store block: ${component}`);
  return row.data as any;
};

export const normalizeStoreData = (rows: StoreRows): StoreData => ({
  global: pick(rows, "global"),
  footer: pick(rows, "footer"),
  header: pick(rows, "header"),
  hero: pick(rows, "hero"),
  heroSlider: pick(rows, "heroSlider"),
  heroFeature: pick(rows, "heroFeature"),
  products: pick(rows, "products"),
  categories: pick(rows, "categories"),
  home: pick(rows, "home"),
});

const Ctx = createContext<StoreData | null>(null);

export const StoreDataProvider = ({
  value,
  children,
}: {
  value: StoreData;
  children: React.ReactNode;
}) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;

export const useStoreData = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreDataProvider missing");
  return v;
};
