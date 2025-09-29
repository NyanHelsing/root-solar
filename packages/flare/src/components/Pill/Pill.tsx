import { type ReactElement } from "react";
import styles from "./Pill.module.scss";

export type PillTone = "neutral" | "accent" | "warning" | "success";

export type PillProps = {
  label: string;
  tone?: PillTone;
  icon?: ReactElement;
  className?: string;
};

const Pill = ({ label, tone = "neutral", icon, className }: PillProps) => {
  const classes = [styles.pill, styles[`pill--${tone}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {icon ? <span className={styles.pill__icon}>{icon}</span> : null}
      <span className={styles.pill__label}>{label}</span>
    </span>
  );
};

export default Pill;
