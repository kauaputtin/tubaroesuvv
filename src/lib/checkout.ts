import { getProductById } from "@/lib/products";

type RequestedItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  options: Record<string, string>;
};

export type CheckedOutItem = {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  options: Record<string, string>;
};

export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly code: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK" | "INVALID_OPTION" | "INVALID_COUPON",
  ) {
    super(message);
  }
}

function cents(value: number) {
  return Math.round(value * 100);
}

export function calculateOrder(input: {
  items: RequestedItem[];
  fulfillment: "pickup" | "local_delivery" | "shipping";
  couponCode?: string;
}) {
  const checkedItems: CheckedOutItem[] = input.items.map((requested) => {
    const product = getProductById(requested.productId);
    if (!product) throw new CheckoutError("Um produto do carrinho não está mais disponível.", "PRODUCT_NOT_FOUND");
    const variant = requested.variantId ? product.variants?.find((candidate) => candidate.id === requested.variantId && candidate.active) : undefined;
    if (requested.variantId && !variant) throw new CheckoutError(`Variação indisponível para ${product.name}.`, "INVALID_OPTION");
    if (product.variants?.length && !variant) throw new CheckoutError(`Selecione uma variação disponível para ${product.name}.`, "INVALID_OPTION");
    const availableStock = variant?.stock ?? product.stock;
    if (!product.allowBackorder && requested.quantity > availableStock) {
      throw new CheckoutError(`Estoque insuficiente para ${product.name}.`, "OUT_OF_STOCK");
    }
    for (const option of product.options) {
      const selected = requested.options[option.name];
      if (option.required && (!selected || !option.values.includes(selected))) {
        throw new CheckoutError(`Selecione uma opção válida de ${option.name} para ${product.name}.`, "INVALID_OPTION");
      }
    }
    return {
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      quantity: requested.quantity,
      unitPrice: variant?.price ?? product.price,
      total: requested.quantity * (variant?.price ?? product.price),
      options: requested.options,
    };
  });

  const subtotalCents = checkedItems.reduce((sum, item) => sum + cents(item.total), 0);
  const coupon = input.couponCode?.trim().toUpperCase();
  let discountCents = 0;
  if (coupon) {
    if (coupon !== "BEMVINDO10") throw new CheckoutError("Cupom inválido ou expirado.", "INVALID_COUPON");
    discountCents = Math.round(subtotalCents * 0.1);
  }
  const shippingCents = input.fulfillment === "pickup" ? 0 : input.fulfillment === "local_delivery" ? 800 : 1800;
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

  return {
    items: checkedItems,
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    shipping: shippingCents / 100,
    total: totalCents / 100,
    couponCode: coupon || null,
  };
}
