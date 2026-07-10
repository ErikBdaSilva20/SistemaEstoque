export type SortDirection = "asc" | "desc";

export function filterRows<T>(rows: T[], query: string, getSearchText: (row: T) => string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => getSearchText(row).toLowerCase().includes(q));
}

export function sortRows<T>(
  rows: T[],
  accessor: (row: T) => string | number,
  direction: SortDirection,
): T[] {
  const sorted = [...rows].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av === bv) return 0;
    return av > bv ? 1 : -1;
  });
  return direction === "asc" ? sorted : sorted.reverse();
}

export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
