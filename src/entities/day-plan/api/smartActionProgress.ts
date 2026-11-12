type SmartActionProgress = (text: string) => void;

let listener: SmartActionProgress | null = null;

export function setSmartActionProgress(next: SmartActionProgress | null) {
  listener = next;
}

export function notifySmartActionProgress(text: string) {
  listener?.(text);
}
