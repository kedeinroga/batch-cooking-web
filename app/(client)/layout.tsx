"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ClientNav } from "@/components/layout/client-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && role !== "CLIENT") {
      router.replace("/");
    }
  }, [role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (role !== "CLIENT") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
