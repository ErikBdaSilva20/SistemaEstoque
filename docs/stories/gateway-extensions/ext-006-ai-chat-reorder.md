# Extensão 006 — IA (chat, reposição, forecast, anomalias)

**Substitui:** `ai-chat`, `ai-suggest-reorder`, `useForecast`, `useAnomalies`,
componentes `AiChatDrawer`, `AiReorderDialog`, `AiUsagePanel`, `ForecastPreviewCard`,
`AnomaliesCard`, page `Forecast`.

## Motivação
- Chat pra perguntar sobre o estoque em linguagem natural.
- Sugestão automática de itens a repor baseada em histórico.
- Previsão de demanda; detecção de anomalias em movimentações.

## Por que é extensão (§A3)
LLM no server (chave OpenAI/Anthropic), streaming, cache de respostas, contexto do tenant.

## Superfície proposta no gateway
- `POST /ai/chat` (stream SSE) — contexto = snapshot do tenant.
- `POST /ai/suggest-reorder` — retorna `{ produto_id, qtd_sugerida, justificativa }[]`.
- `POST /ai/forecast/:produto_id` — série futura.
- `POST /ai/anomalies` — retorna lista de movimentações suspeitas.

## Impacto no schema
- `ai_conversas` + `ai_mensagens` (com owner_id) — só se quiser persistir histórico.
- `ai_uso` (log de tokens por tenant).

## Impacto no template
- `AiChatDrawer` reintroduzido consumindo SSE.
- Cards de dashboard voltam.

## Secrets/config
Chaves de LLM ficam no gateway (ou via Composio).

## Riscos
- Custo por conversa; controle por plano.
- Vazamento de dados do tenant no prompt.

## Critério de aceite
- Chat responde perguntas sobre inventário do próprio tenant.
- Reorder sugere itens abaixo de `estoque_min`.
