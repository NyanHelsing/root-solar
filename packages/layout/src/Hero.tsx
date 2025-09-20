import styles from "./Hero.module.scss";

export const ShellHero = () => {
  return (
    <section className={styles.hero}>
      <h1>Life shares a common root.</h1>
      <p>
        Curating a living canon of operating principles so humans and agents can
        coordinate with shared intent across the solar system.
      </p>
    </section>
  );
};

export default ShellHero;
