"use client";

import React, { createContext, useContext, useMemo } from "react";

export type StoreRow = { component: string; key?: string; order?: number; data: unknown };
export type StoreRows = StoreRow[];

export type StoreApi = {
  get<T = unknown>(component: string, fallback?: T): T;
  has(component: string): boolean;
  rows: StoreRows;
};

const Ctx = createContext<StoreApi | null>(null);

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

export const StoreDataProvider = ({
  rows,
  children,
}: {
  rows: StoreRows;
  children: React.ReactNode;
}) => {
  const api = useMemo<StoreApi>(() => {
    const mem = new Map<string, unknown>();
    for (const r of rows) {
      if (!isObj(r)) continue;
      const c = typeof (r as any).component === "string" ? (r as any).component : "";
      if (!c) continue;
      mem.set(c, (r as any).data);
    }
    return {
      rows,
      has: (c) => mem.has(c),
      get: (c, fallback) => ((mem.get(c) ?? fallback) as any),
    };
  }, [rows]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};

export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreDataProvider missing");
  return v;
};