import styles from "./Header.module.scss";
import NetworkStatusIndicator from "./features/network/NetworkStatusIndicator.tsx";

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
      <NetworkStatusIndicator />
    </header>
  );
}
