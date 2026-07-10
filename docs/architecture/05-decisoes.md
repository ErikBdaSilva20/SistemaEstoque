# ADRs — Decisões arquiteturais

Um por decisão. Formato curto: contexto, decisão, consequência.

---

## ADR-001 — Reescrever, não adaptar

**Contexto.** O projeto atual usa Supabase (client-side + edge functions + RLS +
storage + realtime + vault). O contrato do hub proíbe todos esses.

**Decisão.** Reescrever como novo template do hub, usando o projeto atual como
**blueprint** de UX + modelo de domínio. Nenhum arquivo de `supabase/`, nenhum hook
`useX` que importa `@supabase/*`, nenhuma edge function sobrevive intacto.

**Consequência.** ~60–70% do código muda. UI e modelo de dados sobrevivem
conceitualmente. Reduz risco de contorno mal-feito de RLS/edge/realtime.

---

## ADR-002 — Scaffold `wiki` (Tailwind v4 + shadcn "Atelier")

**Contexto.** Dois scaffolds oficiais: `forms-nps` (CSS + tokens) e `wiki` (shadcn).
O projeto atual usa shadcn.

**Decisão.** Partir de `wiki`. Migrar os tokens "Viver de IA" para `src/app.css` por
cima do "Atelier".

**Consequência.** Continuidade visual. `src/components/ui/**` e `src/lib/utils.ts`
ficam no `protect` do manifest.

---

## ADR-003 — Sem `stores`. Tenancy = 1 Neon por cliente.

**Contexto.** O projeto atual tem `stores` (PDVs) e um `StoreContext` com switcher
"Todos os PDVs". Isso foi um substituto para tenancy dentro do Supabase compartilhado.

**Decisão.** No template do hub, cada cliente tem seu Neon. `stores` some. Se um
cliente futuramente precisar de múltiplos PDVs dentro do mesmo tenant, criamos uma
tabela `pdvs` com `owner_id` — mas isso é decisão do cliente, não do template.

**Consequência.** `StoreContext`, `StoreSwitcher`, hook `useStores`, coluna
`store_id` em toda tabela: **removidos**. Simplifica dashboards e listas.

---

## ADR-004 — Sem realtime no v1

**Contexto.** `useRealtimeSync` assina 4 tabelas via `supabase.channel(...)`. O modo
genérico do gateway não expõe realtime.

**Decisão.** No v1, cache do React Query com `staleTime` moderado + invalidação
manual em mutations + `refetchOnWindowFocus: true`. Realtime vira extensão
[`ext-001-realtime.md`](../stories/gateway-extensions/ext-001-realtime.md) para Onda 2.

**Consequência.** Dashboards não atualizam ao vivo quando outro usuário mexe. Para o
domínio (compras/estoque interno), aceitável.

---

## ADR-005 — Sem storage; sem upload de foto de produto no v1

**Contexto.** `ProductPhotoUpload` usa `supabase.storage.from('product-photos')`.
Igual para `purchase-documents`.

**Decisão.** V1 permite **URL externa** de foto (input `foto_url text`). Upload de
arquivo vira extensão [`ext-002-storage-uploads.md`](../stories/gateway-extensions/ext-002-storage-uploads.md).

**Consequência.** UI mais simples. Cliente pode colar link do Drive/Imgur/CDN dele.

---

## ADR-006 — Sem RPC de código sequencial atômico

**Contexto.** `next_purchase_order_code()` é RPC atômico no Postgres para gerar
`PO-2026-0001` sem colisão.

**Decisão.** V1: gerar código no cliente lendo `list().length + 1` com prefixo por
ano + `unique(codigo)` no schema. Se houver colisão (2 usuários criando ao mesmo
tempo), o insert falha e o front tenta de novo com o próximo número. Aceitável no
volume esperado.

**Consequência.** Race condition possível mas auto-recuperável. Se virar problema,
extensão [`ext-008-cron-jobs.md`](../stories/gateway-extensions/ext-008-cron-jobs.md)
adiciona rota `/next/purchase_order_code` no gateway.

---

## ADR-007 — Sem AI/webhook/notificação no v1

**Contexto.** 8 edge functions cobrem ai-chat, ai-reorder, sale-webhook,
notify-low-stock, notify-purchase-flow, send-quote-request, push-inventory,
barcode-lookup.

**Decisão.** Todas viram extensão de gateway, uma story por capacidade em
`stories/gateway-extensions/`. Nenhuma entra no v1.

**Consequência.** Botões "Enviar cotação por WhatsApp", "Sugerir reposição IA",
"Escanear código" ficam **fora** das telas v1. Voltam com a extensão respectiva.

---

## ADR-008 — Sem onboarding wizard no v1

**Contexto.** `OnboardingWizard` de 9 passos guiava configuração inicial
(criar PDV, cadastrar 1º produto, etc.).

**Decisão.** V1 abre direto no dashboard vazio com empty states convidativos.
Wizard reavaliado depois do primeiro cliente real.

**Consequência.** `OnboardingWizard`, `OnboardingCard`, `useOnboardingWizard`,
`profiles.onboarding_completed`: removidos.

---

## ADR-009 — Sem "Health check" e "Integrations panel"

**Contexto.** `HealthCheckPanel` chama edge functions para diagnosticar Supabase.
`IntegrationsPanel` gerencia credenciais WhatsApp/Email/Shopify/Bling via vault.

**Decisão.** Ambos descartados. Saúde do gateway é responsabilidade do gateway
(monitoring próprio). Integrações voltam como extensão quando cada uma for validada.

---

## ADR-010 — pt-BR restrito a domínio, UI e docs (NÃO é "código em português")

> ⚠️ **Atenção IA/dev:** este ADR NÃO significa escrever código em português.
> Variáveis, funções, componentes, tipos e nomes de arquivo continuam em
> **inglês**, sempre. Ver regra completa e não-negociável em
> `docs/README.md §1.1 (Idioma)`. O escopo deste ADR é só o que está listado
> na Decisão abaixo.

**Contexto.** Projeto atual e docs já são pt-BR. Título antigo deste ADR
("pt-BR em tudo") já causou IA gerando código inteiro em português — corrigido
aqui.

**Decisão.** Manter em pt-BR **apenas**:
- Nomes de tabela e coluna no banco (`produtos`, `fornecedores`, `pedidos_compra`).
- Nomes de entidades de domínio no código quando espelham essas tabelas
  (mesma exceção do README §1.1).
- Textos de UI (labels, mensagens, textos visíveis ao usuário).
- Documentação (arquivos em `docs/`).

Tudo o mais no código-fonte — variáveis, funções, componentes, tipos, nomes de
arquivo, comentários de código — é em **inglês**, sem exceção.

**Consequência.** Consistente. Elimina bilingualismo `products/produtos` nas
tabelas, sem transformar o código-fonte em português.
