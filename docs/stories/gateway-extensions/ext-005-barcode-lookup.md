# Extensão 005 — Barcode lookup (GTIN)

**Substitui:** edge function `barcode-lookup`, `useBarcodeLookup`, `BarcodeScanner`, página `Scan`.

## Motivação
Cadastrar produto rapidamente escaneando código de barras, preenchendo nome/marca/NCM/foto.

## Por que é extensão (§A3)
Chamada a APIs externas (Cosmos/Bluesoft, Open Food Facts) com token no server.

## Superfície proposta no gateway
- `GET /lookup/gtin/:gtin` autenticado → tenta Cosmos, cai em OFF, retorna
  `{ found, source, name, brand, ncm, image_url, ... }`.
- Cache em Redis por 30d.

## Impacto no schema
Nenhum (é lookup ephemeral). Opcional: cache local em `produtos_conhecidos` lookup.

## Impacto no template
- Botão "Escanear código" no form de produto (usa `@zxing/browser` no cliente para captura,
  chama gateway para lookup).

## Secrets/config
`COSMOS_TOKEN` no gateway.

## Riscos
- Rate limit do provedor.

## Critério de aceite
- Escanear GTIN válido preenche form; GTIN inválido retorna erro amigável.
