# Deploy — Compras & Estoque

> Reescrito em 2026-07-13. A versão anterior descrevia uma arquitetura
> Supabase (projeto dedicado, Edge Functions, RLS, Lovable Cloud) que **não
> existe mais neste código** — foi descartada numa reescrita anterior (ver
> `docs/audit/P0-bloqueadores.md`). A arquitetura real, por `Importantdoc.md`
> §B1–B4, é a descrita abaixo.

Este app é um **SPA estático** (Vite + React). Ele **nunca fala com o banco
direto** — tudo passa por um `tenant-gateway` (Better-Auth + `/data/:table`),
que é um **serviço separado**, não parte deste repositório:

```
[Este app: SPA Vite]  --HTTPS-->  [tenant-gateway]  --SQL-->  [Neon do tenant]
     servido por Vercel/            Better-Auth + /data/*        1 banco por cliente
     Cloudflare/qualquer            (repo à parte, ex:
     static host                    Cerebra-AI/tenant-gateway)
```

Publicar este repo sozinho **não é suficiente**. Você precisa de 3 peças,
nesta ordem:

## 1. Um projeto Neon (banco do tenant)

Crie um projeto em [neon.tech](https://neon.tech) — Postgres isolado só pra
este cliente/tenant. A connection string vai pro `tenant-gateway`, nunca pro
frontend.

## 2. Um `tenant-gateway` rodando e apontando pra esse Neon

Não faz parte deste repo. `dev-gateway/server.mjs` é só a versão mock local
(auth fake, pra dev contra o Postgres do Docker) — **não serve pra
produção**. Em produção é uma implementação real de Better-Auth + rotas
`/data/:table`, tipicamente o repo `Cerebra-AI/tenant-gateway`
(`Importantdoc.md` §B2). Ele cria as tabelas do Better-Auth **antes**; só
depois disso aplique `supabase/migrations/0001_business_schema.sql` no mesmo
Neon (ver `docs/architecture/04-modelo-dominio.md`).

Sem um `tenant-gateway` real, nenhuma tela deste app funciona — login e
dados dependem 100% dele.

## 3. O frontend (este repo)

```bash
npm ci
npm run build
# dist/ pronto — Vercel, Cloudflare Pages, Netlify, qualquer static host.
```

`vercel.json` já está no repo (build command, output dir, e o rewrite de SPA
`/* → /index.html`, necessário porque as rotas são client-side via
`react-router-dom`).

### Variável de ambiente obrigatória

| Variável           | Valor                                    |
| ------------------- | ---------------------------------------- |
| `VITE_GATEWAY_URL`  | URL pública do `tenant-gateway` (item 2) |

Sem essa variável, `src/lib/data/client.ts` lança `GatewayError` em toda
chamada.

## 4. Primeiro login

1. Abra `/auth?tab=signup` e crie a primeira conta — **vira `admin`
   automaticamente** (Better-Auth do gateway, `Importantdoc.md` §B8). Sem
   aprovação manual, sem onboarding.
2. Uma segunda conta vira `rep` automaticamente. Use as duas pra validar a
   separação de acesso.
3. Não existe caminho automático pra `manager` — é feito direto no
   Better-Auth do gateway, fora deste app.

## 5. Checklist antes de considerar pronto pro cliente

Ver `docs/audit/v1-ship-readiness.md` (checklist vivo). Resumo do que
bloqueia:

- [ ] Rep vs. admin/manager testado com 2 contas reais contra gateway real.
- [ ] `?preview=1` (bypass de login pro editor/preview) confirmado inerte no
      domínio final publicado.
- [ ] Migration `0001_business_schema.sql` aplicada **depois** das tabelas
      do Better-Auth existirem no Neon.
- [ ] `VITE_GATEWAY_URL` configurada no host escolhido.

## Testar a interface sem gateway (branch `mockup`)

A branch `mockup` (separada desta) tem login e dados 100% fake, com um
seletor de papel visível na tela — serve só pra mostrar a interface, não
valida login real nem permissões reais.
