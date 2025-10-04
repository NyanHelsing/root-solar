import { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./IconButton.module.scss";

export type IconButtonVariant = "default" | "ghost" | "solid" | "danger";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: IconButtonVariant;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { variant = "default", className, ...props },
    ref,
) {
    const classes = [
        styles["icon-button"],
        variant !== "default" ? styles[`icon-button--${variant}`] : undefined,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return <button ref={ref} className={classes} {...props} />;
});

export default IconButton;
