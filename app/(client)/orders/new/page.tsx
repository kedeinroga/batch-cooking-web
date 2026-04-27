"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { getDeliveryAddresses } from "@/lib/api/delivery";
import { createOrder } from "@/lib/api/orders";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { ApiClientError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const newOrderSchema = z.object({
  addressId: z.string().min(1, "Selecciona una dirección"),
});

type NewOrderForm = z.infer<typeof newOrderSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const { weekIdentifier } = useCurrentWeek();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["delivery-addresses"],
    queryFn: getDeliveryAddresses,
  });

  useEffect(() => {
    if (!isLoading && addresses && addresses.length === 0) {
      router.replace("/profile/addresses");
    }
  }, [addresses, isLoading, router]);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewOrderForm>({
    resolver: zodResolver(newOrderSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: NewOrderForm) =>
      createOrder({ ...data, weekIdentifier }),
    onSuccess: (order) => {
      toast.success("Pedido creado");
      router.push(`/orders/${order.id}`);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError
          ? getErrorMessage(err.code)
          : "Error al crear pedido";
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-md">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Pedido</h1>
      <p className="text-sm text-gray-600">Semana: {weekIdentifier}</p>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dirección de entrega</CardTitle>
            <CardDescription>
              ¿Dónde entregamos tu pedido?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecciona una dirección</Label>
              <Select onValueChange={(v) => setValue("addressId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {(addresses ?? []).map((addr) => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {addr.label} — {addr.addressLine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addressId && (
                <p className="text-sm text-red-500">
                  {errors.addressId.message}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              ¿No tienes dirección guardada?{" "}
              <Link
                href="/profile/addresses"
                className="text-blue-600 hover:underline"
              >
                Agregar aquí
              </Link>
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear pedido"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
