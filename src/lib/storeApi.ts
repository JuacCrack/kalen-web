import "server-only";
import type { StoreRow } from "@/data/types";

export const fetchStoreRows = async (): Promise<StoreRow[]> => {
  const url =
    process.env.STORE_API_URL ?? "https://www.kalenindumentaria.com/api/store/";
  const token = process.env.STORE_API_TOKEN ?? "";

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 60 },
    });

    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {}

   // console.log("[fetchStoreRows] status:", res.status);
   console.log("[fetchStoreRows] response:", json ?? raw);

    if (!res.ok) throw new Error(`Store API failed: ${res.status}`);

    return Array.isArray(json) ? (json as StoreRow[]) : [];
  } catch (e) {
  // console.error("[fetchStoreRows] error:", e);
    throw e;
  }
};
