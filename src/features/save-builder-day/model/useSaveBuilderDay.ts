import { useRef } from "react";

import {
  type SaveBuilderDayBody,
  useSaveBuilderDayMutation,
} from "@/entities/day-plan";

function readSaveError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("data" in error) {
      const data = error.data;

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string" &&
        data.message.length > 0
      ) {
        return data.message;
      }
    }

    if (
      "error" in error &&
      typeof error.error === "string" &&
      error.error.length > 0
    ) {
      return error.error;
    }

    if (
      "message" in error &&
      typeof error.message === "string" &&
      error.message.length > 0
    ) {
      return error.message;
    }
  }

  return "Не удалось сохранить план";
}

export function useSaveBuilderDay() {
  const [trigger, { isLoading }] = useSaveBuilderDayMutation();
  const pendingRef = useRef(false);

  const save = async (body: SaveBuilderDayBody) => {
    if (pendingRef.current) {
      return false;
    }

    pendingRef.current = true;

    try {
      await trigger(body).unwrap();
      return true;
    } catch (error) {
      // TODO: replace with Toast
      alert(readSaveError(error));
      return false;
    } finally {
      pendingRef.current = false;
    }
  };

  return { save, isLoading };
}
