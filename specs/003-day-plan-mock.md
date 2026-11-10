# Spec 003: Мок сохранения плана дня

Связана со Spec 001. Клиент текущего экрана шлёт `POST /api/saveBuilderDay`, затем `DayView` читает `GET /api/dayPlan`. Эта спека описывает только мок в `server/`.

`useDayPlanQuery` передаёт в `GET` `date` и `athleteId`. Запись ищется по этой паре. Оба поля обязательны.

## User Story
Как спортсмен, я открываю тот же день в календаре и в `DayView` вижу непустые блоки, которые тренер сохранил из `BuilderDay` для этого спортсмена. План другого спортсмена на ту же дату не показывается. Пока для этой пары сохранения не было, карточки блоков нет.

## Acceptance Criteria
1. `POST /api/saveBuilderDay` отвечает `200` и `{ date, athleteId, workoutName, plan }`. `plan` ответа совпадает с переданным `plan`: те же строковые поля. Запись кладётся в пару `athleteId` + `date`. Поле `sections` в теле не читается.
2. Следующий `GET /api/dayPlan?date=<та же дата>&athleteId=<тот же id>` отвечает `200` и тем же телом. Чужой `athleteId` на ту же дату эту запись не отдаёт и не меняет.
3. Повторный `POST` той же пары заменяет и `plan`, и `workoutName` целиком, а не сливает поля со старой записью. Пустая строка `workoutName` стирает прежнее название только у этой пары. Другие спортсмены на ту же дату остаются.
4. `GET` пары без сохранения отвечает `200` и `{ date, athleteId, workoutName: "", plan: {} }`. Зашитых строк больше нет.
5. Нет `date` или строка пустая — `400` и `{ message: "Параметр date обязателен" }`. Правило общее для `POST` и `GET`. Запись не создаётся.
6. Нет `athleteId` или строка пустая — `400` и `{ message: "Параметр athleteId обязателен" }` и для `POST`, и для `GET`. Запись не создаётся и старая не меняется.
7. `athleteId` обрезается по краям. Сервер не сверяет его со списком `mockAthletes`: любая непустая строка — отдельный ключ. В `plan` поле `athleteId` не попадает. Так ходит `useDayPlanQuery`: оба параметра в query.
8. Пустой объект `plan`, отсутствие поля и значение не объект сохраняются как `plan: {}`. Для текущего экрана это не основной путь: клиент не шлёт запрос без блоков. Блоки, присланные только в `sections`, в запись не попадают.
9. Ключи `plan` не проверяются. Неизвестный ключ сохраняется как есть. Текст блока не проверяется. `DayView` показывает только известные ему непустые ключи.
10. Хранилище живёт в памяти процесса. Перезапуск сервера его очищает.
11. `workoutName` — отдельное поле записи, не ключ `plan`. Нет поля или значение не строка — в записи `""`, запрос не отклоняется. Строка обрезается по краям. Ключи `workoutName` и `athleteId` внутри `plan` не сохраняются. Нестроковые поля `plan` отбрасываются.

## Контракт

Ключи секций те же, что у `Plan` в `entities/day-plan/model/types.ts`: `warmUp`, `main`, `intervals`, `stretch`, `strength`, `coolDown`, `note`. Значение — строка. Сервер этот контракт повторяет своими типами и из `src/` ничего не импортирует.

Клиент Spec 001 кладёт в `plan` только активные блоки черновика. Пустая строка допустима. `DayView` такую строку не рисует.

```ts
// POST /api/saveBuilderDay
type SaveBuilderDayBody = {
  date: string;
  athleteId: string;
  workoutName?: string;
  plan: Partial<Record<string, string>>;
};

// ответ POST и GET /api/dayPlan
type DayData = {
  date: string;
  athleteId: string;
  workoutName: string;
  plan: Partial<Record<string, string>>;
};
```

Пример того, что уходит с текущего экрана:

```http
POST /api/saveBuilderDay
Content-Type: application/json

{ "date": "2026-11-04", "athleteId": "ivanov", "workoutName": "Лёгкий бег", "plan": { "warmUp": "10 минут легко" } }
```

```json
{ "date": "2026-11-04", "athleteId": "ivanov", "workoutName": "Лёгкий бег", "plan": { "warmUp": "10 минут легко" } }
```

```http
GET /api/dayPlan?date=2026-11-04&athleteId=petrova
```

Пока для Петровой на эту дату не было своего `POST`, ответ `{ "date": "2026-11-04", "athleteId": "petrova", "workoutName": "", "plan": {} }`. Запись Иванова на месте.

## Размещение
- `server/app.ts` — Express-приложение без `listen`: `express.json()`, хранилище, `GET /api/dayPlan`, `POST /api/saveBuilderDay`.
- `server/index.ts` — импортирует приложение и слушает порт `3001`.

Хранилище — `Map<string, { workoutName: string; plan: Plan }>`, ключ равен `athleteId + "\0" + date`. В запись кладутся только строковые поля тела `plan`. Нестроковые поля отбрасываются. `workoutName` хранится отдельно от `plan`. `athleteId` в `plan` не кладётся. Поле `sections` тела не читается.

## Out of Scope
- Проверка состава блоков и текста упражнений.
- Проверка, что `athleteId` есть в `mockAthletes`.
- Запись на диск и общее хранилище между перезапусками.
- Клиент: пункт «Сохранить», сбор `plan`, инвалидация `DayPlan`, состояние спортсмена в сторе — это Spec 001.
- Подгрузка плана в черновик `BuilderDay`. Это клиент Spec 001. `GET` пары уже отдаёт `{ date, athleteId, workoutName, plan }`, пара без сохранения — `{ date, athleteId, workoutName: "", plan: {} }`.

## Тесты
- `server/dayPlan.test.ts`:
  - `POST` с `date`, `athleteId`, `workoutName` и `plan` возвращает `{ date, athleteId, workoutName, plan }`, затем `GET` с тем же `date` и тем же `athleteId` возвращает это название и этот `plan`. Тело только с `sections` сохраняет `plan: {}`.
  - `POST` другого спортсмена на ту же дату не меняет `GET` первого. `GET` второго до его сохранения — пустая пара.
  - второй `POST` той же пары заменяет `plan` и `workoutName`, `GET` видит новую запись и не оставляет поля первого сохранения, которых нет во втором. Пустая строка `workoutName` стирает прежнее название только этой пары.
  - `GET` пары без сохранения возвращает `{ date, athleteId, workoutName: "", plan: {} }`, без зашитого текста.
  - нет `workoutName` или значение не строка — `200`, в записи `""`. Строка обрезается по краям. Ключи `workoutName` и `athleteId` внутри `plan` не сохраняются. Нестроковое поле отбрасывается.
  - `POST` и `GET` без `date` возвращают `400` и `{ message: "Параметр date обязателен" }`.
  - `POST` и `GET` без `athleteId` возвращают `400` и `{ message: "Параметр athleteId обязателен" }`. Уже сохранённые пары остаются.
