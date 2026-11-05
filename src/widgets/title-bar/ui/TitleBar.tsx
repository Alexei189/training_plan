import { NavLink } from "react-router-dom";
import clsx from "clsx";

import { RoleSwitch } from "@/features/switch-role";
import { selectRole } from "@/entities/session";
import { isRouteAllowed } from "@/shared/config/roleAccess";
import { useAppSelector } from "@/shared/lib/redux";

import { menuItems } from "../model/menuItems";

import styles from "./TitleBar.module.css";

function TitleBar() {
  const role = useAppSelector(selectRole);
  const visibleItems = menuItems.filter((item) =>
    isRouteAllowed(role, item.path),
  );

  return (
    <header className={styles.titlebar}>
      <nav className={styles.titlebar__title} aria-label="Основная навигация">
        {visibleItems.map(({ label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(styles.menuItem, isActive && styles.active)
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <RoleSwitch />
    </header>
  );
}

export default TitleBar;
