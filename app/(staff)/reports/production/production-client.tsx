"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getProductionReport } from "@/lib/api/operations";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { WeekSelector } from "@/components/week-selector";
import { dishTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy } from "lucide-react";

export function ProductionPageClient() {
  const { weekIdentifier } = useCurrentWeek();

  const { data, isLoading } = useQuery({
    queryKey: ["production-report", weekIdentifier],
    queryFn: () => getProductionReport(weekIdentifier),
  });

  function copyToClipboard() {
    if (!data) return;
    const text = data.items
      .map((item) => `${item.dishName}: ${item.quantity}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Reporte de Producción</h1>
        <div className="flex items-center gap-3">
          <WeekSelector />
          <Button variant="outline" onClick={copyToClipboard} disabled={!data}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              No hay datos de producción para esta semana
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items
                .sort((a, b) => b.quantity - a.quantity)
                .map((item) => (
                  <TableRow key={item.dishId}>
                    <TableCell className="font-medium">
                      {item.dishName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {dishTypeLabel(item.dishType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {item.quantity}
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
