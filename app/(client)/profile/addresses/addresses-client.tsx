"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getDeliveryAddresses,
  getDeliveryZones,
  createDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
} from "@/lib/api/delivery";
import type { DeliveryAddress } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const addressSchema = z.object({
  label: z.string().min(1, "Requerido"),
  addressLine: z.string().min(1, "Requerido"),
  districtId: z.string().min(1, "Selecciona un distrito"),
  reference: z.string().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: DeliveryAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="font-medium">{address.label}</p>
          <p className="text-sm text-gray-600">{address.addressLine}</p>
          {address.district && (
            <p className="text-sm text-gray-500">{address.district.name}</p>
          )}
          {address.reference && (
            <p className="text-sm text-gray-400 italic">{address.reference}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AddressesPageClient() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<DeliveryAddress | null>(
    null
  );

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ["delivery-addresses"],
    queryFn: getDeliveryAddresses,
  });

  const { data: zones } = useQuery({
    queryKey: ["delivery-zones"],
    queryFn: getDeliveryZones,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  const createMutation = useMutation({
    mutationFn: createDeliveryAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-addresses"] });
      toast.success("Dirección agregada");
      setDialogOpen(false);
      reset();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError
          ? getErrorMessage(err.code)
          : "Error al guardar";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressForm }) =>
      updateDeliveryAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-addresses"] });
      toast.success("Dirección actualizada");
      setDialogOpen(false);
      setEditingAddress(null);
      reset();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError
          ? getErrorMessage(err.code)
          : "Error al actualizar";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-addresses"] });
      toast.success("Dirección eliminada");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Error al eliminar"),
  });

  function openCreate() {
    setEditingAddress(null);
    reset();
    setDialogOpen(true);
  }

  function openEdit(address: DeliveryAddress) {
    setEditingAddress(address);
    reset({
      label: address.label,
      addressLine: address.addressLine,
      districtId: address.districtId,
      reference: address.reference ?? "",
    });
    setDialogOpen(true);
  }

  function onSubmit(data: AddressForm) {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Direcciones</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar dirección
        </Button>
      </div>

      {loadingAddresses ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Aún no tienes direcciones guardadas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => openEdit(addr)}
              onDelete={() => setDeleteTarget(addr)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Editar dirección" : "Nueva dirección"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Input placeholder="Casa, Oficina..." {...register("label")} />
              {errors.label && (
                <p className="text-sm text-red-500">{errors.label.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                placeholder="Av. Example 123"
                {...register("addressLine")}
              />
              {errors.addressLine && (
                <p className="text-sm text-red-500">
                  {errors.addressLine.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Distrito</Label>
              <Select
                defaultValue={editingAddress?.districtId}
                onValueChange={(v) => setValue("districtId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar distrito" />
                </SelectTrigger>
                <SelectContent>
                  {(zones ?? [])
                    .filter((z) => z.isActive)
                    .map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.districtId && (
                <p className="text-sm text-red-500">
                  {errors.districtId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input
                placeholder="Frente al parque..."
                {...register("reference")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar dirección</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Eliminar &ldquo;{deleteTarget?.label}&rdquo;? Esta acción no se
            puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
