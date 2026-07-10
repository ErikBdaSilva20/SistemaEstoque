import { SecuritySettings } from "@/components/security/SecuritySettings";

export default function SettingsSecurity() {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Segurança</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Configure aprovação de contas e restrição de cadastro por domínio.
      </p>
      <SecuritySettings />
    </div>
  );
}
