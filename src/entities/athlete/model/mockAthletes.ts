export interface Athlete {
  id: string;
  fullName: string;
}

export const mockAthletes: readonly Athlete[] = [
  { id: "ivanov", fullName: "Иванов Иван Иванович" },
  { id: "petrova", fullName: "Петрова Анна Сергеевна" },
  { id: "smirnov", fullName: "Смирнов Алексей Дмитриевич" },
];
