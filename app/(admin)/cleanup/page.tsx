import type { Metadata } from "next";
import { CleanupPageClient } from "./cleanup-client";

export const metadata: Metadata = { title: "Limpieza de Vouchers" };

export default function CleanupPage() {
  return <CleanupPageClient />;
}
