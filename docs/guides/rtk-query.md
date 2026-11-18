# RTK Query: контракт, теги, server/

Load when: добавляешь эндпоинт, работаешь с кэшем, правишь мок.

Один API на приложение. Второй `createApi` не заводится.

## База

`createApi` живёт в `src/shared/api/baseApi.ts`:

- `baseUrl: "/api"`
- эндпоинты в базе пустые: `endpoints: () => ({})`
- теги объявлены в `tagTypes` этой базы. Сейчас это `DayPlan`. Новый тег добавляется туда же.

Стор в `src/app/store` подключает `baseApi.reducer` и `baseApi.middleware`. Рядом стор импортирует модуль сущности (`import "@/entities/day-plan"`). Без этого импорта `injectEndpoints` не регистрируется.

## Эндпоинт сущности

1. Контракт — типы в `model/` сущности. Типы домена клиента остаются в `src/`.
2. Эндпоинт подключается через `injectEndpoints` в `entities/<слайс>/api`. Образец: `src/entities/day-plan/api/dayPlanApi.ts`.
3. Запрос отдаёт `providesTags`, мутация, которая меняет эти данные, — `invalidatesTags` тех же тегов. Иначе кэш `useGetDayPlanQuery` не обновляется.
4. Хук эндпоинта и типы выходят из `index.ts` сущности.
5. Фича собирает аргументы из своих селекторов и вызывает хук сущности. Образец: `src/features/select-day/model/useDayPlanQuery.ts`. Фича `select-day` принимает `athleteId` аргументом и не импортирует `select-athlete`.

Клиентское состояние (роль, выбранный день, выбранный спортсмен) — `createSlice` в `model/` владельца. В `shared` и в `app` такое состояние не кладётся. Читать и писать стор — через `useAppSelector` и `useAppDispatch` из `src/shared/lib/redux`.

## Прямой fetch

Виджет и фича `fetch` не вызывают. Исключение одно: `queryFn` мутации `smartAction` в `dayPlanApi.ts`. `fetchBaseQuery` отдаёт тело SSE целиком, поэтому куски потока читаются только там. В аргумент мутации слушатель не кладётся. Эта мутация тег `DayPlan` не инвалидирует: запись дня делает `saveBuilderDay`.

## server/

Мок в `server/` не импортирует типы из `src/`. Контракт эндпоинта описывается своими типами в `server/` или в спеке.

- `server/app.ts` — Express без `listen`: `express.json()`, память, маршруты.
- `server/index.ts` — слушает порт `3001`.
- Vite проксирует `/api` на `http://localhost:3001` (`npm run dev`).

Хранилище плана — `Map` в памяти процесса, ключ `athleteId + "\0" + date`. Перезапуск сервера его очищает. `POST /api/smartAction` эту `Map` не меняет: результат записывает клиент через `POST /api/saveBuilderDay`.
