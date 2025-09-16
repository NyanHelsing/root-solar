import styles from "./Header.module.scss";

function RootSolarIcon() {
  return (
    <svg className={styles["root-solar-logo"]}>
      <circle r="1" cx="1" cy="1" />
    </svg>
  );
}

export default function Header() {
  return (
    <header>
      <RootSolarIcon />
      <h1>root.solar</h1>
      <nav>
        <a></a>
      </nav>
    </header>
  );
}
