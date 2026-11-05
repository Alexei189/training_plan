import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { selectAthleteReducer } from "@/features/select-athlete";
import { dayCardReducer, setDate } from "@/features/select-day";

import BuilderDay from "./BuilderDay";

const save = vi.hoisted(() => vi.fn());

vi.mock("@/features/save-builder-day", () => ({
  useSaveBuilderDay: () => ({
    save,
    isLoading: false,
  }),
}));

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

  render(<BuilderDay />, { wrapper });
}

describe("BuilderDay", () => {
  beforeEach(() => {
    save.mockReset();
    save.mockResolvedValue(true);
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
});
