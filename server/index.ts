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

const plansByWeekday: Record<string, Omit<TrainingDayMock, "id">[]> = {
  Пн: [
    {
      title: "Силовая: ноги",
      exercises: [
        { name: "Приседания", sets: 4, reps: "8" },
        { name: "Румынская тяга", sets: 3, reps: "10" },
        { name: "Выпады", sets: 3, reps: "10 на ногу" },
      ],
    },
  ],
  Вт: [
    {
      title: "Силовая: верх",
      exercises: [
        { name: "Жим лёжа", sets: 4, reps: "6–8" },
        { name: "Тяга в наклоне", sets: 4, reps: "8" },
        { name: "Жим гантелей сидя", sets: 3, reps: "10" },
      ],
    },
  ],
  Ср: [
    {
      title: "Восстановление",
      exercises: [
        { name: "Лёгкий бег", sets: 1, reps: "30 мин" },
        { name: "Мобилити", sets: 1, reps: "15 мин" },
      ],
    },
  ],
  Чт: [
    {
      title: "Силовая: всё тело",
      exercises: [
        { name: "Становая тяга", sets: 4, reps: "5" },
        { name: "Подтягивания", sets: 4, reps: "6–8" },
        { name: "Планка", sets: 3, reps: "40 сек" },
      ],
    },
  ],
  Пт: [
    {
      title: "Интервалы",
      exercises: [
        { name: "Гребля", sets: 8, reps: "30 сек / 90 сек отдых" },
        { name: "Берпи", sets: 4, reps: "10" },
      ],
    },
  ],
  Сб: [
    {
      title: "Длинная аэробная",
      exercises: [{ name: "Велосипед", sets: 1, reps: "60–90 мин" }],
    },
  ],
  Вс: [
    {
      title: "Отдых",
      exercises: [],
    },
  ],
};

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

function planForDate(date: string): TrainingDayMock[] {
  const weekday = date.split(" ").find((part) => part in plansByWeekday);
  const source = weekday ? plansByWeekday[weekday] : defaultPlan;

  return source.map((item, index) => ({
    id: `${date}-${index + 1}`,
    ...item,
  }));
}

const app = express();

app.get("/api/trainingDay", (req, res) => {
  const date = readDate(req.query.date);

  if (!date) {
    res.status(400).json({ message: "Параметр date обязателен" });
    return;
  }

  res.json(planForDate(date));
});

app.listen(port, () => {
  console.log(`Мок-сервер: http://localhost:${port}`);
});
