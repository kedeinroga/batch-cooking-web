"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrder, upsertOrderItem, applyPackage, checkoutOrder, cancelOrder, deleteOrder } from "@/lib/api/orders";
import { getCatalog } from "@/lib/api/catalog";
import { ApiClientError } from "@/lib/api/client";
import { getErrorMessage, dayLabel, mealLabel, formatPrice, statusLabel } from "@/lib/utils";
import type { MealType, OrderItem, CatalogDish } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { statusColor } from "@/lib/utils";

const DAYS = [1, 2, 3, 4, 5];
const MEALS: MealType[] = ["LUNCH", "DINNER"];

function DishSelect({
  dishes,
  value,
  onChange,
  placeholder,
}: {
  dishes: CatalogDish[];
  value?: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Ninguno —</SelectItem>
        {dishes.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name} ({formatPrice(d.price)})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OrderEditorClient({
  paramsPromise,
}: {
  paramsPromise: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(paramsPromise);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  const { data: catalog } = useQuery({
    queryKey: ["catalog", order?.weekIdentifier],
    queryFn: () => getCatalog(order!.weekIdentifier),
    enabled: !!order,
  });

  const mainDishes = (catalog?.dishes ?? []).filter((d) => d.type === "MAIN");
  const sideDishes = (catalog?.dishes ?? []).filter((d) => d.type === "SIDE");

  function getItem(day: number, meal: MealType): OrderItem | undefined {
    return order?.items.find(
      (i) => i.dayOfWeek === day && i.mealType === meal
    );
  }

  const upsertMutation = useMutation({
    mutationFn: (data: {
      dayOfWeek: number;
      mealType: MealType;
      mainDishId: string;
      sideDishId?: string;
    }) => upsertOrderItem(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError
          ? getErrorMessage(err.code)
          : "Error al actualizar";
      toast.error(msg);
    },
  });

  const packageMutation = useMutation({
    mutationFn: (packageId: string) => applyPackage(orderId, packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Paquete aplicado");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError ? getErrorMessage(err.code) : "Error";
      toast.error(msg);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido confirmado");
      router.push(`/orders/${orderId}/payment`);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError
          ? getErrorMessage(err.code)
          : "Error al confirmar";
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido cancelado");
      router.push("/orders");
    },
    onError: () => toast.error("Error al cancelar"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Borrador eliminado");
      router.push("/orders");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  function handleMainChange(day: number, meal: MealType, dishId: string) {
    if (dishId === "none") return;
    const item = getItem(day, meal);
    upsertMutation.mutate({
      dayOfWeek: day,
      mealType: meal,
      mainDishId: dishId,
      sideDishId: item?.sideDishId,
    });
  }

  function handleSideChange(day: number, meal: MealType, dishId: string) {
    const item = getItem(day, meal);
    if (!item?.mainDishId) {
      toast.error("Primero selecciona un plato principal");
      return;
    }
    upsertMutation.mutate({
      dayOfWeek: day,
      mealType: meal,
      mainDishId: item.mainDishId,
      sideDishId: dishId === "none" ? undefined : dishId,
    });
  }

  const isEditable = order?.status === "DRAFT";

  if (loadingOrder) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {order.ticketNumber ?? "Pedido en progreso"}
          </h1>
          <p className="text-sm text-gray-500">{order.weekIdentifier}</p>
        </div>
        <Badge variant={statusColor(order.status)}>
          {statusLabel(order.status)}
        </Badge>
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <p className="text-sm text-yellow-800">
              Tu pedido está pendiente de pago.{" "}
              <button
                className="font-medium underline"
                onClick={() => router.push(`/orders/${orderId}/payment`)}
              >
                Subir voucher
              </button>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Packages section */}
          {isEditable && (catalog?.packages ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Aplicar paquete semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={order.packageId ?? ""}
                  onValueChange={(v) => packageMutation.mutate(v)}
                  disabled={packageMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paquete (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog?.packages ?? []).map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} (−{pkg.discountPercentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Meal grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">
                Planifica tu semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div key={day}>
                    <p className="mb-2 font-medium text-sm">{dayLabel(day)}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {MEALS.map((meal) => {
                        const item = getItem(day, meal);
                        return (
                          <div
                            key={meal}
                            className="rounded-md border border-gray-200 p-3 space-y-2"
                          >
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {mealLabel(meal)}
                            </p>
                            {isEditable ? (
                              <>
                                <DishSelect
                                  dishes={mainDishes}
                                  value={item?.mainDishId}
                                  onChange={(v) =>
                                    handleMainChange(day, meal, v)
                                  }
                                  placeholder="Principal"
                                />
                                <DishSelect
                                  dishes={sideDishes}
                                  value={item?.sideDishId}
                                  onChange={(v) =>
                                    handleSideChange(day, meal, v)
                                  }
                                  placeholder="Guarnición (opcional)"
                                />
                              </>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm">
                                  {item?.mainDish?.name ?? "—"}
                                </p>
                                {item?.sideDish && (
                                  <p className="text-xs text-gray-500">
                                    + {item.sideDish.name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {day < 5 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountPercentage > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento ({order.discountPercentage}%)</span>
                  <span>
                    −{formatPrice(order.subtotal * order.discountPercentage / 100)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {isEditable && (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => checkoutMutation.mutate()}
                disabled={
                  checkoutMutation.isPending || order.items.length === 0
                }
              >
                {checkoutMutation.isPending
                  ? "Confirmando..."
                  : "Confirmar pedido"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setConfirmCancel(true)}
              >
                Cancelar pedido
              </Button>
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
              >
                Eliminar borrador
              </Button>
            </div>
          )}

          {order.status === "CONFIRMED" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setConfirmCancel(true)}
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Seguro que deseas cancelar este pedido?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              No, mantener
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar borrador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Eliminar este borrador? Se perderán todos los datos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
