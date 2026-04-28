"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";
import { getCatalog, createDish, deleteDish, updateDish } from "@/lib/api/catalog";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { WeekSelector } from "@/components/week-selector";
import { dishTypeLabel, formatPrice } from "@/lib/utils";
import type { CatalogDish, DishType } from "@/lib/api/types";
import { ApiClientError } from "@/lib/api/client";
import { PackagesSection } from "./packages-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const DISH_TYPES: DishType[] = ["MAIN", "SIDE", "DESSERT", "DRINK"];

const dishSchema = z.object({
  name: z.string().min(1, "Requerido"),
  type: z.enum(["MAIN", "SIDE", "DESSERT", "DRINK"]),
  price: z.number().positive("Precio inválido"),
});

type DishForm = z.infer<typeof dishSchema>;

export function CatalogPageClient() {
  const queryClient = useQueryClient();
  const { weekIdentifier } = useCurrentWeek();
  const [editingDish, setEditingDish] = useState<CatalogDish | null>(null);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["catalog", weekIdentifier],
    queryFn: () => getCatalog(weekIdentifier),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DishForm>({
    resolver: zodResolver(dishSchema),
    defaultValues: { type: "MAIN" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm<DishForm>({
    resolver: zodResolver(dishSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: DishForm) =>
      createDish({ ...data, weekIdentifier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", weekIdentifier] });
      toast.success("Plato agregado");
      reset({ type: "MAIN" });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError ? err.errorMessage : "Error al guardar";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DishForm) =>
      updateDish(editingDish!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", weekIdentifier] });
      toast.success("Plato actualizado");
      setEditingDish(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError ? err.errorMessage : "Error al actualizar";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", weekIdentifier] });
      toast.success("Plato eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  function openEdit(dish: CatalogDish) {
    setEditingDish(dish);
    resetEdit({ name: dish.name, type: dish.type, price: dish.price });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Catálogo Semanal</h1>
        <WeekSelector />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add dish form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agregar plato</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data: DishForm) => createMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input placeholder="Ej: Lomo saltado" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  defaultValue="MAIN"
                  onValueChange={(v) => setValue("type", v as DishType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISH_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {dishTypeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio (S/)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Guardando..." : "Agregar plato"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dish list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Platos de {weekIdentifier}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !catalog || catalog.dishes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No hay platos para esta semana
              </p>
            ) : (
              <div className="space-y-2">
                {catalog.dishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {dishTypeLabel(dish.type)}
                      </Badge>
                      <span className="text-sm font-medium">{dish.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {formatPrice(dish.price)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(dish)}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(dish.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Packages section */}
      {catalog && (
        <PackagesSection
          weekIdentifier={weekIdentifier}
          packages={catalog.packages}
          dishes={catalog.dishes}
        />
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingDish} onOpenChange={(open) => !open && setEditingDish(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plato</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitEdit((data: DishForm) => updateMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input {...registerEdit("name")} />
              {errorsEdit.name && (
                <p className="text-sm text-red-500">{errorsEdit.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={editingDish?.type}
                onValueChange={(v) => setValueEdit("type", v as DishType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISH_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {dishTypeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Precio (S/)</Label>
              <Input
                type="number"
                step="0.01"
                {...registerEdit("price", { valueAsNumber: true })}
              />
              {errorsEdit.price && (
                <p className="text-sm text-red-500">{errorsEdit.price.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDish(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
