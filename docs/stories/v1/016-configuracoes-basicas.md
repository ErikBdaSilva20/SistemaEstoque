# Story 016 — Configurações básicas

**Prioridade:** P1 · **Escopo:** v1 · **Depende de:** 004, 005

## Objetivo
Consolidar telas de configuração v1: **Equipe** (só lista), **Motivos de movimento**,
**Regras de compra**, **Locais de estoque**.

## Fora de escopo
- Integrations, Health, ApiKeys, Audit, Security, Onboarding, Stores — DESCARTADAS.

## Design
- `SettingsLayout` com menu enxuto.
- `SettingsIndex` redireciona pro primeiro item.
- `MembersTable` = `auth.listMembers()` (se gateway expõe) ou nota "veja no gateway".
- `MovementReasonsPanel` e `PurchaseRulesPanel` = CRUD de lookup, só admin edita.
- `LocationsPanel` = CRUD com owner_id (rep cadastra o próprio local); ou lookup
  compartilhado (decidir com stakeholder). Padrão sugerido: **com owner_id**.

## Tarefas
- [ ] Reescrever `SettingsIndex` com menu enxuto.
- [ ] Migrar 4 painéis.
- [ ] Deletar 5 páginas descartadas.
- [ ] `RoleGate` em botões de escrita das lookups.

## DoD
- [ ] DoD padrão.
- [ ] Menu de configurações só mostra o que existe.
