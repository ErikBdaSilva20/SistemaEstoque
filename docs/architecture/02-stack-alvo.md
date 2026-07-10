# Stack alvo

Fonte: [`../reference/Importantdoc.md`](../reference/Importantdoc.md) §B3, §B9.

| Camada    | Tecnologia                                | Nota |
| --------- | ----------------------------------------- | ---- |
| Framework | **React 19**                              | Hoje: React 18 → upgrade obrigatório. |
| Build     | **Vite 6** (SPA estático)                 | Hoje: Vite 5 + TanStack Start. TanStack Start sai. |
| Rotas     | **react-router-dom 7**                    | Hoje: v6 → upgrade. `BrowserRouter`. |
| Linguagem | **TypeScript strict** (`noUnusedLocals`)  | Imports não usados quebram o build. |
| Estilo    | **Tailwind v4 + shadcn "Atelier"**        | Scaffold `wiki`. Projeto atual usa Tailwind v3 → migração. |
| Dados     | `db` de `src/lib/data/client.ts`          | Nenhum outro cliente. |
| Auth      | `auth` de `src/lib/data/client.ts`        | Better-Auth do gateway. |
| Banco     | Postgres (Neon) — só migration           | Sem RLS. |

## Scaffold escolhido: `wiki` (Pro shadcn)

O projeto atual já usa shadcn/ui e o design system "Viver de IA" (Inter + navy + indigo,
oklch tokens). O scaffold **wiki** é o único caminho de continuidade natural.

Consequências:

- Copiamos `wiki` inteiro como ponto de partida.
- `src/components/ui/**`, `src/lib/utils.ts`, `vite.config.ts`, `components.json`,
  `preview-fixtures.ts` entram na lista de **protect** do manifest.
- Tokens do design system "Viver de IA" migram para `src/app.css` (ou `styles.css`) por
  cima da base "Atelier". Sem hex/rgb inline — só semantic tokens.

## O que **sai** da stack atual

- **TanStack Start** → sai. Somos SPA puro Vite. `src/start.ts`, middlewares e
  `client.server.ts` desaparecem.
- **@supabase/supabase-js** → sai de todo `src/`. Substituído por `db` / `auth` do gateway.
- **@supabase/ssr** → sai (não temos SSR).
- **PWA (`manifest.webmanifest`, service worker)** → sai no v1. Reavaliar em pós-v1 se
  houver demanda real.
- **@zxing/browser** (scanner) → sai no v1. Vira extensão (ver
  `stories/gateway-extensions/ext-005-barcode-lookup.md`).
- **framer-motion**, **recharts**, **react-hook-form**, **zod** → **ficam**. São client-side
  e cabem no scaffold Atelier.

## Dependências que ficam

- `@tanstack/react-query` — cache das listas (essencial pro padrão list-then-filter).
- `date-fns`, `clsx`, `class-variance-authority`, `tailwind-merge`.
- `sonner` para toasts.
- `lucide-react` para ícones.
- shadcn primitives em `src/components/ui/**`.

## Node / bundler

- Node 20+.
- `package-lock.json` (npm) commitado — o pipeline do hub usa `npm install`.
  (Hoje o projeto usa `bun.lockb`; será removido junto com bunfig.toml.)
