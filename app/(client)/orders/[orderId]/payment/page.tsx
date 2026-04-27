import type { Metadata } from "next";
import { PaymentPageClient } from "./payment-client";

export const metadata: Metadata = { title: "Subir Voucher de Pago" };

export default function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return <PaymentPageClient paramsPromise={params} />;
}
