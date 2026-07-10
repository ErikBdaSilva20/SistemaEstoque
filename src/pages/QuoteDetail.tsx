import { useParams } from "react-router-dom";
import { QuoteRequestDetail } from "@/components/quotes/QuoteRequestDetail";

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <QuoteRequestDetail id={id ?? ""} />
    </div>
  );
}
