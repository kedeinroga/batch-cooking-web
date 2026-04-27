import type { DishType, MealType, OrderStatus } from "./api/types";

export function currentWeekIdentifier(): string {
  const now = new Date();
  const year = now.getFullYear();

  // ISO week number calculation
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));

  const diff = now.getTime() - startOfWeek1.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
}

export function dayLabel(dayOfWeek: number): string {
  const labels: Record<number, string> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
  };
  return labels[dayOfWeek] ?? `Día ${dayOfWeek}`;
}

export function mealLabel(mealType: MealType): string {
  return mealType === "LUNCH" ? "Almuerzo" : "Cena";
}

export function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    DRAFT: "Borrador",
    PENDING_PAYMENT: "Pendiente de pago",
    CONFIRMED: "Confirmado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };
  return labels[status] ?? status;
}

export function dishTypeLabel(type: DishType): string {
  const labels: Record<DishType, string> = {
    MAIN: "Principal",
    SIDE: "Guarnición",
    DESSERT: "Postre",
    DRINK: "Bebida",
  };
  return labels[type] ?? type;
}

export function statusColor(
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DRAFT":
      return "secondary";
    case "PENDING_PAYMENT":
      return "outline";
    case "CONFIRMED":
      return "default";
    case "DELIVERED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "order-window-closed": "La ventana de pedidos está cerrada",
    "order-capacity-exceeded": "Capacidad semanal alcanzada",
    "order-not-editable":
      "Este pedido no se puede modificar en su estado actual",
    "data-not-found": "No encontrado",
    "unauthorized-access": "Acceso no autorizado",
  };
  return messages[code] ?? "Ha ocurrido un error";
}
