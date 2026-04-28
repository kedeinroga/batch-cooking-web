"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/types";
import type { UserProfile } from "@/lib/api/types";

// Fetches the profile using a pre-obtained access token (no getSession() call).
// Used inside onAuthStateChange to avoid acquiring the navigator lock while
// signInWithPassword still holds it, which would cause a deadlock.
async function fetchRoleWithToken(
  accessToken: string,
  supabase: ReturnType<typeof createClient>,
  setRole: (role: UserRole | null) => void,
  clearAuth: () => void
): Promise<void> {
  try {
    const profile = await apiFetch<UserProfile>("/profile/me", {
      token: accessToken,
    });
    setRole(profile.role);
  } catch (err) {
    if (err instanceof ApiClientError && err.statusCode === 404) {
      toast.error("Perfil no encontrado. Contacta al administrador.");
      await supabase.auth.signOut();
      clearAuth();
    } else {
      setRole(null);
    }
  }
}

// Fetches the profile via getSession() — safe to call outside of any auth lock.
// Used by initialize() on page load.
async function fetchRoleFromSession(
  supabase: ReturnType<typeof createClient>,
  setRole: (role: UserRole | null) => void,
  clearAuth: () => void
): Promise<void> {
  try {
    const profile = await apiFetch<UserProfile>("/profile/me");
    setRole(profile.role);
  } catch (err) {
    if (err instanceof ApiClientError && err.statusCode === 404) {
      toast.error("Perfil no encontrado. Contacta al administrador.");
      await supabase.auth.signOut();
      clearAuth();
    } else {
      setRole(null);
    }
  }
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setRole, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchRoleFromSession(supabase, setRole, clearAuth);
      } else {
        clearAuth();
      }
      setLoading(false);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        if (event === "SIGNED_IN") {
          // Use access_token directly — calling getSession() here would try to
          // acquire the navigator lock while signInWithPassword still holds it.
          setUser(session.user);
          fetchRoleWithToken(session.access_token, supabase, setRole, clearAuth);
        } else {
          setUser(session.user);
        }
      } else {
        clearAuth();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setRole, setLoading, clearAuth]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
        <Toaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
