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
- Diálogo de formulário com header/footer padrão → `components/ui/dialog` +
  wrapper único `components/forms/FormDialog.tsx` (a criar no bloco B).
- Tabela paginada com busca → `components/ui/data-table.tsx` (a criar no bloco B).
- **Nunca copie-e-cole** um formulário/tabela para variar 2 campos. Extraia.

### 1.4 Erros clássicos de app "vibecodado" — proibidos

| Sintoma                                                                            | Regra                                                                 |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Componente com 800+ linhas fazendo fetch + render + form + modal                   | Máx **250 linhas** por arquivo. Quebra em subcomponentes.             |
| `any` espalhado, `@ts-ignore`, `// eslint-disable` sem justificativa em comentário | Proibido. TS strict ligado.                                           |
| `useEffect` fazendo fetch manual em vez de React Query                             | Proibido. Todo I/O → hook do React Query.                             |
| Estado global no `Context` para dado que veio de query                             | Proibido. Cache de servidor = React Query. Context só para sessão/UI. |
| Lógica de negócio dentro de JSX (`{items.filter(...).map(...).reduce(...)}`)       | Extraia para função nomeada acima do `return`.                        |
| Toast de erro genérico ("Algo deu errado")                                         | Toast sempre com mensagem útil. Erro do gateway tem `.message` — use. |
| Nome mentiroso (`handleClick` que abre modal)                                      | Nome descreve o efeito: `openEditDialog`.                             |
| Import não usado / variável não usada                                              | Build quebra (`noUnusedLocals`). Zero tolerância.                     |
| Números mágicos (`if (qty > 5000)`)                                                | Constante nomeada em `features/<x>/constants.ts`.                     |
| CSS inline com cores hex                                                           | Só tokens semânticos do design system (Viver de IA).                  |

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
- [ ] Este README atualizado (checkbox do story marcado + nota em §5).

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

**Objetivo:** criar os componentes reutilizáveis que **todos** os CRUDs vão
usar. Investir aqui poupa 40% de código nos blocos C/D/E.

Entregas (não são stories separados — parte do 002 + adendos):

- `components/forms/FormDialog.tsx` — wrapper padrão de dialog+form.
- `components/data/DataTable.tsx` — tabela paginada + busca + ordenação.
- `components/forms/fields/*` — inputs padronizados (Text, Number, Select, Date).
- `components/feedback/*` — EmptyState, ErrorState, LoadingState.
- `lib/toast.ts` — helpers `toastSuccess/toastError` já lendo `.message` do erro.

**Portão de saída:** existe um exemplo funcionando (CRUD fake de "categoria")
que usa **só** essas primitivas.

### Bloco C — Cadastros Base 🟡

Stories: `006` (produtos), `007` (fornecedores), `016` parcial (locais).
Cadastro simples é a hora de **validar** as primitivas do Bloco B. Se um
formulário aqui não usar `FormDialog`, o Bloco B está incompleto.

**Portão:** CRUD completo dos 3, com import CSV **desligado** (fica no F).

### Bloco D — Fluxo de Compra 🔴

Stories: `008` (movimentações), `009` (PR), `010` (RFQ), `011` (PO), `012`
(recebimento + kardex). Este é o coração do sistema e onde a **denormalização**
do §B5 mais aparece. Faça na ordem — cada um depende do anterior.

**Portão:** PR → RFQ → PO → recebimento fecha ponta a ponta, kardex reflete.

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
6. **Atualizar §5** deste arquivo — marcar checkbox + adicionar 1 linha em
   "Nota da sessão" com data e o que ficou de aprendizado/débito.
7. Commit.

---

## 5. Painel de Progresso (fonte da verdade)

> **Atualize esta seção ao final de cada story.** Se ela mentir, a próxima
> sessão vai refazer coisa ou pular etapa.

**Status geral:** 🏗️ Implementação **em andamento**
**Bloco corrente:** A (fechando) → C/D/E (religamento de telas em progresso)
**Última atualização:** 2026-07-09 — detalhe em `_bmad-output/implementation-artifacts/`

### Bloco A — Fundação 🔴

- [x] 001 · Bootstrap da stack — adaptado (sem scaffold `wiki`/gateway reais disponíveis)
- [x] 002 · Design system — tokens já existentes mantidos
- [x] 003 · Camada de dados `db` + React Query
- [x] 004 · Auth via Better-Auth do gateway (endpoints não validados contra gateway real)
- [x] 005 · Schema inicial (`0001_business_schema.sql`)
- [ ] **Portão A:** `npm run build`, `npx tsc --noEmit` e `npm run lint` confirmados
      limpos (2026-07-09, ver nota de sessão). Falta só: login/db testáveis contra
      gateway real (bloqueado — sem gateway disponível neste ambiente).
      Detalhe completo: `_bmad-output/implementation-artifacts/2026-07-09-story-001-bootstrap-session.md`

### Bloco B — Design System + Primitivas 🟡

- [ ] `FormDialog` primitive
- [ ] `DataTable` primitive
- [ ] Fields padronizados (`Text/Number/Select/Date`)
- [ ] Feedback states (`Empty/Error/Loading`)
- [ ] `lib/toast.ts`
- [ ] CRUD exemplo "categoria" usando só primitivas
- [ ] **Portão B:** exemplo funcionando

### Bloco C — Cadastros Base 🟡

- [x] 006 · Produtos CRUD — completo (tabela, form, lotes, kardex)
- [x] 007 · Fornecedores CRUD — completo
- [x] 016 parcial · Locais de estoque — completo
- [ ] **Portão C:** telas fechadas; falta rodar `npm run build` limpo geral (outros blocos ainda pendentes)

### Bloco D — Fluxo de Compra 🔴

- [x] 008 · Movimentações de estoque — hooks prontos, telas pendentes
- [ ] 009 · Purchase Requests — hook pronto, telas pendentes
- [ ] 010 · Cotações (RFQ) — hook pronto, telas pendentes (envio manual — ext-004 pro envio real)
- [x] 011 · Purchase Orders — detalhe/recebimento/conferência religados; impressão/form/lista pendentes
- [ ] 012 · Recebimento + Kardex — lógica portada pro front, pendente validar E2E
- [ ] **Portão D:** fluxo não fecha ponta a ponta na UI ainda; dados já portados nos hooks

### Bloco E — Inventário, Relatórios, Dashboard 🟡

- [ ] 013 · Contagens de inventário — hook pronto, telas pendentes
- [ ] 014 · Relatórios ABC + turnover — hook pronto, telas pendentes
- [x] 015 · Dashboard — completo (forecast/anomalias removidos, ADR-007)
- [ ] **Portão E:** falta religar telas de contagens e relatórios

### Bloco F — Polimento 🟢

- [ ] 016 final · Configurações restantes
- [ ] 017 · Import/Export CSV
- [ ] 018 · Impressão etiquetas + PO
- [ ] 019 · Testes + qualidade
- [ ] **Portão F:** `masi.template.json` pronto, template publicável

### Gateway Extensions (Onda 2 — fora do v1)

Referência apenas. Não marcar como feito no v1.

- [ ] ext-001 realtime · [ ] ext-002 storage · [ ] ext-003 sale-webhook
- [ ] ext-004 notificações · [ ] ext-005 barcode · [ ] ext-006 ai-chat
- [ ] ext-007 push-inventory · [ ] ext-008 cron

### Notas de sessão (append-only, mais recente no topo)

- **2026-07-09** — Correção de causa-raiz (Amelia): `npm run lint` tinha
  14.621 erros — 100% CRLF/prettier, zero bug real. Causa: `core.autocrlf=true`
  neste ambiente Windows + ausência de `.gitattributes`, então todo checkout
  vira CRLF e conflita com o `endOfLine` do Prettier. Criado `.gitattributes`
  (`* text=auto eol=lf`) na raiz e rodado `git add --renormalize .` +
  `eslint . --fix` pra normalizar o repo inteiro. Estado confirmado após:
  `npm run build` limpo, `npx tsc --noEmit` limpo, `npm run lint` com **0
  erros** (restam só 9 warnings `react-refresh`/`exhaustive-deps`: 6 em
  `components/ui/**` — shadcn protegido —, 2 em `.legacy/out-of-scope-v1/**` —
  fora do escopo v1 —, e 1 em `src/contexts/AuthContext.tsx` — export de
  contexto + provider no mesmo arquivo, padrão React comum, só afeta
  granularidade do Fast Refresh em dev; considerar separar `auth-context.ts`
  se sobrar tempo no Bloco F, não é bloqueante). Corrigido também ADR-010 em
  `architecture/05-decisoes.md`, que estava com título ambíguo ("pt-BR em
  tudo") e já tinha causado uma IA gerar código inteiro em português — agora
  o escopo pt-BR está restrito e explícito (tabela/coluna, entidade de
  domínio, UI, docs). Nenhum commit foi feito nesta sessão — mudanças ficam
  no working tree para revisão do usuário.
- **2026-07-09** — Sessão longa de implementação (Amelia): schema novo, camada
  de dados/auth/hooks 100% reescritos sobre o contrato do gateway, features
  fora do v1 movidas pra `.legacy/out-of-scope-v1/`, boa parte das telas
  religada. Build ainda não limpo. Detalhe completo, decisões e checklist de
  pendências em
  `_bmad-output/implementation-artifacts/2026-07-09-story-001-bootstrap-session.md`
  (não duplicado aqui pra não poluir este README).
- **2026-07-09** — Criado `THIRD_PARTY.md` na raiz creditando o template
  **Viver de IA** como plataforma de origem do remix, mais bibliotecas cujo
  markup foi copiado (shadcn, Radix, Tailwind, Lucide, TanStack Query, React
  Router, Framer Motion). Revisão obrigatória no Bloco F / story 019.
- **2026-07-09** — Documentação (arquitetura, auditoria, 19 stories v1, 8
  extensões) finalizada. Este README passa a ser o cérebro. Próximo passo:
  iniciar Bloco A / story 001.

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
3. **Não crie arquivo de "TODO" novo.** Se precisa registrar débito, adicione
   linha em "Notas de sessão" (§5).
4. **Não avance de bloco** sem o portão anterior marcado.
5. **Ao concluir**, atualize §5 na mesma sessão. Sem isso, a próxima IA vai
   quebrar o trabalho.
6. **Em conflito**, ordem de precedência:
   `reference/Importantdoc.md` > §1 deste README > story individual.
