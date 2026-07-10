import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteRequestForm } from "@/components/quotes/QuoteRequestForm";

export default function NewQuote() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/quotes">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Nova solicitação de orçamento
        </h1>
        <p className="mt-1 text-muted-foreground">
          Monte a lista de itens e selecione os fornecedores a cotar.
        </p>
      </div>
      <QuoteRequestForm />
    </div>
  );
}
