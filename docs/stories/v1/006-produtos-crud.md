# Story 006 — Produtos CRUD

**Prioridade:** P1
**Escopo:** v1
**Depende de:** 003, 004, 005

## Contexto
Migrar `useProducts`, `Products`, `ProductDetail`, `ProductFormDialog`, `ProductsTable`,
`ProductKardex`, `ProductBatchesPanel`, `BatchFormDialog` para a nova camada.

## Objetivo
Cadastro completo de produtos (lista, criar, editar, ativar/desativar, detalhe com kardex
e lotes) usando `db.table('produtos')` e `db.table('lotes_produto')`.

## Fora de escopo
- Upload de foto (usa `foto_url` externo). Ver `ext-002-storage-uploads.md`.
- Lookup por código de barras. Ver `ext-005-barcode-lookup.md`.

## Regras aplicáveis
- §B5 — sem get-by-id; `ProductDetail` faz `list().find()`.
- §B4.1 — `lotes_produto` tem `owner_id`.

## Design
- `src/lib/data/produtos.repo.ts` e `lotes_produto.repo.ts`.
- `src/screens/produtos/{ProdutosScreen,ProdutoDetalheScreen}.tsx`.
- `src/components/produtos/{TabelaProdutos,FormProduto,PainelLotes,FormLote,Kardex}.tsx`.
- Kardex = `listMovimentacoes().filter(m => m.produto_id === id)` ordenado por data desc.

## Exemplo (antes → depois)
**Antes:**
```ts
const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('name');
```
**Depois:**
```ts
const produtos = (await listProdutos()).sort((a,b) => a.nome.localeCompare(b.nome));
```

## Tarefas
- [ ] Criar `produtos.repo.ts` e `lotes_produto.repo.ts`.
- [ ] Reescrever `useProdutos`, `useLotes`, `useKardex`.
- [ ] Migrar telas para os novos hooks.
- [ ] Remover `ProductPhotoUpload`; input `foto_url` no form.
- [ ] Rota `/produtos/:id` → carrega lista + `.find(id)`.

## DoD
- [ ] DoD padrão.
- [ ] Nenhum `store_id` no código.
- [ ] `owner_id` nunca no front.
- [ ] Fluxo criar → editar → arquivar → detalhe → kardex funciona.

## Gancho de extensão
- `ext-002-storage-uploads.md`, `ext-005-barcode-lookup.md`.
