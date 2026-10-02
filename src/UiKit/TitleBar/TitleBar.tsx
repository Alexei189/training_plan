import { NavLink } from "react-router-dom";
import clsx from "clsx";
import styles from "./TitleBar.module.css";

type MenuItem = {
  label: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { label: "План", path: "/plan" },
  { label: "Записи", path: "/records" },
  { label: "Тренер", path: "/trainer" },
];

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
