export type StoreRow = { component: string; key: string; order: number; data: unknown };

const mem = new Map<string, unknown>();

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

export const initStore = (rows: unknown) => {
  mem.clear();
  if (!Array.isArray(rows)) return;

  for (const r of rows) {
    if (!isObj(r)) continue;
    const component = typeof r.component === "string" ? r.component : "";
    if (!component) continue;
    mem.set(component, (r as any).data);
  }
};

export const getStore = <T = unknown>(component: string, fallback?: T): T => {
  const v = mem.get(component);
  return (v === undefined ? fallback : (v as T)) as T;
};