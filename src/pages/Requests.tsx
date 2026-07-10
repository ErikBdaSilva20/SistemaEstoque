import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchaseRequestsTable } from "@/components/requests/PurchaseRequestsTable";
import type { PurchaseRequest } from "@/hooks/usePurchaseRequests";

type Tab = "all" | PurchaseRequest["status"];

export default function Requests() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Solicitações</h1>
          <p className="mt-1 text-muted-foreground">
            Solicite compras antes de cotar ou pedir. O fluxo: PR → RFQ ou PO → entrega → estoque.
          </p>
        </div>
        <Button asChild>
          <Link to="/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova solicitação
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="draft">Rascunhos</TabsTrigger>
          <TabsTrigger value="pending_approval">Aguardando</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="converted">Convertidas</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <PurchaseRequestsTable status={tab === "all" ? undefined : tab} search={search} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
