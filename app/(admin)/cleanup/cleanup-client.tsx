"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cleanupVouchers } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, CheckCircle2 } from "lucide-react";

export function CleanupPageClient() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: cleanupVouchers,
    onSuccess: ({ deleted }) => {
      setDeletedCount(deleted);
      setConfirmOpen(false);
      toast.success(`${deleted} voucher(s) eliminados`);
    },
    onError: () => {
      setConfirmOpen(false);
      toast.error("Error al ejecutar limpieza");
    },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Limpieza de Vouchers</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eliminar vouchers archivados</CardTitle>
          <CardDescription>
            Elimina los archivos de voucher de Google Cloud Storage para pedidos
            en estado DELIVERED con más de 30 días de antigüedad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <strong>Regla:</strong> Solo se eliminan vouchers de pedidos
            DELIVERED con más de 30 días. Esta acción no se puede deshacer.
          </div>

          {deletedCount !== null && (
            <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">
                Limpieza completada: <strong>{deletedCount}</strong> voucher(s)
                eliminados
              </p>
            </div>
          )}

          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={mutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Ejecutar limpieza
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar limpieza</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Ejecutar la limpieza de vouchers? Los archivos eliminados no se
            pueden recuperar.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Eliminando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
