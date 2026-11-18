# AGENTS.md — training_plan

> Карта проекта для агента. Детали — в `docs/` по ссылкам ниже.
> Перед завершением задачи запусти `./scripts/verify.sh` и приложи вывод.

## 1. Project Overview

SPA на **FSD + RTK Query**. Алиас `@/*` → `src/*`. Роли: `athlete`, `coach`.
Мок-сервер в `server/` повторяет контракт эндпоинтов **локальными** типами.
Клиентский домен — только в `src/`.

## 2. Quick Start Commands

| Команда | Назначение |
|---|---|
| `npm run dev` | Vite + мок, прокси `/api` → `http://localhost:3001` |
| `npm run typecheck` | Проверка типов (после серии правок) |
| `npx vitest run <path>` | Тесты по затронутым модулям (тест лежит рядом с модулем) |
| `./scripts/verify.sh` | Единая проверка перед завершением задачи |

## 3. Load-Bearing Rules

Парные правила: «нельзя» → «нужно».

- **Слайс.** Нужно: импорт из `index.ts` (`@/entities/day-plan`). Нельзя: из внутреннего файла (`@/entities/day-plan/model/...`).
- **Слои.** Нужно: зависимость только вниз `app → pages → widgets → features → entities → shared`; общее — в `shared` или ниже. Нельзя: импорт из слоя выше и из соседнего слайса того же слоя.
- **API.** Нужно: один `createApi` в `src/shared/api/baseApi.ts` (`baseUrl: "/api"`, пустые эндпоинты) и `injectEndpoints` в `entities/*/api`. Нельзя: второй `createApi` и прямой `fetch`.
- **Теги.** Нужно: у запроса `providesTags`, у мутации `invalidatesTags` тех же тегов `baseApi`. Нельзя: запрос или мутация без этих тегов.
- **Клиентское состояние.** Нужно: `createSlice` в `model/` владельца; чтение и запись через `useAppSelector` / `useAppDispatch` из `src/shared/lib/redux`. Нельзя: класть роль и выбранный день в `shared` или `app`.
- **Мок.** Нужно: контракт эндпоинта своими типами в `server/` или в спеке. Нельзя: импорт доменных типов из `src/`.
- **Меню.** Нужно: видимость через `isRouteAllowed`, путь — в четыре места из workflow ниже. Нельзя: отдельный список пунктов на роль.
- **Журнал и дельты.** Нужно: править `JOURNAL.md` и текст затронутых спек только по команде; до команды дельта — отдельный файл. Нельзя: писать журнал или переносить дельту в спеки самостоятельно.

## 4. Workflows

### Новый маршрут
1. Добавь путь в `appRoutes` (`src/shared/config/routes.ts`).
2. Добавь путь в `roleRoutes` (`src/shared/config/roleAccess.ts`).
3. Добавь путь в `roleHome` в том же файле, если это домашний экран роли.
4. Оберни страницу в `Route` с `RoleGuard` в `src/app/router`.
5. Добавь пункт в `menuItems` (`src/widgets/title-bar/model/menuItems.ts`), если экран есть в навигации.

### Новый эндпоинт сущности
1. Опиши контракт в `model/` сущности.
2. Подключи эндпоинт через `injectEndpoints` в `entities/<слайс>/api`.
3. Укажи `providesTags` у запроса и `invalidatesTags` у мутации.
4. Реэкспортируй хук и типы из `index.ts` сущности.
5. Собери в фиче аргументы из её селекторов и вызови хук сущности.
6. Импортируй модуль сущности в `src/app/store`.

## 5. Decision Table

| Вопрос | Нужно | Нельзя |
|---|---|---|
| Где хранить клиентское состояние (роль, день)? | `createSlice` в `model/` владельца | `shared` или `app` |
| Как подключить эндпоинт? | `injectEndpoints` в `entities/*/api` | второй `createApi` / `fetch` |
| Где контракт эндпоинта на сервере? | локальные типы в `server/` | импорт из `src/` |
| Как показать пункт меню? | `appRoutes` + `isRouteAllowed` | отдельный список на роль |
| Где лежит тест? | рядом с модулем | отдельная `tests/` папка |
| Какой компонент для дня? | `BuilderDay` — конструктор, `DayView` — карточка | самодельный «day card» |

## 6. Reference Docs

Загружай по требованию:

- **FSD: слои, сегменты, экспорты** → `docs/architecture/LAYERS.md`
  *Когда:* добавляешь слайс, переносишь код между слоями, сомневаешься в направлении импорта.
- **RTK Query: контракт, теги, `server/`** → `docs/guides/rtk-query.md`
  *Когда:* добавляешь эндпоинт, работаешь с кэшем, правишь мок.
- **Маршрутизация и роли** → `docs/guides/routing.md`
  *Когда:* добавляешь маршрут, правишь `RoleGuard` / `roleRoutes` / `menuItems`.
- **Проверка, журнал, дельта-спеки** → `docs/guides/verification.md`
  *Когда:* завершаешь задачу, пишешь тесты, правишь `JOURNAL.md` или дельту.
- **UI-словарь (Ubiquitous Language)** → `docs/glossary.md`
  *Когда:* называешь компоненты и задачи — используй `BuilderDay`, `DayView` и т.д.

## 7. Reference Implementations

- Страница: `src/pages/plan`
- Сущность + API: `src/entities/day-plan/api/dayPlanApi.ts`
- Фича-хук: `src/features/select-day/model/useDayPlanQuery.ts`
- Стор: `src/app/store`
- Виджеты: `src/widgets/builder-day/ui/BuilderDay.tsx` (BuilderDay),
  `src/widgets/day-view/ui/DayView.tsx` (DayView)

## 8. Maintaining This File 

`AGENTS.md` — карта, `docs/` — детали. Держи файл **≤ 150 строк**.
Если правило не помещается в одну строку — вынеси в `docs/` и оставь ссылку.
Все «нельзя» должны иметь парное «нужно».
