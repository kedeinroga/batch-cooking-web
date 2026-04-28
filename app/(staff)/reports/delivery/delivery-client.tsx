"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDeliveryReport, deliverOrder } from "@/lib/api/operations";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { WeekSelector } from "@/components/week-selector";
import { statusLabel, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck } from "lucide-react";

type FilterStatus = "ALL" | "CONFIRMED" | "DELIVERED";

export function DeliveryPageClient() {
  const queryClient = useQueryClient();
  const { weekIdentifier } = useCurrentWeek();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-report", weekIdentifier],
    queryFn: () => getDeliveryReport(weekIdentifier),
  });

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => deliverOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-report", weekIdentifier],
      });
      toast.success("Marcado como entregado");
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const filtered =
    filterStatus === "ALL"
      ? (data?.items ?? [])
      : (data?.items ?? []).filter((i) => i.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Lista de Despacho</h1>
        <div className="flex flex-wrap items-center gap-3">
          <WeekSelector />
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as FilterStatus)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="CONFIRMED">Confirmados</SelectItem>
              <SelectItem value="DELIVERED">Entregados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No hay pedidos para esta semana</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="hidden lg:table-cell">Distrito</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.orderId}>
                  <TableCell className="font-mono text-sm whitespace-nowrap">
                    {item.ticketNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{item.customerEmail}</p>
                      {item.customerPhone && (
                        <p className="text-xs text-gray-500">
                          {item.customerPhone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{item.addressLine}</p>
                      {item.reference && (
                        <p className="text-xs text-gray-400 italic">
                          {item.reference}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{item.district}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatPrice(item.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "DELIVERED" ? "default" : "outline"
                      }
                    >
                      {statusLabel(item.status as OrderStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        disabled={deliverMutation.isPending}
                        onClick={() => deliverMutation.mutate(item.orderId)}
                      >
                        <Truck className="mr-1 h-3 w-3" />
                        Entregar
                      </Button>
                    )}
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
