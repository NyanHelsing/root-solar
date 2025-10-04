import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import styles from "./Card.module.scss";

export type CardTone = "default" | "muted" | "contrast";
export type CardPadding = "none" | "sm" | "md" | "lg";

type CardOwnProps = {
    tone?: CardTone;
    padding?: CardPadding;
    borderless?: boolean;
    title?: ReactNode;
    subtitle?: ReactNode;
    footer?: ReactNode;
};

export type CardProps<T extends ElementType = "div"> = CardOwnProps & {
    as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | "as" | "title">;

const Card = <T extends ElementType = "div">({
    as,
    tone = "default",
    padding = "md",
    borderless = false,
    title,
    subtitle,
    footer,
    children,
    className,
    ...props
}: CardProps<T>) => {
    const Component = (as ?? "div") as ElementType;
    const classes = [
        styles.card,
        tone !== "default" ? styles[`card--${tone}`] : undefined,
        padding !== "md" ? styles[`card--pad-${padding}`] : undefined,
        borderless ? styles["card--borderless"] : undefined,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const showHeader = title !== undefined || subtitle !== undefined;
    const hasBody = children !== undefined && children !== null;

    return (
        <Component className={classes} {...props}>
            {showHeader ? (
                <div className={styles.card__header}>
                    {title !== undefined ? <h2 className={styles.card__title}>{title}</h2> : null}
                    {subtitle !== undefined ? (
                        <p className={styles.card__subtitle}>{subtitle}</p>
                    ) : null}
                </div>
            ) : null}
            {hasBody ? <div className={styles.card__body}>{children}</div> : null}
            {footer !== undefined ? <div className={styles.card__footer}>{footer}</div> : null}
        </Component>
    );
};

export default Card;
