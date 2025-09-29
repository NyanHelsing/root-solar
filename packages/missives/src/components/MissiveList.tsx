import { useCallback, type ChangeEvent } from "react";

import { FlareStack } from "@root-solar/flare";

import MissiveCard from "./MissiveCard.tsx";
import MissiveListHeader from "./MissiveListHeader.tsx";
import useMissiveListController from "../hooks/useMissiveListController.ts";
import { normalizeFilterValue } from "../utils/listUtils.ts";
import { SENTIMENT_TAG_SLUG } from "../constants.ts";

type MissiveListProps = {
  sentiment?: string | null;
  onSentimentChanged?: (next: string | null) => void;
  basePath: string;
  showViewAllLink: boolean;
};

const MissiveList = ({ sentiment, onSentimentChanged, basePath, showViewAllLink }: MissiveListProps) => {
  const {
    copy,
    isLoading,
    error,
    missives,
    totalWeight,
    filterControlId,
    filterValue,
    tagOptions,
    handleFilterChange,
    sentimentFilterSlug,
    activeSentimentTagId,
    isSentimentCapped,
  } = useMissiveListController({ sentiment });

  const onFilterChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextTag = normalizeFilterValue(event.target.value || undefined);
      handleFilterChange(nextTag);
      if (nextTag === SENTIMENT_TAG_SLUG && basePath !== "/axioms") {
        onSentimentChanged?.(SENTIMENT_TAG_SLUG);
      } else if (!nextTag && basePath === "/axioms") {
        onSentimentChanged?.(null);
      } else if (nextTag !== SENTIMENT_TAG_SLUG && basePath === "/axioms") {
        onSentimentChanged?.(null);
      }
    },
    [handleFilterChange, onSentimentChanged, basePath],
  );

  return (
    <FlareStack gap="lg">
      <MissiveListHeader
        copy={copy}
        totalWeight={totalWeight}
        filterControlId={filterControlId}
        filterValue={filterValue}
        tagOptions={tagOptions}
        onFilterChange={onFilterChange}
        showViewAllLink={showViewAllLink}
      />
      {isLoading ? <p className="rs-text-soft">{copy.loadingLabel}</p> : null}
      {error ? (
        <p role="alert" className="rs-text-soft">
          {error}
        </p>
      ) : null}
      {!isLoading && missives.length === 0 ? (
        <p className="rs-text-soft">{copy.emptyLabel}</p>
      ) : null}
      <FlareStack gap="md">
        {missives.map((missive) => (
          <MissiveCard
            key={missive.id}
            {...missive}
            basePath={basePath}
            moreInfoLabel={copy.moreInfoLabel}
            sentimentTagId={activeSentimentTagId}
            isSentimentCapped={isSentimentCapped}
            sentimentSlug={sentimentFilterSlug}
          />
        ))}
      </FlareStack>
    </FlareStack>
  );
};

export default MissiveList;
