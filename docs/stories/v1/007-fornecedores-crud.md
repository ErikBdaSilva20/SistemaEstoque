# Story 007 — Fornecedores CRUD

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 003, 004, 005

## Objetivo
CRUD de fornecedores usando `db.table('fornecedores')`.

## Regras aplicáveis
- §B4 — `owner_id` obrigatório. §B5 — list-then-filter.

## Design
- `src/lib/data/fornecedores.repo.ts`.
- `src/screens/fornecedores/FornecedoresScreen.tsx`.
- Componentes: `TabelaFornecedores`, `FormFornecedor`.
- Validação CNPJ no front (`src/lib/cnpj.ts` — MANTER, é utility puro).

## Exemplo
```ts
export const listFornecedores   = () => db.table<Fornecedor>('fornecedores').list();
export const createFornecedor   = (i: Partial<Fornecedor>) => db.table<Fornecedor>('fornecedores').create(i);
```

## Tarefas
- [ ] Repo.
- [ ] Reescrever `useFornecedores`.
- [ ] Migrar `SuppliersTable`, `SupplierFormDialog`.
- [ ] Manter `src/lib/cnpj.ts`.

## DoD
- [ ] DoD padrão.
- [ ] CNPJ único por owner (via unique constraint no schema).
- [ ] Busca por nome funciona (filter no cliente).

## Gancho de extensão
- Import CSV — story 017 (fica no v1, é 100% front).
