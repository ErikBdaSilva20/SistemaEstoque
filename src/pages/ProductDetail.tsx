import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductKardex } from "@/components/products/ProductKardex";
import { ProductBatchesPanel } from "@/components/products/ProductBatchesPanel";
import { useProduct } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatBRL, formatNumber } from "@/lib/formatters";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { data: suppliers = [] } = useSuppliers(true);
  const supplier = suppliers.find((s) => s.id === product?.supplier_id);

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !product ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Produto não encontrado.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
                {!product.active && <Badge variant="secondary">Inativo</Badge>}
                {product.category && <Badge variant="outline">{product.category}</Badge>}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {product.sku}
                {product.barcode ? ` · ${product.barcode}` : ""}
              </p>
              {product.description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SmallStat label="Custo" value={formatBRL(Number(product.cost_price))} />
              <SmallStat label="Preço" value={formatBRL(Number(product.sale_price))} />
              <SmallStat
                label="Estoque mínimo"
                value={`${formatNumber(product.min_stock)} ${product.unit}`}
              />
              <SmallStat label="Fornecedor" value={supplier?.name ?? "—"} />
            </div>
          </div>

          {product.track_batches && (
            <div className="mb-6">
              <ProductBatchesPanel productId={product.id} productUnit={product.unit} />
            </div>
          )}

          <ProductKardex productId={product.id} />
        </>
      )}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  );
}
