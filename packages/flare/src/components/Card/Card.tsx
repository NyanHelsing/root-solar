import { type HTMLAttributes, type ReactNode } from "react";
import styles from "./Card.module.scss";

export type CardTone = "default" | "muted" | "contrast";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  borderless?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
}

const Card = ({
  tone = "default",
  padding = "md",
  borderless = false,
  title,
  subtitle,
  footer,
  children,
  className,
  ...props
}: CardProps) => {
  const classes = [
    styles.card,
    tone !== "default" ? styles[`card--${tone}`] : undefined,
    padding !== "md" ? styles[`card--pad-${padding}`] : undefined,
    borderless ? styles["card--borderless"] : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");

  const showHeader = title !== undefined || subtitle !== undefined;
  const hasBody = children !== undefined && children !== null;

  return (
    <div className={classes} {...props}>
      {showHeader ? (
        <div className={styles["card__header"]}>
          {title !== undefined ? <h2 className={styles["card__title"]}>{title}</h2> : null}
          {subtitle !== undefined ? (
            <p className={styles["card__subtitle"]}>{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {hasBody ? <div className={styles["card__body"]}>{children}</div> : null}
      {footer !== undefined ? <div className={styles["card__footer"]}>{footer}</div> : null}
    </div>
  );
};

export default Card;
