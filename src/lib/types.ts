export type ProductOption = {
  name: string;
  values: string[];
  required?: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  price?: number;
  stock: number;
  image?: string;
  active: boolean;
  options: Record<string, string>;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  categorySlug: string;
  image: string;
  gallery: string[];
  price: number;
  compareAtPrice?: number;
  cost: number;
  sku: string;
  stock: number;
  minimumStock: number;
  active: boolean;
  featured: boolean;
  isNew: boolean;
  bestSeller?: boolean;
  allowBackorder?: boolean;
  options: ProductOption[];
  variants?: ProductVariant[];
  weightGrams: number;
};

export type CartItem = {
  lineId: string;
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  image: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  options: Record<string, string>;
};

export type PaymentStatus =
  | "pending"
  | "processing"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded";

export type FulfillmentStatus =
  | "received"
  | "preparing"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "cancelled";
