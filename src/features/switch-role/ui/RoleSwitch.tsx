import clsx from "clsx";

import { selectRole, setRole } from "@/entities/session";
import { roleLabels, roleList } from "@/shared/config/roles";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import styles from "./RoleSwitch.module.css";

function RoleSwitch() {
  const role = useAppSelector(selectRole);
  const dispatch = useAppDispatch();

  return (
    <div className={styles.root} role="group" aria-label="Роль">
      {roleList.map((item) => (
        <button
          key={item}
          type="button"
          className={clsx(styles.button, role === item && styles.active)}
          aria-label={roleLabels[item]}
          aria-pressed={role === item}
          title={roleLabels[item]}
          onClick={() => dispatch(setRole(item))}
        >
          {roleLabels[item].slice(0, 1)}
        </button>
      ))}
    </div>
  );
}

export default RoleSwitch;
