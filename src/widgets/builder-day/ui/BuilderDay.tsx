import { useLayoutEffect, useRef, useState } from "react";

import { selectCurrentDate } from "@/features/select-day";
import {
  type PlanSectionKey,
  planSectionKeys,
  planSections,
} from "@/shared/config/planSections";
import { getDateWithWeekDay } from "@/shared/lib/date";
import { useAppSelector } from "@/shared/lib/redux";

import styles from "./BuilderDay.module.css";

function GrowingTextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function BuilderDay() {
  const currentDate = useAppSelector(selectCurrentDate);
  const [workoutName, setWorkoutName] = useState("");
  const [activeKeys, setActiveKeys] = useState<PlanSectionKey[]>([]);
  const [texts, setTexts] = useState<Partial<Record<PlanSectionKey, string>>>(
    {},
  );

  const toggleSection = (key: PlanSectionKey) => {
    setActiveKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.cards}>
        {planSectionKeys.map((key) => {
          const selected = activeKeys.includes(key);

          return (
            <button
              key={key}
              type="button"
              className={selected ? styles.cardSelected : styles.card}
              style={{ backgroundColor: planSections[key].backgroundColor }}
              aria-pressed={selected}
              onClick={() => toggleSection(key)}
            >
              {planSections[key].label}
            </button>
          );
        })}
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={styles.header}>
          <div className={styles.date}>{getDateWithWeekDay(currentDate)}</div>
          <label className={styles.titleField}>
            <span>Название тренировки</span>
            <GrowingTextArea
              value={workoutName}
              onChange={setWorkoutName}
              placeholder="Название тренировки"
            />
          </label>
        </div>

        <div className={styles.fields}>
          {activeKeys.map((key) => (
            <label key={key} className={styles.field}>
              <span>{planSections[key].label}</span>
              <GrowingTextArea
                value={texts[key] ?? ""}
                onChange={(value) =>
                  setTexts((prev) => ({ ...prev, [key]: value }))
                }
              />
            </label>
          ))}
        </div>
      </form>
    </div>
  );
}

export default BuilderDay;
