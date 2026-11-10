import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useSaveBuilderDay } from "@/features/save-builder-day";
import {
  cancelAthleteRequest,
  commitAthlete,
  selectAthleteId,
  selectPendingAthleteId,
  setLeaveGuard,
} from "@/features/select-athlete";
import {
  cancelDateRequest,
  commitDate,
  selectCurrentDate,
  selectPendingDate,
  useDayPlanQuery,
} from "@/features/select-day";
import type { DayData } from "@/entities/day-plan";
import {
  type PlanSectionKey,
  planSectionKeys,
  planSections,
} from "@/shared/config/planSections";
import { getDateWithWeekDay } from "@/shared/lib/date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import styles from "./BuilderDay.module.css";

interface DayDraft {
  workoutName: string;
  activeKeys: PlanSectionKey[];
  texts: Partial<Record<PlanSectionKey, string>>;
}

function pairKey(athleteId: string, date: string): string {
  return `${athleteId}\0${date}`;
}

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

function draftsEqual(left: DayDraft, right: DayDraft): boolean {
  if (left.workoutName !== right.workoutName) {
    return false;
  }

  if (left.activeKeys.length !== right.activeKeys.length) {
    return false;
  }

  return left.activeKeys.every(
    (key, index) =>
      key === right.activeKeys[index] &&
      (left.texts[key] ?? "") === (right.texts[key] ?? ""),
  );
}

function draftFromDayData(data: DayData): DayDraft {
  const plan = data.plan as Partial<Record<string, unknown>>;
  const activeKeys = planSectionKeys.filter(
    (key) => typeof plan[key] === "string",
  );
  const texts: DayDraft["texts"] = {};

  for (const key of activeKeys) {
    texts[key] = plan[key] as string;
  }

  return {
    workoutName: data.workoutName,
    activeKeys,
    texts,
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
  const dispatch = useAppDispatch();
  const currentDate = useAppSelector(selectCurrentDate);
  const pendingDate = useAppSelector(selectPendingDate);
  const athleteId = useAppSelector(selectAthleteId);
  const pendingAthleteId = useAppSelector(selectPendingAthleteId);
  const { currentData } = useDayPlanQuery(athleteId);
  const { save, isLoading } = useSaveBuilderDay();
  const [drafts, setDrafts] = useState<Record<string, DayDraft>>({});
  const [baselines, setBaselines] = useState<Record<string, DayDraft>>({});
  const [editingByPair, setEditingByPair] = useState<Record<string, boolean>>(
    {},
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [clipboard, setClipboard] = useState<DayDraft | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const key = pairKey(athleteId, currentDate);
  const draftReady = Object.prototype.hasOwnProperty.call(drafts, key);
  const draft = drafts[key] ?? emptyDraft();
  const baseline = baselines[key];
  const isEditing = editingByPair[key] ?? true;
  const isDirty = draftReady && (!baseline || !draftsEqual(draft, baseline));
  const leavePending = pendingDate !== null || pendingAthleteId !== null;
  const showLeaveDialog = leavePending && isDirty;

  useLayoutEffect(() => {
    dispatch(setLeaveGuard(true));

    return () => {
      dispatch(setLeaveGuard(false));
      dispatch(cancelDateRequest());
      dispatch(cancelAthleteRequest());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!leavePending || isDirty) {
      return;
    }

    if (pendingDate !== null) {
      dispatch(commitDate());
    }

    if (pendingAthleteId !== null) {
      dispatch(commitAthlete());
    }
  }, [dispatch, isDirty, leavePending, pendingAthleteId, pendingDate]);

  useEffect(() => {
    if (
      !currentData ||
      currentData.date !== currentDate ||
      currentData.athleteId !== athleteId
    ) {
      return;
    }

    const loaded = draftFromDayData(currentData);

    setDrafts((prev) => {
      if (prev[key]) {
        return prev;
      }

      return { ...prev, [key]: cloneDraft(loaded) };
    });
    setBaselines((prev) => {
      if (prev[key]) {
        return prev;
      }

      return { ...prev, [key]: cloneDraft(loaded) };
    });
  }, [athleteId, currentData, currentDate, key]);

  const updateDraft = (update: (current: DayDraft) => DayDraft) => {
    setDrafts((prev) => {
      const current = prev[key] ?? emptyDraft();

      return {
        ...prev,
        [key]: update(current),
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

  useEffect(() => {
    if (!showLeaveDialog) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (isLoading || event.key !== "Escape") {
        return;
      }

      dispatch(cancelDateRequest());
      dispatch(cancelAthleteRequest());
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [dispatch, isLoading, showLeaveDialog]);

  const toggleSection = (keyToToggle: PlanSectionKey) => {
    updateDraft((current) => ({
      ...current,
      activeKeys: current.activeKeys.includes(keyToToggle)
        ? current.activeKeys.filter((item) => item !== keyToToggle)
        : [...current.activeKeys, keyToToggle],
    }));
  };

  const saveDraft = async () => {
    if (isLoading || !isEditing || draft.activeKeys.length === 0) {
      return false;
    }

    const savedKey = key;
    const plan: DayDraft["texts"] = {};

    for (const sectionKey of draft.activeKeys) {
      plan[sectionKey] = draft.texts[sectionKey] ?? "";
    }

    const snapshot: DayDraft = {
      workoutName: draft.workoutName,
      activeKeys: [...draft.activeKeys],
      texts: { ...plan },
    };
    const saved = await save({
      date: currentDate,
      athleteId,
      workoutName: draft.workoutName,
      plan,
    });

    if (!saved) {
      return false;
    }

    setBaselines((prev) => ({ ...prev, [savedKey]: snapshot }));
    setEditingByPair((prev) => ({ ...prev, [savedKey]: false }));
    setMenuOpen(false);
    return true;
  };

  const confirmLeave = async () => {
    const saved = await saveDraft();

    if (!saved) {
      return;
    }

    dispatch(commitDate());
    dispatch(commitAthlete());
  };

  const discardLeave = () => {
    if (baseline) {
      const restored = cloneDraft(baseline);
      setDrafts((prev) => ({ ...prev, [key]: restored }));
    } else {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    dispatch(commitDate());
    dispatch(commitAthlete());
  };

  const cancelLeave = () => {
    if (isLoading) {
      return;
    }

    dispatch(cancelDateRequest());
    dispatch(cancelAthleteRequest());
  };

  const runAction = (action: DayAction) => {
    if (action === "save") {
      void saveDraft();
      return;
    }

    if (action === "edit") {
      setEditingByPair((prev) => ({ ...prev, [key]: true }));
    }

    if (action === "copy" && draftReady) {
      setClipboard(cloneDraft(draft));
    }

    if (action === "paste" && clipboard) {
      const next = cloneDraft(clipboard);
      updateDraft(() => next);
      setEditingByPair((prev) => ({ ...prev, [key]: true }));
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

    if (action === "copy") {
      return !draftReady;
    }

    if (action === "paste") {
      return clipboard === null;
    }

    return false;
  };

  const leaveSaveDisabled =
    !isEditing || draft.activeKeys.length === 0 || isLoading;

  return (
    <div className={styles.root}>
      <div className={styles.cards}>
        {planSectionKeys.map((sectionKey) => {
          const selected = draft.activeKeys.includes(sectionKey);

          return (
            <button
              key={sectionKey}
              type="button"
              className={selected ? styles.cardSelected : styles.card}
              style={{
                backgroundColor: planSections[sectionKey].backgroundColor,
              }}
              aria-pressed={selected}
              disabled={!isEditing}
              onClick={() => toggleSection(sectionKey)}
            >
              {planSections[sectionKey].label}
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
          {draft.activeKeys.map((sectionKey) => (
            <label key={sectionKey} className={styles.field}>
              <span>{planSections[sectionKey].label}</span>
              <GrowingTextArea
                value={draft.texts[sectionKey] ?? ""}
                readOnly={!isEditing}
                onChange={(value) =>
                  updateDraft((current) => ({
                    ...current,
                    texts: { ...current.texts, [sectionKey]: value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </form>
      {showLeaveDialog && (
        <div
          className={styles.leave}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-title"
        >
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Закрыть"
            onClick={cancelLeave}
          />
          <div className={styles.leaveCard}>
            <p id="unsaved-title" className={styles.leaveTitle}>
              Есть несохранённые изменения
            </p>
            <button
              type="button"
              className={styles.menuItem}
              disabled={leaveSaveDisabled}
              onClick={() => {
                void confirmLeave();
              }}
            >
              {isLoading ? "Сохранение…" : "Сохранить"}
            </button>
            <button
              type="button"
              className={styles.menuItem}
              disabled={isLoading}
              onClick={discardLeave}
            >
              Отменить изменения
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuilderDay;
