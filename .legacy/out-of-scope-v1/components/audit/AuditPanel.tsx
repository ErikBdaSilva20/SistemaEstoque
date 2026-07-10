import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  CheckCircle2,
  History,
  Mail,
  MessageCircle,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invokeEdge } from "@/lib/edge-fn";
import { formatDateTime } from "@/lib/formatters";

export function AuditPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Auditoria</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico de chamadas de IA, notificações enviadas e eventos de webhooks recebidos.
        </p>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai">
            <Bot className="mr-2 h-3 w-3" />
            IA
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <MessageCircle className="mr-2 h-3 w-3" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <ShoppingBag className="mr-2 h-3 w-3" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <AiAuditTable />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTable />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AiAuditTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "ai"],
    queryFn: () =>
      invokeEdge<{ rows: unknown[] }>("admin-audit", {
        action: "list",
        kind: "ai",
        limit: 50,
      }),
  });

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Últimas 50 chamadas de IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Duração</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.rows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma chamada registrada.
                  </TableCell>
                </TableRow>
              ) : (
                (
                  data?.rows as Array<{
                    id: string;
                    created_at: string;
                    action: string;
                    model: string | null;
                    duration_ms: number | null;
                    input_tokens: number | null;
                    output_tokens: number | null;
                    error: string | null;
                  }>
                ).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.action}</TableCell>
                    <TableCell className="text-xs">{row.model ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {row.duration_ms ? `${row.duration_ms}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {(row.input_tokens ?? 0) + (row.output_tokens ?? 0)}
                    </TableCell>
                    <TableCell>
                      {row.error ? (
                        <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Erro
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-accent-success/15 text-accent-success"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "notifications"],
    queryFn: () =>
      invokeEdge<{ rows: unknown[] }>("admin-audit", {
        action: "list",
        kind: "notifications",
        limit: 50,
      }),
  });

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Últimas 50 notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.rows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma notificação registrada.
                  </TableCell>
                </TableRow>
              ) : (
                (
                  data?.rows as Array<{
                    id: string;
                    created_at: string;
                    channel: string;
                    recipient: string;
                    template: string | null;
                    status: string;
                    error: string | null;
                  }>
                ).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.channel === "whatsapp" ? (
                        <Badge
                          variant="secondary"
                          className="bg-accent-success/15 text-accent-success gap-1"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-accent-primary/15 text-accent-primary gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.recipient}</TableCell>
                    <TableCell className="text-xs">{row.template ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          row.status === "sent"
                            ? "bg-accent-success/15 text-accent-success"
                            : row.status === "failed"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WebhooksTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "webhooks"],
    queryFn: () =>
      invokeEdge<{ rows: unknown[] }>("admin-audit", {
        action: "list",
        kind: "webhooks",
        limit: 50,
      }),
  });

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-4 w-4" />
          Últimos 50 eventos de webhook
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>ID externo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.rows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nenhum evento registrado.
                  </TableCell>
                </TableRow>
              ) : (
                (
                  data?.rows as Array<{
                    id: string;
                    created_at: string;
                    provider: string;
                    external_order_id: string;
                    status: string;
                    processed_at: string | null;
                  }>
                ).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell className="text-xs">{row.provider}</TableCell>
                    <TableCell className="font-mono text-xs">{row.external_order_id}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          row.status === "processed"
                            ? "bg-accent-success/15 text-accent-success"
                            : row.status === "processed_with_errors"
                              ? "bg-warning/15 text-warning"
                              : row.status === "failed"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted text-muted-foreground"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {row.processed_at ? formatDateTime(row.processed_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
