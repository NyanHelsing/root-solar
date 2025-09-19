import React, { useId, useMemo } from "react";
import styles from "./Hero.module.scss";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <h1>Life shares a common root.</h1>
      <p>
        Creating an approach rooted in consensus for describing foundational
        Operating Principles created by the entities that describe themselves as
        rooted at the solar system.
      </p>
    </section>
  );
}
