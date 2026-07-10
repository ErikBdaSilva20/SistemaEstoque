# THIRD_PARTY

Créditos de código, design e conteúdo de terceiros incorporados a este template.
Mantido conforme exigido pelo contrato do hub Masia (§B / checklist final,
item "THIRD_PARTY.md credita o OSS de origem").

> **Regra:** ao copiar qualquer markup, componente, snippet ou asset de fonte
> externa, adicione uma entrada aqui com **origem + licença + link + o que foi
> reaproveitado**. Sem entrada = não pode entrar no repositório.

---

## Plataforma de origem do remix

### Viver de IA
- **O que:** este projeto foi **remixado a partir de um template da plataforma
  Viver de IA**. A identidade visual ("Viver de IA"), tokens de cor (paleta
  navy + indigo + neutros quentes em `oklch`), tipografia (Inter), utilitários
  de landing page (`lp-section-*`, `lp-btn-*`, `lp-glass-card`, `lp-solid-card`),
  padrões de animação com `ScrollReveal` (framer-motion) e diversas decisões
  de UI/UX derivam dessa base.
- **Onde no código:**
  - `src/styles.css` — tokens de design e classes `lp-*`.
  - `src/components/lp/ScrollReveal.tsx` — wrapper de animação.
  - Componentes de autenticação e landing herdados do template original.
- **Licença:** template proprietário Viver de IA, uso autorizado no contexto
  do hub Masia.
- **Link:** https://viverdeia.ai

---

## Bibliotecas e frameworks (dependências npm)

As licenças de todos os pacotes npm ficam em `node_modules/*/LICENSE` e são
resolvidas automaticamente pelo `package-lock.json`. Não são listadas aqui
individualmente — apenas os projetos cujo **markup/design foi copiado
diretamente** para o nosso código-fonte precisam de entrada explícita.

Casos que merecem menção pelo peso do reaproveitamento visual/estrutural:

### shadcn/ui
- **O que:** componentes primitivos de UI em `src/components/ui/**` são cópia
  direta da biblioteca shadcn/ui (não é dependência npm — é código copiado).
- **Licença:** MIT.
- **Link:** https://ui.shadcn.com

### Radix UI
- **O que:** primitives de acessibilidade usados por dentro dos componentes
  shadcn (`@radix-ui/*`).
- **Licença:** MIT.
- **Link:** https://www.radix-ui.com

### Tailwind CSS
- **O que:** sistema de utility classes.
- **Licença:** MIT.
- **Link:** https://tailwindcss.com

### Lucide Icons
- **O que:** biblioteca de ícones (`lucide-react`).
- **Licença:** ISC.
- **Link:** https://lucide.dev

### TanStack Query
- **O que:** cache/estado de servidor (`@tanstack/react-query`).
- **Licença:** MIT.
- **Link:** https://tanstack.com/query

### React Router
- **O que:** roteamento (`react-router-dom`).
- **Licença:** MIT.
- **Link:** https://reactrouter.com

### Framer Motion
- **O que:** animações declarativas usadas em `ScrollReveal` e transições
  da landing.
- **Licença:** MIT.
- **Link:** https://www.framer.com/motion

---

## Assets

### Ícones e logos
- Ícones da UI vêm de `lucide-react` (ver acima).
- Favicon (`public/favicon.svg`) é asset próprio do projeto ou herdado do
  template Viver de IA — atualizar esta linha quando o favicon do template
  final for definido.

### Imagens ilustrativas
- Nenhuma imagem de terceiros incorporada atualmente. Quando houver, listar
  aqui com origem (Unsplash, Pexels, geração própria, etc.) e licença.

---

## Processo de manutenção

- **Ao adicionar dependência nova** que envolva **copiar markup** (não só
  usar como npm), adicione entrada aqui na mesma tarefa.
- **Ao copiar bloco de UI** de qualquer site/repo, mesmo pequeno, adicione
  entrada.
- **Ao trocar de template base** (deixar de ser derivado do Viver de IA),
  atualizar/remover a seção "Plataforma de origem do remix".
- Revisão obrigatória no story `019-testes-qualidade` antes de publicar o
  template.
