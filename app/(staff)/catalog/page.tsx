import type { Metadata } from "next";
import { CatalogPageClient } from "./catalog-client";

export const metadata: Metadata = { title: "Gestión de Catálogo" };

export default function CatalogPage() {
  return <CatalogPageClient />;
}
