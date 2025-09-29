import { Children, type ReactNode } from "react";
import styles from "./TagGroup.module.scss";

export type TagGroupProps = {
  children: ReactNode;
  wrap?: boolean;
  gap?: "xs" | "sm" | "md";
  className?: string;
};

const gapClass = {
  xs: styles["group--gap-xs"],
  sm: styles["group--gap-sm"],
  md: styles["group--gap-md"],
};

const TagGroup = ({ children, wrap = true, gap = "sm", className }: TagGroupProps) => {
  const classes = [
    styles.group,
    wrap ? styles["group--wrap"] : undefined,
    gapClass[gap],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{Children.toArray(children)}</div>;
};

export default TagGroup;
