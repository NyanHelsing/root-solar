import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { TiMinus, TiPlus } from "react-icons/ti";
import { useSetAtom } from "jotai";

import {
  MAX_SENTIMENT_WEIGHT,
  setAxiomWeightAtom,
  type AxiomSentiment,
} from "./features/axioms/store.ts";
import styles from "./Axiom.module.scss";

const formatRatio = (ratio: number) => `${Math.round(ratio * 100)}%`;

export default function Axiom({ id, title, weight, ratio }: AxiomSentiment) {
  const setWeight = useSetAtom(setAxiomWeightAtom);
  const [draft, setDraft] = useState(() => weight.toString());

  useEffect(() => {
    setDraft(weight.toString());
  }, [weight]);

  const commitWeight = useCallback(
    (next: number) => {
      setWeight({ axiomId: id, weight: next });
    },
    [id, setWeight],
  );

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(MAX_SENTIMENT_WEIGHT, weight + delta));
    commitWeight(next);
  };

  const handleBlur = () => {
    const next = Number.parseInt(draft, 10);
    if (Number.isNaN(next)) {
      commitWeight(0);
      return;
    }
    commitWeight(next);
  };

  return (
    <div className={styles["axiom"]}>
      <h2 className={styles["title"]}>{title}</h2>
      <div className={styles["metrics"]}>
        <span className={styles["ratio"]}>{formatRatio(ratio)}</span>
        <span className={styles["weight"]}>{weight}</span>
      </div>
      <fieldset className={styles["prioritization"]}>
        <button
          type="button"
          onClick={() => adjust(1)}
          aria-label="Increase priority"
          disabled={weight >= MAX_SENTIMENT_WEIGHT}
        >
          <TiPlus />
        </button>
        <input
          name="weight"
          inputMode="numeric"
          type="number"
          min={0}
          max={MAX_SENTIMENT_WEIGHT}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          onClick={() => adjust(-1)}
          aria-label="Decrease priority"
          disabled={weight <= 0}
        >
          <TiMinus />
        </button>
      </fieldset>
      <div className={styles["cta-group"]}>
        <Link to={`/axioms/${id}`}>More Info</Link>
      </div>
    </div>
  );
}
