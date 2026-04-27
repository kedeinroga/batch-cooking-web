"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { StaffNav } from "@/components/layout/staff-nav";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && role !== "STAFF" && role !== "ADMIN") {
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

  if (role !== "STAFF" && role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffNav />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
