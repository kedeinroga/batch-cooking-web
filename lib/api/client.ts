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
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token: explicitToken, ...fetchOptions } = options;

  let accessToken = explicitToken;
  if (!accessToken) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
  const url = `${baseUrl}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers ?? {}),
  };

  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { ...fetchOptions, headers });

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
