import { apiFetch } from "./client";
import type { DeliveryAddress, DeliveryZone } from "./types";

export function getDeliveryZones(): Promise<DeliveryZone[]> {
  return apiFetch<DeliveryZone[]>("/delivery-zones");
}

export function getDeliveryAddresses(): Promise<DeliveryAddress[]> {
  return apiFetch<DeliveryAddress[]>("/delivery-addresses");
}

export function createDeliveryAddress(
  data: Omit<DeliveryAddress, "id" | "userId" | "district">
): Promise<DeliveryAddress> {
  return apiFetch<DeliveryAddress>("/delivery-addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateDeliveryAddress(
  addressId: string,
  data: Partial<Omit<DeliveryAddress, "id" | "userId" | "district">>
): Promise<DeliveryAddress> {
  return apiFetch<DeliveryAddress>(`/delivery-addresses/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteDeliveryAddress(addressId: string): Promise<void> {
  return apiFetch<void>(`/delivery-addresses/${addressId}`, {
    method: "DELETE",
  });
}
