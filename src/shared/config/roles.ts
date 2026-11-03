export const roles = {
  athlete: "athlete",
  coach: "coach",
} as const;

export type Role = (typeof roles)[keyof typeof roles];

export const roleList: readonly Role[] = [roles.athlete, roles.coach];

export const roleLabels: Record<Role, string> = {
  athlete: "Спортсмен",
  coach: "Тренер",
};

export function isRole(value: unknown): value is Role {
  return value === roles.athlete || value === roles.coach;
}
