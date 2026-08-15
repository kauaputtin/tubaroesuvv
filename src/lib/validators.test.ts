import { describe, expect, it } from "vitest";
import { checkoutDetailsSchema, isValidCpf } from "@/lib/validators";

describe("validação de CPF", () => {
  it("aceita um CPF matematicamente válido com máscara", () => expect(isValidCpf("529.982.247-25")).toBe(true));
  it("rejeita dígitos repetidos", () => expect(isValidCpf("111.111.111-11")).toBe(false));
  it("rejeita dígitos verificadores incorretos", () => expect(isValidCpf("529.982.247-24")).toBe(false));
});

describe("dados do checkout", () => {
  const valid = { fullName:"Kauã da Silva",email:"kaua@example.com",phone:"(27) 99999-9999",cpf:"529.982.247-25",course:"Ciência da Computação",notes:"",fulfillment:"pickup",postalCode:"",street:"",number:"",complement:"",district:"",city:"",state:"",paymentMethod:"pix",couponCode:"",acceptedTerms:true };
  it("aceita retirada sem endereço", () => expect(checkoutDetailsSchema.safeParse(valid).success).toBe(true));
  it("exige endereço para entrega", () => { const result=checkoutDetailsSchema.safeParse({...valid,fulfillment:"shipping"}); expect(result.success).toBe(false); if(!result.success) expect(result.error.flatten().fieldErrors.street).toBeDefined(); });
  it("exige consentimento LGPD", () => expect(checkoutDetailsSchema.safeParse({...valid,acceptedTerms:false}).success).toBe(false));
});

