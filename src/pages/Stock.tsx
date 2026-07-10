import { MovementsTable } from "@/components/stock/MovementsTable";
import { StockKpiCards } from "@/components/stock/StockKpiCards";

export default function Stock() {
  return (
    <div className="mx-auto w-full max-w-content space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Estoque</h1>
        <p className="mt-1 text-muted-foreground">
          Histórico de entradas, saídas, ajustes e transferências.
        </p>
      </div>

      <StockKpiCards />

      <MovementsTable />
    </div>
  );
}
