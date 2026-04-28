"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrder, upsertOrderItem, removeOrderItem, applyPackage, checkoutOrder, cancelOrder, deleteOrder } from "@/lib/api/orders";
import { getCatalog } from "@/lib/api/catalog";
import { ApiClientError } from "@/lib/api/client";
import { getErrorMessage, dayLabel, mealLabel, formatPrice, statusLabel } from "@/lib/utils";
import type { MealType, OrderItem, CatalogDish } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
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
import { ArrowRight } from "lucide-react";
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

  function getDishName(dishId: string | undefined): string {
    if (!dishId) return "—";
    return catalog?.dishes.find((d) => d.id === dishId)?.name ?? "—";
  }

  function getItem(day: number, meal: MealType): OrderItem | undefined {
    return order?.items?.find(
      (i) => i.dayOfWeek === day && i.mealType === meal
    );
  }

  const removeMutation = useMutation({
    mutationFn: ({ dayOfWeek, mealType }: { dayOfWeek: number; mealType: MealType }) =>
      removeOrderItem(orderId, dayOfWeek, mealType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Error al quitar el plato"),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: {
      dayOfWeek: number;
      mealType: MealType;
      dishId: string;
      sideId?: string;
    }) => upsertOrderItem(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    if (dishId === "none") {
      if (getItem(day, meal)) {
        removeMutation.mutate({ dayOfWeek: day, mealType: meal });
      }
      return;
    }
    const item = getItem(day, meal);
    upsertMutation.mutate({
      dayOfWeek: day,
      mealType: meal,
      dishId,
      sideId: item?.sideId,
    });
  }

  function handleSideChange(day: number, meal: MealType, sideId: string) {
    const item = getItem(day, meal);
    if (!item?.dishId) {
      toast.error("Primero selecciona un plato principal");
      return;
    }
    upsertMutation.mutate({
      dayOfWeek: day,
      mealType: meal,
      dishId: item.dishId,
      sideId: sideId === "none" ? undefined : sideId,
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
      <BackButton href="/orders" label="Mis Pedidos" />
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
                  value={order.sourcePackageId ?? ""}
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
                                  value={item?.dishId}
                                  onChange={(v) =>
                                    handleMainChange(day, meal, v)
                                  }
                                  placeholder="Principal"
                                />
                                <DishSelect
                                  dishes={sideDishes}
                                  value={item?.sideId}
                                  onChange={(v) =>
                                    handleSideChange(day, meal, v)
                                  }
                                  placeholder="Guarnición (opcional)"
                                />
                              </>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm">
                                  {getDishName(item?.dishId)}
                                </p>
                                {item?.sideId && (
                                  <p className="text-xs text-gray-500">
                                    + {getDishName(item.sideId)}
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
              {(order.discountApplied ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>−{formatPrice(order.discountApplied)}</span>
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
                className="w-full h-auto flex-col gap-0.5 py-3"
                onClick={() => checkoutMutation.mutate()}
                disabled={
                  checkoutMutation.isPending || (order.items?.length ?? 0) === 0
                }
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  {checkoutMutation.isPending ? "Procesando..." : "Proceder al pago"}
                  {!checkoutMutation.isPending && <ArrowRight className="h-4 w-4" />}
                </span>
                <span className="text-xs font-normal opacity-75">
                  Finaliza tu selección y pasa al pago
                </span>
              </Button>

              <div className="flex items-center gap-2 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-400 whitespace-nowrap">otras acciones</span>
                <Separator className="flex-1" />
              </div>

              <button
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                onClick={() => setConfirmCancel(true)}
              >
                <span className="block text-sm font-medium text-gray-700">
                  Cancelar pedido
                </span>
                <span className="mt-0.5 block text-xs text-gray-400">
                  Queda registrado en tu historial
                </span>
              </button>

              <button
                className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
              >
                <span className="block text-sm font-medium text-red-600">
                  Eliminar borrador
                </span>
                <span className="mt-0.5 block text-xs text-red-400">
                  Se borra por completo, sin historial
                </span>
              </button>
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
            <DialogTitle>¿Cancelar este pedido?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            El pedido quedará marcado como cancelado. Podrás verlo en tu
            historial pero no podrás editarlo ni retomarlo.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              Mantener pedido
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? "Cancelando..." : "Sí, cancelar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este borrador?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            El borrador se eliminará por completo y no aparecerá en tu
            historial. Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Mantener borrador
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
