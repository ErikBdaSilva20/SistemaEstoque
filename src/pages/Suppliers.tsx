import { SuppliersTable } from "@/components/suppliers/SuppliersTable";

export default function Suppliers() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Fornecedores</h1>
        <p className="mt-1 text-muted-foreground">
          Cadastre fornecedores e defina prazos de entrega (lead time).
        </p>
      </div>
      <SuppliersTable />
    </div>
  );
}
