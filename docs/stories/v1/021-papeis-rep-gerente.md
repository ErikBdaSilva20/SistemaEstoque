---
baseline_commit: 683734cef86ca3305c0ca33b6840ef450f42fe84
---

# Story 021 — Separação de acesso: Funcionário (rep) vs Gerente (admin/manager)

**Prioridade:** P2 · **Escopo:** v1 · **Depende de:** 006, 008, 013, 015 (todos já completos)

## Objetivo

Hoje o app é quase todo aberto: qualquer usuário autenticado (`admin`, `manager` ou `rep`) acessa
praticamente tudo. Só 3 pontos já são restritos a `admin`/`manager`: `/suppliers`, `/settings/*` e
aprovar/rejeitar Pedido de Compra (dentro de `PurchaseOrderDetail.tsx`).

Esta story separa de vez em duas visões:

- **Funcionário (`rep`)** — opera o dia a dia de balcão/estoque, sem ver dados financeiros/gerenciais.
- **Gerente (`admin`/`manager`)** — acesso completo, sem mudança em relação a hoje.

## Por que isso não é extensão de gateway

O modelo de papéis (`admin`/`manager`/`rep`, 1º usuário = admin, demais = `rep` automático) já vem
pronto do Better-Auth do `tenant-gateway` — não é algo que este template cria. O Importantdoc é
explícito: **a role serve só pra UI** (esconder telas/botões); a segurança real já está no gateway.
Ou seja, esta story é 100% front-end — reaproveita o que já existe, sem tocar em schema nem pedir
nada novo ao gateway.

## Matriz de acesso alvo

| Tela / Ação                                         | Funcionário (rep)                                                 | Gerente (admin/manager)           |
| --------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| Venda Rápida (`/quick-sale`)                        | ✅ completo                                                       | ✅                                |
| Produtos — listar/ver detalhe                       | ✅                                                                | ✅                                |
| Produtos — **cadastrar** novo                       | ✅                                                                | ✅                                |
| Produtos — **editar/excluir** existente             | ❌                                                                | ✅                                |
| Estoque — movimentações manuais (`/stock`)          | ✅ completo                                                       | ✅                                |
| Contagem de inventário (`/counts`)                  | ✅ completo                                                       | ✅                                |
| Lotes vencendo (hoje é um card dentro do Dashboard) | ✅ — **só esse componente**, não o Dashboard inteiro (ver §Notas) | ✅ (dentro do Dashboard completo) |
| Dashboard completo (KPIs, valor de estoque, etc.)   | ❌                                                                | ✅                                |
| Compras (`/purchases*`)                             | ❌                                                                | ✅ (já era)                       |
| Fornecedores (`/suppliers`)                         | ❌ (já era)                                                       | ✅ (já era)                       |
| Relatórios (`/reports`)                             | ❌                                                                | ✅                                |
| Configurações (`/settings/*`)                       | ❌ (já era)                                                       | ✅ (já era)                       |
| Aprovar/rejeitar Pedido de Compra                   | ❌ (já era)                                                       | ✅ (já era)                       |

## Notas de implementação (pra próxima sessão)

### 1. Padrões já existentes — reaproveitar, não inventar

- **Gate de rota inteira:** `ProtectedRoute allowedRoles={["admin","manager"]}` já é usado em
  `src/App.tsx` (bloco de `/suppliers` + `/settings/*`). Para bloquear rotas inteiras pro rep
  (Compras, Relatórios), basta mover `/purchases*` e `/reports` pro bloco já protegido, ou criar um
  novo bloco `<Route element={<ProtectedRoute allowedRoles={["admin","manager"]} />}>` ao lado dele.
- **Gate de componente/seção:** `src/components/auth/RoleGate.tsx` já existe (usado hoje só em
  `/settings`, com fallback de redirect). Serve pra esconder uma ação dentro de uma tela que o rep
  ainda acessa (ex: os itens "Editar"/"Excluir" no menu de `ProductsTable.tsx`, sem bloquear a tela
  inteira).
- **Nav:** `src/pages/AppShell.tsx` já filtra itens de menu por `canManage` (`isAdmin || isManager`)
  — é só estender esse `canManage` pros itens que hoje aparecem pra todo mundo (Compras,
  Relatórios) e adicionar o "Dashboard completo" nessa lista também.

### 2. Produtos — criar sim, editar/excluir não

`src/components/products/ProductsTable.tsx` tem `handleEdit` (linha 86) e `handleDelete` (linha
96), disparados por itens de um `DropdownMenuItem` (linha 227 "Editar", 385 confirmação de
exclusão). Envolver esses itens do menu (não a tela toda) num `RoleGate allowedRoles={["admin",
"manager"]}` — ou mais simples, condicionar a renderização deles a `canManage` direto (mesmo padrão
do `AppShell.tsx`), já que aqui não precisa da tela de "acesso negado", só esconder a opção. O botão
"Novo produto" (que abre `ProductFormDialog` sem `product`) continua visível pra todo mundo.

### 3. "Vencidos" — extrair do Dashboard, não dar acesso ao Dashboard inteiro

O card hoje é `src/components/dashboard/ExpiringBatchesCard.tsx`, usado dentro de
`src/pages/Dashboard.tsx`. Ele já é **autocontido** (hook próprio `useExpiringBatches(30)`,
zero dependência de dado compartilhado do Dashboard) — dá pra reaproveisar direto numa tela nova
sem refatorar o componente.

**Pendência a resolver na implementação:** o card tem um link "Ver todos" apontando pra
`/reports` (linha 66) — isso não serve pro rep, que não terá acesso a Relatórios. Duas opções pra
decidir na hora de implementar: (a) remover o link "Ver todos" na versão do rep, ou (b) o hook já
suporta `withinDays` como parâmetro — criar uma tela simples que lista todos os lotes vencendo
(sem o corte de 5 + link), sem precisar de Relatórios.

Sugestão de rota nova: `/expiring` (ou reaproveitar `/products` com um filtro — mas como o pedido
foi "só esse componente", a rota dedicada é mais direta). Adicionar ao nav do rep só esse item, não
"Dashboard".

### 4. Rotas hoje abertas que precisam entrar no gate de gerente

Em `src/App.tsx`, o bloco principal (`<Route element={<ProtectedRoute />}>`, sem `allowedRoles`,
linhas ~95-106) hoje inclui `/dashboard`, `/products`, `/quick-sale`, `/stock`, `/purchases*`,
`/counts*`, `/reports`. Pra bater com a matriz acima, `/purchases*`, `/reports` e `/dashboard`
precisam sair desse bloco aberto e entrar no bloco `allowedRoles={["admin","manager"]}` (o mesmo
que já protege `/suppliers`). `/products`, `/quick-sale`, `/stock`, `/counts*` continuam abertos.

**Onde o rep cai ao logar/navegar pra uma rota bloqueada?** Hoje existem **3 redirects pra
`/dashboard`** em `src/App.tsx` que vão quebrar assim que `/dashboard` virar rota de gerente:
`ProtectedRoute` quando a role não bate (linha 74), `RootRedirect` pro usuário autenticado (linha
83), e o `fallback` do `RoleGate` de `/settings` (linha 119). Os 3 precisam apontar pra uma rota que
o rep sempre tem acesso — sugestão: `/quick-sale` ou `/products`.

### 5. Nav do rep

Em `src/pages/AppShell.tsx`, `mainNavItems` hoje lista Dashboard, Produtos, Venda Rápida, Estoque,
Compras, Contagem, Relatórios (sem filtro de role). Precisa separar: itens sempre visíveis
(Produtos, Venda Rápida, Estoque, Contagem, + o novo "Vencidos") vs. itens só-gerente (Dashboard,
Compras, Relatórios) — usando o mesmo `canManage` que já filtra `managementNavItems` hoje.

## Fora de escopo (não confundir)

- Não é permissão granular por ação em **todas** as telas — só o que está na matriz acima.
  Estoque e Contagem continuam com acesso total pro rep (nenhuma ação interna restrita).
- Não muda nada no schema, no `tenant-gateway`, nem no modelo de papéis do Better-Auth.
- Não adiciona um 4º papel nem sub-permissões customizáveis — usa só `admin`/`manager`/`rep` como já
  vêm prontos.

## Critério de aceite

- [x] Login como `rep`: vê só Produtos, Venda Rápida, Estoque, Contagem, Vencidos no nav.
- [x] `rep` tentando abrir `/dashboard`, `/purchases`, `/reports`, `/suppliers`, `/settings`
      diretamente pela URL é redirecionado, não vê a tela.
- [x] `rep` consegue cadastrar produto novo; não vê "Editar"/"Excluir" na tabela de produtos.
- [x] Tela de "Vencidos" do rep não tem link morto pra `/reports`.
- [x] Login como `admin`/`manager`: nada muda em relação ao comportamento atual.
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` limpos após a mudança.

## Dev Agent Record

### Implementation Plan

Implementado em 5 blocos, seguindo exatamente as notas de implementação da story:

1. **Rotas** (`src/App.tsx`): `/dashboard`, `/purchases*`, `/reports` movidos do bloco
   `ProtectedRoute` aberto pro bloco `allowedRoles={["admin","manager"]}` (mesmo bloco de
   `/suppliers`/`/settings`). Dos 3 redirects que apontavam pra `/dashboard`, só o fallback de role
   incorreta no `ProtectedRoute` (só dispara pro `rep`, nunca pra admin/manager) foi trocado pra
   `/quick-sale`. `RootRedirect` (rota `/`) e o fallback do `RoleGate` de `/settings` viraram
   role-aware: admin/manager continuam caindo em `/dashboard` (comportamento idêntico ao atual);
   só o `rep` cai em `/quick-sale`. Isso corrige uma primeira versão que mandava todo mundo,
   inclusive admin/manager, pra `/quick-sale` — regressão pro critério "nada muda pro admin/manager".
2. **Nav** (`src/pages/AppShell.tsx`): `mainNavItems` (sempre visível) ficou só com Produtos,
   Venda Rápida, Estoque, Contagem e o novo item Vencidos. `managementNavItems` (só quando
   `canManage`) passou a agrupar Dashboard, Compras, Relatórios, Fornecedores e Configurações —
   nenhum desses aparece mais pro `rep` (antes "Configurações" aparecia pro `rep` incondicionalmente,
   mesmo a rota já sendo bloqueada; corrigido pra bater com o critério de aceite de que o `rep` só
   vê os 5 itens).
3. **Produtos** (`src/components/products/ProductsTable.tsx`): botão "Novo produto" liberado pra
   todos (antes só `canManage`). Coluna de ações do menu agora sempre renderiza (Ativar/Desativar
   fica visível pra todos — não está na matriz de restrição), mas o item "Editar" só aparece se
   `canManage`; "Remover" continua restrito a `isAdmin` (sem mudança).
4. **Tela "Vencidos"** (`src/pages/Expiring.tsx`, nova rota `/expiring` aberta): reaproveita
   `ExpiringBatchesCard` sem refatorar o componente — o card ganhou props opcionais
   (`withinDays`, `limit`, `viewAllHref`) pra suportar tanto o uso no Dashboard (30d, top 5, link
   pra `/reports`) quanto a tela dedicada do `rep` (90d, lista completa, sem link).
5. **Verificação**: `npx tsc --noEmit` limpo, `npm run build` limpo (só warning pré-existente de
   chunk-size), `npm run lint` com 0 erros (9 warnings pré-existentes, nenhum nos arquivos tocados).

### Correções pós code-review

O `/code-review` (rodado manualmente, sem os 8 sub-agentes por limite de sessão) achou que o
critério "rep não vê Editar/Excluir" estava satisfeito na letra, mas o Objetivo da story
("sem ver dados financeiros/gerenciais") ainda vazava por dois caminhos que este diff tinha
reaberto/deixado passar:

1. **`ProductFormDialog`/`ProductBasicFields`**: liberar "Novo produto" pro `rep` também abria o
   campo "Custo (R$)" sem gate nenhum. Corrigido com prop `showCost` (default `true`), setada como
   `canManage` em `ProductFormDialog.tsx` — `rep` cria produto sem ver/setar custo (fica `0`, ajustável
   depois por quem tem `canManage`).
2. **Exportar (XLSX)**: o botão nunca foi restrito por `canManage` e a planilha incluía
   `custo: Number(p.cost_price)` incondicionalmente — vazamento pré-existente, mas no mesmo arquivo
   e mesmo tema desta story. Corrigido: a chave `custo` só entra no objeto exportado quando
   `canManage`.
3. **Tela "Vencidos"**: `ExpiringBatchesCard` sumia (`return null`) quando vazio, o que deixava
   `/expiring` em branco sem nenhum feedback pro rep. Adicionada prop `hideWhenEmpty` (default
   `true`, preserva o Dashboard) — a tela `/expiring` passa `hideWhenEmpty={false}` e mostra
   "Nenhum lote vencendo nesse período." em vez de sumir.

Revalidado após as correções: `tsc --noEmit`, `npm run build`, `npm run lint` — todos limpos.

### Investigação: contas de teste sempre com acesso total no preview

Usuário reportou que contas novas testadas no **preview/editor do hub (Sandpack)** sempre viam
todas as telas e o nome no sidebar não mudava entre contas. Causa raiz: `preview-fixtures.ts`
(mock usado quando `window.__MASI_PREVIEW__ === true`) sempre retornava o mesmo `PREVIEW_USER`
fixo com `role: "admin"` pro `/get-session`, **independente** de qual conta "logou" — não é bug
da lógica de gate implementada nesta story (rotas/nav/produtos), é comportamento do mock local
(sem gateway real por trás nesse modo). Confirmado com o usuário que o teste foi feito no preview,
não num clone publicado com gateway real.

Com aprovação explícita do usuário, editado `src/lib/data/preview-fixtures.ts` (arquivo
**protegido**, contrato com o hub) pra ler `?previewRole=rep|manager|admin` da URL do preview e
usar essa role no `/get-session` mockado — default continua `"admin"` (comportamento anterior
preservado pra quem não usa o parâmetro). Permite validar visualmente o gate de rep/gerente dentro
do próprio editor sem precisar publicar um clone real.

### Completion Notes

- Mudança 100% front-end, sem tocar em schema, gateway ou modelo de papéis, conforme "Por que isso
  não é extensão de gateway".
- Não foi possível validar visualmente em navegador com login real `rep`/`admin` (app depende de
  sessão do `tenant-gateway`, sem credenciais de teste disponíveis neste ambiente, e o modo preview
  local tem o papel fixado em `admin` nos fixtures). A verificação foi feita por leitura de código
  cruzada com cada critério de aceite, mais `tsc`/`build`/`lint` limpos. Recomenda-se validação
  manual com contas reais `rep` e `admin`/`manager` antes de finalizar a review.

## File List

- `src/App.tsx`
- `src/pages/AppShell.tsx`
- `src/components/products/ProductsTable.tsx`
- `src/components/products/ProductBasicFields.tsx`
- `src/components/products/ProductFormDialog.tsx`
- `src/components/dashboard/ExpiringBatchesCard.tsx`
- `src/pages/Expiring.tsx` (novo)
- `src/lib/data/preview-fixtures.ts` (protegido — editado com OK explícito do usuário, só toggle
  de debug `?previewRole=`)

## Change Log

- 2026-07-10: Separação de acesso rep/gerente implementada (rotas, nav, produtos, tela Vencidos).
- 2026-07-10: Code-review — corrigido vazamento de custo (`ProductBasicFields`/Exportar) e
  empty-state da tela Vencidos.

## Status

review
