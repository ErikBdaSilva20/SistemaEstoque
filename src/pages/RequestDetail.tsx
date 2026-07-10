import { useParams } from "react-router-dom";
import { PurchaseRequestDetail } from "@/components/requests/PurchaseRequestDetail";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <PurchaseRequestDetail id={id} />
    </div>
  );
}
