import { QuickSaleCart } from "@/components/stock/QuickSaleCart";

export default function QuickSale() {
  return (
    <div className="mx-auto w-full max-w-content space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Venda Rápida</h1>
        <p className="mt-1 text-muted-foreground">
          Escaneie os produtos do balcão e finalize a venda — o estoque é baixado automaticamente.
        </p>
      </div>

      <QuickSaleCart />
    </div>
  );
}
