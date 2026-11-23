import type { Metadata } from "next";
import { CategoryGrid } from "@/components/CategoryGrid";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Categories | Lamplight" };

export default function CategoriesPage() {
  return (
    <PageShell eyebrow="Browse by shelf" title="Categories">
      <CategoryGrid />
    </PageShell>
  );
}
