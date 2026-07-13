# `mock/` — tudo que é fake, num lugar só

Duas coisas diferentes moram aqui, ambas dev-only:

- **`gateway-server.mjs` + `gateway-seed.mjs`** — servidor local (`npm run
  dev:gateway`) que mocka só o auth (usuário fixo) e fala com o Postgres real
  do Docker. Pra dev normal, com dado persistente.
- **`preview-fixtures.ts` + `MockRoleSwitcher.tsx`** — mock 100% front, em
  memória, usado pelo browser quando `window.__MASI_PREVIEW__` é `true`
  (branch `mockup`). Sem backend nenhum, dado reseta a cada load.

## Como remover tudo (1 passo + 3 referências)

1. Apague esta pasta (`mock/`).
2. Tire as 3 referências que apontam pra cá:
   - `src/lib/data/client.ts` — os dois `await import("@mock/preview-fixtures")`.
   - `src/pages/AppShell.tsx` — o `import { MockRoleSwitcher } from "@mock/MockRoleSwitcher"` e o `<MockRoleSwitcher />`.
   - `index.html` — o `<script>` que seta `window.__MASI_PREVIEW__`.
3. Opcional: tire o alias `@mock` do `vite.config.ts` e os scripts
   `dev:gateway`/`db:seed` do `package.json`.

Sem esses 3 pontos apontando pra cá, não sobra código morto — só o `db`/`auth`
reais (`client.ts`) falando com `VITE_GATEWAY_URL`.
