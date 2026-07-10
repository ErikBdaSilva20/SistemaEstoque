# Story 017 — Import/Export CSV

**Prioridade:** P2 · **Escopo:** v1 · **Depende de:** 006, 007

## Objetivo
Importar/exportar produtos e fornecedores via CSV. 100% no cliente.

## Design
- `src/lib/import-export.ts` MANTER (é PapaParse-like puro).
- Import: parse CSV → validar linha → `create()` em loop com progress bar.
- Export: `list()` → mapear → download blob.

## Tarefas
- [ ] Reescrever `ProductsImportDialog`, `SuppliersImportDialog`.
- [ ] Barra de progresso e sumário de erros.

## DoD
- [ ] DoD padrão.
- [ ] Import de 1000 linhas termina sem travar UI.

## Riscos
- Loop de `create` no gateway — muitas requests. Considerar throttling (10 req/s).
