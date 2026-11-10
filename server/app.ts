import express from "express";

import { handleSmartAction } from "./smartAction";

function readDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = value.trim();
  return date.length > 0 ? date : null;
}

function readAthleteId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const athleteId = value.trim();
  return athleteId.length > 0 ? athleteId : null;
}

type Plan = Record<string, string>;

interface StoredDay {
  workoutName: string;
  plan: Plan;
}

interface DayData {
  date: string;
  athleteId: string;
  workoutName: string;
  plan: Plan;
}

function readWorkoutName(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readPlan(value: unknown): Plan {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const plan: Plan = {};

  for (const [key, item] of Object.entries(value)) {
    if (key === "workoutName" || key === "athleteId" || typeof item !== "string") {
      continue;
    }

    plan[key] = item;
  }

  return plan;
}

function storageKey(athleteId: string, date: string): string {
  return `${athleteId}\0${date}`;
}

const days = new Map<string, StoredDay>();

export const app = express();

app.use(express.json());

app.get("/api/dayPlan", (req, res) => {
  const date = readDate(req.query.date);

  if (!date) {
    res.status(400).json({ message: "Параметр date обязателен" });
    return;
  }

  const athleteId = readAthleteId(req.query.athleteId);

  if (!athleteId) {
    res.status(400).json({ message: "Параметр athleteId обязателен" });
    return;
  }

  const stored = days.get(storageKey(athleteId, date));
  const body: DayData = {
    date,
    athleteId,
    workoutName: stored?.workoutName ?? "",
    plan: stored?.plan ?? {},
  };
  res.json(body);
});

app.post("/api/saveBuilderDay", (req, res) => {
  const date = readDate(req.body?.date);

  if (!date) {
    res.status(400).json({ message: "Параметр date обязателен" });
    return;
  }

  const athleteId = readAthleteId(req.body?.athleteId);

  if (!athleteId) {
    res.status(400).json({ message: "Параметр athleteId обязателен" });
    return;
  }

  const workoutName = readWorkoutName(req.body?.workoutName);
  const plan = readPlan(req.body?.plan);
  days.set(storageKey(athleteId, date), { workoutName, plan });

  const body: DayData = { date, athleteId, workoutName, plan };
  res.json(body);
});

app.post("/api/smartAction", async (req, res) => {
  const date = readDate(req.body?.date);

  if (!date) {
    res.status(400).json({ message: "Параметр date обязателен" });
    return;
  }

  const athleteId = readAthleteId(req.body?.athleteId);

  if (!athleteId) {
    res.status(400).json({ message: "Параметр athleteId обязателен" });
    return;
  }

  const stored = days.get(storageKey(athleteId, date));

  if (!stored) {
    res.status(404).json({ message: "План на эту дату не найден" });
    return;
  }

  await handleSmartAction(req, res, {
    date,
    athleteId,
    action: req.body?.action,
    day: {
      workoutName: stored.workoutName,
      plan: { ...stored.plan },
    },
  });
});
