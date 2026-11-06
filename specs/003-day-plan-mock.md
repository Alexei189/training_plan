# Spec 003: Мок сохранения плана дня

Связана со Spec 001. Клиент текущего экрана шлёт `POST /api/saveBuilderDay`, затем `DayView` читает `GET /api/dayPlan`. Сейчас `GET` всегда отдаёт зашитый текст и не помнит сохранение. Эта спека описывает только мок в `server/`.

`useDayPlanQuery` передаёт в `GET` только `date`. Запись ищется по дате. `athleteId` в `POST` обязателен и в ключ хранилища не входит: на текущем экране спортсмен выбран в шапке, а карточка дня запрашивает план только по дате календаря.

## User Story
Как спортсмен, я открываю тот же день в календаре и в `DayView` вижу непустые блоки, которые тренер сохранил из `BuilderDay`. Пока сохранения не было, карточки блоков нет.

## Acceptance Criteria
1. `POST /api/saveBuilderDay` отвечает `200` и `{ date, workoutName, plan }`. `plan` совпадает с переданным `sections`: те же строковые поля.
2. Следующий `GET /api/dayPlan?date=<та же дата>` отвечает `200` и тем же `{ date, workoutName, plan }`. `athleteId` в query не требуется.
3. Повторный `POST` на ту же дату заменяет и `plan`, и `workoutName` целиком, а не сливает поля со старой записью. Пустая строка `workoutName` стирает прежнее название.
4. `GET` на дату без сохранения отвечает `200` и `{ date, workoutName: "", plan: {} }`. Зашитых строк (разминка, интервалы и остальные фиксированные тексты) больше нет.
5. Нет `date` или строка пустая — `400` и `{ message: "Параметр date обязателен" }`. Правило общее для `POST` и `GET`.
6. В `POST` нет `athleteId` или строка пустая — `400` и `{ message: "Параметр athleteId обязателен" }`. Запись не создаётся и старая не меняется.
7. `GET` без `athleteId` отдаёт план этой даты. Так ходит `useDayPlanQuery`.
8. Пустой объект `sections` сохраняется как `plan: {}`. Для текущего экрана это не основной путь: клиент не шлёт запрос без блоков.
9. Ключи `sections` не проверяются. Неизвестный ключ сохраняется как есть. Текст блока не проверяется. `DayView` показывает только известные ему непустые ключи.
10. Хранилище живёт в памяти процесса. Перезапуск сервера его очищает.
11. `workoutName` — отдельное поле записи, не ключ `plan`. Нет поля или значение не строка — в записи `""`, запрос не отклоняется. Строка обрезается по краям. Ключ `workoutName` внутри `sections` в `plan` не попадает.

## Контракт

Ключи секций те же, что у `Plan` в `entities/day-plan/model/types.ts`: `warmUp`, `main`, `intervals`, `stretch`, `strength`, `coolDown`, `note`. Значение — строка. Сервер этот контракт повторяет своими типами и из `src/` ничего не импортирует.

Клиент Spec 001 кладёт в `sections` только активные блоки черновика. Пустая строка допустима. `DayView` такую строку не рисует.

```ts
// POST /api/saveBuilderDay
type SaveBuilderDayBody = {
  date: string;
  athleteId: string;
  workoutName?: string;
  sections: Partial<Record<string, string>>;
};

// ответ POST и GET /api/dayPlan
type DayData = {
  date: string;
  workoutName: string;
  plan: Partial<Record<string, string>>;
};
```

Пример того, что уходит с текущего экрана:

```http
POST /api/saveBuilderDay
Content-Type: application/json

{ "date": "2026-11-04", "athleteId": "ivanov", "workoutName": "Лёгкий бег", "sections": { "warmUp": "10 минут легко" } }
```

```json
{ "date": "2026-11-04", "workoutName": "Лёгкий бег", "plan": { "warmUp": "10 минут легко" } }
```

```http
GET /api/dayPlan?date=2026-11-04
```

Ответ тот же, включая `workoutName`. `POST` с другим `athleteId` и той же датой перезаписывает запись: в моке один план на дату. После смены роли спортсмен на эту дату видит последние сохранённые `workoutName` и `plan`.

## Размещение
- `server/app.ts` — Express-приложение без `listen`: `express.json()`, хранилище, `GET /api/dayPlan`, `POST /api/saveBuilderDay`.
- `server/index.ts` — импортирует приложение и слушает порт `3001`.

Хранилище — `Map<string, { workoutName: string; plan: Plan }>`, ключ равен `date`. В `plan` кладутся только строковые поля `sections`. Нестроковые поля `sections` отбрасываются. `workoutName` хранится отдельно от `plan`.

## Out of Scope
- Проверка состава блоков и текста упражнений.
- Разделение планов по `athleteId`.
- Запись на диск и общее хранилище между перезапусками.
- Клиент: пункт «Сохранить», сбор `sections`, инвалидация `DayPlan`, состояние спортсмена в сторе — это Spec 001.
- Подгрузка плана в черновик `BuilderDay`. Это клиент Spec 001. Мок не меняется: `GET` по дате уже отдаёт `{ date, workoutName, plan }`, дата без сохранения — `{ date, workoutName: "", plan: {} }`.

## Тесты
- `server/dayPlan.test.ts`:
  - `POST` с `date`, `athleteId`, `workoutName` и `sections` возвращает `{ date, workoutName, plan }`, затем `GET` с тем же `date` и без `athleteId` возвращает это название и этот `plan`.
  - второй `POST` на ту же дату заменяет `plan` и `workoutName`, `GET` видит новую запись и не оставляет поля первого сохранения, которых нет во втором. Пустая строка `workoutName` стирает прежнее название.
  - `GET` неизвестной даты возвращает `{ date, workoutName: "", plan: {} }`, без зашитого текста.
  - нет `workoutName` или значение не строка — `200`, в записи `""`. Строка обрезается по краям. Ключ `workoutName` внутри `sections` в `plan` не попадает.
  - `POST` и `GET` без `date` возвращают `400` и `{ message: "Параметр date обязателен" }`.
  - `POST` без `athleteId` возвращает `400` и `{ message: "Параметр athleteId обязателен" }`. `GET` этой даты по-прежнему отдаёт прежние `workoutName` и `plan`, а если сохранения не было — `{ date, workoutName: "", plan: {} }`.
