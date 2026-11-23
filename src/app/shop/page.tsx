import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/PageShell";
import { ShopCatalog } from "@/components/ShopCatalog";
import { collections } from "@/data/catalog";

export const metadata: Metadata = { title: "Shop | Lamplight" };

/** Reads ?shelf= (runtime data), so it sits inside <Suspense> and the rest of the page can be prerendered. */
async function Catalog({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const { shelf } = await searchParams;
  const initialShelf = typeof shelf === "string" && collections.some((c) => c.id === shelf) ? shelf : "all";
  // key: a new ?shelf= (e.g. from the Categories page) resets the filters
  return <ShopCatalog key={initialShelf} initialShelf={initialShelf} />;
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <PageShell eyebrow="Every book on every shelf" title="Shop">
      <Suspense fallback={<ShopCatalog />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
