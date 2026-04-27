import { apiFetch } from "./client";
import type { CatalogDish, CatalogResponse, WeeklyPackage } from "./types";

export function getCatalog(weekIdentifier: string): Promise<CatalogResponse> {
  return apiFetch<CatalogResponse>(`/catalog/${weekIdentifier}`);
}

export function createDish(
  data: Omit<CatalogDish, "id">
): Promise<CatalogDish> {
  return apiFetch<CatalogDish>("/catalog/dishes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function upsertPackage(
  data: Omit<WeeklyPackage, "id">
): Promise<WeeklyPackage> {
  return apiFetch<WeeklyPackage>("/catalog/packages", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteDish(dishId: string): Promise<void> {
  return apiFetch<void>(`/catalog/dishes/${dishId}`, { method: "DELETE" });
}
