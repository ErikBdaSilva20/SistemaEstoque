import { useQueryClient } from "@tanstack/react-query";
import { createProduct, type ProductInsert } from "@/lib/data/products.repo";
import { createStockMovement } from "@/lib/data/stock_movements.repo";
import { useSuppliers } from "@/hooks/useSuppliers";
import { PRODUCTS_QUERY_KEY } from "@/hooks/useProducts";
import { ImportDialog, type ImportIssue, type ValidationResult } from "./ImportDialog";
import { num, str, bool, type Row } from "@/lib/import-export";

const TEMPLATE_COLUMNS = [
  "sku",
  "nome",
  "barcode",
  "categoria",
  "unidade",
  "custo",
  "preco",
  "estoque_minimo",
  "estoque_inicial",
  "fornecedor",
  "descricao",
  "ativo",
];

const TEMPLATE_SAMPLE: Row = {
  sku: "PROD-001",
  nome: "Produto exemplo",
  barcode: "7891234567890",
  categoria: "Bebidas",
  unidade: "un",
  custo: "10,50",
  preco: "19,90",
  estoque_minimo: "5",
  estoque_inicial: "20",
  fornecedor: "Fornecedor Exemplo LTDA",
  descricao: "Descrição opcional",
  ativo: "sim",
};

export interface ProductsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductsImportDialog({ open, onOpenChange }: ProductsImportDialogProps) {
  const qc = useQueryClient();
  const { data: suppliers = [] } = useSuppliers(true);

  const validate = (rows: Row[]): ValidationResult<ProductRow> => {
    const issues: ImportIssue[] = [];
    const valid: ProductRow[] = [];
    const seenSkus = new Set<string>();

    const supplierMap = new Map<string, string>();
    for (const s of suppliers) {
      supplierMap.set(s.name.toLowerCase().trim(), s.id);
      if (s.cnpj) supplierMap.set(s.cnpj.trim(), s.id);
    }

    rows.forEach((row, i) => {
      const lineNum = i + 2; // planilhas começam em 1, + header

      const sku = str(row.sku ?? row.SKU ?? row.Sku);
      const name = str(row.nome ?? row.name ?? row.Nome);
      const unit = str(row.unidade ?? row.unit) || "un";
      const cost = num(row.custo ?? row.cost);
      const price = num(row.preco ?? row.preço ?? row.price);
      const minStock = num(row.estoque_minimo ?? row.min_stock);
      const initialStock = num(row.estoque_inicial ?? row.initial_stock);
      const barcode = str(row.barcode ?? row.ean);
      const category = str(row.categoria ?? row.category);
      const description = str(row.descricao ?? row.descrição ?? row.description);
      const supplierRaw = str(row.fornecedor ?? row.supplier);
      const activeRaw = row.ativo ?? row.active;
      const isActive =
        activeRaw === undefined || activeRaw === null || activeRaw === "" ? true : bool(activeRaw);

      if (!sku) {
        issues.push({ row: lineNum, message: "SKU é obrigatório", severity: "error" });
        return;
      }
      if (!name) {
        issues.push({ row: lineNum, message: "Nome é obrigatório", severity: "error" });
        return;
      }
      if (seenSkus.has(sku)) {
        issues.push({
          row: lineNum,
          message: `SKU duplicado no arquivo: ${sku}`,
          severity: "error",
        });
        return;
      }
      seenSkus.add(sku);

      if (cost === null || cost < 0) {
        issues.push({ row: lineNum, message: "Custo inválido", severity: "error" });
        return;
      }
      if (price === null || price < 0) {
        issues.push({ row: lineNum, message: "Preço inválido", severity: "error" });
        return;
      }
      if (minStock === null || minStock < 0) {
        issues.push({
          row: lineNum,
          message: "Estoque mínimo inválido",
          severity: "error",
        });
        return;
      }

      let supplierId: string | null = null;
      if (supplierRaw) {
        const sid = supplierMap.get(supplierRaw.toLowerCase().trim());
        if (sid) {
          supplierId = sid;
        } else {
          issues.push({
            row: lineNum,
            message: `Fornecedor não encontrado: "${supplierRaw}" (será importado sem fornecedor)`,
            severity: "warning",
          });
        }
      }

      valid.push({
        sku,
        name,
        barcode: barcode || null,
        category: category || null,
        description: description || null,
        unit,
        cost_price: cost,
        sale_price: price,
        min_stock: minStock,
        initial_stock: initialStock ?? 0,
        supplier_id: supplierId,
        active: isActive,
      });
    });

    return { valid, issues };
  };

  const performImport = async (
    items: ProductRow[],
    onProgress: (done: number, total: number) => void,
  ) => {
    const errors: ImportIssue[] = [];
    let inserted = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { initial_stock, ...productData } = item;

      try {
        const product = await createProduct(productData);
        inserted++;
        if (initial_stock > 0) {
          try {
            await createStockMovement({
              product_id: product.id,
              product_name: product.name,
              type: "adjustment",
              quantity: initial_stock,
              origin: "manual",
            });
          } catch (mErr) {
            errors.push({
              row: i + 2,
              message: `Produto criado mas falha ao lançar saldo inicial: ${(mErr as Error).message}`,
              severity: "warning",
            });
          }
        }
      } catch (error) {
        errors.push({
          row: i + 2,
          message: (error as Error).message,
          severity: "error",
        });
      }
      onProgress(i + 1, items.length);
    }

    qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    return { inserted, errors };
  };

  return (
    <ImportDialog<ProductRow>
      open={open}
      onOpenChange={onOpenChange}
      title="Importar produtos"
      description="Aceita CSV/XLSX. Colunas reconhecidas: sku, nome, barcode, categoria, unidade, custo, preco, estoque_minimo, estoque_inicial, fornecedor, descricao, ativo."
      templateColumns={TEMPLATE_COLUMNS}
      templateSampleRow={TEMPLATE_SAMPLE}
      validate={validate}
      performImport={performImport}
    />
  );
}

type ProductRow = ProductInsert & { initial_stock: number };
