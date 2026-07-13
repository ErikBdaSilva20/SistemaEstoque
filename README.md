# Compras & Estoque

Sistema de gestão de compras e controle de estoque pra uma equipe única
(não é multi-empresa/multi-cliente dentro do app — cada instalação atende
um só time). Cobre: cadastro de produtos e fornecedores, movimentação de
estoque (entrada/saída/ajuste/transferência), pedidos de compra com fluxo
de aprovação, contagem de inventário, lotes com vencimento, relatórios
(curva ABC, giro) e um dashboard operacional.

Papéis de acesso: **admin**, **manager** e **rep** (operador). O primeiro
usuário a se cadastrar num tenant vira `admin` automaticamente; os
seguintes entram como `rep`. `rep` só vê o dia a dia operacional (Produtos,
Venda Rápida, Estoque, Contagem, Vencidos) — Dashboard, Compras,
Relatórios, Fornecedores e Configurações são exclusivos de admin/manager.

## Stack

SPA **Vite + React 19 + TypeScript strict**, **Tailwind v4 + shadcn**
("Atelier"), **React Query** pra estado de servidor, **react-router-dom**
pra rotas. **Sem backend próprio**: o app fala só com um `tenant-gateway`
compartilhado (Better-Auth pra login/sessão + `/data/:table` genérico pra
CRUD), que por sua vez fala com um Postgres **Neon** dedicado por cliente.
**Não usa Supabase, não tem RLS, não roda SSR.** Detalhe completo da
arquitetura em [`Importantdoc.md`](./Importantdoc.md).

## Branches — leia isto antes de mexer em qualquer coisa

Este repositório tem duas branches com propósitos **bem diferentes**. Não
confunda uma com a outra.

### `deploy` — vira a `main`

É o código de verdade, o que vai pro cliente. Trate esta branch como se já
fosse a `main` (é pra onde ela vai virar PR). Características:

- **Zero mock, zero código de preview.** Login e dados só funcionam contra
  um `tenant-gateway` real, configurado via `VITE_GATEWAY_URL`. Sem essa
  variável, o app não faz nada — nem tenta simular.
- `tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` — todos
  limpos nesta branch.
- Passo a passo de deploy (Neon → gateway → frontend) em
  [`DEPLOYMENT.md`](./DEPLOYMENT.md).
- Checklist do que falta validar antes de considerar pronto pro cliente
  (principalmente: separação rep/admin nunca testada contra gateway real)
  em [`docs/audit/v1-ship-readiness.md`](./docs/audit/v1-ship-readiness.md).

### `mockup` — só vitrine, não é código de produção

Branch separada, existe só pra publicar uma versão 100% front-end (login e
dados fake, em memória, resetam a cada load) num host tipo Vercel **sem
precisar de nenhuma infraestrutura real** — nem Neon, nem gateway. Tem um
seletor de papel visível na tela (admin/gerente/operador) pra dar uma volta
pela interface com cada nível de acesso sem criar conta de verdade.

⚠️ **Essa branch está bagunçada de propósito** — foi montada rápido, só
pra demonstração visual, os arquivos de mock (`mock/gateway-server.mjs`,
`mock/preview-fixtures.ts`, `mock/MockRoleSwitcher.tsx`) não seguem o
mesmo padrão de organização do resto do projeto e não passaram pelo mesmo
nível de revisão da `deploy`. **Não usar como base pra nada além de
mostrar a tela** — não puxar código dela pra `deploy`/`main`, não tratar
nada que está lá como referência de arquitetura.

## Rodando localmente (branch `deploy`)

```bash
npm ci
npm run dev        # sobe o Vite em localhost:8080 (ou próxima porta livre)
```

Pra qualquer tela funcionar de verdade (login, listas, formulários),
precisa de um `tenant-gateway` acessível e `VITE_GATEWAY_URL` configurada
— ver [`DEPLOYMENT.md`](./DEPLOYMENT.md#2-um-tenant-gateway-rodando-e-apontando-pra-esse-neon).
Sem isso, use a branch `mockup` só pra visualizar a interface.

## Onde encontrar as coisas

| Precisa saber…                                 | Abra                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Contrato técnico oficial (o que pode/não pode) | [`Importantdoc.md`](./Importantdoc.md)                                               |
| Passo a passo de deploy real                   | [`DEPLOYMENT.md`](./DEPLOYMENT.md)                                                   |
| Onde o projeto está / histórico do remix       | [`docs/README.md`](./docs/README.md)                                                 |
| Checklist de prontidão pro cliente             | [`docs/audit/v1-ship-readiness.md`](./docs/audit/v1-ship-readiness.md)               |
| Modelo de dados / schema                       | [`docs/architecture/04-modelo-dominio.md`](./docs/architecture/04-modelo-dominio.md) |
