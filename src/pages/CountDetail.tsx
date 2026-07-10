import { useParams } from "react-router-dom";
import { CountSessionDetail } from "@/components/counts/CountSessionDetail";

export default function CountDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <CountSessionDetail id={id ?? ""} />
    </div>
  );
}
