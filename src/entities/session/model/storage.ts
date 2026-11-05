import { isRole, type Role, roles } from "@/shared/config/roles";

const ROLE_STORAGE_KEY = "training-plan-role";

export function readStoredRole(): Role {
  try {
    const value = localStorage.getItem(ROLE_STORAGE_KEY);
    if (isRole(value)) {
      return value;
    }
  } catch {
    // Хранилище недоступно — остаётся роль по умолчанию.
  }

  return roles.athlete;
}

let cachedRole: Role | null = null;

export function persistRole(role: Role) {
  if (cachedRole === role) {
    return;
  }

  cachedRole = role;

  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // Хранилище недоступно — роль останется только в текущей сессии.
  }
}
