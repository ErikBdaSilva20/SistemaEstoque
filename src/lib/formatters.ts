export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(
  value: number | string | null | undefined,
  fractionDigits = 3,
): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return (
      d.toLocaleDateString("pt-BR") +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "—";
  }
}
