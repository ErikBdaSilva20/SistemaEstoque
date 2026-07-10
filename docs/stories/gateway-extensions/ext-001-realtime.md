# Extensão 001 — Realtime

**Substitui:** `useRealtimeSync` (Supabase Realtime).

## Motivação
Dashboards e listas atualizarem ao vivo quando outro usuário do tenant mexe (ex: gestor
aprovando PO enquanto comprador olha a lista).

## Por que é extensão (§A3)
Realtime = WebSocket persistente no gateway. Fora do `/data/:table`.

## Superfície proposta no gateway
- `WS /realtime` autenticado por sessão Better-Auth.
- Cliente subscreve a canais: `subscribe({ tables: ['produtos', 'pedidos_compra'] })`.
- Server emite `{ table, op: 'insert'|'update'|'delete', row }` filtrado pelo tenant.
- Autz: por linha, aplicando `owner_id` para papel `rep`.

## Impacto no schema
Nenhum. Trigger `NOTIFY` no Postgres se necessário (ou LISTEN via gateway).

## Impacto no template
- Hook opcional `useRealtimeSubscribe(tables[])` em `src/lib/realtime.ts`.
- Se `VITE_REALTIME_URL` presente → conecta; senão → no-op (fallback ao `refetchOnWindowFocus`).

## Secrets/config
`REALTIME_JWT_SECRET` no gateway.

## Riscos
- Custo de conexões persistentes.
- Fan-out por tenant vs global.

## Critério de aceite
- 2 abas → uma cria produto → outra vê aparecer em <500ms.
- Rep não vê linhas de outros donos.
