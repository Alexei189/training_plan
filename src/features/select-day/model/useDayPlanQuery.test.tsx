import { configureStore, createSlice } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as dayPlanModule from "@/entities/day-plan";

import { useDayPlanQuery } from "./useDayPlanQuery";

vi.mock("@/entities/day-plan", () => ({
  useGetDayPlanQuery: vi.fn(),
}));

const dayCardSlice = createSlice({
  name: "dayCard",
  initialState: { currentDate: "2024-01-01" },
  reducers: {
    setDate: (state, action) => {
      state.currentDate = action.payload;
    },
  },
});

const { setDate } = dayCardSlice.actions;

describe("useDayPlanQuery", () => {
  const mockUseGetDayPlanQuery = vi.mocked(dayPlanModule.useGetDayPlanQuery);
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    vi.clearAllMocks();

    store = configureStore({
      reducer: {
        dayCard: dayCardSlice.reducer,
      },
    });

    mockUseGetDayPlanQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as any);
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  it("должен вызывать useGetDayPlanQuery с датой из store", () => {
    renderHook(() => useDayPlanQuery(), { wrapper });

    expect(mockUseGetDayPlanQuery).toHaveBeenCalledWith({
      date: "2024-01-01",
    });
  });

  it("должен возвращать результат useGetDayPlanQuery", () => {
    const mockResult = {
      data: { id: 1, name: "Test Plan" },
      isLoading: false,
      isError: false,
      isSuccess: true,
    };

    mockUseGetDayPlanQuery.mockReturnValue(mockResult as any);

    const { result } = renderHook(() => useDayPlanQuery(), { wrapper });

    expect(result.current).toBe(mockResult);
  });

  it("должен обновлять аргументы при изменении даты в store", () => {
    const { rerender } = renderHook(() => useDayPlanQuery(), { wrapper });

    expect(mockUseGetDayPlanQuery).toHaveBeenLastCalledWith({
      date: "2024-01-01",
    });

    store.dispatch(setDate("2024-02-15"));
    rerender();

    expect(mockUseGetDayPlanQuery).toHaveBeenLastCalledWith({
      date: "2024-02-15",
    });
  });

  it("должен мемоизировать args — при одинаковой дате ссылка на объект не меняется", () => {
    const { rerender } = renderHook(() => useDayPlanQuery(), { wrapper });

    const firstArgs = mockUseGetDayPlanQuery.mock.calls[0][0];

    rerender();

    const secondArgs = mockUseGetDayPlanQuery.mock.calls[1][0];

    expect(firstArgs).toBe(secondArgs);
  });

  it("должен создавать новый объект args при изменении даты", () => {
    const { rerender } = renderHook(() => useDayPlanQuery(), { wrapper });

    const firstArgs = mockUseGetDayPlanQuery.mock.calls[0][0];

    store.dispatch(setDate("2024-03-01"));
    rerender();

    const secondArgs = mockUseGetDayPlanQuery.mock.calls[1][0];

    expect(firstArgs).not.toBe(secondArgs);
    expect(secondArgs).toEqual({ date: "2024-03-01" });
  });

  it("должен корректно работать с несколькими последовательными изменениями даты", () => {
    const { rerender } = renderHook(() => useDayPlanQuery(), { wrapper });

    const dates = ["2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01"];

    dates.forEach((date, index) => {
      if (index > 0) {
        store.dispatch(setDate(date));
        rerender();
      }

      expect(mockUseGetDayPlanQuery).toHaveBeenLastCalledWith({ date });
    });
  });

  it("должен корректно возвращать состояние загрузки", () => {
    mockUseGetDayPlanQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
    } as any);

    const { result } = renderHook(() => useDayPlanQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("должен корректно возвращать состояние ошибки", () => {
    mockUseGetDayPlanQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Network error" },
    } as any);

    const { result } = renderHook(() => useDayPlanQuery(), { wrapper });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual({ message: "Network error" });
  });
});
