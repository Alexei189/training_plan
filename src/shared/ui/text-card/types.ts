import { CSSProperties, ReactNode } from "react";

export interface TextCardProps  {
  header?: string;
  text?: string;
  backgroundColor?: CSSProperties['backgroundColor'];
}
