"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user, role } = useAuthStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Datos de cuenta</CardTitle>
          <CardDescription>Tu información de Batch Cooking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-base">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rol</p>
            <p className="text-base capitalize">{role?.toLowerCase() ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direcciones de entrega</CardTitle>
          <CardDescription>
            Gestiona tus domicilios de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/profile/addresses">
              <MapPin className="mr-2 h-4 w-4" />
              Gestionar direcciones
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
