"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDeliveryZones } from "@/lib/api/delivery";
import { updateDeliveryZone } from "@/lib/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ZonesPageClient() {
  const queryClient = useQueryClient();

  const { data: zones, isLoading } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: getDeliveryZones,
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      zoneId,
      isActive,
    }: {
      zoneId: string;
      isActive: boolean;
    }) => updateDeliveryZone(zoneId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      toast.success("Zona actualizada");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Zonas de Entrega</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distritos disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !zones || zones.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No hay zonas configuradas
            </p>
          ) : (
            <div className="space-y-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={zone.isActive ? "default" : "secondary"}>
                      {zone.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={zone.isActive ? "outline" : "default"}
                    disabled={toggleMutation.isPending}
                    onClick={() =>
                      toggleMutation.mutate({
                        zoneId: zone.id,
                        isActive: !zone.isActive,
                      })
                    }
                  >
                    {zone.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
