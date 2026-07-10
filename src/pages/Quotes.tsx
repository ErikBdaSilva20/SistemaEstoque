import { QuotesTable } from "@/components/quotes/QuotesTable";

export default function Quotes() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Solicitações de orçamento
        </h1>
        <p className="mt-1 text-muted-foreground">
          Peça preço a múltiplos fornecedores, compare e converta em pedido de compra.
        </p>
      </div>
      <QuotesTable />
    </div>
  );
}
