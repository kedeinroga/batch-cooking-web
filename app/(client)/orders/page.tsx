"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { getOrders } from "@/lib/api/orders";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { WeekSelector } from "@/components/week-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { statusLabel, statusColor, formatPrice } from "@/lib/utils";

export default function OrdersPage() {
  const { weekIdentifier } = useCurrentWeek();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", weekIdentifier],
    queryFn: () => getOrders(weekIdentifier),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Mis Pedidos</h1>
        <div className="flex flex-wrap items-center gap-3">
          <WeekSelector />
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo pedido
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">
              No tienes pedidos para esta semana
            </p>
            <Button asChild className="mt-4">
              <Link href="/orders/new">Crear pedido</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {order.ticketNumber ?? `Pedido ${order.id.slice(0, 8)}`}
                    </CardTitle>
                    <Badge variant={statusColor(order.status)}>
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{order.weekIdentifier}</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
