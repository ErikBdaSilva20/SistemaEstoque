# Extensão 002 — Upload de arquivos (foto de produto, documento de compra)

**Substitui:** `supabase.storage.from('product-photos'|'purchase-documents')`.

## Motivação
Foto de produto e comprovantes de compra armazenados sem o cliente depender de URL externa.

## Por que é extensão (§A3)
Storage pesado é extensão de fundação.

## Superfície proposta no gateway
- `POST /storage/sign` → `{ key, bucket }` → devolve URL assinada de upload direto pra R2/S3.
- `GET /storage/:bucket/:key` → proxy autenticado ou URL assinada de leitura.
- Buckets do template: `product-photos`, `purchase-documents`.

## Impacto no schema
- `produtos.foto_url` já existe (v1 aceita URL externa).
- `pedidos_compra_documentos` (opcional, tabela filha com `owner_id`) — só se comprovante
  virar recurso de negócio.

## Impacto no template
- Componente `UploadFotoProduto` (recuperado do `ProductPhotoUpload` legado, adaptado).
- Fallback: se `VITE_STORAGE_URL` ausente → esconde botão de upload, mostra só input de URL.

## Secrets/config
`R2_ACCESS_KEY_ID`, `R2_SECRET`, `R2_BUCKET`, no gateway.

## Riscos
- Cotas e limites por tenant.
- Purga de arquivos órfãos quando `produto` é deletado.

## Critério de aceite
- Upload de JPEG 2MB → URL persistida em `produtos.foto_url` → render OK na tela.
