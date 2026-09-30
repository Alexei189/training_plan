import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "disabled"
> {
  id?: string;
  onClick: (id?: string) => void;
  children: ReactNode;
  disabled?: boolean;
  submit?: boolean;
}
