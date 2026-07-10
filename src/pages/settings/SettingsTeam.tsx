import { MembersTable } from "@/components/team/MembersTable";

export default function SettingsTeam() {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Equipe</h2>
      <p className="mb-6 text-sm text-muted-foreground">Gerencie membros, papéis e acesso.</p>
      <MembersTable />
    </div>
  );
}
