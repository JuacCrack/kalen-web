import ClientShell from "./ClientShell";
import { fetchStoreRows } from "@/lib/storeApi";
import {
  setStoreRows,
  getGlobal,
  getFooter,
  getHeader,
  getHero,  
  getHeroSlider,
  getHeroFeature,
  getProducts,
  getCategories,
  getHomeNewArrivals,
} from "@/data/store";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rows = await fetchStoreRows();
  setStoreRows(rows);

  const storeData = {
    global: getGlobal(),
    footer: getFooter(),
    header: getHeader(),
    hero: getHero(),
    heroSlider: getHeroSlider(),
    heroFeature: getHeroFeature(),
    products: getProducts(),
    categories: getCategories(),
    home: { newArrivals: getHomeNewArrivals() },
  };

  return <ClientShell storeData={storeData}>{children}</ClientShell>;
}
