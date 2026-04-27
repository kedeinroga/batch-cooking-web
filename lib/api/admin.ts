import { apiFetch } from "./client";
import type { DeliveryZone, WeeklyConfig } from "./types";

export function upsertWeeklyConfig(
  data: Omit<WeeklyConfig, "id">
): Promise<WeeklyConfig> {
  return apiFetch<WeeklyConfig>("/admin/weekly-configs", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateDeliveryZone(
  zoneId: string,
  data: { isActive: boolean }
): Promise<DeliveryZone> {
  return apiFetch<DeliveryZone>(`/admin/delivery-zones/${zoneId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function cleanupVouchers(): Promise<{ deleted: number }> {
  return apiFetch<{ deleted: number }>("/admin/cleanup-vouchers", {
    method: "POST",
  });
}
