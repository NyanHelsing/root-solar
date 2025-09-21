import type { HTMLAttributes } from "react";

import styles from "./Loader.module.scss";

export type LoaderSize = "sm" | "md" | "lg";

export type LoaderProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  size?: LoaderSize;
};

const Loader = ({
  label = "Loading…",
  size = "md",
  className,
  ...rest
}: LoaderProps) => {
  const classes = [styles.loader, styles[`loader--${size}`], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div role="status" aria-live="polite" className={classes} {...rest}>
      <span aria-hidden="true" className={styles.spinner} />
      <span className={styles.visuallyHidden}>{label}</span>
      <span aria-hidden="true" className={styles.label}>
        {label}
      </span>
    </div>
  );
};

export default Loader;
