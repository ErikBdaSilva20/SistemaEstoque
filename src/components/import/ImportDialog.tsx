import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseFile, downloadCsv, type Row } from "@/lib/import-export";
import { mapGatewayError } from "@/lib/errors";

export interface ImportIssue {
  row: number;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult<T> {
  valid: T[];
  issues: ImportIssue[];
}

export interface ImportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  templateColumns: string[];
  templateSampleRow?: Row;
  validate: (rows: Row[]) => ValidationResult<T>;
  performImport: (
    items: T[],
    onProgress: (done: number, total: number) => void,
  ) => Promise<{ inserted: number; errors: ImportIssue[] }>;
  onComplete?: () => void;
}

export function ImportDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  templateColumns,
  templateSampleRow,
  validate,
  performImport,
  onComplete,
}: ImportDialogProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{
    rows: Row[];
    columns: string[];
  } | null>(null);
  const [validation, setValidation] = useState<ValidationResult<T> | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setParsed(null);
    setValidation(null);
    setProgress(null);
  }, []);

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const parseM = useMutation({
    mutationFn: async (f: File) => {
      const r = await parseFile(f);
      if (r.errors.length > 0) throw new Error(r.errors.join("\n"));
      if (r.rows.length === 0) throw new Error("Arquivo vazio.");
      return r;
    },
    onSuccess: (r) => {
      setParsed({ rows: r.rows, columns: r.columns });
      setValidation(validate(r.rows));
    },
    onError: (e) => toast.error(mapGatewayError(e)),
  });

  const importM = useMutation({
    mutationFn: async () => {
      if (!validation) throw new Error("Nada para importar.");
      setProgress({ done: 0, total: validation.valid.length });
      return performImport(validation.valid, (done, total) => setProgress({ done, total }));
    },
    onSuccess: (r) => {
      toast.success(
        `${r.inserted} registro(s) importado(s).${
          r.errors.length > 0 ? ` ${r.errors.length} falha(s).` : ""
        }`,
      );
      if (r.errors.length === 0) {
        handleClose(false);
      } else {
        setValidation((prev) =>
          prev ? { valid: [], issues: [...prev.issues, ...r.errors] } : null,
        );
      }
      onComplete?.();
    },
    onError: (e) => toast.error(mapGatewayError(e)),
  });

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setValidation(null);
    parseM.mutate(f);
  };

  const downloadTemplate = () => {
    const sample = templateSampleRow ?? {};
    const row = templateColumns.reduce((acc, c) => {
      acc[c] = sample[c] ?? "";
      return acc;
    }, {} as Row);
    downloadCsv(`modelo-${title.toLowerCase().replace(/\s+/g, "-")}.csv`, [row], templateColumns);
  };

  const errors = validation?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = validation?.issues.filter((i) => i.severity === "warning") ?? [];
  const canImport = validation !== null && validation.valid.length > 0 && errors.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!file && (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-bg-base/40 p-6">
              <FileSpreadsheet className="h-8 w-8 text-accent-primary shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">Selecione um arquivo</div>
                <p className="text-xs text-muted-foreground">
                  .csv, .xlsx ou .xls — até 10.000 linhas por import
                </p>
              </div>
              <Button asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Escolher arquivo
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,.xlsx,.xls"
                    className="sr-only"
                    onChange={onFileSelected}
                  />
                </label>
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <Download className="h-3 w-3" />
              Baixar modelo CSV
            </Button>
          </div>
        )}

        {parseM.isPending && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
            <p className="text-sm text-muted-foreground">Processando {file?.name}...</p>
          </div>
        )}

        {file && parsed && validation && !importM.isPending && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-bg-base/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>
                  <strong>{file.name}</strong> — {parsed.rows.length} linha(s),{" "}
                  {parsed.columns.length} coluna(s)
                </span>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Trocar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <StatChip
                label="Válidas"
                value={validation.valid.length}
                tone="success"
                icon={<CheckCircle2 className="h-3 w-3" />}
              />
              <StatChip
                label="Avisos"
                value={warnings.length}
                tone="warning"
                icon={<AlertTriangle className="h-3 w-3" />}
              />
              <StatChip
                label="Erros"
                value={errors.length}
                tone="destructive"
                icon={<XCircle className="h-3 w-3" />}
              />
            </div>

            {(errors.length > 0 || warnings.length > 0) && (
              <ScrollArea className="h-48 rounded-md border border-border">
                <div className="divide-y divide-border">
                  {validation.issues.slice(0, 100).map((iss, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 text-xs ${
                        iss.severity === "error" ? "text-destructive" : "text-warning"
                      }`}
                    >
                      {iss.severity === "error" ? (
                        <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      )}
                      <span>
                        <strong>Linha {iss.row}:</strong> {iss.message}
                      </span>
                    </div>
                  ))}
                  {validation.issues.length > 100 && (
                    <div className="p-2 text-xs text-muted-foreground">
                      ... e mais {validation.issues.length - 100} aviso(s).
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {importM.isPending && progress && (
          <div className="space-y-3 py-6">
            <div className="flex items-center justify-between text-sm">
              <span>Importando...</span>
              <span className="font-mono tabular-nums">
                {progress.done} / {progress.total}
              </span>
            </div>
            <Progress value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importM.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => importM.mutate()} disabled={!canImport || importM.isPending}>
            {importM.isPending
              ? "Importando..."
              : `Importar ${validation?.valid.length ?? 0} linha(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatChip({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "destructive";
  icon: React.ReactNode;
}) {
  const map = {
    success: "bg-accent-success/15 text-accent-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <div className={`rounded-md p-2 text-xs ${map[tone]}`}>
      <div className="flex items-center justify-center gap-1 font-semibold">
        {icon}
        {value}
      </div>
      <div className="text-[10px] uppercase opacity-70">{label}</div>
    </div>
  );
}
