import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseOrderForm } from "@/components/purchases/PurchaseOrderForm";

export default function NewPurchase() {
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/purchases">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Novo pedido de compra
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cadastre os itens e gere um rascunho. Marcar como enviado é um passo separado, feito
          depois de revisar o pedido.
        </p>
      </div>
      <PurchaseOrderForm />
    </div>
  );
}
