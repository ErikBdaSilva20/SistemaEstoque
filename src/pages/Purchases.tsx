import { PurchasesTable } from "@/components/purchases/PurchasesTable";

export default function Purchases() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Compras</h1>
        <p className="mt-1 text-muted-foreground">
          Pedidos de compra para fornecedores. Receba itens para dar entrada automática no estoque.
        </p>
      </div>
      <PurchasesTable />
    </div>
  );
}
