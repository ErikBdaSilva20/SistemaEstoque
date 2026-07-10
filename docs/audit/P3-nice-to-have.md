# P3 — Nice-to-have (backlog livre)

Cosmético / opcional. Só entra se sobrar tempo ou pedido explícito de cliente.

---

### Animações com `framer-motion`

- **Onde:** `src/components/lp/ScrollReveal.tsx`, uso pontual em cards.
- **Categoria:** MANTER.
- **Ação:** nenhuma. Continua funcionando.

---

### Design system "Viver de IA" completo

- **Onde:** `src/styles.css` (tokens oklch, LP classes).
- **Categoria:** MANTER, migrar por cima do "Atelier".
- **Ação:** copiar tokens para `src/app.css`. Classes `lp-*` só se landing page for reintroduzida.
- **Story vinculado:** `stories/v1/002-design-system-atelier.md`.

---

### PWA (manifest + service worker)

- **Onde:** `public/manifest.webmanifest` (se existir), `vite-plugin-pwa` (se estiver em deps).
- **Categoria:** DESCARTAR no v1.
- **Ação:** remover.

---

### Landing page (`lp-*` classes)

- **Onde:** classes em `styles.css`, `ScrollReveal`.
- **Categoria:** DESCARTAR no v1 do template.
- **Ação:** template abre já autenticado. Marketing/LP não é papel do template.

---

### Dark mode

- **Onde:** tokens oklch já têm `.dark` no `styles.css`.
- **Categoria:** MANTER.
- **Ação:** herda do "Atelier". Toggle já existe no shadcn.

---

### `use-mobile` hook

- **Onde:** `src/hooks/use-mobile.tsx`.
- **Categoria:** MANTER.

---

### Prettier/ESLint config

- **Onde:** `.prettierrc`, `eslint.config.js`.
- **Categoria:** MANTER + alinhar com o scaffold `wiki`.
