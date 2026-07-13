# Auditoria de prontidão — v1 pronta pra deploy

> Gerada em 2026-07-13, sessão de reskin de cores + reorganização de layout +
> revisão de textos. Objetivo: checklist pra validar **diretamente no deploy
> real** (não no preview/editor local) antes de considerar a v1 pronta.
> Escopo: todo o repo, exceto `.legacy/`.

Esta auditoria **não substitui** [`../README.md`](../README.md) (o "cérebro"
do remix) — complementa. Onde os dois falarem da mesma coisa, o `README.md`
com seu Painel de Progresso (§5) é a fonte de verdade sobre o que foi
implementado; este arquivo foca no que **falta validar contra um ambiente
real** e no que **pode confundir/quebrar quem for publicar agora**.

---

## TL;DR — ordem de ataque

1. **Validar rep vs. admin/manager com contas reais** (nunca foi feito — só
   por leitura de código + preview mockado). É o item #1 do pedido original.
2. **Confirmar que `?preview=1` não funciona no domínio publicado.** Se
   funcionar, qualquer visitante pula o login.
3. **Apagar ou reescrever `DEPLOYMENT.md` e `scripts/smoke.mjs` +
   `scripts/README.md`** — os três descrevem uma arquitetura Supabase que não
   existe mais neste código. Seguir esses guias hoje **vai falhar**.
4. Os itens P2/P3 abaixo (bugs pequenos, docs desatualizados) — corrigir
   quando sobrar tempo, não bloqueiam ir ao ar.

---

## 1. Login e separação rep / admin-manager

### O que está implementado (verifiquei lendo o código, bate com `stories/v1/021-papeis-rep-gerente.md`)

- Login/cadastro via Better-Auth do gateway (`src/lib/data/client.ts` →
  `auth.signIn/signUp/signOut/me()`), sem Supabase, sem auth próprio.
- 1º usuário do tenant vira `admin` automaticamente; os demais entram como
  `rep` (regra do gateway, não deste app — ver `Importantdoc.md` §B8).
- **Rotas bloqueadas pra `rep`:** `/dashboard`, `/purchases*`, `/reports`,
  `/suppliers`, `/settings/*` — `ProtectedRoute allowedRoles={["admin","manager"]}`
  em `src/App.tsx`. Tentativa de acesso direto por URL redireciona.
- **Nav filtrado:** `AppShell.tsx` só mostra ao `rep` Produtos, Venda Rápida,
  Estoque, Contagem, Vencidos. Dashboard/Compras/Relatórios/Fornecedores/
  Configurações somem do menu quando `!canManage`.
- **Produtos:** `rep` cadastra produto novo, mas não vê "Editar"/"Excluir" no
  menu da tabela, nem o campo de custo no formulário (`ProductBasicFields`
  usa prop `showCost` = `canManage`). Exportar XLSX omite a coluna `custo`
  pra quem não é `canManage`.
- **Vencidos (`/expiring`):** tela própria pro `rep` ver lotes vencendo sem
  precisar de acesso ao Dashboard/Relatórios inteiros.
- `npm run build`, `npx tsc --noEmit`, `npm run lint` — limpos (reconferido
  nesta sessão).

### O que NUNCA foi validado (isto é o item #1 pra testar no deploy real)

A própria story 021 registra isto explicitamente na seção "Completion Notes":
> "Não foi possível validar visualmente em navegador com login real
> rep/admin... Recomenda-se validação manual com contas reais rep e
> admin/manager antes de finalizar a review."

Status da story: **`review`**, não `done`. Toda a separação de acesso foi
verificada **só por leitura de código** — nunca contra um `tenant-gateway`
real com duas contas de verdade.

**Como testar no deploy:**

- [ ] Criar a 1ª conta (vira `admin` automaticamente) — confirmar que ela vê
      tudo (Dashboard, Compras, Relatórios, Fornecedores, Configurações).
- [ ] Criar uma 2ª conta com email diferente (vira `rep` automaticamente) —
      confirmar que ela só vê Produtos, Venda Rápida, Estoque, Contagem,
      Vencidos no menu.
- [ ] Logada como `rep`, tentar acessar `/dashboard`, `/purchases`,
      `/reports`, `/suppliers`, `/settings` **direto pela URL** — deve
      redirecionar, não mostrar a tela.
- [ ] Logada como `rep`, cadastrar um produto novo — confirmar que o campo
      "Custo (R$)" não aparece no formulário, e que a linha criada não tem
      "Editar"/"Excluir" no menu de ações.
- [ ] Exportar produtos como `rep` — abrir o XLSX e confirmar que a coluna
      `custo` não está lá.
- [ ] **Não existe hoje um jeito de promover um `rep` pra `manager`** dentro
      do app (nem documentado no `Importantdoc.md`) — só `admin`/`rep` têm
      atribuição automática. Se precisar de um `manager` de verdade, isso é
      feito direto no Better-Auth do gateway, fora deste app. Confirmar com
      quem administra o gateway como fazer isso antes de precisar na prática.

### Cuidado ao testar: preview mode mente sobre o papel

Se você testar pelo **editor/preview do hub** (Sandpack, `?preview=1`), o
usuário e o papel são sempre **fixos/fake** — só mudam se você adicionar
`?previewRole=rep` (ou `manager`/`admin`) na URL manualmente. Isso não é uma
sessão real, é um mock em memória (`src/lib/data/preview-fixtures.ts`). Já
vi esse exato mal-entendido acontecer nesse projeto antes (registrado na
própria story 021) — **só o teste contra o domínio publicado com gateway
real conta** pra validar isto de verdade.

---

## 2. `?preview=1` e o mock de dados — confirmar que não vaza pro domínio publicado

`index.html` tem este script **sem nenhum gate de ambiente** (não checa
`import.meta.env.DEV`, roda em qualquer build, inclusive produção):

```html
<script>
  if (new URLSearchParams(location.search).get("preview") === "1") {
    window.__MASI_PREVIEW__ = true;
  }
</script>
```

Quando `window.__MASI_PREVIEW__` é `true`, **todo** acesso a dado/auth
(`src/lib/data/client.ts`) desvia pro mock local em
`src/lib/data/preview-fixtures.ts` — login vira automático (usuário fake,
papel escolhido por `?previewRole=`), e os dados viram um `Map` em memória
(não é o banco real, não persiste, não vaza dado real do tenant).

**O risco não é vazamento de dado real** (o mock não toca no banco de
verdade) — é isto: **qualquer pessoa que abrir
`https://seudominio.com/dashboard?preview=1&previewRole=admin` pula a tela
de login inteira** e cai direto numa versão "logada como admin" do app,
mesmo sem credencial nenhuma. Pra uma v1 que vai pra cliente, isso é
estranho de acontecer no domínio final — mesmo sendo só uma casca com dado
fake, dá a impressão de que o login não protege nada.

`src/lib/data/client.ts` e `preview-fixtures.ts` estão marcados como
**`protect`** no `masi.template.json` (não editáveis por story de feature —
são contrato com o hub). Ou seja, **isto não é algo pra eu corrigir
sozinho aqui**: é uma pergunta pra quem mantém o hub/`tenant-gateway`:

- [ ] Confirmar se o pipeline de publish (Cloudflare, por trás do hub) serve
      um `index.html` diferente (sem esse script) no domínio final do
      cliente, ou se `?preview=1` funciona lá também.
- [ ] Se funcionar no domínio final, decidir com o time da Masia se isso é
      aceitável (é assim que o hub embute preview em iframe?) ou se precisa
      de um gate adicional (ex: checar `window.self !== window.top`, ou uma
      env var de build).

### Mesmo arquivo, mesmo risco: `?gw=` e `?t=` sobrescrevem o gateway via URL

Em `readConfig()` (`client.ts`), a URL do gateway e o tenant ID podem vir de
query params (`?gw=...&t=...`), com prioridade sobre a env var
`VITE_GATEWAY_URL`. Isso é provavelmente **intencional** — é assim que o hub
deve injetar o gateway certo durante o preview/embed antes do domínio custom
existir — mas vale a mesma pergunta: no domínio final publicado, esse
override continua ativo? Se sim, um link malicioso tipo
`seudominio.com/dashboard?gw=https://outro-lugar.com` faria o app mandar
requests (com `credentials: "include"`, ou seja, com cookies) pra um host
arbitrário. Mesma recomendação: confirmar com quem mantém o hub.

---

## 3. Documentação e scripts que descrevem uma arquitetura que não existe mais

O projeto passou por uma reescrita completa (Supabase direto + Edge
Functions + RLS → `tenant-gateway` + Better-Auth + `db` genérico — ver
`docs/audit/P0-bloqueadores.md`). O código foi migrado, mas **três arquivos
fora de `docs/` não foram atualizados** e hoje **mentem sobre como o
projeto funciona**:

### `DEPLOYMENT.md` (raiz) — guia de deploy inteiro pra arquitetura errada

Manda criar projeto Supabase, aplicar migrations com enums que não existem
(`app_role`, `purchase_order_status` como enum nativo — o schema real usa
`text ... check (...)`), fazer deploy de **13 Edge Functions que não
existem no repo** (`supabase/functions/` nem existe), configurar Vault,
Lovable Cloud, integrações (WhatsApp/Email/Shopify/Bling/IA) que não têm
tela nenhuma no app atual. Também referencia
`src/integrations/supabase/client.ts`, que **não existe** — a pasta
`src/integrations/` foi apagada faz tempo.

**Seguir este guia hoje não funciona.** Precisa ser reescrito do zero
descrevendo o fluxo real (`tenant-gateway` + Neon + Better-Auth, ver
`Importantdoc.md` §B e `docs/architecture/`), ou apagado até existir um
guia atualizado.

- [ ] Reescrever ou remover `DEPLOYMENT.md`.

### `scripts/smoke.mjs` + `scripts/README.md` — smoke test morto

`smoke.mjs` importa `@supabase/supabase-js`, que **não está no
`package.json`** — rodar `npm run smoke` falha na primeira linha com
"module not found". O script testa RPCs (`recalc_stock`,
`next_purchase_order_code` como RPC, `close_count_session`), 19 tabelas +
uma view `v_expiring_batches`, 5 Edge Functions específicas, e uma tela
`/settings/health` que **não existe** no app atual (removida
explicitamente na story 016 — "Fora de escopo: Health... DESCARTADAS").

- [ ] Apagar `scripts/smoke.mjs` e `scripts/README.md`, ou escrever um smoke
      test novo contra o `db`/`auth` reais do gateway (equivalente ao que
      esses arquivos tentavam fazer, mas pro contrato atual).
- [ ] Se apagar, remover também o script `"smoke"` de `package.json`.

### Não existe `README.md` na raiz do repo

Só existe `docs/README.md` (o "cérebro" interno de execução do remix — ele
mesmo se descreve como documento de trabalho pra IA/dev, não como
apresentação do projeto). Um README de raiz normal (o que aparece no
GitHub/npm, "o que é isto, como rodar") não existe. Isso já está registrado
como pendência no Bloco F do `docs/README.md` (linha "README deste projeto
(raiz, não este) reescrito para o template").

- [ ] Escrever `README.md` na raiz: o que é o app, como rodar localmente
      (Docker + `npm run dev` + `npm run dev:gateway`, documentado nesta
      sessão), como fazer deploy (depois de resolver o item do
      `DEPLOYMENT.md` acima).

### `THIRD_PARTY.md` — descrição da paleta desatualizada

Ainda descreve "paleta navy + indigo + neutros quentes" herdada do template
Viver de IA original — mas nesta sessão a paleta inteira foi trocada pra
verde/ciano (ver `DESIGN.md` em
`_bmad-output/planning-artifacts/ux-designs/`). A atribuição de origem
(Viver de IA, tipografia, `lp-*`, `ScrollReveal`) continua correta — só a
descrição de cores ficou velha.

- [ ] Atualizar o parágrafo de paleta em `THIRD_PARTY.md` pra refletir a
      reskin verde/ciano (tokens em `src/styles.css`).

---

## 4. Bugs pequenos encontrados e já corrigidos nesta sessão

Registro rápido pro changelog/commit da branch nova:

- **`LocationsPanel.tsx`** mostrava o tipo de local em inglês cru
  (`warehouse`, `store`...) em vez de traduzido — o mapa de labels usava
  chaves em português (`deposito`, `loja`...) que nunca batiam com o que o
  formulário realmente grava (`warehouse`, `store`, `vehicle`, `other`).
  Corrigido.
- **Status de Pedido de Compra** tinha 3 textos diferentes pro mesmo status
  espalhados em `Dashboard.tsx`, `PurchasesTable.tsx` e
  `PurchaseOrderDetail.tsx` (ex: "Aguarda aprovação" / "Aguardando
  aprovação" / "Pendente aprovação"), "Rejeitado" nem aparecia como opção
  no filtro, e "Cancelado" tinha cor diferente em lugares diferentes.
  Centralizado em `src/lib/purchase-order-status.ts`.
- Botão/toasts "Enviar ao fornecedor" davam a entender que o sistema
  manda algo pro fornecedor de verdade — confirmado no código que é só uma
  troca de status interna (`PATCH` em `purchase_orders`, sem email/API/
  webhook). Textos trocados pra "Marcar como enviado".
- Texto "vence em Xd" em `/expiring` (âmbar 10px sobre fundo já amarelado)
  tinha contraste baixo — trocado pra `text-xs` + `text-primary` (verde da
  marca, mais legível).
- "Motivos de movimento" removido das Configurações (o hook/dado
  continuam existindo pra Estoque, só a tela de administração saiu).

## 5. Débitos já conhecidos (registrados em `docs/README.md`, só resumindo aqui)

- **Equipe (`/settings/team`) nunca vai listar ninguém** — o contrato do
  gateway não expõe um endpoint de listagem de membros de tenant, só
  `auth.me()` do usuário logado. Isso é deliberado (story 016), não bug.
  Decisão pendente: manter o placeholder, tirar do menu, ou pedir o
  endpoint pro time do gateway (já discutimos as opções numa sessão
  anterior).
- Import CSV/XLSX de produtos/fornecedores existe e está ligado, mas não
  foi verificado com lotes grandes (~1000 linhas) — risco de travar a UI
  sem barra de progresso.
- Cobertura de teste é só `lib/*` (formatters, cnpj, reports,
  data-table-utils) — 36 testes, todos passando. Zero teste de componente
  não-trivial, zero Playwright, zero CI (`.github/workflows/`) — decisão
  consciente do usuário, registrada no README.
- `MovementFormDialog.tsx` (640 linhas) e `AnimatedAuthForm.tsx` (512
  linhas) ainda não foram avaliados pra split (critério do projeto: só vale
  separar quando há responsabilidades misturadas, não só por tamanho).
- Chunk único de produção em 2.2MB (aviso do `vite build`) — funciona, mas
  vale `manualChunks`/`dynamic import` se o carregamento inicial incomodar.

---

## 6. Checklist final consolidado

- [ ] Testar rep vs. admin com 2 contas reais no deploy (seção 1)
- [ ] Confirmar `?preview=1` inerte no domínio publicado (seção 2)
- [ ] Confirmar `?gw=`/`?t=` não sobrescrevem em produção (seção 2)
- [ ] Reescrever/remover `DEPLOYMENT.md` (seção 3)
- [ ] Remover/reescrever `scripts/smoke.mjs` + `scripts/README.md` (seção 3)
- [ ] Escrever `README.md` de raiz (seção 3)
- [ ] Atualizar paleta em `THIRD_PARTY.md` (seção 3)
- [ ] Decidir o destino de "Equipe" em Settings (seção 5)
- [ ] `npm run build && npx tsc --noEmit && npm run lint && npm test` —
      todos limpos nesta sessão, reconferir depois de qualquer mudança da
      seção 3
