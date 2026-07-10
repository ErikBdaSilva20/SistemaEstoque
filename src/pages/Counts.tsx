import { CountSessionsTable } from "@/components/counts/CountSessionsTable";

export default function Counts() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Contagem cíclica</h1>
        <p className="mt-1 text-muted-foreground">
          Faça inventários periódicos. Diferenças viram ajustes automáticos ao fechar a sessão.
        </p>
      </div>
      <CountSessionsTable />
    </div>
  );
}
