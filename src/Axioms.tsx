import { useState } from "react";
import { Link } from "wouter";
import { TiMinus, TiPlus } from "react-icons/ti";

import { seedAxioms } from "./data/index.ts";
import Axiom from "./Axiom.tsx";

import styles from "./Axioms.module.scss";

export default function Axioms() {
  const [axioms] = useState(seedAxioms);
  return (
    <section className={styles.axioms}>
      <h1>Aggregate Prioritization</h1>
      <p>
        Calculated by summing the weights of individual participant's priorities
      </p>
      <ul>
        {axioms.map((axiom) => {
          return (
            <li>
              <Axiom {...axiom} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
