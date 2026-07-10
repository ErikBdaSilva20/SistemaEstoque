# 🧠 Cérebro do Remix — Guia Único de Execução

> **Propósito deste arquivo.** Este é o **único documento** que uma IA (ou humano
> novo no projeto) precisa ler para saber:
>
> 1. **O que** estamos construindo.
> 2. **Por que** estamos reescrevendo (contrato do hub Masia).
> 3. **Como** está organizado o trabalho (blocos → stories).
> 4. **Onde paramos agora** (checklist vivo, atualizado a cada story concluído).
> 5. **Quais regras de qualidade** todo código precisa respeitar.
>
> **Regra dura:** ao concluir qualquer bloco/story, **atualize os checkboxes
> deste arquivo na mesma tarefa**. Se este README estiver desatualizado, o
> "cérebro" está corrompido e a próxima IA vai tomar decisão errada.
>
> Os demais arquivos em `docs/` são **anexos técnicos**: só abra quando este
> README te mandar (via link explícito). Nunca ande na pasta procurando
> contexto solto.

---

## 0. TL;DR (leia isto primeiro, sempre)

- **Projeto:** template de gestão de compras/estoque para o hub de clones da Masia.
- **Estado atual:** SPA React 18 + Vite 5 + Supabase (client) + 14 edge functions
  - TanStack Start. **Nada disso sobrevive ao remix.**
- **Estado alvo:** SPA React 19 + Vite 6 + `tenant-gateway` (Better-Auth + Neon +
  `db` genérico). Sem RLS, sem edge functions no repo, sem realtime no v1.
- **Contrato oficial:** [`reference/Importantdoc.md`](./reference/Importantdoc.md).
  Se algo neste README conflitar com ele, o Importantdoc vence.
- **Onde estamos:** ver §5 — Painel de Progresso.

---

## 1. Padrões de Qualidade (NÃO-NEGOCIÁVEIS)

Todo código escrito neste projeto — sem exceção — segue os padrões abaixo.
Uma IA que gerar código sem cumprir isso está errada e o PR deve ser rejeitado.

### 1.1 Idioma

- **Código em inglês** (nomes de variáveis, funções, componentes, tipos, arquivos,
  comentários de código). Isso vale mesmo que outros docs deste projeto
  (ex: ADR-010 em `architecture/05-decisoes.md`) estejam em pt-BR — pt-BR
  ali é sobre domínio/UI/docs, não sobre código.
  - Exceção: nomes de **entidades de domínio** ficam em pt-BR quando o negócio
    fala pt-BR (`produtos`, `fornecedores`, `pedidos_compra`). Tabelas do banco
    seguem essa convenção — está no Importantdoc §B4.
- **UI em pt-BR.**

> ⚠️ Se você é uma IA gerando código para este projeto: "pt-BR" nunca significa
> traduzir variáveis, funções, componentes ou tipos genéricos para português.
> Só nomes de entidade de domínio (tabelas/colunas do banco e seus equivalentes
> no código) e textos visíveis ao usuário (UI) ficam em pt-BR.

### 1.2 Arquitetura

- **Camadas explícitas:**
  ```
  screens/          ← rotas + composição de features (finas, sem lógica de dados)
  features/<x>/     ← lógica de negócio por domínio (hooks, componentes, repo)
  lib/data/         ← acesso ao gateway (PROTEGIDO, vem do scaffold)
  lib/               ← utilities puros (formatters, cnpj, validators)
  components/ui/    ← shadcn (PROTEGIDO)
  ```
- **Um domínio, uma pasta.** `features/produtos/` contém tudo de produto:
  hook (`useProdutos`), repo (`produtos.repo.ts`), componentes de produto,
  tipos de produto. Nada de espalhar em 4 pastas diferentes.
- **Repo = única porta para o `db`.** Componentes/hooks **nunca** chamam
  `db.table(...)` direto. Sempre via `features/<x>/<x>.repo.ts`.
- **Hooks React Query** ficam ao lado do repo. Um hook por operação-chave
  (`useProdutosList`, `useProdutoCreate`). Sem hook mega-monolítico que faz tudo.

### 1.3 Reutilização (mata "vibe coding")

Antes de criar um componente/util, **procure**:

- Formatação de dinheiro, data, quantidade → `lib/formatters.ts` (existe, mantém).
- Validação de CNPJ → `lib/cnpj.ts` (existe, mantém).
- Diálogo de formulário com header/footer padrão → `components/forms/FormDialog.tsx` +
  `components/forms/fields/*` (Text/Textarea/Number/Select/Date/Checkbox).
- Tabela paginada com busca/ordenação → `components/data/DataTable.tsx`.
- Estados de carregamento/erro/vazio → `components/feedback/*`.
- Toast de sucesso/erro → `lib/toast.ts` (`toastSuccess`/`toastError`).
- **Nunca copie-e-cole** um formulário/tabela para variar 2 campos. Extraia.

### 1.4 Erros clássicos de app "vibecodado" — proibidos

| Sintoma                                                                            | Regra                                                                                                                                   |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Componente com 800+ linhas fazendo fetch + render + form + modal                   | Máx **450 linhas** por arquivo. Quebra em subcomponentes. (Nota: Só vale apena quando temos muitas responsabilidades diferentes juntas) |
| `any` espalhado, `@ts-ignore`, `// eslint-disable` sem justificativa em comentário | Proibido. TS strict ligado.                                                                                                             |
| `useEffect` fazendo fetch manual em vez de React Query                             | Proibido. Todo I/O → hook do React Query.                                                                                               |
| Estado global no `Context` para dado que veio de query                             | Proibido. Cache de servidor = React Query. Context só para sessão/UI.                                                                   |
| Lógica de negócio dentro de JSX (`{items.filter(...).map(...).reduce(...)}`)       | Extraia para função nomeada acima do `return`.                                                                                          |
| Toast de erro genérico ("Algo deu errado")                                         | Toast sempre com mensagem útil. Erro do gateway tem `.message` — use.                                                                   |
| Nome mentiroso (`handleClick` que abre modal)                                      | Nome descreve o efeito: `openEditDialog`.                                                                                               |
| Import não usado / variável não usada                                              | Build quebra (`noUnusedLocals`). Zero tolerância.                                                                                       |
| Números mágicos (`if (qty > 5000)`)                                                | Constante nomeada em `features/<x>/constants.ts`.                                                                                       |
| CSS inline com cores hex                                                           | Só tokens semânticos do design system (Viver de IA).                                                                                    |

### 1.5 Comentários

- **Não comente o óbvio** (`// incrementa i`).
- **Comente o "por quê"** quando a decisão não é óbvia: contorno de bug,
  regra de negócio, razão de uma denormalização, âncora ao Importantdoc.
- Todo **repo** começa com um comentário-cabeçalho de 3–5 linhas: o que
  gerencia, qual tabela, quais regras do Importantdoc aplica.
- Toda **função pública com regra de negócio** tem docstring pt-BR.

Exemplo do padrão esperado:

```ts
// Repo de Pedidos de Compra.
// Tabela: pedidos_compra (+ pedidos_compra_itens).
// Regras: §B4.1 (owner_id em itens), §B5 (denormaliza fornecedor_nome).
// Não faz join — busca fornecedor separado quando a tela precisa.

export const listPedidosCompra = () => db.table<PedidoCompra>("pedidos_compra").list();
```

### 1.6 Testes

- Utils puros (`lib/*`) → **teste obrigatório** (vitest).
- Repos → smoke test com mock do `db` (só o "chama a tabela certa").
- Componentes → só se tiver lógica não-trivial. UI pura não precisa.

### 1.7 Definition of Done padrão

Todo story herda automaticamente:

- [ ] `npm run build` limpo.
- [ ] `npm run lint` limpo.
- [ ] `npm test` passa (se mexeu em utils).
- [ ] Zero imports não usados, zero `any` sem justificativa.
- [ ] Zero menção a `@supabase/*`, `@tanstack/react-start`, `supabase.functions.invoke`.
- [ ] Zero menção a `owner_id` no front (nem em create, nem em update).
- [ ] Este README atualizado (checkbox do story marcado em §5).

---

## 2. Regra de Separação: v1 vs. Gateway Extensions

Isto é o que **mais confunde** uma IA nova. Grave:

- **v1** = tudo que roda 100% no front chamando `db` e `auth` genéricos do
  scaffold. É o **único** escopo do remix atual.
- **Gateway Extensions (Onda 2)** = qualquer coisa que precise de: realtime,
  webhook, edge function, storage/upload, integração externa (Shopify, Bling,
  WhatsApp, Email, OpenAI), cron, IA. **Nada disso entra no v1.** Cada uma tem
  seu arquivo em `stories/gateway-extensions/` só como memória — a
  implementação é feita no repositório `tenant-gateway`, não aqui.

Se um story v1 estiver descrevendo webhook/realtime/edge/IA/etc., ele está
**errado** — mova para uma extensão.

---

## 3. Plano de Execução — 6 Blocos de Foco

O remix é feito em **6 blocos sequenciais**. Cada bloco tem foco único, peso
estimado (🟢 fácil / 🟡 médio / 🔴 pesado) e um portão de saída (não avance
sem cumprir).

```text
BLOCO A  Fundação           🔴 pesado    stories 001–005
   │
BLOCO B  Design System +    🟡 médio     story 002 + primitives compartilhadas
   │      Primitivas
   │
BLOCO C  Cadastros Base     🟡 médio     stories 006, 007, 016 (parcial)
   │
BLOCO D  Fluxo de Compra    🔴 pesado    stories 008, 009, 010, 011, 012
   │
BLOCO E  Inventário +       🟡 médio     stories 013, 014, 015
   │      Relatórios +
   │      Dashboard
   │
BLOCO F  Polimento          🟢 fácil     stories 016 (fim), 017, 018, 019
          (config, csv,
           print, testes)
```

### Bloco A — Fundação 🔴

**Objetivo:** Trocar o esqueleto. No fim do bloco, `npm run build` passa com
o scaffold `wiki` no lugar, `db` e `auth` funcionando contra um gateway local,
schema aplicado no Neon.

Stories:

- `001-bootstrap-stack.md` — scaffold wiki, remover Supabase/TanStack Start.
- `002-design-system-atelier.md` — só a base de tokens; primitives ficam no Bloco B.
- `003-camada-dados-db.md` — `db` + React Query.
- `004-auth-tenant-gateway.md` — Better-Auth via gateway.
- `005-schema-migracao-inicial.md` — `0001_business_schema.sql` completo.

**Portão de saída:** login funciona, `db.table('produtos').list()` retorna `[]`
sem erro, build limpo, zero import de Supabase.

### Bloco B — Design System + Primitivas 🟡

**Objetivo:** componentes reutilizáveis que os CRUDs dos blocos C/D/E usam.

Entregas (não são stories separados — parte do 002 + adendos):

- `components/forms/FormDialog.tsx` — wrapper padrão de dialog+form.
- `components/data/DataTable.tsx` — tabela paginada + busca + ordenação.
- `components/forms/fields/*` — inputs padronizados (Text, Textarea, Number, Select, Date, Checkbox).
- `components/feedback/*` — EmptyState, ErrorState, LoadingState.
- `lib/toast.ts` — helpers `toastSuccess/toastError` já lendo `.message` do erro.

**Portão de saída:** primitivas em uso real nos formulários/tabelas do Bloco C (não um
exemplo descartável — religar direto nos CRUDs reais vale mais).

### Bloco C — Cadastros Base 🟡

Stories: `006` (produtos), `007` (fornecedores), `016` parcial (locais).

**Portão:** CRUD completo dos 3, usando as primitivas do Bloco B.

### Bloco D — Fluxo de Compra 🔴

Stories: `008` (movimentações), `011` (Pedido de Compra), `012` (recebimento + kardex).
**Redesenho:** `009` (Purchase Request) e `010` (RFQ/Cotação) foram fundidos num único
"Pedido de Compra" — sem conversão automática entre entidades, sem comparação de cotações
de múltiplos fornecedores. Motivo: aproximar do CRUD genérico que o Importantdoc pede (a
maior parte do código de PR/RFQ era orquestração — conversão, motor de regras nunca lido de
verdade, 2 fluxos de recebimento paralelos — não CRUD). Aprovação de pedido acima de um valor
configurável (`purchase_rules.approval_min_amount`) fica direto no detalhe do pedido
(botões Aprovar/Rejeitar), sem página de aprovações separada.

**Portão:** criar Pedido → (se acima do limite) aprovar → enviar → receber (parcial/total)
fecha ponta a ponta, kardex reflete.

### Bloco E — Inventário, Relatórios, Dashboard 🟡

Stories: `013` (contagens), `014` (ABC/turnover), `015` (dashboard).
Leitura pesada. Trabalho é bom SQL do lado do repo (agregações no cliente
via list-then-reduce, sem RPC).

**Portão:** dashboard carrega em <1s com 5k produtos mockados.

### Bloco F — Polimento 🟢

Stories: `016` (fim das configs), `017` (import/export CSV), `018` (print/etiquetas),
`019` (testes + qualidade). Fecha a régua de qualidade e deixa pronto para
virar template do hub. Revisar `THIRD_PARTY.md` (na raiz) — atualizar entradas
se algum asset/markup novo foi copiado durante os blocos anteriores.

**Portão:** `masi.template.json` finalizado, screenshots atualizadas, README
deste projeto (raiz, não este) reescrito para o template, `THIRD_PARTY.md`
revisado.

---

## 4. Como executar um story (fluxo por sessão de IA)

1. **Abrir este README** e ver §5 — Painel de Progresso. Escolher o próximo
   story em aberto do bloco corrente.
2. **Abrir só dois arquivos**: o story escolhido em `stories/v1/NNN-*.md` e
   (se citado) o item de auditoria referenciado.
3. **Verificar dependências** (campo "Depende de" no story). Se algum não
   estiver marcado em §5, parar e fazer o de trás primeiro.
4. **Implementar** respeitando §1 (Qualidade).
5. **Rodar DoD** do story + DoD padrão.
6. **Atualizar §5** deste arquivo — marcar checkbox e, se sobrou débito, deixar
   registrado na própria linha do item (sem criar seção de notas separada).
7. Commit.

---

## 5. Painel de Progresso (fonte da verdade)

> **Atualize esta seção ao final de cada story.** Se ela mentir, a próxima
> sessão vai refazer coisa ou pular etapa.

**Status geral:** 🏗️ Implementação **em andamento**
**Bloco corrente:** A/B/C/D/E estruturalmente prontos — falta validação E2E contra gateway real
(bloqueada neste ambiente) e o Bloco F (testes automatizados, CI, polimento final).

### Bloco A — Fundação 🔴

- [x] 001 · Bootstrap da stack — adaptado (sem scaffold `wiki`/gateway reais disponíveis)
- [x] 002 · Design system — tokens já existentes mantidos
- [x] 003 · Camada de dados `db` + React Query
- [x] 004 · Auth via Better-Auth do gateway
- [x] 005 · Schema inicial (`0001_business_schema.sql`)
- [ ] **Portão A:** `npm run build`, `npx tsc --noEmit` e `npm run lint` limpos. Falta só:
      login/`db` validados contra um `tenant-gateway` real (bloqueado — sem gateway disponível
      neste ambiente).

### Bloco B — Design System + Primitivas 🟡

- [x] `FormDialog` primitive (`components/forms/FormDialog.tsx`)
- [x] `DataTable` primitive (`components/data/DataTable.tsx`)
- [x] Fields padronizados (`components/forms/fields/{Text,Textarea,Number,Select,Date,Checkbox}Field.tsx`)
- [x] Feedback states (`components/feedback/{EmptyState,ErrorState,LoadingState}.tsx`)
- [x] `lib/toast.ts` (`toastSuccess`/`toastError`)
- [x] **Portão B:** primitivas em uso real nos formulários/tabelas de produtos, fornecedores e
      locais (Bloco C)

### Bloco C — Cadastros Base 🟡

- [x] 006 · Produtos CRUD — completo (tabela, form, lotes, kardex)
- [x] 007 · Fornecedores CRUD — completo
- [x] 016 parcial · Locais de estoque — completo
- [x] **Portão C:** telas fechadas, usando as primitivas do Bloco B

### Bloco D — Fluxo de Compra 🔴

- [x] 008 · Movimentações de estoque — inclui leitura de código de barras (câmera, em
      `ScanMovementDialog`) e tela de Venda Rápida (`/quick-sale`, leitor USB/Bluetooth em modo
      teclado) pra baixa em lote no balcão; ambos cadastram produto novo na hora se o código
      escaneado não bater com nada
- [x] 009/010 · **Supersedidos** — PR e RFQ fundidos em Pedido de Compra único (ver §3)
- [x] 011 · Pedido de Compra — form, lista, detalhe, impressão, aprovação por valor
      configurável (direto no detalhe, sem página separada)
- [x] 012 · Recebimento + Kardex — um único fluxo de recebimento, kardex reflete as entradas
- [ ] **Portão D:** fluxo criar → aprovar → enviar → receber (parcial/total) fecha ponta a ponta
      na UI; falta validação E2E contra gateway real (mesmo bloqueio do Portão A)

### Bloco E — Inventário, Relatórios, Dashboard 🟡

- [x] 013 · Contagens de inventário — completo
- [x] 014 · Relatórios ABC + turnover — completo
- [x] 015 · Dashboard — completo
- [ ] **Portão E:** telas religadas; falta validação E2E contra gateway real (mesmo bloqueio do
      Portão A) e medir "dashboard <1s com 5k produtos" (sem dados reais pra popular o cenário)

### Bloco F — Polimento 🟢

- [x] 016 final · Configurações (Equipe/Locais/Regras de compra/Motivos de movimento)
- [ ] 017 · Import/Export CSV — import de produtos/fornecedores e export XLSX existem e estão
      ligados nas telas; não verificado: barra de progresso/sumário de erros em lotes grandes
      (~1000 linhas sem travar a UI)
- [ ] 018 · Impressão etiquetas + PO — `LabelsPrintDialog` e `PurchaseOrderPrint` existem
- [ ] 019 · Testes + qualidade — testes em `lib/cnpj.ts`, `lib/formatters.ts`, `lib/reports.ts`
      e `components/data/data-table-utils.ts`. Falta: testes de componente não-trivial,
      Playwright, `.github/workflows/ci.yml` (fora de escopo por decisão do usuário)
- [ ] 020 · Avaliar arquivos grandes caso a caso (§1.4 — só vale a pena separar quando há
      responsabilidades diferentes misturadas, não só por linha). Já avaliados/refatorados:
      `ProductFormDialog.tsx`, `PurchaseOrderDetail.tsx`. Ainda não avaliados:
      `MovementFormDialog.tsx` (640L), `AnimatedAuthForm.tsx` (512L)
- [x] 021 · Separação de acesso funcionário (rep) vs gerente (admin/manager) — implementado
      (rotas, nav, produtos, tela `/expiring`), ver `stories/v1/021-papeis-rep-gerente.md`.
      Validação manual com contas reais `rep`/`admin` ainda pendente (sem credenciais neste ambiente)
- [ ] **Portão F:** `masi.template.json` pronto, template publicável; screenshots pendentes;
      `THIRD_PARTY.md` existe, revisão final pendente

### Gateway Extensions (Onda 2 — fora do v1)

Referência apenas. Não marcar como feito no v1.

- [ ] ext-001 realtime · [ ] ext-002 storage · [ ] ext-003 sale-webhook
- [ ] ext-004 notificações · [ ] ext-005 barcode · [ ] ext-006 ai-chat
- [ ] ext-007 push-inventory · [ ] ext-008 cron

---

## 6. Índice de anexos (só abra quando for necessário)

| Precisa saber…                             | Abra                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| A regra oficial da Masia                   | [`reference/Importantdoc.md`](./reference/Importantdoc.md)                 |
| Princípios não-negociáveis (versão longa)  | [`architecture/01-principios.md`](./architecture/01-principios.md)         |
| Stack alvo (versões, pacotes)              | [`architecture/02-stack-alvo.md`](./architecture/02-stack-alvo.md)         |
| Como usar o `db` do gateway                | [`architecture/03-camada-dados.md`](./architecture/03-camada-dados.md)     |
| Modelo de domínio (tabelas)                | [`architecture/04-modelo-dominio.md`](./architecture/04-modelo-dominio.md) |
| ADRs (decisões arquiteturais)              | [`architecture/05-decisoes.md`](./architecture/05-decisoes.md)             |
| O que vai virar lixo / manter / reescrever | [`audit/README.md`](./audit/README.md)                                     |
| Auditoria por prioridade                   | `audit/P0..P3-*.md`                                                        |
| Auditoria por área do código               | `audit/by-area/*`                                                          |
| Detalhe de um story do v1                  | `stories/v1/NNN-*.md`                                                      |
| Como escrever um story novo                | [`stories/_template.md`](./stories/_template.md)                           |
| Uma extensão da Onda 2                     | `stories/gateway-extensions/ext-NNN-*.md`                                  |
| Créditos de terceiros / origem do remix    | [`../THIRD_PARTY.md`](../THIRD_PARTY.md)                                   |

---

## 7. Regras finais para IAs que abrirem este projeto

1. **Leia este arquivo inteiro** antes de tocar em qualquer coisa.
2. **Confie no §5** — é a única fonte de verdade sobre onde paramos.
3. **Não crie arquivo de "TODO" novo.** Se precisa registrar débito, deixe na
   própria linha do item em §5 — sem seção de notas separada.
4. **Não avance de bloco** sem o portão anterior marcado.
5. **Ao concluir**, atualize §5 na mesma sessão. Sem isso, a próxima IA vai
   quebrar o trabalho.
6. **Em conflito**, ordem de precedência:
   `reference/Importantdoc.md` > §1 deste README > story individual.
