import React, { useCallback } from "react";
import { ButtonProps } from "./types";
import styles from "./Button.module.css";

const buttonClassNames = {
  0: "",
  1: "button--primary",
};

function Button({
  children,
  disabled = false,

  submit = false,
  id,
  onClick = () => {},
}: ButtonProps) {
  const handleOnClick = useCallback(() => {
    if (id) {
      onClick(id);
    } else {
      onClick();
    }
  }, [id, onClick]);
  return (
    <button
      type={submit ? "submit" : "button"}
      className={styles.button}
      onClick={handleOnClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
