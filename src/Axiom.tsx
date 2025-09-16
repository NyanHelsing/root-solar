import { Link } from "wouter";
import { TiMinus, TiPlus } from "react-icons/ti";

import styles from "./Axiom.module.scss";
interface Axiom {
  id: string;
  title: string;
  weight?: number;
}

export default function Axiom({ id, title, weight = 1 }: Axiom) {
  return (
    <div className={styles["axiom"]}>
      <h2 className={styles["title"]}>{title}</h2>
      <fieldset className={styles["prioritization"]}>
        <button>
          <TiPlus />
        </button>
        <input name="weight" value={weight} />
        <button>
          <TiMinus />
        </button>
      </fieldset>
      <div className={styles["cta-group"]}>
        <Link to={`/axioms/${id}`}>More Info</Link>
      </div>
    </div>
  );
}
