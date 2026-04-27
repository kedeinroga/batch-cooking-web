import { createClient } from "@/lib/supabase/client";
import type { ApiError } from "./types";

export class ApiClientError extends Error {
  statusCode: number;
  code: string;
  errorMessage: string;

  constructor(error: ApiError) {
    super(error.errorMessage);
    this.statusCode = error.statusCode;
    this.code = error.code;
    this.errorMessage = error.errorMessage;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
  const url = `${baseUrl}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.access_token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorBody: ApiError;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {
        statusCode: response.status,
        code: "unknown-error",
        errorMessage: response.statusText,
      };
    }
    throw new ApiClientError(errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
