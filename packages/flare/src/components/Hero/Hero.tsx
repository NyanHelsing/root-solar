import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import styles from "./Hero.module.scss";

export type HeroTone = "brand" | "surface" | "minimal" | "dark";
export type HeroAlignment = "center" | "start";

export interface HeroProps extends HTMLAttributes<HTMLElement> {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  tone?: HeroTone;
  alignment?: HeroAlignment;
  backgroundImage?: string;
  overlay?: string;
  imageOpacity?: number;
}

const Hero = ({
  title,
  description,
  eyebrow,
  actions,
  tone = "brand",
  alignment = "center",
  backgroundImage,
  overlay,
  imageOpacity,
  className,
  children,
  ...rest
}: HeroProps) => {
  const heroClasses = [
    styles.hero,
    tone !== "brand" ? styles[`hero--${tone}`] : undefined,
    alignment === "start"
      ? styles["hero--align-start"]
      : styles["hero--align-center"],
    !children ? styles["hero--no-gap"] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const innerClasses = [
    styles.hero__inner,
    alignment === "center"
      ? styles["hero__inner--center"]
      : styles["hero__inner--start"],
  ]
    .filter(Boolean)
    .join(" ");

  const styleOverrides: CSSProperties = {
    ...(backgroundImage
      ? ({
          "--flare-hero-background-image": `url(${backgroundImage})`,
        } as CSSProperties)
      : {}),
    ...(overlay ? ({ "--flare-hero-overlay": overlay } as CSSProperties) : {}),
    ...(imageOpacity !== undefined
      ? ({
          "--flare-hero-image-opacity": imageOpacity.toString(),
        } as CSSProperties)
      : {}),
  };

  const style =
    Object.keys(styleOverrides).length > 0 ? styleOverrides : undefined;

  return (
    <section className={heroClasses} style={style} {...rest}>
      <div className={innerClasses}>
        {eyebrow ? <p className={styles.hero__eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.hero__title}>{title}</h1>
        {description ? (
          <p className={styles.hero__description}>{description}</p>
        ) : null}
        {actions ? <div className={styles.hero__actions}>{actions}</div> : null}
        {children}
      </div>
    </section>
  );
};

export default Hero;
