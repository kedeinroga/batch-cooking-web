"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  BookOpen,
  ChefHat,
  Truck,
  Settings,
  MapPin,
  Trash2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const staffLinks = [
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/catalog", label: "Catálogo", icon: BookOpen },
  { href: "/reports/production", label: "Producción", icon: ChefHat },
  { href: "/reports/delivery", label: "Despacho", icon: Truck },
];

const adminLinks = [
  { href: "/config", label: "Configuración", icon: Settings },
  { href: "/zones", label: "Zonas", icon: MapPin },
  { href: "/cleanup", label: "Limpieza", icon: Trash2 },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearAuth();
    toast.success("Sesión cerrada");
    router.push("/login");
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-0.5 lg:gap-1">
            <span className="mr-2 lg:mr-4 font-semibold text-gray-900 text-sm lg:text-base whitespace-nowrap">
              <span className="hidden sm:inline">Panel Admin</span>
              <span className="sm:hidden">Admin</span>
            </span>
            {staffLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 lg:px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
            <Separator orientation="vertical" className="h-6 mx-0.5 lg:mx-1" />
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 lg:px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0 ml-2">
            <LogOut className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
