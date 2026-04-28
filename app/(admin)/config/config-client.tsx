"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getWeeklyConfig, upsertWeeklyConfig } from "@/lib/api/admin";
import { currentWeekIdentifier } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const configSchema = z.object({
  weekIdentifier: z.string().regex(/^\d{4}-W\d{2}$/, "Formato: 2026-W16"),
  startDate: z.string().min(1, "Requerido"),
  maxOrders: z.number().int().positive("Debe ser positivo"),
  discountPercentage: z.number().min(0).max(100),
  isActive: z.boolean(),
});

type ConfigForm = z.infer<typeof configSchema>;

export function ConfigPageClient() {
  const queryClient = useQueryClient();
  const week = currentWeekIdentifier();

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["weekly-config", week],
    queryFn: () => getWeeklyConfig(week),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      weekIdentifier: week,
      discountPercentage: 0,
      maxOrders: 50,
      isActive: true,
    },
  });

  useEffect(() => {
    if (existingConfig) {
      reset({
        weekIdentifier: existingConfig.weekIdentifier,
        startDate: existingConfig.startDate.split("T")[0],
        maxOrders: existingConfig.maxOrders,
        discountPercentage: existingConfig.discountPercentage,
        isActive: existingConfig.isActive,
      });
    }
  }, [existingConfig, reset]);

  const mutation = useMutation({
    mutationFn: upsertWeeklyConfig,
    onSuccess: () => {
      toast.success("Configuración guardada");
      queryClient.invalidateQueries({ queryKey: ["weekly-config", week] });
    },
    onError: () => toast.error("Error al guardar"),
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Configuración Semanal</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form
              onSubmit={handleSubmit((data: ConfigForm) =>
                mutation.mutate(data)
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Semana (YYYY-WNN)</Label>
                <Input
                  placeholder="2026-W16"
                  {...register("weekIdentifier")}
                />
                {errors.weekIdentifier && (
                  <p className="text-sm text-red-500">
                    {errors.weekIdentifier.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Fecha de inicio</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Máximo de pedidos</Label>
                <Input
                  type="number"
                  min={1}
                  {...register("maxOrders", { valueAsNumber: true })}
                />
                {errors.maxOrders && (
                  <p className="text-sm text-red-500">
                    {errors.maxOrders.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descuento global (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  {...register("discountPercentage", { valueAsNumber: true })}
                />
                {errors.discountPercentage && (
                  <p className="text-sm text-red-500">
                    {errors.discountPercentage.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Semana activa</Label>
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Guardar configuración"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
