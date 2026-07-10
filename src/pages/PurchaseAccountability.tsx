import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseAccountability } from "@/components/purchases/PurchaseAccountability";

export default function PurchaseAccountabilityPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/purchases/${id ?? ""}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar ao pedido
          </Link>
        </Button>
      </div>
      <PurchaseAccountability orderId={id ?? ""} />
    </div>
  );
}
