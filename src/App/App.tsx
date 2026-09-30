import { AppProps } from "./types";
import { navigation } from "../Routes";
import { NavigationItem } from "../Routes/types";
import { NavLink, Outlet } from "react-router-dom";

import styles from "./App.module.css";
import Home from "../Pages/Home";

function renderNavigationItem(
  navigationItem: NavigationItem,
  rootStyles?: Record<string, string>,
) {
  return (
    <NavLink to={navigationItem.href} end={navigationItem.href === "/"}>
      {navigationItem.displayName}
    </NavLink>
  );
}
function App({ className, style }: AppProps) {
  return (
    <div style={style}>
      <Home />
      <Outlet />
    </div>
  );
}

export default App;
