# Refactor Spec: Размещение сохранения дня в ROADMAP

Правит только описание фазы A1 в `ROADMAP.md`. Поведение клиента и мока не меняется: оно уже совпадает со Spec 001, Spec 003 и `specs/delta-001-refactor-workoutName.md`.

## Что расходилось

Блок **FSD** в A1 (`ROADMAP.md`, пункты про кнопку, хук, сущность и стор) описывал размещение, которого нет в Spec 001 и в коде.

| Было в ROADMAP | Как зафиксировано в документации и коде |
| --- | --- |
| `features/save-builder-day/ui/SaveButton.tsx`, состояния `idle` / `loading`, активность по «хотя бы одному блоку» | Отдельной кнопки нет. Пункт «Сохранить» уже в `widgets/builder-day/ui/BuilderDay.tsx`. Доступен, когда дата в режиме редактирования и в `activeKeys` есть хотя бы один ключ. Пока запрос идёт, подпись «Сохранение…». |
| Тело `POST`: `{ date, athleteId, sections }` | `{ date, athleteId, workoutName, sections }`. `workoutName` — строка черновика, в том числе пустая (Delta 001, Spec 001). |
| `entities/builder-day/api/builderDayApi.ts` и `entities/builder-day/model/types.ts` | Мутация `saveBuilderDay` в `entities/day-plan/api/dayPlanApi.ts` через `injectEndpoints` того же `dayPlanApi`. Типы — `entities/day-plan/model/types.ts`. Новый `createApi` и сущность `builder-day` не заводятся (`AGENTS.md`, Spec 001). |
| Импорт слайса `builder-day` в `src/App/store/index.ts`, чтобы зарегистрировать эндпоинт | Модуль `@/entities/day-plan` в сторе уже импортирован. Для мутации отдельный импорт не нужен. В том же сторе подключён редьюсер `features/select-athlete`: без него `BuilderDay` не собирает `athleteId`. |

Рядом, в блоке мока той же фазы, оставалась формулировка «`workoutName` в контракт не входит» и ответ `{ date, plan }`. Spec 003 и Delta 001 описывают `{ date, workoutName, plan }`. Этот пункт роадмапа приведён к Spec 003 в том же проходе: иначе FSD и мок внутри A1 противоречат друг другу.

`alert()` и комментарий `// TODO: replace with Toast` в хуке совпадают со Spec 001. Их роадмап не меняет.

## Стало в ROADMAP

- Пункт «Сохранить» живёт в `BuilderDay`. Хук `useSaveBuilderDay` принимает готовое тело и при ошибке вызывает `alert`.
- Контракт и мутация принадлежат сущности `day-plan`. `invalidatesTags: ["DayPlan"]`.
- Выбранный спортсмен — слайс `features/select-athlete`, редьюсер в `src/App/store/index.ts`.
- Мок отвечает `{ date, workoutName, plan }`. `workoutName` хранится отдельно от `plan`.

## Соответствие

- **Spec 001.** Фича не импортирует соседние фичи. Дату, `athleteId`, `workoutName` и `sections` собирает виджет и передаёт в хук. Публичный выход фичи — именованный хук из `index.ts`.
- **AGENTS.md, RTK Query.** Один `createApi`. Эндпоинт сущности через `injectEndpoints`. Хук мутации и `SaveBuilderDayBody` выходят из `entities/day-plan/index.ts`. Клиентское состояние спортсмена — `createSlice` владельца. `server/` типы из `src/` не импортирует.
- **Spec 003 и Delta 001.** Тело и ответ включают `workoutName`. Ключ хранилища — только `date`.
- **Код.** `SaveButton.tsx` и `entities/builder-day/` отсутствуют. Мутация — `dayPlanApi.ts`. Хук — `useSaveBuilderDay.ts`. Стор импортирует `@/entities/day-plan` и `selectAthleteReducer`.
