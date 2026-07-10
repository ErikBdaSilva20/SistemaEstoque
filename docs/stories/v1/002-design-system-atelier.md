# Story 002 — Design system "Atelier" + tokens "Viver de IA"

**Prioridade:** P0
**Escopo:** v1
**Depende de:** 001

## Contexto
O scaffold `wiki` traz o design system **Atelier** (Tailwind v4 + shadcn). O projeto atual
tem o sistema **"Viver de IA"** (Inter, navy #..., indigo, tokens oklch, warm neutrals).
Precisamos preservar a identidade sem quebrar o contrato do scaffold.

Ver memoria de projeto: `mem://design/viver-de-ia-system.md`.

## Objetivo
Migrar tokens de cor, fonte e sombra do "Viver de IA" para `src/app.css`, mantendo o
esqueleto do Atelier e os primitivos shadcn de `src/components/ui/**` intactos.

## Fora de escopo
- Landing page (classes `lp-*`).
- Animações — `ScrollReveal` chega junto se sobrar tempo, senão story pós-v1.
- Modo dark customizado (Atelier já tem).

## Regras aplicáveis (Importantdoc)
- §B3 — "Estilo: Tailwind v4 + shadcn 'Atelier'".
- §B9 — Scaffold `wiki`; `src/components/ui/**` protegido.

## Design / Arquitetura
- Substituir tokens do bloco `:root { --background: ... }` no `src/app.css`.
- Preservar variáveis semânticas: `--background`, `--foreground`, `--primary`, `--card`,
  `--border`, `--muted`, `--accent`, `--destructive`, etc. Só troca os valores oklch.
- Preservar `--radius` mas alinhar com "rounded-2xl" (0.75rem+).
- Adicionar utilitário `shadow-elevation-1/2/3` como `@utility` do Tailwind v4.

## Exemplo (antes → depois)

**Antes — `src/styles.css` (v3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 30 20% 98%;
    --primary: 231 60% 45%;
  }
}
```

**Depois — `src/app.css` (v4):**
```css
@import "tailwindcss";

@theme {
  --color-background: oklch(0.99 0.01 80);
  --color-foreground: oklch(0.20 0.02 260);
  --color-primary: oklch(0.55 0.16 260);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-card: oklch(0.99 0.005 80);
  --color-border: oklch(0.90 0.01 80);
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius: 0.75rem;
}

@utility shadow-elevation-1 { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06); }
@utility shadow-elevation-2 { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.08); }
@utility shadow-elevation-3 { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.10); }
```

## Tarefas
- [ ] Extrair tokens do `src/styles.css` legado.
- [ ] Reescrever `src/app.css` no formato Tailwind v4.
- [ ] Adicionar fontes (Inter) via `<link>` no `index.html`.
- [ ] Validar contraste (WCAG AA) em cada cor primária/foreground.
- [ ] Rodar visualmente as telas placeholder do wiki para conferir aplicação dos tokens.

## Definition of Done
- [ ] DoD padrão cumprido.
- [ ] Nenhum uso de `bg-white`, `text-white`, ou hex/rgb inline em componentes (grep + regra ESLint opcional).
- [ ] `src/components/ui/**` inalterado.

## Riscos
- Sombras "warm neutral" ficam apagadas em dark mode → testar dark antes de encerrar.
