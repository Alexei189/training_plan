import { Outlet } from "react-router-dom";

import { TitleBar } from "@/widgets/title-bar";

import styles from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <div className={styles.root}>
      <TitleBar />
      <Outlet />
    </div>
  );
}
