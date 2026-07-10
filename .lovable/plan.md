
# Documentação do Remix — Auditoria + Stories

Objetivo: transformar o mapa de incompatibilidades e o plano de reescrita em uma base documental **navegável, detalhada e didática**, com stories independentes, cada um respeitando as regras do `Importantdoc.md`. Nada será remixado ainda — só documentação. Extensões de Gateway ficam em pasta separada, isoladas do escopo v1.

## Estrutura de pastas a criar

```text
docs/
├── README.md                              # índice mestre + como ler
├── architecture/
│   ├── 01-principios.md                   # regras não-negociáveis (do Importantdoc)
│   ├── 02-stack-alvo.md                   # React 19, Vite 6, TS strict, Tailwind v4, Atelier
│   ├── 03-camada-dados.md                 # db.table() API, sem supabase-js, sem RLS client
│   ├── 04-modelo-dominio.md               # owner_id, snake_case, uuid, tenancy
│   └── 05-decisoes.md                     # ADRs curtos (por que cada regra)
├── audit/
│   ├── README.md                          # legenda P0..P3, categorias, como usar
│   ├── P0-bloqueadores.md                 # tudo que impede rodar sob as regras
│   ├── P1-criticos.md                     # core do domínio que precisa reescrita
│   ├── P2-importantes.md                  # features relevantes mas adiáveis
│   ├── P3-nice-to-have.md                 # cosmético / opcional
│   └── by-area/
│       ├── backend-supabase.md            # client, types, RLS, vault
│       ├── edge-functions.md              # 13 funções, veredito 1 a 1
│       ├── schema-tabelas.md              # tabela a tabela: manter/reescrever/descartar
│       ├── rpcs-triggers.md               # next_purchase_order_code etc.
│       ├── ui-paginas.md                  # pages/*, components/*
│       ├── hooks.md                       # useProducts, useRealtimeSync, ...
│       └── config-infra.md                # vite, tsconfig, tailwind, PWA, CI
└── stories/
    ├── README.md                          # convenção do story, template, DoD
    ├── _template.md                       # template reutilizável
    ├── v1/                                # ESCOPO v1 (só CRUD + telas)
    │   ├── 001-bootstrap-stack.md
    │   ├── 002-design-system-atelier.md
    │   ├── 003-camada-dados-db.md
    │   ├── 004-auth-tenant-gateway.md
    │   ├── 005-schema-migracao-inicial.md
    │   ├── 006-produtos-crud.md
    │   ├── 007-fornecedores-crud.md
    │   ├── 008-estoque-movimentacoes.md
    │   ├── 009-purchase-requests.md
    │   ├── 010-quotes-rfq.md
    │   ├── 011-purchase-orders.md
    │   ├── 012-recebimento-e-kardex.md
    │   ├── 013-contagens-inventario.md
    │   ├── 014-relatorios-abc-turnover.md
    │   ├── 015-dashboard.md
    │   ├── 016-configuracoes-basicas.md
    │   ├── 017-import-export-csv.md
    │   ├── 018-impressao-etiquetas-po.md
    │   └── 019-testes-qualidade.md
    └── gateway-extensions/                # ISOLADO — Onda 2, nada disso entra no v1
        ├── README.md                      # o que é extensão, quando propor
        ├── ext-001-realtime.md
        ├── ext-002-storage-uploads.md
        ├── ext-003-webhook-vendas.md
        ├── ext-004-notificacoes-whatsapp-email.md
        ├── ext-005-barcode-lookup.md
        ├── ext-006-ai-chat-reorder.md
        ├── ext-007-push-inventory-shopify-bling.md
        └── ext-008-cron-jobs.md
```

## Padrão de qualidade (aplicado a todo arquivo)

Cada documento segue esta estrutura mínima:

1. **Contexto** — o que é, onde vive hoje no projeto atual.
2. **Decisão** — o que fica, o que muda, o que sai.
3. **Justificativa** — qual regra do `Importantdoc.md` motiva.
4. **Exemplo antes/depois** — snippet real do código atual + snippet do alvo.
5. **Impacto** — arquivos afetados, riscos, dependências entre stories.
6. **Definition of Done** — checklist objetivo.

Sem prosa vazia. Todo "porquê" citado com âncora à regra correspondente.

## Auditoria — critério de prioridade

| Nível | Significado | Exemplo |
|---|---|---|
| **P0** | Bloqueia rodar sob as regras. Precisa ser resolvido antes de qualquer story | `supabase-js` no client, RLS, edge functions no path crítico |
| **P1** | Core de negócio que exige reescrita, mas não bloqueia infra | RPCs de PO, kardex, conversão RFQ→PO |
| **P2** | Feature relevante, pode entrar depois do v1 | Contagens avançadas, relatórios extras |
| **P3** | Cosmético / opcional | Animações, PWA, temas |

Cada item da auditoria recebe: **nível**, **categoria** (MANTER / REESCREVER / DESCARTAR / EXTENSÃO GATEWAY), **arquivo(s)**, **regra violada**, **ação recomendada**.

## Template do story (resumo)

```md
# Story NNN — <título>

**Prioridade:** P0 | P1 | P2
**Depende de:** 00X, 00Y
**Escopo:** v1 (CRUD) — não inclui realtime/webhook/AI

## Contexto
## Objetivo
## Fora de escopo
## Regras aplicáveis (Importantdoc)
- Regra X: ...
## Design / Arquitetura
- Tabelas, endpoints db.table(), componentes
## Exemplo (antes → depois)
## Tarefas
- [ ] ...
## Definition of Done
- [ ] Build + tsgo strict OK
- [ ] Sem import de `@supabase/*`
- [ ] Sem edge function
- [ ] Testes de fluxo principal
## Riscos
```

## Regra dura de separação

- Nada em `stories/v1/**` pode citar realtime, webhook, edge function, storage bucket, integração externa ou secret.
- Tudo isso vive **exclusivamente** em `stories/gateway-extensions/**`, cada extensão com sua própria proposta de endpoint no gateway, contrato de I/O, riscos e critério de aceite — para serem avaliados um a um na Onda 2.

## Entrega desta rodada

Ao aprovar, criarei todos os arquivos acima com conteúdo real e detalhado (não placeholders). Volume estimado: ~35 arquivos markdown. Nenhum arquivo do projeto atual será modificado — só criação em `docs/`.

## Confirmações rápidas

1. Idioma: **pt-BR** em tudo (mantém padrão do projeto). OK?
2. Manter `.lovable/plan.md` como está e usar `docs/` como fonte da verdade daqui pra frente?
3. Posso incluir nos stories v1 uma seção "Gancho de extensão" apontando para o arquivo em `gateway-extensions/` correspondente (referência, não implementação)?
