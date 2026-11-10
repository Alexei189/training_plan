# Delta Spec: Одно поле plan в сохранении и в ответе модели

Правит контракт Spec 001, Spec 002, Spec 003 и Spec 004. Нового эндпоинта нет. Текст этих спек и код приведены к дельте.

Единое имя — `plan`. Так уже называются `DayData`, ответ `GET /api/dayPlan`, запись `Map` и JSON модели Spec 004. Поле `sections` в теле `POST /api/saveBuilderDay` уходит.

## Затронутые спецификации
- `specs/001-save-builder-day.md` (MODIFIED)
- `specs/002-copy-buider-day.md` (MODIFIED)
- `specs/003-day-plan-mock.md` (MODIFIED)
- `specs/004-llm-day-actions.md` (MODIFIED)

## MODIFIED Requirements

### [Spec 001] Acceptance Criteria
- **Было:** «Нажатие отправляет `POST /api/saveBuilderDay` с телом `{ date, athleteId, workoutName, sections }`. `sections` — только активные блоки».
- **Стало:** тело `{ date, athleteId, workoutName, plan }`. `plan` — только активные блоки: ключ из `activeKeys`, значение `texts[key] ?? ""`. Неактивные блоки не отправляются. Ответ по-прежнему `{ date, athleteId, workoutName, plan }`.

### [Spec 001] Контракт клиента
- **Было:** `SaveBuilderDayBody.sections`.
- **Стало:** `SaveBuilderDayBody.plan` того же типа `Partial<Record<PlanSectionKey, string>>`. Хук `useSaveBuilderDay` принимает `plan`. Сбор блоков остаётся в `BuilderDay`.

### [Spec 002] Acceptance Criteria
- **Было:** сохранение вставленного плана шлёт `{ date, athleteId, workoutName, sections }`.
- **Стало:** то же тело с полем `plan`. Смысл «Сохранить» не меняется.

### [Spec 003] Acceptance Criteria
- **Было:** `plan` ответа совпадает с переданным `sections`. Пустой объект `sections` сохраняется как `plan: {}`. Ключ `workoutName` внутри `sections` в `plan` не попадает.
- **Стало:** `POST` читает блоки из `plan`. Ответ и `GET` по-прежнему кладут их в `plan`: те же строковые поля. Пустой объект `plan`, отсутствие поля и не объект дают `plan: {}`. Нестроковые поля отбрасываются. Ключи `workoutName` и `athleteId` внутри `plan` не сохраняются. Поле `sections` в теле не читается: присланные только в нём блоки в запись не попадают.

### [Spec 003] Контракт
- **Было:** `SaveBuilderDayBody.sections`.
- **Стало:** `SaveBuilderDayBody.plan`. Пример тела: `{ "date": "2026-11-04", "athleteId": "ivanov", "workoutName": "Лёгкий бег", "plan": { "warmUp": "10 минут легко" } }`. Ответ тот же, без переименования.

### [Spec 004] Acceptance Criteria
- **Было:** «В теле сохранения то же содержимое называется `sections`, не `plan`. Клиент копирует `plan` ответа в `sections`. Тело без `sections` мок записал бы как `plan: {}`».
- **Стало:** клиент после `[DONE]` шлёт `POST /api/saveBuilderDay` с `date`, `athleteId` исходного запроса и с `workoutName` и `plan` из JSON модели. Поле не переименовывается. `POST /api/smartAction` по-прежнему сам в `Map` не пишет.

### [Spec 004] Out of Scope
- **Было:** «Запись ответа модели в `Map` и переименование `plan` в `sections`».
- **Стало:** «Запись ответа модели в `Map`». Отдельного переименования больше нет.

## Out of Scope
- Смена имени `plan` в `GET`, в `DayData` и в `Map`.
- Разбор JSON модели на сервере Spec 004. Поток SSE остаётся текстом.
- Меню «…» и сборка ответа модели на клиенте. Когда этот клиент появится, он шлёт уже поле `plan`.
