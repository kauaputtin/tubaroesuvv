import "server-only";
import { createHmac } from "node:crypto";

/**
 * Identificação do cliente derivada do CPF, no formato que o banco guarda.
 *
 * O CPF nunca é persistido nem enviado ao Postgres. Ele existe só na memória
 * desta requisição, o tempo de virar HMAC aqui e de seguir para o gateway.
 *
 * HMAC e não SHA-256 puro: o CPF tem cerca de 10^9 valores válidos, o que faz
 * de um hash rápido e sem segredo algo reversível por força bruta em minutos.
 * A chave transforma a busca em impossível para quem só tem o banco.
 */
export function identificacaoDoCpf(cpf: string) {
  const digitos = cpf.replace(/\D/g, "");
  const chave = process.env.CPF_HASH_KEY;
  if (!chave || chave.length < 32) {
    throw new Error("CPF_HASH_KEY ausente ou curta demais (mínimo 32 caracteres).");
  }
  return {
    cpf_hash: createHmac("sha256", chave).update(digitos).digest("hex"),
    cpf_last4: digitos.slice(-4),
  };
}

/** A chave precisa existir antes de aceitar qualquer pedido. */
export function cpfHashConfigurado() {
  return Boolean(process.env.CPF_HASH_KEY && process.env.CPF_HASH_KEY.length >= 32);
}
