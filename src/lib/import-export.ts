import Papa from "papaparse";
import * as XLSX from "xlsx";

export type Row = Record<string, unknown>;

export interface ParseResult {
  rows: Row[];
  columns: string[];
  errors: string[];
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    return await new Promise<ParseResult>((resolve) => {
      Papa.parse<Row>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (res) => {
          const columns = res.meta.fields ?? [];
          resolve({
            rows: res.data,
            columns,
            errors: res.errors.map((e) => `Linha ${e.row ?? "?"}: ${e.message}`),
          });
        },
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: null });
    const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];
    return { rows, columns, errors: [] };
  }

  return {
    rows: [],
    columns: [],
    errors: [`Formato de arquivo não suportado: .${ext ?? ""}`],
  };
}

export function downloadCsv(filename: string, rows: Row[], columns?: string[]): void {
  const csv = Papa.unparse(rows, {
    columns,
    header: true,
    newline: "\n",
  });
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, filename);
}

export function downloadXlsx(filename: string, rows: Row[], sheetName = "Dados"): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type CellValue = string | number | boolean | null | undefined;

export function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : null;
}

export function bool(v: unknown): boolean {
  const s = str(v).toLowerCase();
  return s === "true" || s === "sim" || s === "s" || s === "1" || s === "yes" || s === "y";
}
