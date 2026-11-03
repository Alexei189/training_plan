import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { selectRole } from "@/entities/session";
import { isRouteAllowed, roleHome } from "@/shared/config/roleAccess";
import { useAppSelector } from "@/shared/lib/redux";

export function RoleGuard({ children }: PropsWithChildren) {
  const role = useAppSelector(selectRole);
  const { pathname } = useLocation();

  if (!isRouteAllowed(role, pathname)) {
    return <Navigate to={roleHome[role]} replace />;
  }

  return children;
}

export function RoleHomeRedirect() {
  const role = useAppSelector(selectRole);

  return <Navigate to={roleHome[role]} replace />;
}
