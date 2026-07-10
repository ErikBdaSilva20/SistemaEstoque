import { useSearchParams } from "react-router-dom";
import { ProductsTable } from "@/components/products/ProductsTable";

export default function Products() {
  const [searchParams] = useSearchParams();
  const onlyLowStock = searchParams.get("onlyLowStock") === "true";

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Produtos</h1>
        <p className="mt-1 text-muted-foreground">Cadastre e acompanhe o estoque de cada item.</p>
      </div>
      <ProductsTable initialOnlyLowStock={onlyLowStock} />
    </div>
  );
}
