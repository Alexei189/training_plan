import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { selectAthleteReducer } from "@/features/select-athlete";
import { dayCardReducer, setDate } from "@/features/select-day";

import BuilderDay from "./BuilderDay";

const save = vi.hoisted(() => vi.fn());
const dayPlan = vi.hoisted(() => ({
  current: undefined as
    | {
        date: string;
        workoutName: string;
        plan: Record<string, string>;
      }
    | undefined,
}));

vi.mock("@/features/save-builder-day", () => ({
  useSaveBuilderDay: () => ({
    save,
    isLoading: false,
  }),
}));

vi.mock("@/features/select-day", async () => {
  const actual = await vi.importActual<typeof import("@/features/select-day")>(
    "@/features/select-day",
  );

  return {
    ...actual,
    useDayPlanQuery: () => ({ currentData: dayPlan.current }),
  };
});

function renderBuilder() {
  const store = configureStore({
    reducer: {
      dayCard: dayCardReducer,
      selectAthlete: selectAthleteReducer,
    },
  });

  store.dispatch(setDate("2026-11-04"));

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, ...render(<BuilderDay />, { wrapper }) };
}

function fieldLabels() {
  const form = document.querySelector("form");
  if (!form) {
    return [];
  }

  return Array.from(form.querySelectorAll("label span"), (label) => label.textContent);
}

describe("BuilderDay", () => {
  beforeEach(() => {
    save.mockReset();
    save.mockResolvedValue(true);
    dayPlan.current = undefined;
  });

  it("отправляет активные блоки и название черновика", async () => {
    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Разминка" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Интервальная работа" }),
    );
    fireEvent.change(screen.getByPlaceholderText("Название тренировки"), {
      target: { value: "Утро" },
    });

    const fields = screen.getAllByRole("textbox");
    fireEvent.change(fields[1], { target: { value: "легко" } });

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Сохранить" }));
    await act(async () => {
      await save.mock.results[0]?.value;
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({
      date: "2026-11-04",
      athleteId: "ivanov",
      workoutName: "Утро",
      sections: {
        warmUp: "легко",
        intervals: "",
      },
    });
  });

  it("отправляет пустое название, если поле черновика не заполнено", async () => {
    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Разминка" }));
    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Сохранить" }));
    await act(async () => {
      await save.mock.results[0]?.value;
    });

    expect(save).toHaveBeenCalledWith({
      date: "2026-11-04",
      athleteId: "ivanov",
      workoutName: "",
      sections: { warmUp: "" },
    });
  });

  it("не отправляет запрос, если активных блоков нет", () => {
    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    const saveItem = screen.getByRole("menuitem", { name: "Сохранить" });

    expect(saveItem).toBeDisabled();
    fireEvent.click(saveItem);
    expect(save).not.toHaveBeenCalled();
  });

  it("оставляет пустой черновик, если на дату нет плана", () => {
    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "",
      plan: {},
    };

    renderBuilder();

    expect(screen.getByPlaceholderText("Название тренировки")).toHaveValue("");
    expect(fieldLabels()).toEqual(["Название тренировки"]);
    expect(screen.getByRole("button", { name: "Разминка" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("подгружает известные блоки в порядке секций и пропускает неизвестный ключ", () => {
    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "Лёгкий бег",
      plan: {
        note: "заметка",
        warmUp: "",
        unknown: "скрыто",
        main: "работа",
      },
    };

    renderBuilder();

    expect(fieldLabels()).toEqual([
      "Название тренировки",
      "Разминка",
      "Основная работа",
      "Примечание",
    ]);
    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "Лёгкий бег",
    );
    expect(screen.getByRole("textbox", { name: "Разминка" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Основная работа" })).toHaveValue(
      "работа",
    );
    expect(screen.getByRole("textbox", { name: "Примечание" })).toHaveValue(
      "заметка",
    );
    expect(screen.queryByRole("textbox", { name: "Интервальная работа" })).toBeNull();
    expect(screen.queryByDisplayValue("скрыто")).toBeNull();
  });

  it("не затирает уже изменённый черновик ответом плана", () => {
    const { store, rerender } = renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Разминка" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Разминка" }), {
      target: { value: "своё" },
    });

    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "Сервер",
      plan: { warmUp: "с сервера", main: "работа" },
    };
    rerender(<BuilderDay />);

    expect(screen.getByRole("textbox", { name: "Разминка" })).toHaveValue("своё");
    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "",
    );
    expect(screen.queryByRole("textbox", { name: "Основная работа" })).toBeNull();

    dayPlan.current = {
      date: "2026-11-05",
      workoutName: "Другой день",
      plan: { main: "работа" },
    };
    act(() => {
      store.dispatch(setDate("2026-11-05"));
    });
    rerender(<BuilderDay />);

    expect(screen.getByRole("textbox", { name: "Основная работа" })).toHaveValue(
      "работа",
    );

    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "Сервер",
      plan: { warmUp: "с сервера", main: "работа" },
    };
    act(() => {
      store.dispatch(setDate("2026-11-04"));
    });
    rerender(<BuilderDay />);

    expect(screen.getByRole("textbox", { name: "Разминка" })).toHaveValue("своё");
    expect(screen.queryByRole("textbox", { name: "Основная работа" })).toBeNull();
  });

  it("блокирует копирование, пока черновик даты не готов", () => {
    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));

    expect(screen.getByRole("menuitem", { name: "Копировать" })).toBeDisabled();
  });

  it("блокирует вставку, пока буфер пуст", () => {
    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "",
      plan: {},
    };

    renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));

    expect(screen.getByRole("menuitem", { name: "Копировать" })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: "Вставить" })).toBeDisabled();
  });

  it("копирует черновик и заменяет им черновик другой даты", () => {
    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "Утро",
      plan: { note: "заметка", warmUp: "" },
    };

    const { store, rerender } = renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Копировать" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Разминка" }), {
      target: { value: "после копирования" },
    });

    dayPlan.current = {
      date: "2026-11-05",
      workoutName: "Чужой день",
      plan: { intervals: "интервалы", main: "старая работа" },
    };
    act(() => {
      store.dispatch(setDate("2026-11-05"));
    });
    rerender(<BuilderDay />);

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Вставить" }));

    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "Утро",
    );
    expect(fieldLabels()).toEqual([
      "Название тренировки",
      "Разминка",
      "Примечание",
    ]);
    expect(screen.getByRole("textbox", { name: "Разминка" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Примечание" })).toHaveValue(
      "заметка",
    );
    expect(screen.queryByRole("textbox", { name: "Интервальная работа" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Основная работа" })).toBeNull();

    dayPlan.current = {
      date: "2026-11-06",
      workoutName: "Третий",
      plan: { strength: "сила" },
    };
    act(() => {
      store.dispatch(setDate("2026-11-06"));
    });
    rerender(<BuilderDay />);

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Вставить" }));

    expect(fieldLabels()).toEqual([
      "Название тренировки",
      "Разминка",
      "Примечание",
    ]);
    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "Утро",
    );
    expect(screen.queryByRole("textbox", { name: "Силовая" })).toBeNull();

    act(() => {
      store.dispatch(setDate("2026-11-04"));
    });
    rerender(<BuilderDay />);

    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "Утро",
    );
    expect(screen.getByRole("textbox", { name: "Разминка" })).toHaveValue(
      "после копирования",
    );
    expect(screen.getByRole("textbox", { name: "Примечание" })).toHaveValue(
      "заметка",
    );
  });

  it("не затирает вставленный черновик следующим ответом плана", () => {
    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "Утро",
      plan: { warmUp: "легко" },
    };

    const { store, rerender } = renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Копировать" }));

    dayPlan.current = {
      date: "2026-11-05",
      workoutName: "Пусто",
      plan: {},
    };
    act(() => {
      store.dispatch(setDate("2026-11-05"));
    });
    rerender(<BuilderDay />);

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Вставить" }));

    dayPlan.current = {
      date: "2026-11-05",
      workoutName: "Сервер",
      plan: { main: "с сервера" },
    };
    rerender(<BuilderDay />);

    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "Утро",
    );
    expect(screen.getByRole("textbox", { name: "Разминка" })).toHaveValue("легко");
    expect(screen.queryByRole("textbox", { name: "Основная работа" })).toBeNull();
  });

  it("после вставки сохраняет уже новый черновик и не шлёт запрос из вставки", async () => {
    dayPlan.current = {
      date: "2026-11-04",
      workoutName: "Утро",
      plan: { warmUp: "легко" },
    };

    const { store, rerender } = renderBuilder();

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Копировать" }));

    dayPlan.current = {
      date: "2026-11-05",
      workoutName: "Старое",
      plan: { main: "старая работа" },
    };
    act(() => {
      store.dispatch(setDate("2026-11-05"));
    });
    rerender(<BuilderDay />);

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Сохранить" }));
    await act(async () => {
      await save.mock.results[0]?.value;
    });

    expect(save).toHaveBeenCalledWith({
      date: "2026-11-05",
      athleteId: "ivanov",
      workoutName: "Старое",
      sections: { main: "старая работа" },
    });
    expect(screen.getByRole("textbox", { name: "Основная работа" })).toHaveAttribute(
      "readonly",
    );

    save.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Вставить" }));

    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Разминка" })).not.toHaveAttribute(
      "readonly",
    );
    expect(screen.getByRole("textbox", { name: "Название тренировки" })).toHaveValue(
      "Утро",
    );

    fireEvent.click(screen.getByRole("button", { name: "Действия" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Сохранить" }));
    await act(async () => {
      await save.mock.results[0]?.value;
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({
      date: "2026-11-05",
      athleteId: "ivanov",
      workoutName: "Утро",
      sections: { warmUp: "легко" },
    });
  });
});
