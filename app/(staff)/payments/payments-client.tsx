"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPendingPaymentOrders, getVoucherSignedUrl } from "@/lib/api/operations";
import { confirmPayment } from "@/lib/api/payments";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { WeekSelector } from "@/components/week-selector";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Check, MessageCircle } from "lucide-react";

export function PaymentsPageClient() {
  const queryClient = useQueryClient();
  const { weekIdentifier } = useCurrentWeek();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["pending-payments", weekIdentifier],
    queryFn: () => getPendingPaymentOrders(weekIdentifier),
  });

  const voucherMutation = useMutation({
    mutationFn: (orderId: string) => getVoucherSignedUrl(orderId),
    onSuccess: ({ signedUrl }) => {
      window.open(signedUrl, "_blank");
    },
    onError: () => toast.error("Error al obtener voucher"),
  });

  const confirmMutation = useMutation({
    mutationFn: (orderId: string) => confirmPayment(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      toast.success("Pago confirmado");
    },
    onError: () => toast.error("Error al confirmar pago"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagos Pendientes</h1>
        <WeekSelector />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              No hay pagos pendientes para esta semana
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.ticketNumber ?? order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{order.user?.email ?? "—"}</p>
                      {order.user?.phone && (
                        <p className="text-xs text-gray-500">
                          {order.user.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={voucherMutation.isPending}
                        onClick={() => voucherMutation.mutate(order.id)}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Voucher
                      </Button>
                      {order.user?.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `https://wa.me/51${order.user!.phone}?text=Hola,%20tu%20pago%20ha%20sido%20confirmado`,
                              "_blank"
                            )
                          }
                        >
                          <MessageCircle className="mr-1 h-3 w-3" />
                          WA
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={confirmMutation.isPending}
                        onClick={() => confirmMutation.mutate(order.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Confirmar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
