"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function BackButton({
  href,
  label = "Volver",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
