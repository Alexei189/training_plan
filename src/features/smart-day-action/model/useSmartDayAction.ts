import { useEffect, useRef, useState } from "react";

import {
  type SmartActionBody,
  setSmartActionProgress,
  useSmartActionMutation,
} from "@/entities/day-plan";

import { parseSmartAction, previewSmartAction, type SmartActionPreview } from "./parseSmartAction";

const emptyPreview: SmartActionPreview = { plan: {} };

function readSmartError(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return "LLM недоступна";
  }

  if ("error" in error && error.error === "aborted") {
    return null;
  }

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

  if ("error" in error && typeof error.error === "string" && error.error.length > 0) {
    return error.error;
  }

  return "LLM недоступна";
}

export function useSmartDayAction() {
  const [trigger] = useSmartActionMutation();
  const [preview, setPreview] = useState<SmartActionPreview>(emptyPreview);
  const [isLoading, setIsLoading] = useState(false);
  const pendingRef = useRef(false);
  const requestRef = useRef<{ abort: () => void } | null>(null);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);

  const run = async (body: SmartActionBody) => {
    if (pendingRef.current) {
      return null;
    }

    pendingRef.current = true;
    setIsLoading(true);
    setPreview(emptyPreview);
    setSmartActionProgress((text) => {
      setPreview(previewSmartAction(text));
    });

    const request = trigger(body);
    requestRef.current = request;

    try {
      const text = await request.unwrap();
      const parsed = parseSmartAction(text);

      if (!parsed) {
        // TODO: replace with Toast
        alert("Ответ модели не JSON");
        return null;
      }

      return parsed;
    } catch (error) {
      const message = readSmartError(error);

      if (message === null) {
        return null;
      }

      // TODO: replace with Toast
      alert(message);
      return null;
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
      }

      setSmartActionProgress(null);
      pendingRef.current = false;
      setIsLoading(false);
    }
  };

  return { run, preview, isLoading };
}
