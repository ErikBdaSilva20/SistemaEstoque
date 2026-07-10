# Stories — índice

> ⚠️ **Não use este arquivo para saber onde paramos.** A fonte de verdade —
> ordem de execução, blocos, checkboxes de progresso — é
> [`../README.md`](../README.md) (o "cérebro"). Esta pasta é **anexo técnico**:
> abra o story individual quando o cérebro te mandar.

## O que tem aqui

- [`v1/`](./v1) — 19 stories do remix. **É o escopo executável.** A ordem e o
  agrupamento em blocos (A–F) ficam no cérebro, §3 e §5.
- [`gateway-extensions/`](./gateway-extensions) — Onda 2. **Não entra no v1.**
  Cada arquivo é uma capacidade que exige trabalho no repositório
  `tenant-gateway`, não neste projeto.
- [`_template.md`](./_template.md) — modelo obrigatório ao criar story novo.

## Estrutura de um story

Todo story em `v1/` segue o template e traz:

1. Prioridade (P0/P1/P2) · Escopo (v1) · Depende de.
2. Contexto (regra do Importantdoc + item da auditoria).
3. Objetivo · Fora de escopo.
4. Regras aplicáveis (âncoras a `../reference/Importantdoc.md`).
5. Design / Arquitetura (tabelas, endpoints, componentes).
6. Exemplo antes/depois com snippet real.
7. Tarefas (checklist ordenado).
8. Definition of Done específico.
9. Riscos.
10. Gancho de extensão (aponta para `gateway-extensions/` — só referência, sem descrever).

## Definition of Done herdado

Todo story v1 herda o DoD padrão do cérebro (§1.7). Não repetir aqui — se
mudar, muda **só no cérebro**.

## Regra dura

`v1/**` **não pode** mencionar realtime, webhook, edge function, storage
bucket, integração externa, secret, IA ou cron como parte do escopo. Isso é
`gateway-extensions/**`.
