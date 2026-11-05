import { type Role, roles } from "./roles";
import { type AppRoute, appRoutes } from "./routes";

export const roleRoutes: Record<Role, readonly AppRoute[]> = {
  [roles.athlete]: [appRoutes.plan],
  [roles.coach]: [appRoutes.trainer, appRoutes.records],
};

export const roleHome: Record<Role, AppRoute> = {
  [roles.athlete]: appRoutes.plan,
  [roles.coach]: appRoutes.trainer,
};

export function isRouteAllowed(role: Role, pathname: string): boolean {
  return roleRoutes[role].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
