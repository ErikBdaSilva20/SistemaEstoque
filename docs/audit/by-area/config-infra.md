# Auditoria por área — Config e Infra

| Arquivo | Categoria | Ação |
| --- | --- | --- |
| `package.json` | REESCREVER | React 19, Vite 6, react-router-dom 7, Tailwind v4. Remover `@supabase/*`, `@tanstack/react-start`, `@zxing/*`. |
| `bun.lockb` / `bunfig.toml` | DESCARTAR | Hub usa `npm install`. |
| `package-lock.json` | CRIAR | Commitado (pré-req §B10). |
| `vite.config.ts` | REESCREVER | Vite 6, plugin React, `@tailwindcss/vite`. Sem plugin TanStack Start. PROTEGIDO no scaffold `wiki`. |
| `tsconfig.json` | REESCREVER | strict + `noUnusedLocals: true`. |
| `tailwind.config.ts` | DESCARTAR | Tailwind v4 é config-in-CSS. |
| `src/styles.css` (v3) | REESCREVER | Vira `src/app.css` estilo v4 (`@import "tailwindcss"`), tokens migrados. |
| `components.json` | MANTER (vem do scaffold) | PROTEGIDO. |
| `index.html` | REESCREVER | Título/meta pt-BR do produto. Sem PWA. |
| `.env.example` | REESCREVER | Só `VITE_GATEWAY_URL`. |
| `.env` | REESCREVER (usuário) | idem. |
| `.github/workflows/ci.yml` | REESCREVER | Só `npm ci && npm run build` + `npm run lint`. Sem deploy próprio (publish é `pnpm templates:publish` fora do repo). |
| `.prettierrc`, `.prettierignore` | MANTER | Alinhar com scaffold. |
| `eslint.config.js` | MANTER | Alinhar com scaffold. |
| `bunfig.toml` | DESCARTAR | — |
| `components.json` | MANTER | — |
| `public/favicon.svg` | MANTER | Substituível pela IA. |
| `public/manifest.webmanifest` (se existir) | DESCARTAR | — |
| `scripts/smoke.mjs` | REESCREVER | Vira smoke Playwright do fluxo principal. |
| `scripts/README.md` | REESCREVER | Documenta o novo smoke. |
| `DEPLOYMENT.md` | REESCREVER | Vira nota curta apontando pra `pnpm templates:publish` do hub. |
| `masi.template.json` | CRIAR | Manifest do template (§B7). |
| `supabase/config.toml` | DESCARTAR | Sem projeto Supabase. |
| `supabase/functions/**` | DESCARTAR | — |
| `supabase/migrations/**` | REESCREVER | 1 arquivo `0001_business_schema.sql`. |
| `src/main.tsx` | REESCREVER | `createRoot` puro + BrowserRouter. PROTEGIDO. |
| `src/components/registry.tsx` | CRIAR | Do scaffold `wiki`. PROTEGIDO. |
| `src/lib/data/client.ts` | CRIAR | Do scaffold. PROTEGIDO. |
| `src/lib/data/types.gen.ts` | CRIAR | Gerado. PROTEGIDO. |
| `src/lib/data/preview-fixtures.ts` | CRIAR | Do scaffold. PROTEGIDO. |
| `THIRD_PARTY.md` | OPCIONAL | Nota histórica sobre origem do domínio. |

## Fluxo de CI enxuto

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test  # vitest
```
