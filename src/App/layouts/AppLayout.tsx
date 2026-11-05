import { Outlet } from "react-router-dom";

import { selectRole } from "@/entities/session";
import { AthleteSelect } from "@/features/select-athlete";
import { roles } from "@/shared/config/roles";
import { useAppSelector } from "@/shared/lib/redux";
import { TitleBar } from "@/widgets/title-bar";

import styles from "./AppLayout.module.css";

export function AppLayout() {
  const role = useAppSelector(selectRole);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <TitleBar />
        {role === roles.coach && <AthleteSelect />}
      </div>
      <Outlet />
    </div>
  );
}
