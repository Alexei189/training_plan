import express from "express";

const port = 3001;

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface TrainingDayMock {
  id: string;
  title: string;
  exercises: Exercise[];
}



const defaultPlan: Omit<TrainingDayMock, "id">[] = [
  {
    title: "Общая тренировка",
    exercises: [
      { name: "Приседания", sets: 3, reps: "10" },
      { name: "Отжимания", sets: 3, reps: "12" },
      { name: "Планка", sets: 3, reps: "40 сек" },
    ],
  },
];

function readDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = value.trim();
  return date.length > 0 ? date : null;
}

interface DayNote {
  date: string;
  text: string;
}

const notesByAthlete = 'здесь текстовый блок на день тренировки'

function readAthleteId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const athleteId = value.trim();
  return athleteId.length > 0 ? athleteId : null;
}

function dayPlan(date: string, athleteId: string): DayNote {
  const text = notesByAthlete

  return { date, text };
}


const app = express();

app.get("/api/dayPlan", (req, res) => {
  const date = readDate(req.query.date);
  const athleteId = readAthleteId(req.query.athleteId);

  if (!date || !athleteId) {
    res.status(400).json({ message: "Параметры date и athleteId обязательны" });
    return;
  }

  res.json(dayPlan(date, athleteId));
});


app.listen(port, () => {
  console.log(`Мок-сервер: http://localhost:${port}`);
});
