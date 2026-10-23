import clsx from "clsx";
import { NavLink } from "react-router-dom";

import { menuItems } from "../model/menuItems";
import styles from "./TitleBar.module.css";

function TitleBar() {
  return (
    <header className={styles.titlebar}>
      <nav className={styles.titlebar__title} aria-label="Основная навигация">
        {menuItems.map(({ label, path }) => (
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
    </header>
  );
}

export default TitleBar;
