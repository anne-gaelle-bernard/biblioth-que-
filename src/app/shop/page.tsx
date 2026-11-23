import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ShopCatalog } from "@/components/ShopCatalog";
import { collections } from "@/data/catalog";

export const metadata: Metadata = { title: "Shop | Lamplight" };

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const { shelf } = await searchParams;
  const initialShelf = typeof shelf === "string" && collections.some((c) => c.id === shelf) ? shelf : "all";

  return (
    <PageShell eyebrow="Every book on every shelf" title="Shop">
      {/* key: a new ?shelf= (e.g. from the Categories page) resets the filters */}
      <ShopCatalog key={initialShelf} initialShelf={initialShelf} />
    </PageShell>
  );
}
