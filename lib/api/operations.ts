import { apiFetch } from "./client";
import type { DeliveryReport, Order, ProductionReport } from "./types";

interface PendingPaymentOrdersResponse {
  weekIdentifier: string;
  totalOrders: number;
  orders: Order[];
}

export function getPendingPaymentOrders(week: string): Promise<Order[]> {
  return apiFetch<PendingPaymentOrdersResponse>(
    `/operations/orders/pending-payment?week=${week}`
  ).then((res) => res.orders);
}

export function getVoucherSignedUrl(
  orderId: string
): Promise<{ signedUrl: string }> {
  return apiFetch<{ signedUrl: string }>(
    `/operations/orders/${orderId}/voucher`
  );
}

export function deliverOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/operations/orders/${orderId}/deliver`, {
    method: "POST",
  });
}

export function getProductionReport(week: string): Promise<ProductionReport> {
  return apiFetch<ProductionReport>(
    `/operations/reports/production?week=${week}`
  );
}

export function getDeliveryReport(week: string): Promise<DeliveryReport> {
  return apiFetch<DeliveryReport>(
    `/operations/reports/delivery?week=${week}`
  );
}
