import { createElement, type CSSProperties, type ElementType, type HTMLAttributes } from "react";
import styles from "./PageSection.module.scss";

export interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  maxWidth?: string;
  paddingBlock?: string;
  paddingInline?: string;
}

const PageSection = ({
  as: Component = "section",
  maxWidth,
  paddingBlock,
  paddingInline,
  style,
  className,
  children,
  ...rest
}: PageSectionProps) => {
  const styleOverrides: Record<string, string> = {};

  if (maxWidth) {
    styleOverrides["--flare-page-section-max-width"] = maxWidth;
  }

  if (paddingBlock) {
    styleOverrides["--flare-page-section-padding-block"] = paddingBlock;
  }

  if (paddingInline) {
    styleOverrides["--flare-page-section-inline-padding"] = paddingInline;
  }

  const mergedStyle = {
    ...styleOverrides,
    ...(style as CSSProperties | undefined),
  } as CSSProperties;

  const classes = [styles.section, className].filter(Boolean).join(" ");

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

export default PageSection;
