import { RotateCcw, WandSparkles } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsOutletContext {
  openOnboarding: () => void;
}

export default function SettingsOnboarding() {
  const { openOnboarding } = useOutletContext<SettingsOutletContext>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold">Onboarding</h2>
        <p className="text-sm text-muted-foreground">
          Reabra o assistente de configuração inicial para revisar integrações, IA e operação.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WandSparkles className="h-4 w-4 text-accent-primary" />
            Assistente inicial
          </CardTitle>
          <CardDescription>
            Use novamente o fluxo guiado para configurar ou revisar etapas da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={openOnboarding} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Abrir onboarding novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
