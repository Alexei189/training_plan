import express from "express";

const port = 3001;


function readDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = value.trim();
  return date.length > 0 ? date : null;
}

interface DayData {
  date: string;
  plan: Plan;
}

interface Plan {
  warmUp?: string;
  intervals?: string;
  main?: string;
  strength?: string;
  stretch?: string;
  coolDown?: string;
  note?: string;
}


function readAthleteId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const athleteId = value.trim();
  return athleteId.length > 0 ? athleteId : null;
}

function dayPlan(date: string, athleteId: string): DayData {
  const plan = {
    warmUp: "10 минут разминка",
    intervals: "10 минут интервалы",
    main: "10 минут основная тренировка",
    strength: "10 минут силовая тренировка",
    // stretch: "10 минут растяжка",
    coolDown: "10 минут разминка",
  }

  return { date, plan };
}


const app = express();

app.get("/api/dayPlan", (req, res) => {
  const date = readDate(req.query.date);

  if (!date) {
    res.status(400).json({ message: "Параметр date обязателен" });
    return;
  }

  res.json(dayPlan(date, readAthleteId(req.query.athleteId) ?? ""));
});


app.listen(port, () => {
  console.log(`Мок-сервер: http://localhost:${port}`);
});
