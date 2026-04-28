"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UtensilsCrossed, ShoppingBag, User, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const links = [
  { href: "/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/orders", label: "Mis Pedidos", icon: ShoppingBag },
  { href: "/profile", label: "Perfil", icon: User },
];

export function ClientNav() {
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
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="mr-2 sm:mr-4 font-semibold text-gray-900 whitespace-nowrap">
              Batch Cooking
            </span>
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 sm:px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0 ml-2">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
