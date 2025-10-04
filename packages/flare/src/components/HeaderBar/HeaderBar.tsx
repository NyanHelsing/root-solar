import type { HTMLAttributes, ReactNode } from "react";
import styles from "./HeaderBar.module.scss";

export type HeaderBarTone = "transparent" | "surface";

export interface HeaderBarProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    brand?: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    tone?: HeaderBarTone;
    children?: ReactNode;
}

const HeaderBar = ({
    brand,
    title,
    subtitle,
    actions,
    tone = "transparent",
    className,
    children,
    ...rest
}: HeaderBarProps) => {
    const headerClasses = [
        styles.header,
        tone === "surface" ? styles["header--surface"] : undefined,
        className
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <header className={headerClasses} {...rest}>
            {brand ? <div className={styles.header__brand}>{brand}</div> : null}
            {(title || subtitle) && (
                <div className={styles.header__center}>
                    {title ? <h1 className={styles.header__title}>{title}</h1> : null}
                    {subtitle ? <p className={styles.header__subtitle}>{subtitle}</p> : null}
                </div>
            )}
            {actions ? <div className={styles.header__actions}>{actions}</div> : null}
            {children ? <div className={styles.header__children}>{children}</div> : null}
        </header>
    );
};

export default HeaderBar;
