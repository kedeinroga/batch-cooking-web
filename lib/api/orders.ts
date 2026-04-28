import { apiFetch } from "./client";
import type { Order, OrderItem, MealType } from "./types";

export function getOrders(week: string): Promise<Order[]> {
  return apiFetch<Order[]>(`/orders?week=${week}`);
}

export function getOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}`);
}

export function createOrder(data: {
  deliveryAddressId: string;
  weekIdentifier: string;
}): Promise<Order> {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function upsertOrderItem(
  orderId: string,
  data: {
    dayOfWeek: number;
    mealType: MealType;
    dishId: string;
    sideId?: string;
  }
): Promise<OrderItem> {
  return apiFetch<OrderItem>(`/orders/${orderId}/items`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function applyPackage(
  orderId: string,
  packageId: string
): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/package`, {
    method: "PATCH",
    body: JSON.stringify({ packageId }),
  });
}

export function checkoutOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/checkout`, { method: "POST" });
}

export function cancelOrder(orderId: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/cancel`, { method: "PATCH" });
}

export function deleteOrder(orderId: string): Promise<void> {
  return apiFetch<void>(`/orders/${orderId}`, { method: "DELETE" });
}
