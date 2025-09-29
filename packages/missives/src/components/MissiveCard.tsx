import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { Link } from "react-router";
import { TiMinus, TiPlus } from "react-icons/ti";

import {
  FlareCard,
  FlareIconButton,
  FlareStack,
  FlareTextInput,
} from "@root-solar/flare";
import { TagListDisplay } from "@root-solar/tagging";

import { MAX_SENTIMENT_WEIGHT } from "../constants.ts";
import { useUpdateMissiveSentiment } from "../hooks/useMissiveActions.ts";
import type { MissiveOverview } from "../types.ts";

type MissiveCardProps = MissiveOverview & {
  basePath: string;
  moreInfoLabel: string;
  sentimentTagId: string;
  isSentimentCapped: boolean;
  sentimentSlug: string | null;
};

const MissiveCard = ({
  id,
  title,
  weight,
  ratio,
  tags,
  basePath,
  moreInfoLabel,
  sentimentTagId,
  isSentimentCapped,
  sentimentSlug,
}: MissiveCardProps) => {
  const updateSentiment = useUpdateMissiveSentiment();
  const [draft, setDraft] = useState(() => weight.toString());

  useEffect(() => {
    setDraft(weight.toString());
  }, [weight]);

  const upperBound = isSentimentCapped ? MAX_SENTIMENT_WEIGHT : Number.POSITIVE_INFINITY;

  const commitWeight = useCallback(
    (next: number) => {
      void updateSentiment({ missiveId: id, tagId: sentimentTagId, weight: next });
    },
    [id, sentimentTagId, updateSentiment],
  );

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(upperBound, weight + delta));
    commitWeight(next);
  };

  const handleBlur = () => {
    const next = Number.parseInt(draft, 10);
    if (Number.isNaN(next)) {
      commitWeight(0);
      return;
    }
    commitWeight(Math.max(0, Math.min(upperBound, next)));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  const ratioLabel = useMemo(() => `${Math.round(ratio * 100)}%`, [ratio]);

  const detailHref = useMemo(() => {
    if (!sentimentSlug) {
      return `${basePath}/${id}`;
    }
    const params = new URLSearchParams();
    params.set("sentiment", sentimentSlug);
    return `${basePath}/${id}?${params.toString()}`;
  }, [basePath, id, sentimentSlug]);

  return (
    <FlareCard padding="lg">
      <FlareStack gap="lg">
        <FlareStack direction="row" wrap align="baseline" justify="space-between" gap="md">
          <h2 className="rs-heading-md">{title}</h2>
          <FlareStack direction="row" align="baseline" gap="sm" className="rs-text-soft">
            <strong>{ratioLabel}</strong>
            <span className="rs-text-caption">{weight}</span>
          </FlareStack>
        </FlareStack>
        <TagListDisplay tags={tags} gap="xs" emptyLabel={null} />
        <FlareStack direction="row" justify="flex-end" align="center" gap="sm" wrap>
          <FlareIconButton
            type="button"
            variant="solid"
            onClick={() => adjust(1)}
            aria-label="Increase weight"
            disabled={weight >= upperBound}
          >
            <TiPlus />
          </FlareIconButton>
          <FlareTextInput
            name="weight"
            inputMode="numeric"
            type="number"
            min={0}
            max={isSentimentCapped ? MAX_SENTIMENT_WEIGHT : undefined}
            value={draft}
            onChange={handleInputChange}
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
            aria-label="Decrease weight"
            disabled={weight <= 0}
          >
            <TiMinus />
          </FlareIconButton>
        </FlareStack>
        <FlareStack direction="row" justify="flex-end" gap="sm" fullWidth>
          <Link to={detailHref} className="rs-link">
            {moreInfoLabel}
          </Link>
        </FlareStack>
      </FlareStack>
    </FlareCard>
  );
};

export default MissiveCard;
