import { describe, expect, it } from "vitest";
import { calculateOrder, CheckoutError } from "@/lib/checkout";

describe("cálculo confiável do pedido", () => {
  it("recalcula preço, desconto e retirada a partir do catálogo", () => {
    const quote = calculateOrder({ items:[{productId:"copo-tubaroes",quantity:2,options:{}}], fulfillment:"pickup", couponCode:"BEMVINDO10" });
    expect(quote).toMatchObject({ subtotal:20, discount:2, shipping:0, total:18 });
  });
  it("inclui a taxa de envio", () => {
    const quote = calculateOrder({ items:[{productId:"tirante-grande",quantity:1,options:{}}], fulfillment:"shipping" });
    expect(quote.total).toBe(28);
  });
  it("obriga a seleção das variações necessárias", () => {
    expect(() => calculateOrder({ items:[{productId:"camisa-i-2025",quantity:1,options:{}}], fulfillment:"pickup" })).toThrowError(CheckoutError);
  });
  it("aceita uma variação válida", () => {
    const quote = calculateOrder({ items:[{productId:"camisa-i-2025",quantity:1,options:{Tamanho:"M"}}], fulfillment:"pickup" });
    expect(quote.total).toBe(69.9);
  });
  it("impede quantidade acima do estoque", () => {
    expect(() => calculateOrder({ items:[{productId:"camisa-cc-preta",quantity:9,options:{Tamanho:"M"}}], fulfillment:"pickup" })).toThrow("Estoque insuficiente");
  });
  it("rejeita cupom desconhecido", () => {
    expect(() => calculateOrder({ items:[{productId:"copo-tubaroes",quantity:1,options:{}}], fulfillment:"pickup",couponCode:"FALSO" })).toThrow("Cupom inválido");
  });
});

