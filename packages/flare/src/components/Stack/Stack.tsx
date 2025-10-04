import {
    createElement,
    type CSSProperties,
    type ComponentPropsWithoutRef,
    type ElementType,
    type ReactNode,
} from "react";
import styles from "./Stack.module.scss";

const gapMap = {
    none: "0",
    xs: "0.5rem",
    sm: "var(--flare-gap-sm, 0.75rem)",
    md: "var(--flare-gap-md, 1.25rem)",
    lg: "var(--flare-gap-lg, 2rem)",
} as const;

export type StackGap = keyof typeof gapMap | string;
export type StackDirection = "row" | "column";
export type StackAlignment = "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
export type StackJustify =
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";

type StackOwnProps = {
    direction?: StackDirection;
    gap?: StackGap;
    align?: StackAlignment;
    justify?: StackJustify;
    wrap?: boolean;
    fullWidth?: boolean;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
};

export type StackProps<T extends ElementType = "div"> = StackOwnProps & {
    as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof StackOwnProps | "as" | "style" | "className">;

const Stack = <T extends ElementType = "div">({
    as,
    direction = "column",
    gap = "md",
    align,
    justify,
    wrap,
    fullWidth,
    style,
    className,
    children,
    ...rest
}: StackProps<T>) => {
    const resolvedGap = gapMap[gap as keyof typeof gapMap] ?? gap;
    const styleOverrides: Record<string, string> = {
        "--flare-stack-direction": direction,
        "--flare-stack-gap": resolvedGap,
    };

    if (align) {
        styleOverrides["--flare-stack-align"] = align;
    }

    if (justify) {
        styleOverrides["--flare-stack-justify"] = justify;
    }

    if (wrap !== undefined) {
        styleOverrides["--flare-stack-wrap"] = wrap ? "wrap" : "nowrap";
    }

    const mergedStyle = {
        ...styleOverrides,
        ...(style as CSSProperties | undefined),
    } as CSSProperties;

    const classes = [styles.stack, fullWidth ? styles["stack--full"] : undefined, className]
        .filter(Boolean)
        .join(" ");

    const Component = (as ?? "div") as ElementType;

    return createElement(
        Component,
        {
            className: classes,
            style: mergedStyle,
            ...rest,
        },
        children,
    );
};

export default Stack;
