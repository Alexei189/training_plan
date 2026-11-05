# Delta Spec: Название тренировки

## Затронутые спецификации
- `specs/001-save-builder-day.md` (MODIFIED)
- `specs/003-day-plan-mock.md` (MODIFIED)

## MODIFIED Requirements

### [Spec 001] Acceptance Criteria
- **Было:** «Нажатие отправляет `POST /api/saveBuilderDay` с телом `{ date, athleteId, sections }`. `workoutName` не отправляется».
- **Стало:** «Нажатие отправляет `POST /api/saveBuilderDay` с телом `{ date, athleteId, workoutName, sections }`. `workoutName` — строка черновика, в том числе пустая. `sections` по-прежнему только активные блоки».

### [Spec 001] Acceptance Criteria
- **Было:** «Смена роли на спортсмена показывает в `DayView` непустые сохранённые блоки».
- **Стало:** «Смена роли на спортсмена показывает в `DayView` непустые блоки и непустое `workoutName` заголовком дня в шапке. Пустое название не рисуется. Карточкой секции оно не становится».

### [Spec 001] Контракт клиента
- **Было:** `SaveBuilderDayBody` — `{ date, athleteId, sections }`. Ответ — `DayData` с `{ date, plan }`.
- **Стало:** `SaveBuilderDayBody` — `{ date, athleteId, workoutName, sections }`. `DayData` — `{ date, workoutName, plan }`.

### [Spec 001] Out of Scope
- **Было:** «Сохранение и показ `workoutName`. В `DayView` его нет».
- **Стало:** «Загрузка сохранённого названия обратно в черновик `BuilderDay`».

### [Spec 003] Acceptance Criteria
- **Было:** «`POST` с телом `{ date, athleteId, sections }` отвечает `{ date, plan }`. Следующий `GET` отвечает тем же `{ date, plan }`. Повторный `POST` заменяет `plan`. Дата без сохранения — `{ date, plan: {} }`».
- **Стало:** «`POST` отвечает `{ date, workoutName, plan }`. Следующий `GET` отдаёт то же название. Повторный `POST` заменяет и `plan`, и `workoutName`: пустая строка стирает прежнее название. Дата без сохранения — `{ date, workoutName: "", plan: {} }`».

### [Spec 003] Acceptance Criteria
- **Было:** «`workoutName` в теле нет. Если поле всё же прислали, в `plan` оно не попадает».
- **Стало:** «`workoutName` — отдельное поле записи, не ключ `plan`. Нет поля или значение не строка — в записи `""`, запрос не отклоняется. Строка обрезается по краям. Ключ `workoutName` внутри `sections` в `plan` не попадает».

### [Spec 003] Out of Scope
- **Было:** «Показ `workoutName` и загрузка плана обратно в конструктор».
- **Стало:** «Загрузка плана обратно в конструктор».
