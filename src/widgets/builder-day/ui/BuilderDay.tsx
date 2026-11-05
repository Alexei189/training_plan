import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useSaveBuilderDay } from "@/features/save-builder-day";
import { selectAthleteId } from "@/features/select-athlete";
import { selectCurrentDate } from "@/features/select-day";
import {
  type PlanSectionKey,
  planSectionKeys,
  planSections,
} from "@/shared/config/planSections";
import { getDateWithWeekDay } from "@/shared/lib/date";
import { useAppSelector } from "@/shared/lib/redux";

import styles from "./BuilderDay.module.css";

interface DayDraft {
  workoutName: string;
  activeKeys: PlanSectionKey[];
  texts: Partial<Record<PlanSectionKey, string>>;
}

let copiedDraft: DayDraft | null = null;

function emptyDraft(): DayDraft {
  return {
    workoutName: "",
    activeKeys: [],
    texts: {},
  };
}

function cloneDraft(draft: DayDraft): DayDraft {
  return {
    workoutName: draft.workoutName,
    activeKeys: [...draft.activeKeys],
    texts: { ...draft.texts },
  };
}

function GrowingTextArea({
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
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
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

const actions = [
  { id: "edit", label: "Редактировать" },
  { id: "save", label: "Сохранить" },
  { id: "copy", label: "Копировать" },
  { id: "paste", label: "Вставить" },
] as const;

type DayAction = (typeof actions)[number]["id"];

function BuilderDay() {
  const currentDate = useAppSelector(selectCurrentDate);
  const athleteId = useAppSelector(selectAthleteId);
  const { save, isLoading } = useSaveBuilderDay();
  const [drafts, setDrafts] = useState<Record<string, DayDraft>>({});
  const [editingByDate, setEditingByDate] = useState<Record<string, boolean>>(
    {},
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(copiedDraft !== null);
  const menuRef = useRef<HTMLDivElement>(null);
  const draft = drafts[currentDate] ?? emptyDraft();
  const isEditing = editingByDate[currentDate] ?? true;

  const updateDraft = (update: (current: DayDraft) => DayDraft) => {
    setDrafts((prev) => {
      const current = prev[currentDate] ?? emptyDraft();

      return {
        ...prev,
        [currentDate]: update(current),
      };
    });
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const closeOnOutside = (event: MouseEvent) => {
      if (isLoading) {
        return;
      }

      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (isLoading) {
        return;
      }

      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isLoading, menuOpen]);

  const toggleSection = (key: PlanSectionKey) => {
    updateDraft((current) => ({
      ...current,
      activeKeys: current.activeKeys.includes(key)
        ? current.activeKeys.filter((item) => item !== key)
        : [...current.activeKeys, key],
    }));
  };

  const saveDraft = async () => {
    if (isLoading || !isEditing || draft.activeKeys.length === 0) {
      return;
    }

    const date = currentDate;
    const sections: DayDraft["texts"] = {};

    for (const key of draft.activeKeys) {
      sections[key] = draft.texts[key] ?? "";
    }

    const saved = await save({
      date,
      athleteId,
      workoutName: draft.workoutName,
      sections,
    });

    if (!saved) {
      return;
    }

    setEditingByDate((prev) => ({ ...prev, [date]: false }));
    setMenuOpen(false);
  };

  const runAction = (action: DayAction) => {
    if (action === "save") {
      void saveDraft();
      return;
    }

    if (action === "edit") {
      setEditingByDate((prev) => ({ ...prev, [currentDate]: true }));
    }

    if (action === "copy") {
      copiedDraft = cloneDraft(draft);
      setHasClipboard(true);
    }

    if (action === "paste" && copiedDraft) {
      const next = cloneDraft(copiedDraft);
      updateDraft(() => next);
    }

    setMenuOpen(false);
  };

  const isActionDisabled = (action: DayAction) => {
    if (action === "edit") {
      return isEditing;
    }

    if (action === "save") {
      return !isEditing || draft.activeKeys.length === 0 || isLoading;
    }

    if (action === "paste") {
      return !hasClipboard;
    }

    return false;
  };

  return (
    <div className={styles.root}>
      <div className={styles.cards}>
        {planSectionKeys.map((key) => {
          const selected = draft.activeKeys.includes(key);

          return (
            <button
              key={key}
              type="button"
              className={selected ? styles.cardSelected : styles.card}
              style={{ backgroundColor: planSections[key].backgroundColor }}
              aria-pressed={selected}
              disabled={!isEditing}
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
          <div className={styles.dateRow}>
            <div className={styles.date}>{getDateWithWeekDay(currentDate)}</div>
            <div className={styles.menu} ref={menuRef}>
              <button
                type="button"
                className={styles.menuButton}
                aria-label="Действия"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  if (isLoading) {
                    return;
                  }

                  setMenuOpen((open) => !open);
                }}
              >
                ···
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    className={styles.backdrop}
                    aria-label="Закрыть меню"
                    onClick={() => {
                      if (!isLoading) {
                        setMenuOpen(false);
                      }
                    }}
                  />
                  <ul className={styles.menuList} role="menu">
                    <li className={styles.menuTitle} role="presentation">
                      Действия
                    </li>
                    {actions.map((action) => (
                      <li key={action.id} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.menuItem}
                          disabled={isActionDisabled(action.id)}
                          onClick={() => runAction(action.id)}
                        >
                          {action.id === "save" && isLoading
                            ? "Сохранение…"
                            : action.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
          <label className={styles.titleField}>
            <span>Название тренировки</span>
            <GrowingTextArea
              value={draft.workoutName}
              onChange={(workoutName) =>
                updateDraft((current) => ({ ...current, workoutName }))
              }
              placeholder="Название тренировки"
              readOnly={!isEditing}
            />
          </label>
        </div>

        <div className={styles.fields}>
          {draft.activeKeys.map((key) => (
            <label key={key} className={styles.field}>
              <span>{planSections[key].label}</span>
              <GrowingTextArea
                value={draft.texts[key] ?? ""}
                readOnly={!isEditing}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    texts: { ...current.texts, [key]: value },
                  }))
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
