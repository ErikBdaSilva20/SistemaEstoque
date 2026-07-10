# Auditoria — índice

> ⚠️ **Não use este arquivo para descobrir o que fazer.** A fonte de verdade é
> [`../README.md`](../README.md) (o "cérebro"). Esta pasta é **anexo técnico**:
> abra apenas quando o cérebro te mandar buscar detalhe de um item.

## O que tem aqui

Mapa de incompatibilidades do projeto atual vs. o contrato do hub
([`../reference/Importantdoc.md`](../reference/Importantdoc.md)).

## Como está organizado

**Por prioridade** (leia nesta ordem se for atacar direto):

- [`P0-bloqueadores.md`](./P0-bloqueadores.md) — impede qualquer build limpo do template.
- [`P1-criticos.md`](./P1-criticos.md) — lógica de negócio v1.
- [`P2-importantes.md`](./P2-importantes.md) — relevante, mas não bloqueia v1.
- [`P3-nice-to-have.md`](./P3-nice-to-have.md) — cosmético / backlog.

**Por área do código** (quando quer recorte técnico):

- `by-area/backend-supabase.md`
- `by-area/edge-functions.md`
- `by-area/schema-tabelas.md`
- `by-area/rpcs-triggers.md`
- `by-area/hooks.md`
- `by-area/ui-paginas.md`
- `by-area/config-infra.md`

## Categorias usadas

- **MANTER** — código sobrevive ao remix como está.
- **REESCREVER** — vira story em `../stories/v1/`.
- **DESCARTAR** — apagar.
- **EXTENSÃO GATEWAY** — não entra no v1; vira arquivo em `../stories/gateway-extensions/`.

## Regra

Nenhum item marcado **EXTENSÃO GATEWAY** aparece em stories v1. Se aparecer,
o story está errado — mover para a pasta de extensões.
