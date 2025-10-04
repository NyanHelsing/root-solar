import type { CSSProperties, HTMLAttributes } from "react";
import styles from "./BrandMark.module.scss";

export interface BrandMarkProps extends HTMLAttributes<HTMLSpanElement> {
    label?: string;
    size?: string;
    background?: string;
    color?: string;
}

const BrandMark = ({
    label,
    size,
    background,
    color,
    style,
    className,
    ...rest
}: BrandMarkProps) => {
    const styleOverrides: Record<string, string> = {};

    if (size) {
        styleOverrides["--flare-brand-mark-size"] = size;
    }

    if (background) {
        styleOverrides["--flare-brand-mark-background"] = background;
    }

    if (color) {
        styleOverrides["--flare-brand-mark-color"] = color;
    }

    const mergedStyle = {
        ...styleOverrides,
        ...(style as CSSProperties | undefined)
    } as CSSProperties;

    if (label) {
        return (
            <span
                className={[styles.brand, styles["brand--with-label"], className]
                    .filter(Boolean)
                    .join(" ")}
                style={mergedStyle}
                {...rest}
            >
                <span aria-hidden="true">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle cx="9" cy="9" r="5.5" fill="currentColor" />
                    </svg>
                </span>
                {label}
            </span>
        );
    }

    return (
        <span
            aria-hidden="true"
            className={[styles.brand, className].filter(Boolean).join(" ")}
            style={mergedStyle}
            {...rest}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="9" cy="9" r="5.5" fill="currentColor" />
            </svg>
        </span>
    );
};

export default BrandMark;
