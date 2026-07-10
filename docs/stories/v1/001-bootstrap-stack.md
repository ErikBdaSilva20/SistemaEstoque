# Story 001 — Bootstrap da stack (Vite 6 + React 19 + scaffold `wiki`)

**Prioridade:** P0
**Escopo:** v1
**Depende de:** —

## Contexto
Projeto atual usa **React 18 + Vite 5 + TanStack Start**. O contrato exige
**React 19 + Vite 6 + SPA puro** e o scaffold canônico Pro é o `wiki`
(Tailwind v4 + shadcn "Atelier"). Ver auditoria `by-area/config-infra.md` e
[`../../architecture/02-stack-alvo.md`](../../architecture/02-stack-alvo.md).

## Objetivo
Trocar o esqueleto do projeto pelo scaffold `wiki`, mantendo apenas a pasta `src/`
como referência (será migrada peça a peça nos stories seguintes).

## Fora de escopo
- Migrar telas/hooks/repos (stories 006+).
- Criar schema (story 005).
- Configurar auth (story 004).

## Regras aplicáveis (Importantdoc)
- §B1 — "SPA estático (Vite + React). NÃO existe backend por app."
- §B3 — "React 19; Vite 6; TypeScript strict com `noUnusedLocals`; rotas com react-router-dom 7."
- §B9 — Scaffold `wiki` para app Pro shadcn.
- §B10 — `package-lock.json` commitado; `vite build` passa; zero imports não usados.

## Design / Arquitetura
- Ponto de partida: `cp -R masi-ai-orquestration/clone-templates/wiki <este-projeto>`.
- Preservar (mover para `.legacy/`): pasta `src/` atual, `supabase/`.
- Arquivos protegidos que vêm do scaffold e **não podem ser editados**:
  - `src/main.tsx`
  - `src/lib/data/client.ts`
  - `src/lib/data/types.gen.ts`
  - `src/lib/data/preview-fixtures.ts`
  - `src/components/registry.tsx`
  - `src/components/ui/**`
  - `src/lib/utils.ts`
  - `vite.config.ts`
  - `components.json`

## Exemplo (antes → depois)

**Antes — `src/main.tsx`:**
```tsx
import { StartClient } from '@tanstack/react-start/client';
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document, <StartClient router={router} />);
```

**Depois — `src/main.tsx` (do scaffold):**
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

## Tarefas
- [ ] Mover `src/` atual para `.legacy/src-supabase/` (só referência).
- [ ] Copiar scaffold `wiki` para o repositório.
- [ ] `rm -rf node_modules dist bun.lockb bunfig.toml supabase/`.
- [ ] `npm install`; commit `package-lock.json`.
- [ ] Ajustar `index.html` (título/meta pt-BR do produto).
- [ ] Ajustar `.env.example` para conter só `VITE_GATEWAY_URL`.
- [ ] `npm run build` — precisa passar limpo, mesmo com telas placeholder do wiki.

## Definition of Done
- [ ] DoD padrão cumprido.
- [ ] `package-lock.json` commitado.
- [ ] Nenhum `@supabase/*` ou `@tanstack/react-start` em `package.json`.
- [ ] `masi.template.json` presente (mesmo esqueleto do wiki, ID/name podem ficar placeholder).
- [ ] Rota `/` do wiki carrega no browser em dev.

## Riscos
- Perder algo importante da `src/` atual → mitigado pelo `.legacy/`.
- Diferença de package manager (bun→npm) pode expor versões flutuantes → travar no lockfile.
