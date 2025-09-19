import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import Axiom from "./Axiom.tsx";

import {
  axiomsAtom,
  axiomsLoadingAtom,
  axiomsTotalWeightAtom,
  loadAxiomsAtom,
} from "./features/axioms/store.ts";

import styles from "./Axioms.module.scss";

export default function Axioms() {
  const axioms = useAtomValue(axiomsAtom);
  const totalWeight = useAtomValue(axiomsTotalWeightAtom);
  const isLoading = useAtomValue(axiomsLoadingAtom);
  const loadAxioms = useSetAtom(loadAxiomsAtom);

  useEffect(() => {
    loadAxioms();
  }, [loadAxioms]);

  return (
    <section className={styles.axioms}>
      <h1>Aggregate Prioritization</h1>
      <p>
        Calculated by summing the weights of individual participant's priorities
      </p>
      <p className={styles.summary}>
        Total personal allocation: <strong>{totalWeight}</strong>
      </p>
      {isLoading && <p className={styles.loading}>Refreshing priorities…</p>}
      {!isLoading && axioms.length === 0 && (
        <p className={styles.empty}>No axioms found yet.</p>
      )}
      <ul>
        {axioms.map((axiom) => {
          return (
            <li key={axiom.id}>
              <Axiom {...axiom} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
