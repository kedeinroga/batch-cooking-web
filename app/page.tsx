"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootPage() {
  const router = useRouter();
  const { user, role, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "CLIENT") {
      router.replace("/menu");
    } else if (role === "STAFF") {
      router.replace("/payments");
    } else if (role === "ADMIN") {
      router.replace("/config");
    } else {
      router.replace("/login");
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 w-64">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
