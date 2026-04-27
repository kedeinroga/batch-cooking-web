import type { Metadata } from "next";
import { MenuPageClient } from "./menu-client";

export const metadata: Metadata = { title: "Menú de la Semana" };

export default function MenuPage() {
  return <MenuPageClient />;
}
