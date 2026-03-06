import ClientShell from "./ClientShell";
import { MetaPixel } from "./MetaPixel";
import { fetchStoreRows } from "@/lib/storeApi";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rows = await fetchStoreRows();

  return (
    <ClientShell rows={rows as any}>
      <MetaPixel />
      {children}
    </ClientShell>
  );
}