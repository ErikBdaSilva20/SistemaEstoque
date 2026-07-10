import { ExpiringBatchesCard } from "@/components/dashboard/ExpiringBatchesCard";

export default function Expiring() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Vencidos</h1>
        <p className="mt-1 text-muted-foreground">
          Lotes vencidos ou próximos do vencimento nos próximos 90 dias.
        </p>
      </div>
      <ExpiringBatchesCard
        withinDays={90}
        limit={Number.MAX_SAFE_INTEGER}
        viewAllHref={null}
        hideWhenEmpty={false}
      />
    </div>
  );
}
