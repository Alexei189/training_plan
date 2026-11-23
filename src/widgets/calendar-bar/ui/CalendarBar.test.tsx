import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { AppLayout } from "@/app/layouts/AppLayout";
import { sessionReducer, setRole } from "@/entities/session";
import {
  commitAthlete,
  requestAthleteId,
  selectAthleteReducer,
  setAthleteId,
  setLeaveGuard,
} from "@/features/select-athlete";
import { dayCardReducer, selectCurrentDate, setDate } from "@/features/select-day";
import { baseApi } from "@/shared/api";
import { roles } from "@/shared/config/roles";
import { getDateString, getDateWithWeekDay, getWeekDates, shiftDate } from "@/shared/lib/date";
import { DayView } from "@/widgets/day-view";

import CalendarBar from "./CalendarBar";

function createStore() {
  return configureStore({
    reducer: {
      session: sessionReducer,
      dayCard: dayCardReducer,
      selectAthlete: selectAthleteReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

function renderCalendar(
  store = createStore(),
  ui: ReactNode = (
    <>
      <CalendarBar />
      <DayView />
    </>
  ),
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, ...render(ui, { wrapper }) };
}

describe("CalendarBar", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "Request",
      class TestRequest {
        url: string;

        constructor(input: string) {
          this.url = input;
        }
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            date: "2026-11-18",
            athleteId: "ivanov",
            workoutName: "",
            plan: {},
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("при первой загрузке показывает неделю сегодняшнего дня", () => {
    const { store } = renderCalendar();
    const today = getDateString();

    expect(selectCurrentDate(store.getState())).toBe(today);
    expect(screen.getByRole("button", { name: /Пн/ })).toHaveTextContent(
      String(Number(getWeekDates(today)[0].slice(8, 10))),
    );
  });

  it("показывает неделю выбранной даты и сдвигает её кнопками", () => {
    const { store } = renderCalendar();

    act(() => {
      store.dispatch(setDate("2026-10-07"));
    });

    expect(screen.getByRole("button", { name: "7Ср" })).toHaveTextContent("7");
    expect(screen.getByText(getDateWithWeekDay("2026-10-07"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Следующая неделя" }));

    expect(selectCurrentDate(store.getState())).toBe(shiftDate("2026-10-07", 7));
    expect(screen.getByRole("button", { name: "14Ср" })).toHaveTextContent("14");
    expect(screen.getByText(getDateWithWeekDay("2026-10-14"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Предыдущая неделя" }));
    fireEvent.click(screen.getByRole("button", { name: "Предыдущая неделя" }));

    expect(selectCurrentDate(store.getState())).toBe(shiftDate("2026-10-07", -7));
  });

  it("у спортсмена дата меняется сразу", () => {
    const { store } = renderCalendar();

    act(() => {
      store.dispatch(setDate("2026-10-07"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Следующая неделя" }));

    expect(selectCurrentDate(store.getState())).toBe("2026-10-14");
    expect(screen.getByText("14 ср")).toBeInTheDocument();
  });

  it("при охране тренера кнопка ставит ожидание и дату не меняет", () => {
    const { store } = renderCalendar();

    act(() => {
      store.dispatch(setDate("2026-10-07"));
      store.dispatch(setLeaveGuard(true));
    });
    fireEvent.click(screen.getByRole("button", { name: "Предыдущая неделя" }));

    expect(selectCurrentDate(store.getState())).toBe("2026-10-07");
    expect(store.getState().dayCard.pendingDate).toBe("2026-09-30");
  });

  it("смена спортсмена возвращает текущую неделю, тот же спортсмен и ожидание не меняют дату", async () => {
    const store = createStore();
    store.dispatch(setRole(roles.coach));
    store.dispatch(setDate("2026-10-07"));

    renderCalendar(
      store,
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );

    expect(selectCurrentDate(store.getState())).toBe("2026-10-07");

    act(() => {
      store.dispatch(setAthleteId("ivanov"));
    });
    expect(selectCurrentDate(store.getState())).toBe("2026-10-07");

    act(() => {
      store.dispatch(requestAthleteId("petrova"));
    });
    expect(selectCurrentDate(store.getState())).toBe("2026-10-07");

    act(() => {
      store.dispatch(setRole(roles.athlete));
    });
    expect(selectCurrentDate(store.getState())).toBe("2026-10-07");

    act(() => {
      store.dispatch(commitAthlete());
    });

    expect(store.getState().selectAthlete.athleteId).toBe("petrova");
    expect(selectCurrentDate(store.getState())).toBe(getDateString());
  });
});
