// Sem RPC atômica de código sequencial no modo genérico (ADR-006). Gera o próximo
// código a partir da lista já carregada; `codigo` é unique no schema, então uma
// colisão rara (2 usuários criando ao mesmo tempo) falha no insert e quem chamar
// deve tentar de novo com a lista atualizada.

export function nextSequentialCode(existingCodes: string[], prefix: string, padLength = 4): string {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const seq = existingCodes.filter((c) => c.startsWith(fullPrefix)).length + 1;
  return `${fullPrefix}${String(seq).padStart(padLength, "0")}`;
}
