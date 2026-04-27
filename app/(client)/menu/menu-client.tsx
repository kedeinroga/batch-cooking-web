"use client";

import { useQuery } from "@tanstack/react-query";
import { getCatalog } from "@/lib/api/catalog";
import { useCurrentWeek } from "@/hooks/use-current-week";
import { WeekSelector } from "@/components/week-selector";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, dishTypeLabel } from "@/lib/utils";
import type { CatalogDish, DishType } from "@/lib/api/types";

const DISH_TYPES: DishType[] = ["MAIN", "SIDE", "DESSERT", "DRINK"];

function DishCard({ dish }: { dish: CatalogDish }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3">
      <div>
        <p className="font-medium text-sm">{dish.name}</p>
      </div>
      <span className="text-sm font-semibold text-blue-700">
        {formatPrice(dish.price)}
      </span>
    </div>
  );
}

function DishSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function MenuPageClient() {
  const { weekIdentifier } = useCurrentWeek();

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", weekIdentifier],
    queryFn: () => getCatalog(weekIdentifier),
  });

  const dishesByType = DISH_TYPES.reduce(
    (acc, type) => {
      acc[type] = (data?.dishes ?? []).filter((d) => d.type === type);
      return acc;
    },
    {} as Record<DishType, CatalogDish[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menú de la Semana</h1>
        <WeekSelector />
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {DISH_TYPES.map((type) => (
            <Card key={type}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <DishSkeleton key={i} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data || data.dishes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">
              No hay menú disponible para esta semana
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {DISH_TYPES.map((type) =>
              dishesByType[type].length === 0 ? null : (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {dishTypeLabel(type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dishesByType[type].map((dish) => (
                      <DishCard key={dish.id} dish={dish} />
                    ))}
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {data.packages.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">Paquetes Semanales</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.packages.map((pkg) => (
                  <Card key={pkg.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{pkg.name}</CardTitle>
                        <Badge variant="secondary">
                          -{pkg.discountPercentage}%
                        </Badge>
                      </div>
                      {pkg.description && (
                        <CardDescription>{pkg.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">
                        {pkg.items.length} comidas incluidas
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
