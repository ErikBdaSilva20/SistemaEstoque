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
    // Date-only strings ("YYYY-MM-DD") parse as UTC midnight per the ISO 8601
    // spec, which shifts a day back in timezones behind UTC (e.g. pt-BR).
    // Force local-midnight parsing for those; full timestamps pass through.
    const isDateOnly = value.length <= 10;
    const d = new Date(isDateOnly ? `${value}T00:00:00` : value);
    return d.toLocaleDateString("pt-BR");
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
