import { apiFetch } from "./client";
import type { UserProfile } from "./types";

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/profile/me");
}
