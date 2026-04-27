"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { getProfile } from "@/lib/api/profile";
import { ApiClientError } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/types";

async function fetchAndSetRole(
  supabase: ReturnType<typeof createClient>,
  setRole: (role: UserRole | null) => void,
  clearAuth: () => void
): Promise<void> {
  try {
    const profile = await getProfile();
    setRole(profile.role);
  } catch (err) {
    if (err instanceof ApiClientError && err.statusCode === 404) {
      // Usuario autenticado pero sin perfil en user_profiles.
      // Ocurre cuando no existe el trigger en la BD. Hace signout para evitar loop.
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
        await fetchAndSetRole(supabase, setRole, clearAuth);
      } else {
        clearAuth();
      }
      setLoading(false);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === "SIGNED_IN") {
          setLoading(true);
          setUser(session.user);
          await fetchAndSetRole(supabase, setRole, clearAuth);
          setLoading(false);
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
