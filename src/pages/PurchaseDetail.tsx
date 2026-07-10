import { useParams } from "react-router-dom";
import { PurchaseOrderDetail } from "@/components/purchases/PurchaseOrderDetail";

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <PurchaseOrderDetail id={id ?? ""} />
    </div>
  );
}
