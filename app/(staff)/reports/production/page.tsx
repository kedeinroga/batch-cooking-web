import type { Metadata } from "next";
import { ProductionPageClient } from "./production-client";

export const metadata: Metadata = { title: "Reporte de Producción" };

export default function ProductionPage() {
  return <ProductionPageClient />;
}
