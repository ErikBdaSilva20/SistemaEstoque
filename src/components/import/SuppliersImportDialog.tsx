import { useQueryClient } from "@tanstack/react-query";
import { createSupplier, type SupplierInsert } from "@/lib/data/suppliers.repo";
import { SUPPLIERS_QUERY_KEY } from "@/hooks/useSuppliers";
import { ImportDialog, type ImportIssue, type ValidationResult } from "./ImportDialog";
import { num, str, bool, type Row } from "@/lib/import-export";

const TEMPLATE_COLUMNS = [
  "nome",
  "cnpj",
  "email",
  "telefone",
  "lead_time_dias",
  "observacoes",
  "ativo",
];

const TEMPLATE_SAMPLE: Row = {
  nome: "Fornecedor Exemplo LTDA",
  cnpj: "00.000.000/0001-00",
  email: "contato@fornecedor.com",
  telefone: "(11) 99999-9999",
  lead_time_dias: "7",
  observacoes: "Prazo de pagamento 30 dias",
  ativo: "sim",
};

export interface SuppliersImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuppliersImportDialog({ open, onOpenChange }: SuppliersImportDialogProps) {
  const qc = useQueryClient();

  const validate = (rows: Row[]): ValidationResult<SupplierRow> => {
    const issues: ImportIssue[] = [];
    const valid: SupplierRow[] = [];
    const seenNames = new Set<string>();
    const seenCnpjs = new Set<string>();

    rows.forEach((row, i) => {
      const lineNum = i + 2;
      const name = str(row.nome ?? row.name);
      const cnpj = str(row.cnpj ?? row.CNPJ);
      const email = str(row.email ?? row.Email);
      const phone = str(row.telefone ?? row.phone ?? row.celular);
      const leadTime = num(row.lead_time_dias ?? row.lead_time ?? row.prazo) ?? 7;
      const notes = str(row.observacoes ?? row.observações ?? row.notes);
      const activeRaw = row.ativo ?? row.active;
      const isActive =
        activeRaw === undefined || activeRaw === null || activeRaw === "" ? true : bool(activeRaw);

      if (!name) {
        issues.push({ row: lineNum, message: "Nome é obrigatório", severity: "error" });
        return;
      }
      const lowName = name.toLowerCase();
      if (seenNames.has(lowName)) {
        issues.push({
          row: lineNum,
          message: `Fornecedor duplicado no arquivo: ${name}`,
          severity: "warning",
        });
      }
      seenNames.add(lowName);

      if (cnpj) {
        const cleaned = cnpj.replace(/\D/g, "");
        if (cleaned.length !== 14) {
          issues.push({
            row: lineNum,
            message: `CNPJ com ${cleaned.length} dígitos (esperado 14)`,
            severity: "warning",
          });
        }
        if (seenCnpjs.has(cleaned)) {
          issues.push({
            row: lineNum,
            message: `CNPJ duplicado no arquivo: ${cnpj}`,
            severity: "error",
          });
          return;
        }
        seenCnpjs.add(cleaned);
      }

      if (email && !email.includes("@")) {
        issues.push({
          row: lineNum,
          message: `Email inválido: ${email}`,
          severity: "warning",
        });
      }

      if (leadTime < 0 || leadTime > 365) {
        issues.push({
          row: lineNum,
          message: `Lead time fora do intervalo (0-365): ${leadTime}`,
          severity: "error",
        });
        return;
      }

      valid.push({
        name,
        cnpj: cnpj || null,
        email: email || null,
        phone: phone || null,
        lead_time_days: leadTime,
        notes: notes || null,
        active: isActive,
      });
    });

    return { valid, issues };
  };

  const performImport = async (
    items: SupplierRow[],
    onProgress: (done: number, total: number) => void,
  ) => {
    const errors: ImportIssue[] = [];
    let inserted = 0;
    const CHUNK_SIZE = 50;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async (item, chunkIdx) => {
          const rowNum = i + chunkIdx + 2;
          try {
            await createSupplier(item);
            inserted++;
          } catch (error) {
            errors.push({
              row: rowNum,
              message: (error as Error).message,
              severity: "error",
            });
          }
        }),
      );

      onProgress(Math.min(i + CHUNK_SIZE, items.length), items.length);
    }

    qc.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
    return { inserted, errors };
  };

  return (
    <ImportDialog<SupplierRow>
      open={open}
      onOpenChange={onOpenChange}
      title="Importar fornecedores"
      description="Aceita CSV/XLSX. Colunas reconhecidas: nome, cnpj, email, telefone, lead_time_dias, observacoes, ativo."
      templateColumns={TEMPLATE_COLUMNS}
      templateSampleRow={TEMPLATE_SAMPLE}
      validate={validate}
      performImport={performImport}
    />
  );
}

type SupplierRow = SupplierInsert;
