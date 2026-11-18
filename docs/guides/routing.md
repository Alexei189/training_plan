# Маршрутизация и роли

Load when: добавляешь маршрут, правишь `RoleGuard`, `roleRoutes` или `menuItems`.

Роли: `athlete`, `coach`. Константы, подписи и проверка значения — `src/shared/config/roles.ts`.

## Куда можно зайти

Пути — `appRoutes` в `src/shared/config/routes.ts`.

Кто куда может зайти — `roleRoutes` и `roleHome` в `src/shared/config/roleAccess.ts`.

| Роль | Маршруты | Домашний экран |
|---|---|---|
| `athlete` | `/plan` | `/plan` |
| `coach` | `/trainer`, `/records` | `/trainer` |

`isRouteAllowed(role, pathname)` считает видимость. Отдельный список пунктов меню на роль не заводится.

## Дерево

Роутер — `src/app/router`. Общий каркас — `AppLayout`.

- Индекс `/` и неизвестный путь ведут в `RoleHomeRedirect`.
- Страница маршрута обёрнута в `RoleGuard`.

Оба смотрят на `selectRole`. Если путь роли не разрешён, `RoleGuard` заменяет его на `roleHome` этой роли.

Пункты меню лежат в `src/widgets/title-bar/model/menuItems.ts` и ссылаются на `appRoutes`. `TitleBar` оставляет пункт, если `isRouteAllowed` для текущей роли истинен.

## Новый маршрут

Сразу четыре места:

1. Путь в `appRoutes`.
2. Путь в `roleRoutes` и, если это домашний экран роли, в `roleHome`.
3. `Route` с `RoleGuard` в `src/app/router`.
4. Пункт в `menuItems`, если экран есть в навигации.

После этого экран проверяется под каждой ролью, которой маршрут открыт, и под ролью, которой он закрыт. Закрытый путь должен увести на `roleHome`.
