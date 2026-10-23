import { appRoutes } from "@/shared/config/routes";

export const menuItems = [
  { label: "План", path: appRoutes.plan },
  { label: "Записи", path: appRoutes.records },
  { label: "Тренер", path: appRoutes.trainer },
] as const;
