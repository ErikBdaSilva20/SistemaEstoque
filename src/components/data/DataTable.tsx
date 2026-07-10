import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { filterRows, pageCount, paginate, sortRows, type SortDirection } from "./data-table-utils";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  /** Presence enables click-to-sort on this column's header. */
  sortAccessor?: (row: T) => string | number;
}

export interface DataTableSearchConfig<T> {
  placeholder?: string;
  getSearchText: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyMessage: ReactNode;
  search?: DataTableSearchConfig<T>;
  /** Enables pagination when set; omit to render every row. */
  pageSize?: number;
  rowClassName?: (row: T) => string | undefined;
}

/**
 * Tabela padrão do app: header/skeleton/estado-vazio + busca e paginação
 * opcionais. Ver docs/README.md §1.3 — substitui o boilerplate repetido em
 * cada *Table.tsx (header, skeleton de loading, linha de "nenhum registro").
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  skeletonRows = 3,
  emptyIcon: EmptyIcon,
  emptyMessage,
  search,
  pageSize,
  rowClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);

  const filtered = useMemo(
    () => (search ? filterRows(data, query, search.getSearchText) : data),
    [data, query, search],
  );

  const sortColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;
  const sorted = useMemo(() => {
    if (!sortColumn?.sortAccessor || !sort) return filtered;
    return sortRows(filtered, sortColumn.sortAccessor, sort.direction);
  }, [filtered, sortColumn, sort]);

  const total = sorted.length;
  const totalPages = pageSize ? pageCount(total, pageSize) : 1;
  const safePage = Math.min(page, totalPages);
  const visible = pageSize ? paginate(sorted, safePage, pageSize) : sorted;

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const colSpan = columns.length;

  return (
    <div className="space-y-3">
      {search && (
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={search.placeholder ?? "Buscar..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.headerClassName,
                    col.sortAccessor && "cursor-pointer select-none",
                  )}
                  onClick={col.sortAccessor ? () => toggleSort(col.key) : undefined}
                >
                  {col.header}
                  {sort?.key === col.key && (sort.direction === "asc" ? " ▲" : " ▼")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {EmptyIcon && <EmptyIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />}
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow key={rowKey(row)} className={rowClassName?.(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageSize != null && total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, total)} de {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
