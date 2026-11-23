import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ShopCatalog } from "@/components/ShopCatalog";

export const metadata: Metadata = { title: "Shop | Lamplight" };

export default function ShopPage() {
  return (
    <PageShell eyebrow="Every book on every shelf" title="Shop">
      <ShopCatalog />
    </PageShell>
  );
}
