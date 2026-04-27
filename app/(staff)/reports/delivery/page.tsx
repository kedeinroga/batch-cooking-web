import type { Metadata } from "next";
import { DeliveryPageClient } from "./delivery-client";

export const metadata: Metadata = { title: "Lista de Despacho" };

export default function DeliveryPage() {
  return <DeliveryPageClient />;
}
