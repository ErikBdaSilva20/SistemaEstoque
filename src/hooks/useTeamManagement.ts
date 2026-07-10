import { useQuery } from "@tanstack/react-query";
import type { AppRole } from "@/lib/data/client";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: AppRole | null;
}

export const TEAM_QUERY_KEY = ["team-members"] as const;

// V1 mínimo (story 016): o contrato do gateway (docs/reference/Importantdoc.md
// §B8) não documenta um endpoint de listagem de membros do tenant — só
// `auth.me()` pro usuário logado. Sem esse endpoint no gateway real, esta tela
// não tem como listar a equipe; devolve lista vazia até o gateway expor
// `auth.listMembers()` (ou equivalente). Gestão de papéis é feita direto no
// gateway/Better-Auth por enquanto.
export function useTeamMembers() {
  return useQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: async (): Promise<TeamMember[]> => [],
    staleTime: 30_000,
  });
}
