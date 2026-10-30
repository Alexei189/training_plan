import { baseApi } from "@/shared/api";

import { DayArgs, DayData } from "../model/types";

export const dayPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDayPlan: builder.query<DayData, DayArgs>({
      query: ({ date }) => ({
        url: "/dayPlan",
        params: { date },
      }),
      providesTags: ["DayPlan"],
    }),
  }),
});

export const { useGetDayPlanQuery } = dayPlanApi;
