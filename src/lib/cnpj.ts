/**
 * Validação e formatação de CNPJ (dígito verificador, módulo 11).
 * Baseado na regra oficial da Receita Federal.
 */

const BLACKLIST = new Set([
  "00000000000000",
  "11111111111111",
  "22222222222222",
  "33333333333333",
  "44444444444444",
  "55555555555555",
  "66666666666666",
  "77777777777777",
  "88888888888888",
  "99999999999999",
]);

export function onlyDigits(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

export function isValidCnpj(input: string): boolean {
  const digits = onlyDigits(input);
  if (digits.length !== 14) return false;
  if (BLACKLIST.has(digits)) return false;

  const calc = (slice: number[], weights: number[]): number => {
    const sum = slice.reduce((acc, n, i) => acc + n * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const nums = digits.split("").map(Number);
  const d1 = calc(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== nums[12]) return false;
  const d2 = calc(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === nums[13];
}

export function formatCnpj(input: string): string {
  const d = onlyDigits(input).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
