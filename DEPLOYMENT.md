# Deploy — Compras & Estoque

> Reescrito em 2026-07-13. A versão anterior deste arquivo descrevia uma
> arquitetura Supabase (projeto Supabase dedicado, 13 Edge Functions, RLS,
> Lovable Cloud) que **não existe mais neste código** — foi descartada numa
> reescrita anterior (ver `docs/audit/P0-bloqueadores.md`). A arquitetura
> real, por `Importantdoc.md` §B1–B4, é a descrita abaixo.

Este app é um **SPA estático** (Vite + React). Ele **nunca fala com o banco
direto** — tudo passa por um `tenant-gateway` (Better-Auth + `/data/:table`),
que é um **serviço separado**, não parte deste repositório:

```
[Este app: SPA Vite]  --HTTPS-->  [tenant-gateway]  --SQL-->  [Neon do tenant]
     servido por Vercel            Better-Auth + /data/*        1 banco por cliente
     (ou Cloudflare/Netlify/       (repo à parte, ex:
      qualquer static host)        Cerebra-AI/tenant-gateway)
```

Ou seja, publicar este repo sozinho **não é suficiente**. Você precisa de
**3 peças**, nesta ordem:

---

## 1. Um projeto Neon (banco do tenant)

1. Crie um projeto novo em [neon.tech](https://neon.tech) — um Postgres
   isolado só pra este cliente/tenant.
2. Anote a connection string — é o que o `tenant-gateway` vai usar (não o
   frontend; o frontend nunca vê a connection string do banco).

## 2. Um `tenant-gateway` rodando e apontando pra esse Neon

Isto é o passo que costuma faltar. O gateway:

- Não faz parte deste repo — é o serviço que já roda `mock/gateway-server.mjs`
  localmente (versão mock, só pra dev — **não serve pra produção**, auth é
  fake). Em produção é uma implementação real de Better-Auth + rotas
  `/data/:table`, tipicamente o repo `Cerebra-AI/tenant-gateway` (deploy em
  Fly.io, per `Importantdoc.md` §B2).
- Precisa criar as tabelas do Better-Auth (`user`, `session`, `account`,
  `verification`) **antes** da migration de negócio.
- **Depois** disso, aplique `supabase/migrations/0001_business_schema.sql`
  no mesmo Neon (schema de produtos/fornecedores/compras/estoque/contagens
  deste app — ver `docs/architecture/04-modelo-dominio.md`).

Se você não tem acesso a uma instância de `tenant-gateway` (compartilhada
pelo hub da Masia, ou uma sua), **pare aqui** — sem isso, nenhuma tela deste
app funciona de verdade (login e dados dependem 100% do gateway). Ver
`docs/audit/v1-ship-readiness.md` §1 pra mais contexto.

## 3. O frontend (este repo) publicado apontando pro gateway

```bash
npm ci
npm run build
# dist/ pronto — Vercel, Cloudflare Pages, Netlify, qualquer static host.
```

`vercel.json` já está no repo (build command, output dir, e o rewrite de SPA
`/* → /index.html`, necessário porque as rotas são client-side via
`react-router-dom`).

### Variável de ambiente obrigatória

| Variável            | Valor                                          |
| ------------------- | ----------------------------------------------- |
| `VITE_GATEWAY_URL`  | URL pública do `tenant-gateway` (passo 2)        |

No Vercel: Project Settings → Environment Variables → `VITE_GATEWAY_URL`.
Sem essa variável, `src/lib/data/client.ts` lança `GatewayError` em toda
chamada (`"VITE_GATEWAY_URL não configurado"`).

> Existe também um jeito de sobrescrever isso via URL (`?gw=...&t=...`,
> usado pelo hub pra preview/embed antes do domínio final existir — ver
> `docs/audit/v1-ship-readiness.md` §2). Não depende disso pra um deploy
> normal; a env var é o caminho padrão.

---

## 4. Primeiro login

1. Abra `/auth?tab=signup` e crie a primeira conta. **O primeiro usuário do
   tenant vira `admin` automaticamente** (regra do Better-Auth do gateway,
   `Importantdoc.md` §B8) — não existe passo de aprovação manual, não existe
   onboarding.
2. Crie uma segunda conta com outro email — ela vira `rep` automaticamente.
   Use as duas pra validar a separação de acesso (checklist completo em
   `docs/audit/v1-ship-readiness.md` §1).
3. Não existe caminho automático pra virar `manager` — isso é feito direto
   no Better-Auth do gateway, fora deste app.

---

## 5. Checklist antes de considerar pronto pro cliente

Ver **`docs/audit/v1-ship-readiness.md`** — é o checklist vivo, mais
detalhado que cabe aqui. Resumo dos itens que bloqueiam:

- [ ] Rep vs. admin/manager testado com 2 contas reais (nunca foi validado
      contra gateway real, só por leitura de código).
- [ ] Confirmar que `?preview=1` (bypass de login pro editor/preview) fica
      inerte no domínio final publicado.
- [ ] Migration `0001_business_schema.sql` aplicada **depois** das tabelas
      do Better-Auth existirem no Neon.
- [ ] `VITE_GATEWAY_URL` configurada no host (Vercel ou outro).

---

## Testar sem gateway real: branch `mockup`

Se você só quer mostrar a interface pra alguém (sem gateway/Neon
configurado ainda), existe uma branch separada `mockup` — login e dados são
100% fake (em memória, reseta a cada load), com um seletor de papel visível
na tela pra alternar entre admin/gerente/rep sem precisar de conta real.
**Não serve pra validar login real, permissões reais, ou dado persistente**
— é só uma casca pra visualização. A branch `deploy` (esta) é a que conecta
em infraestrutura real.
