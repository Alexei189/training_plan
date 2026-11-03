import { useState } from "react";

import { mockAthletes } from "@/entities/athlete";

import styles from "./AthleteSelect.module.css";

function AthleteSelect() {
  const [athleteId, setAthleteId] = useState(mockAthletes[0].id);

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="athlete-select">
        Спортсмен
      </label>
      <select
        id="athlete-select"
        className={styles.select}
        value={athleteId}
        onChange={(event) => setAthleteId(event.target.value)}
      >
        {mockAthletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.fullName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AthleteSelect;
