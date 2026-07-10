import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseRequestForm } from "@/components/requests/PurchaseRequestForm";

export default function NewRequest() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/requests">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Nova solicitação</h1>
        <p className="mt-1 text-muted-foreground">
          Descreva o que precisa, prioridade e justifique. A aprovação libera a próxima etapa.
        </p>
      </div>
      <PurchaseRequestForm />
    </div>
  );
}
