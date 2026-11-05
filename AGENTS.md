# Инструкции агента

Постоянные правила для training_plan. Новый код повторяет эти схемы, а не обходит их.

## FSD

Код в `src/`. Алиас `@/*` → `src/*`. Слайс снаружи виден только через свой `index.ts`.

Зависимости идут вниз: `App` → `pages` → `widgets` → `features` → `entities` → `shared`. Слайс берёт код только из слоёв ниже. Соседний слайс того же слоя не импортируется.

- `App` — стор, провайдеры, роутер, каркас экрана.
- `pages` — сборка одного маршрута из виджетов. Образец: `src/pages/plan`.
- `widgets` — самостоятельный блок экрана.
- `features` — одно действие пользователя: слайс, селекторы, хук сценария.
- `entities` — домен: типы и серверное состояние.
- `shared` — api, config, lib, ui без знания домена.

Сегменты слайса по необходимости: `ui/`, `model/`, `api/`. Страница и виджет отдают компонент через `export default` в `ui/` и именованный реэкспорт из `index.ts`. Хук, слайс, селектор и тип — именованный экспорт.

## RTK Query

Один API на приложение: `createApi` в `src/shared/api/baseApi.ts`, `baseUrl: "/api"`, эндпоинты в базе пустые. Второй `createApi` и прямой `fetch` не заводят.

- Сущность описывает контракт в `model/` и подключает эндпоинты через `injectEndpoints`. Образец: `src/entities/day-plan/api/dayPlanApi.ts`.
- Запрос отдаёт `providesTags`, изменение — `invalidatesTags` тех же тегов `baseApi`.
- Хук эндпоинта и типы сущности выходят из её `index.ts`.
- Фича собирает аргументы запроса из своих селекторов и вызывает хук сущности. Образец: `src/features/select-day/model/useDayPlanQuery.ts`.
- Стор в `src/app/store` подключает `baseApi.reducer`, `baseApi.middleware` и импортирует модуль сущности, иначе `injectEndpoints` не регистрируется.
- Клиентское состояние (роль, выбранный день) — `createSlice` в `model/` владельца. Читать и писать стор через `useAppSelector` и `useAppDispatch` из `src/shared/lib/redux`.
- `server/` повторяет контракт эндпоинта своими типами. Типы домена клиента остаются в `src/`.

## server/

Мок-сервер не импортирует типы из `src/`. Контракт эндпоинта описывается локально в `server/` или в спеке.

## Маршрутизация

Пути — константы `appRoutes` в `src/shared/config/routes.ts`. Кто куда может зайти — `roleRoutes` и `roleHome` в `src/shared/config/roleAccess.ts`. Роли: `athlete`, `coach` (`src/shared/config/roles.ts`).

Дерево в `src/App/router`: общий `AppLayout`, индекс и неизвестный путь ведут в `RoleHomeRedirect`, страница маршрута обёрнута в `RoleGuard`. Оба смотрят на `selectRole`: чужой путь заменяется на `roleHome` этой роли.

Пункты меню лежат в `src/widgets/title-bar/model/menuItems.ts` и ссылаются на `appRoutes`. Видимость считает `isRouteAllowed`, отдельный список пунктов на роль не заводится.

Новый маршрут добавляется сразу в четыре места: `appRoutes`, `roleRoutes` (и `roleHome`, если это домашний экран роли), `Route` с `RoleGuard` в роутере, пункт `menuItems`, если он есть в навигации.

## Проверка

- `npm run dev` — Vite и мок, прокси `/api` → `http://localhost:3001`.
- `npm run typecheck` после серии правок.
- `npx vitest run <path>` по затронутым тестам. Тест лежит рядом с модулем.
- Экран проверить в браузере под каждой ролью, которой маршрут доступен, и под ролью, которой он закрыт.

## UI Словарь (Ubiquitous Language)
При описании задач и генерации кода использовать следующие названия:
- **BuilderDay** — конструктор дня (`widgets/builder-day/ui/BuilderDay.tsx`).
- **DayView** - карточка дня спортсмена (`widgets/day-view/ui/DayView.tsx`) 