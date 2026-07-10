import { ApiKeysSettings } from "@/components/api-keys/ApiKeysSettings";
import { AiUsagePanel } from "@/components/ai/AiUsagePanel";
import { RoleGate } from "@/components/auth/RoleGate";

export default function SettingsApiKeys() {
  return (
    <RoleGate allowedRoles={["admin"]}>
      <div className="space-y-8">
        <div>
          <h2 className="mb-1 text-xl font-semibold">API Keys</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Gerencie as chaves de OpenAI e Anthropic. Armazenadas com criptografia no Supabase Vault
            e usadas apenas pelo servidor (edge functions).
          </p>
          <ApiKeysSettings />
        </div>

        <div>
          <h2 className="mb-1 text-xl font-semibold">Controle de consumo de IA</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Define um teto diário de tokens por usuário e mostra o consumo das últimas 24h. Protege
            contra uso acidental de alto volume.
          </p>
          <AiUsagePanel />
        </div>
      </div>
    </RoleGate>
  );
}
