"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, X } from "lucide-react";
import { upsertPackage } from "@/lib/api/catalog";
import { ApiClientError } from "@/lib/api/client";
import type { CatalogDish, MealType, WeeklyPackage } from "@/lib/api/types";
import { dayLabel, mealLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = [1, 2, 3, 4, 5] as const;
const MEAL_TYPES: MealType[] = ["LUNCH", "DINNER"];

const itemSchema = z.object({
  dayOfWeek: z.number().min(1).max(5),
  mealType: z.enum(["LUNCH", "DINNER"] as const),
  dishId: z.string().min(1, "Requerido"),
  sideId: z.string().optional(),
});

const packageSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  discountPercentage: z
    .number()
    .min(0, "Mínimo 0")
    .max(100, "Máximo 100"),
  items: z.array(itemSchema).min(1, "Agrega al menos un ítem"),
});

type PackageForm = z.infer<typeof packageSchema>;

interface Props {
  weekIdentifier: string;
  packages: WeeklyPackage[];
  dishes: CatalogDish[];
}

export function PackagesSection({ weekIdentifier, packages, dishes }: Props) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<WeeklyPackage | null>(null);

  const mainDishes = dishes.filter((d) => d.type !== "SIDE");
  const sideDishes = dishes.filter((d) => d.type === "SIDE");

  const form = useForm<PackageForm>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      discountPercentage: 0,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const upsertMutation = useMutation({
    mutationFn: (data: PackageForm) =>
      upsertPackage({
        id: editingPackage?.id,
        weekIdentifier,
        name: data.name,
        description: data.description || undefined,
        discountPercentage: data.discountPercentage,
        items: data.items.map((item) => ({
          dayOfWeek: item.dayOfWeek,
          mealType: item.mealType,
          dishId: item.dishId,
          sideId: item.sideId || undefined,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", weekIdentifier] });
      toast.success(editingPackage ? "Paquete actualizado" : "Paquete creado");
      closeDialog();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError ? err.errorMessage : "Error al guardar";
      toast.error(msg);
    },
  });

  function openCreate() {
    setEditingPackage(null);
    form.reset({ name: "", description: "", discountPercentage: 0, items: [] });
    setDialogOpen(true);
  }

  function openEdit(pkg: WeeklyPackage) {
    setEditingPackage(pkg);
    form.reset({
      name: pkg.name,
      description: pkg.description ?? "",
      discountPercentage: pkg.discountPercentage,
      items: pkg.items.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        mealType: item.mealType,
        dishId: item.mainDishId,
        sideId: item.sideDishId ?? undefined,
      })),
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingPackage(null);
  }

  function addItem() {
    append({ dayOfWeek: 1, mealType: "LUNCH", dishId: "", sideId: undefined });
  }

  const watchedItems = form.watch("items");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Paquetes Semanales</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo paquete
        </Button>
      </div>

      {packages.length === 0 ? (
        <p className="rounded-md border py-6 text-center text-sm text-gray-500">
          No hay paquetes para esta semana
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    {pkg.description && (
                      <p className="mt-1 text-sm text-gray-500">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">{pkg.discountPercentage}% dto.</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}>
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {pkg.items
                    .slice()
                    .sort((a, b) =>
                      a.dayOfWeek !== b.dayOfWeek
                        ? a.dayOfWeek - b.dayOfWeek
                        : a.mealType.localeCompare(b.mealType)
                    )
                    .map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <span className="w-28 shrink-0 text-gray-500">
                          {dayLabel(item.dayOfWeek)} · {mealLabel(item.mealType)}
                        </span>
                        <span className="font-medium">
                          {item.mainDish?.name ?? "—"}
                        </span>
                        {item.sideDish && (
                          <span className="text-gray-400">+ {item.sideDish.name}</span>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Editar paquete" : "Nuevo paquete"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit((data) => upsertMutation.mutate(data))}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej: Paquete Fitness"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  {...form.register("discountPercentage", { valueAsNumber: true })}
                />
                {form.formState.errors.discountPercentage && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.discountPercentage.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Descripción del paquete..."
                rows={2}
                {...form.register("description")}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Ítems
                  {form.formState.errors.items?.root && (
                    <span className="ml-2 font-normal text-red-500">
                      {form.formState.errors.items.root.message}
                    </span>
                  )}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar ítem
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="rounded-md border py-4 text-center text-sm text-gray-400">
                  Sin ítems — agrega al menos uno
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-md border p-3 space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Día</Label>
                          <Select
                            value={String(watchedItems[index]?.dayOfWeek ?? 1)}
                            onValueChange={(v) =>
                              form.setValue(`items.${index}.dayOfWeek`, Number(v))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map((d) => (
                                <SelectItem key={d} value={String(d)}>
                                  {dayLabel(d)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Comida</Label>
                          <Select
                            value={watchedItems[index]?.mealType ?? "LUNCH"}
                            onValueChange={(v) =>
                              form.setValue(`items.${index}.mealType`, v as MealType)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MEAL_TYPES.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {mealLabel(m)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Plato principal</Label>
                          <Select
                            value={watchedItems[index]?.dishId || ""}
                            onValueChange={(v) =>
                              form.setValue(`items.${index}.dishId`, v)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {mainDishes.length === 0 ? (
                                <SelectItem value="" disabled>
                                  Sin platos en el catálogo
                                </SelectItem>
                              ) : (
                                mainDishes.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.items?.[index]?.dishId && (
                            <p className="text-xs text-red-500">Requerido</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Acompañamiento</Label>
                          <Select
                            value={watchedItems[index]?.sideId || "__none__"}
                            onValueChange={(v) =>
                              form.setValue(
                                `items.${index}.sideId`,
                                v === "__none__" ? undefined : v
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Ninguno</SelectItem>
                              {sideDishes.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-7 text-red-500 hover:text-red-600"
                        >
                          <X className="mr-1 h-3 w-3" />
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending
                  ? "Guardando..."
                  : editingPackage
                    ? "Guardar cambios"
                    : "Crear paquete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
