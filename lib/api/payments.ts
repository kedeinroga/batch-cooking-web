import { apiFetch } from "./client";
import type { Order } from "./types";

export function getVoucherUploadUrl(
  orderId: string
): Promise<{ uploadUrl: string; objectName: string }> {
  return apiFetch<{ uploadUrl: string; objectName: string }>(
    `/orders/${orderId}/voucher-upload-url`,
    { method: "POST" }
  );
}

export function confirmVoucher(
  orderId: string,
  objectName: string
): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/confirm-voucher`, {
    method: "POST",
    body: JSON.stringify({ objectName }),
  });
}

export function confirmPayment(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/confirm-payment`, {
    method: "POST",
  });
}
