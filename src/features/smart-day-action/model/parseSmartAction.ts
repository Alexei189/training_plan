import {
  type PlanSectionKey,
  planSectionKeys,
} from "@/shared/config/planSections";

export type SmartActionPreview = {
  workoutName?: string;
  plan: Partial<Record<PlanSectionKey, string>>;
};

export type ParsedSmartAction = {
  workoutName: string;
  plan: Record<string, string>;
};

const planKeySet = new Set<string>(planSectionKeys);

export function parseSmartAction(text: string): ParsedSmartAction | null {
  const source = stripWrappingFence(text.trim());

  try {
    const data: unknown = JSON.parse(source);

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return null;
    }

    if (!("workoutName" in data) || typeof data.workoutName !== "string") {
      return null;
    }

    if (!("plan" in data) || typeof data.plan !== "object" || data.plan === null || Array.isArray(data.plan)) {
      return null;
    }

    const plan: Record<string, string> = {};

    for (const [key, value] of Object.entries(data.plan)) {
      if (key === "workoutName" || key === "athleteId" || typeof value !== "string") {
        continue;
      }

      plan[key] = value;
    }

    return { workoutName: data.workoutName, plan };
  } catch {
    return null;
  }
}

export function previewSmartAction(text: string): SmartActionPreview {
  const source = stripOpeningFence(text);

  if (source === null) {
    return { plan: {} };
  }

  const preview: SmartActionPreview = { plan: {} };
  let index = 0;

  skipWhitespace(source, () => index, (next) => {
    index = next;
  });

  if (source[index] !== "{") {
    return preview;
  }

  index += 1;
  readObject(source, () => index, (next) => {
    index = next;
  }, [], preview);

  return preview;
}

function stripWrappingFence(text: string): string {
  if (!text.startsWith("```")) {
    return text;
  }

  let body = text.slice(3);

  if (body.startsWith("json")) {
    body = body.slice(4);
  }

  body = body.trim();

  if (body.endsWith("```")) {
    body = body.slice(0, -3).trim();
  }

  return body;
}

function stripOpeningFence(text: string): string | null {
  const leading = text.match(/^\s*/)?.[0].length ?? 0;
  const body = text.slice(leading);

  if (!body.startsWith("`")) {
    return text;
  }

  if (!body.startsWith("```")) {
    return null;
  }

  let rest = body.slice(3);

  if (rest.startsWith("json")) {
    rest = rest.slice(4);
  } else if (/^j(s(o)?)?$/.test(rest)) {
    return null;
  }

  const white = rest.match(/^[ \t]*\n?/);

  return rest.slice(white?.[0].length ?? 0);
}

function readObject(
  source: string,
  getIndex: () => number,
  setIndex: (index: number) => void,
  path: string[],
  preview: SmartActionPreview,
) {
  while (getIndex() < source.length) {
    skipWhitespace(source, getIndex, setIndex);

    if (getIndex() >= source.length) {
      return;
    }

    if (source[getIndex()] === "}") {
      setIndex(getIndex() + 1);
      return;
    }

    if (source[getIndex()] !== '"') {
      return;
    }

    const key = readString(source, getIndex);
    setIndex(key.end);

    if (!key.closed) {
      return;
    }

    skipWhitespace(source, getIndex, setIndex);

    if (source[getIndex()] !== ":") {
      return;
    }

    setIndex(getIndex() + 1);
    readValue(source, getIndex, setIndex, [...path, key.value], preview);
    skipWhitespace(source, getIndex, setIndex);

    if (source[getIndex()] === ",") {
      setIndex(getIndex() + 1);
      continue;
    }

    if (source[getIndex()] === "}") {
      setIndex(getIndex() + 1);
    }

    return;
  }
}

function readValue(
  source: string,
  getIndex: () => number,
  setIndex: (index: number) => void,
  path: string[],
  preview: SmartActionPreview,
) {
  skipWhitespace(source, getIndex, setIndex);

  if (getIndex() >= source.length) {
    return;
  }

  if (source[getIndex()] === '"') {
    const read = readString(source, getIndex);
    setIndex(read.end);
    rememberString(path, read.value, preview);
    return;
  }

  if (source[getIndex()] === "{") {
    setIndex(getIndex() + 1);
    readObject(source, getIndex, setIndex, path, preview);
  }
}

function rememberString(
  path: string[],
  value: string,
  preview: SmartActionPreview,
) {
  if (path.length === 1 && path[0] === "workoutName") {
    preview.workoutName = value;
    return;
  }

  if (path.length === 2 && path[0] === "plan" && planKeySet.has(path[1])) {
    preview.plan[path[1] as PlanSectionKey] = value;
  }
}

function readString(source: string, getIndex: () => number) {
  let index = getIndex() + 1;
  let value = "";

  while (index < source.length) {
    const char = source[index];

    if (char === "\\") {
      if (index + 1 >= source.length) {
        return { value, end: source.length, closed: false };
      }

      const next = source[index + 1];

      if (next === "u") {
        if (index + 6 > source.length) {
          return { value, end: source.length, closed: false };
        }

        const hex = source.slice(index + 2, index + 6);

        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          return { value, end: source.length, closed: false };
        }

        value += String.fromCharCode(Number.parseInt(hex, 16));
        index += 6;
        continue;
      }

      value += escapedChar(next);
      index += 2;
      continue;
    }

    if (char === '"') {
      return { value, end: index + 1, closed: true };
    }

    value += char;
    index += 1;
  }

  return { value, end: source.length, closed: false };
}

function escapedChar(char: string) {
  switch (char) {
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "b":
      return "\b";
    case "f":
      return "\f";
    default:
      return char;
  }
}

function skipWhitespace(
  source: string,
  getIndex: () => number,
  setIndex: (index: number) => void,
) {
  let index = getIndex();

  while (index < source.length && /\s/.test(source[index])) {
    index += 1;
  }

  setIndex(index);
}
