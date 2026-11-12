# Delta Spec: Актуальная модель Groq

Правит модель в Spec 004 и в фазе A5 `ROADMAP.md`. Нового эндпоинта нет. Текст этих спек и код приведены к дельте. Промпт, температура, адрес Groq и разбор потока не меняются.

16 августа 2026 Groq отключил `llama-3.3-70b-versatile` для бесплатных и developer-аккаунтов. Запрос с этим именем отвечает `404` и `model_not_found`, без перенаправления. Рекомендованная замена — `openai/gpt-oss-120b`.

## Затронутые спецификации
- `specs/004-llm-day-actions.md` (MODIFIED)
- `ROADMAP.md`, фаза A5 (MODIFIED)

## MODIFIED Requirements

### [Spec 004] Acceptance Criteria
- **Было:** «Модель `llama-3.3-70b-versatile`, `temperature: 0.3`».
- **Стало:** модель `openai/gpt-oss-120b`, `temperature: 0.3`. Провайдер, адрес `POST https://api.groq.com/openai/v1/chat/completions`, `stream: true` и чтение `choices[0].delta.content` те же.

### [Spec 004] Контракт
- **Было:** тело запроса к Groq содержит `model: "llama-3.3-70b-versatile"` и `temperature: 0.3`.
- **Стало:** то же тело с `model: "openai/gpt-oss-120b"`. Системный промпт и сообщение пользователя не меняются.

### [Spec 004] Тесты
- **Было:** `server/smartAction.test.ts` проверяет модель `llama-3.3-70b-versatile`. Название теста называет эту модель.
- **Стало:** тот же тест проверяет `openai/gpt-oss-120b` и `temperature: 0.3`. Остальные проверки потока, `400`, `404` и `500` не меняются.

### [ROADMAP] Фаза A5
- **Было:** «Модель Groq `llama-3.3-70b-versatile`, `temperature: 0.3`».
- **Стало:** «Модель Groq `openai/gpt-oss-120b`, `temperature: 0.3`». Рядом в фазе A5 — ссылка на эту дельту.

## Out of Scope
- Текст системного промпта и сообщения пользователя.
- `temperature`, URL Groq, заголовок `Authorization` и формат SSE.
- Подмена любой ошибки провайдера на «LLM недоступна». Это Spec 004, критерии 8 и 9.
- Клиент меню «…», разбор JSON и `POST /api/saveBuilderDay`. Это Spec 005.
- Запасная модель `qwen/qwen3.6-27b` и смена провайдера.
