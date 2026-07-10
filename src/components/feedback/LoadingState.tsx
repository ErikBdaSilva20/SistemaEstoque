import { Skeleton } from "@/components/ui/skeleton";

export interface LoadingStateProps {
  rows?: number;
}

export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <div className="space-y-2 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
