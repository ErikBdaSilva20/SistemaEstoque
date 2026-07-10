import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type Store = Tables<"stores">;

// Sentinela para "Todos os PDVs" (consolidação). Em modo 'all' não filtramos
// por store_id no client — a RLS já limita aos PDVs do usuário.
export const ALL_STORES = "all" as const;
export type ActiveStore = string | typeof ALL_STORES;

const STORAGE_KEY = "active_store_id";

export interface StoreContextValue {
  stores: Store[];
  isLoading: boolean;
  /** PDV ativo: id concreto ou 'all' (consolidado). */
  activeStoreId: ActiveStore;
  setActiveStoreId: (id: ActiveStore) => void;
  /** Objeto do PDV ativo, ou null quando em 'all'. */
  activeStore: Store | null;
  isAllStores: boolean;
  /** PDV concreto para usar em INSERTs (cai no 1º acessível quando em 'all'). */
  insertStoreId: string | null;
  /** true quando o usuário acessa mais de um PDV (mostra o seletor). */
  isMultiStore: boolean;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeStoreId, setActiveStoreIdState] = useState<ActiveStore>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ActiveStore | null) ?? ALL_STORES;
  });

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["stores", "accessible"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Store[]> => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as Store[];
    },
  });

  const setActiveStoreId = useCallback((id: ActiveStore) => {
    setActiveStoreIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // Garante que o PDV ativo persistido ainda é acessível; senão, normaliza.
  useEffect(() => {
    if (isLoading || stores.length === 0) return;
    if (activeStoreId === ALL_STORES) {
      // Usuário com 1 PDV só: trava no concreto (sem opção "todos").
      if (stores.length === 1) setActiveStoreId(stores[0].id);
      return;
    }
    const exists = stores.some((s) => s.id === activeStoreId);
    if (!exists) {
      setActiveStoreId(stores.length === 1 ? stores[0].id : ALL_STORES);
    }
  }, [stores, isLoading, activeStoreId, setActiveStoreId]);

  const value = useMemo<StoreContextValue>(() => {
    const isAll = activeStoreId === ALL_STORES;
    const activeStore = isAll ? null : (stores.find((s) => s.id === activeStoreId) ?? null);
    const insertStoreId = isAll ? (stores[0]?.id ?? null) : activeStoreId;
    return {
      stores,
      isLoading,
      activeStoreId,
      setActiveStoreId,
      activeStore,
      isAllStores: isAll,
      insertStoreId,
      isMultiStore: stores.length > 1,
    };
  }, [stores, isLoading, activeStoreId, setActiveStoreId]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
