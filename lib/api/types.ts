export type UserRole = "CLIENT" | "STAFF" | "ADMIN";

export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "DELIVERED"
  | "CANCELLED";

export type MealType = "LUNCH" | "DINNER";

export type DishType = "MAIN" | "SIDE" | "DESSERT" | "DRINK";

export interface UserProfile {
  id: string;
  role: UserRole;
}

export interface DeliveryZone {
  id: string;
  districtName: string;
  isActive: boolean;
}

export interface DeliveryAddress {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  districtId: string;
  district?: DeliveryZone;
  reference?: string;
}

export interface WeeklyConfig {
  id: string;
  weekIdentifier: string;
  startDate: string;
  maxOrders: number;
  discountPercentage: number;
  isActive: boolean;
}

export interface CatalogDish {
  id: string;
  name: string;
  type: DishType;
  price: number;
  weekIdentifier: string;
}

export interface WeeklyPackageItem {
  id: string;
  packageId: string;
  dayOfWeek: number;
  mealType: MealType;
  mainDishId: string;
  sideDishId?: string;
  mainDish?: CatalogDish;
  sideDish?: CatalogDish;
}

export interface WeeklyPackage {
  id: string;
  weekIdentifier: string;
  name: string;
  description?: string;
  discountPercentage: number;
  items: WeeklyPackageItem[];
}

export interface CatalogResponse {
  dishes: CatalogDish[];
  packages: WeeklyPackage[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  dayOfWeek: number;
  mealType: MealType;
  dishId: string;
  sideId?: string;
}

export interface Order {
  id: string;
  userId: string;
  weekIdentifier: string;
  status: OrderStatus;
  ticketNumber?: string;
  deliveryAddressId: string;
  items?: OrderItem[];
  subtotal: number;
  discountApplied: number;
  total: number;
  sourcePackageId?: string;
  voucherPath?: string;
  user?: {
    id: string;
    email: string;
    phone?: string;
  };
}

export interface ProductionReportItem {
  dishId: string;
  dishName: string;
  dishType: DishType;
  quantity: number;
}

export interface ProductionReport {
  weekIdentifier: string;
  items: ProductionReportItem[];
}

export interface DeliveryReportItem {
  orderId: string;
  ticketNumber: string;
  customerEmail: string;
  customerPhone?: string;
  addressLine: string;
  district: string;
  reference?: string;
  status: OrderStatus;
  total: number;
}

export interface DeliveryReport {
  weekIdentifier: string;
  items: DeliveryReportItem[];
}

export interface ApiError {
  statusCode: number;
  code: string;
  errorMessage: string;
}
