import { type HTMLAttributes, type ReactNode } from "react";
import styles from "./StatusIndicator.module.scss";

export type StatusIndicatorTone = "success" | "warning" | "danger" | "info" | "muted";

export interface StatusIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  tone?: StatusIndicatorTone;
  icon?: ReactNode;
  showDot?: boolean;
}

const StatusIndicator = ({
  label,
  tone = "muted",
  icon,
  showDot = true,
  className,
  ...rest
}: StatusIndicatorProps) => {
  const indicatorClasses = [
    styles.indicator,
    tone ? styles[`indicator--${tone}`] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={indicatorClasses} {...rest}>
      {showDot ? <span aria-hidden="true" className={styles.dot} /> : null}
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default StatusIndicator;
