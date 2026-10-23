export const appRoutes = {
  plan: "/plan",
  records: "/records",
  trainer: "/trainer",
} as const;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];
