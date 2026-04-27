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
          <div className="flex items-center gap-1">
            <span className="mr-4 font-semibold text-gray-900">Panel Admin</span>
            {staffLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <Separator orientation="vertical" className="h-6 mx-1" />
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </nav>
  );
}
