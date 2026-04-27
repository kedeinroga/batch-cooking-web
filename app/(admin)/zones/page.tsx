import type { Metadata } from "next";
import { ZonesPageClient } from "./zones-client";

export const metadata: Metadata = { title: "Zonas de Entrega" };

export default function ZonesPage() {
  return <ZonesPageClient />;
}
