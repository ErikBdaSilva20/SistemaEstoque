# Story 019 — Testes e qualidade

**Prioridade:** P2 · **Escopo:** v1 · **Depende de:** 006–013

## Objetivo
Baseline de qualidade: vitest para utils + 1 smoke Playwright do fluxo principal.

## Design
- vitest cobre: `estoque.calcularSaldo`, `reports/{abc,turnover,stockouts}`, `cnpj.validar`.
- Playwright: login → cria produto → cria PR → converte PR→PO → recebe → confere kardex.
- CI (`.github/workflows/ci.yml`) roda `npm ci && npm run lint && npm run build && npm test`.

## Tarefas
- [ ] Adicionar `vitest`, `@testing-library/react`, `playwright` como devDeps.
- [ ] Scripts em `package.json`: `test`, `test:e2e`, `lint`.
- [ ] Escrever suites.
- [ ] `scripts/smoke.mjs` → substituir por spec Playwright.

## DoD
- [ ] `npm test` verde.
- [ ] `npm run test:e2e` verde contra gateway local.
- [ ] Cobertura ≥ 60% em `src/lib/`.

## Riscos
- Flakiness do E2E — mockar gateway com MSW se necessário.
