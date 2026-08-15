import { z } from "zod";

export function isValidCpf(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calculateDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const result = (sum * 10) % 11;
    return result === 10 ? 0 : result;
  };

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10]);
}

const brazilianPhone = /^(?:\+?55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\d{4}|[2-8]\d{3})[-\s]?\d{4}$/;

const checkoutDetailsFields = {
  fullName: z.string().trim().min(5, "Informe nome e sobrenome."),
  email: z.email("Informe um e-mail válido."),
  phone: z.string().regex(brazilianPhone, "Informe um telefone brasileiro válido."),
  cpf: z.string().refine(isValidCpf, "Informe um CPF válido."),
  course: z.string().min(1, "Selecione seu curso."),
  notes: z.string().max(500, "Use no máximo 500 caracteres."),
  fulfillment: z.enum(["pickup", "local_delivery", "shipping"]),
  postalCode: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  paymentMethod: z.enum(["pix", "card"]),
  couponCode: z.string(),
  acceptedTerms: z.boolean().refine(Boolean, "Aceite os termos e a política de privacidade."),
};

function validateAddress(
  data: { fulfillment: "pickup" | "local_delivery" | "shipping" } & Record<string, unknown>,
  ctx: z.RefinementCtx,
) {
  if (data.fulfillment !== "pickup") {
    const requiredAddressFields = ["postalCode", "street", "number", "district", "city", "state"] as const;
    for (const field of requiredAddressFields) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        ctx.addIssue({ code: "custom", path: [field], message: "Campo obrigatório para entrega." });
      }
    }
  }
}

export const checkoutDetailsSchema = z.object(checkoutDetailsFields).superRefine(validateAddress);

export const checkoutSchema = z
  .object({
    ...checkoutDetailsFields,
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          variantId: z.string().min(1).optional(),
          quantity: z.number().int().min(1).max(20),
          options: z.record(z.string(), z.string()),
        }),
      )
      .min(1, "Seu carrinho está vazio."),
    cardToken: z.string().optional(),
    paymentMethodId: z.string().optional(),
    issuerId: z.string().optional(),
    installments: z.number().int().min(1).max(12).optional(),
  })
  .superRefine((data, ctx) => {
    validateAddress(data, ctx);
    if (data.paymentMethod === "card" && !data.cardToken) {
      ctx.addIssue({ code: "custom", path: ["cardToken"], message: "Token do cartão não informado." });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;

export const trackingSchema = z.object({
  token: z.string().min(32).max(512),
  email: z.email(),
});
