import type { Metadata } from "next";
import { OrderEditorClient } from "./order-editor-client";

export const metadata: Metadata = { title: "Editar Pedido" };

export default function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return <OrderEditorClient paramsPromise={params} />;
}
