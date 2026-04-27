import type { Metadata } from "next";
import { AddressesPageClient } from "./addresses-client";

export const metadata: Metadata = { title: "Mis Direcciones" };

export default function AddressesPage() {
  return <AddressesPageClient />;
}
