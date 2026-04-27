import type { Metadata } from "next";
import { ConfigPageClient } from "./config-client";

export const metadata: Metadata = { title: "Configuración Semanal" };

export default function ConfigPage() {
  return <ConfigPageClient />;
}
