import { Store as StoreIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { ALL_STORES } from "@/contexts/StoreContext";

/**
 * Seletor de PDV ativo no header. Some quando o usuário só acessa 1 PDV.
 * Admin ganha a opção "Todos os PDVs" (consolidação).
 */
export function StoreSwitcher() {
  const { stores, activeStoreId, setActiveStoreId, isMultiStore } = useStore();
  const { isAdmin } = useAuth();

  if (!isMultiStore) return null;

  return (
    <Select value={activeStoreId} onValueChange={setActiveStoreId}>
      <SelectTrigger
        className="h-9 w-[180px] gap-2 border-border bg-bg-base"
        aria-label="Selecionar PDV"
      >
        <StoreIcon className="h-4 w-4 shrink-0 text-text-muted" />
        <SelectValue placeholder="PDV" />
      </SelectTrigger>
      <SelectContent>
        {isAdmin && <SelectItem value={ALL_STORES}>Todos os PDVs</SelectItem>}
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
