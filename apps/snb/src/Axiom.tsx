import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { TiMinus, TiPlus } from "react-icons/ti";

import {
  FlareCard,
  FlareIconButton,
  FlareStack,
  FlareTextInput,
} from "@root-solar/flare";
import {
  MAX_SENTIMENT_WEIGHT,
  SENTIMENT_TYPE,
  type AxiomOverview,
  useUpdateAxiomSentiment,
} from "@root-solar/declarations";

const formatRatio = (ratio: number) => `${Math.round(ratio * 100)}%`;

export default function Axiom({ id, title, weight, ratio }: AxiomOverview) {
  const updateSentiment = useUpdateAxiomSentiment();
  const [draft, setDraft] = useState(() => weight.toString());

  useEffect(() => {
    setDraft(weight.toString());
  }, [weight]);

  const commitWeight = useCallback(
    (next: number) => {
      void updateSentiment({ axiomId: id, type: SENTIMENT_TYPE, weight: next });
    },
    [id, updateSentiment],
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

  const ratioLabel = useMemo(() => formatRatio(ratio), [ratio]);

  return (
    <FlareCard padding="lg">
      <FlareStack gap="lg">
        <FlareStack
          direction="row"
          wrap
          align="baseline"
          justify="space-between"
          gap="md"
        >
          <h2 className="rs-heading-md">{title}</h2>
          <FlareStack direction="row" align="baseline" gap="sm" className="rs-text-soft">
            <strong>{ratioLabel}</strong>
            <span className="rs-text-caption">{weight}</span>
          </FlareStack>
        </FlareStack>
        <FlareStack
          direction="row"
          justify="flex-end"
          align="center"
          gap="sm"
          wrap
        >
          <FlareIconButton
            type="button"
            variant="solid"
            onClick={() => adjust(1)}
            aria-label="Increase priority"
            disabled={weight >= MAX_SENTIMENT_WEIGHT}
          >
            <TiPlus />
          </FlareIconButton>
          <FlareTextInput
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
            size="numeric"
          />
          <FlareIconButton
            type="button"
            variant="ghost"
            onClick={() => adjust(-1)}
            aria-label="Decrease priority"
            disabled={weight <= 0}
          >
            <TiMinus />
          </FlareIconButton>
        </FlareStack>
        <FlareStack direction="row" justify="flex-end" gap="sm" fullWidth>
          <Link to={`/axioms/${id}`} className="rs-link">
            More Info
          </Link>
        </FlareStack>
      </FlareStack>
    </FlareCard>
  );
}
