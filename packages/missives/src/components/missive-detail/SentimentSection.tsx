import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { TiMinus, TiPlus } from "react-icons/ti";

import {
    FlareButton,
    FlareCard,
    FlareIconButton,
    FlareStack,
    FlareTextInput,
} from "@root-solar/flare";
import type { SentimentAllocation } from "@root-solar/api";
import { labelFromSlug } from "@root-solar/globalization";

import { MAX_SENTIMENT_WEIGHT } from "../../constants.ts";
import { toTagId } from "../../utils/toTagId.ts";
import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";

export type SentimentSectionProps = {
    sentiments: SentimentAllocation[];
    labels: MissiveLabels;
    activeSentimentId: string;
    onCommitSentiment: (tagId: string, weight: number) => Promise<number>;
};

export const SentimentSection = ({
    sentiments,
    labels,
    activeSentimentId,
    onCommitSentiment,
}: SentimentSectionProps) => {
    const [busySentimentTagId, setBusySentimentTagId] = useState<string | null>(null);
    const [sentimentError, setSentimentError] = useState<string | null>(null);
    const [sentimentDrafts, setSentimentDrafts] = useState<Record<string, string>>({});
    const [newSentimentLabel, setNewSentimentLabel] = useState("");
    const [newSentimentWeight, setNewSentimentWeight] = useState("1");
    const [isCreatingSentiment, setIsCreatingSentiment] = useState(false);

    useEffect(() => {
        if (sentiments.length === 0) {
            setSentimentDrafts({});
            return;
        }
        setSentimentDrafts((current) => {
            const next: Record<string, string> = {};
            let changed = Object.keys(current).length !== sentiments.length;
            for (const sentiment of sentiments) {
                const key = sentiment.tagId;
                const value = sentiment.weight.toString();
                next[key] = value;
                if (!changed && current[key] !== value) {
                    changed = true;
                }
            }
            return changed ? next : current;
        });
    }, [sentiments]);

    const clampWeightForTag = useCallback(
        (tagId: string, weight: number) => {
            const normalized = Math.max(0, Math.round(weight));
            if (tagId === activeSentimentId) {
                return Math.min(MAX_SENTIMENT_WEIGHT, normalized);
            }
            return normalized;
        },
        [activeSentimentId],
    );

    const handleCommitSentiment = useCallback(
        async (tagId: string, weight: number) => {
            const allocation = sentiments.find((sentiment) => sentiment.tagId === tagId);
            const previousWeight = allocation?.weight ?? 0;
            const nextWeight = clampWeightForTag(tagId, weight);
            if (nextWeight === previousWeight) {
                setSentimentDrafts((current) => ({
                    ...current,
                    [tagId]: nextWeight.toString(),
                }));
                return;
            }
            setBusySentimentTagId(tagId);
            setSentimentError(null);
            try {
                const resolvedWeight = await onCommitSentiment(tagId, nextWeight);
                setSentimentDrafts((current) => ({
                    ...current,
                    [tagId]: resolvedWeight.toString(),
                }));
            } catch (error) {
                console.error("Failed to update sentiment weight", error);
                setSentimentError(
                    error instanceof Error && error.message
                        ? error.message
                        : "Unable to update sentiment weight. Please try again.",
                );
                setSentimentDrafts((current) => ({
                    ...current,
                    [tagId]: previousWeight.toString(),
                }));
            } finally {
                setBusySentimentTagId(null);
            }
        },
        [clampWeightForTag, onCommitSentiment, sentiments],
    );

    const handleCreateSentiment = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const label = newSentimentLabel.trim();
            const parsedWeight = Number.parseInt(newSentimentWeight, 10);
            if (!label) {
                setSentimentError("Provide a name for the new sentiment tag.");
                return;
            }
            if (Number.isNaN(parsedWeight)) {
                setSentimentError("Enter a numeric weight for the new sentiment.");
                return;
            }

            const existing = sentiments.find((sentiment) => {
                const matchesLabel = sentiment.tag?.label
                    ? sentiment.tag.label.toLowerCase() === label.toLowerCase()
                    : false;
                const matchesId = sentiment.tagId.toLowerCase() === label.toLowerCase();
                return matchesLabel || matchesId;
            });

            const resolvedTagId = existing?.tagId ?? toTagId(label);
            if (!resolvedTagId) {
                setSentimentError("Unable to derive a tag identifier from that label.");
                return;
            }

            const nextWeight = clampWeightForTag(resolvedTagId, parsedWeight);
            setSentimentError(null);
            setIsCreatingSentiment(true);
            try {
                await onCommitSentiment(resolvedTagId, nextWeight);
                setNewSentimentLabel("");
                setNewSentimentWeight("1");
            } catch (error) {
                console.error("Failed to create sentiment tag", error);
                setSentimentError(
                    error instanceof Error && error.message
                        ? error.message
                        : "Unable to create sentiment tag. Please try again.",
                );
            } finally {
                setIsCreatingSentiment(false);
            }
        },
        [clampWeightForTag, newSentimentLabel, newSentimentWeight, onCommitSentiment, sentiments],
    );

    const sentimentCards = useMemo(
        () =>
            sentiments.map((sentiment) => {
                const draft = sentimentDrafts[sentiment.tagId] ?? sentiment.weight.toString();
                const parsedDraft = Number.parseInt(draft, 10);
                const resolvedWeight = Number.isNaN(parsedDraft) ? sentiment.weight : parsedDraft;
                const maxWeight =
                    sentiment.tagId === activeSentimentId
                        ? MAX_SENTIMENT_WEIGHT
                        : sentiment.maxWeight;
                const isBusy = busySentimentTagId === sentiment.tagId;
                const ratioLabel = `${Math.round((sentiment.ratio ?? 0) * 100)}%`;
                const fallbackLabel = sentiment.tagId.replace(/^tag:/, "");
                const displayLabel = sentiment.tag?.label ?? labelFromSlug(fallbackLabel);

                const handleDraftChange = (value: string) => {
                    setSentimentDrafts((current) => ({
                        ...current,
                        [sentiment.tagId]: value,
                    }));
                };

                return {
                    sentiment,
                    draft,
                    resolvedWeight,
                    maxWeight,
                    isBusy,
                    ratioLabel,
                    displayLabel,
                    handleDraftChange,
                };
            }),
        [sentiments, sentimentDrafts, activeSentimentId, busySentimentTagId],
    );

    return (
        <FlareStack gap="md">
            <FlareStack direction="row" justify="space-between" align="baseline" wrap>
                <h2 className="rs-heading-lg">Sentiments</h2>
                <span className="rs-text-soft">
                    Tune how strongly this {labels.singular} registers across each sentiment tag.
                </span>
            </FlareStack>
            {sentimentError ? (
                <p role="alert" className="rs-text-soft">
                    {sentimentError}
                </p>
            ) : null}
            {sentiments.length > 0 ? (
                <FlareStack gap="md">
                    {sentimentCards.map(
                        ({
                            sentiment,
                            draft,
                            resolvedWeight,
                            maxWeight,
                            isBusy,
                            ratioLabel,
                            displayLabel,
                            handleDraftChange,
                        }) => (
                            <FlareCard key={sentiment.tagId} padding="md">
                                <FlareStack gap="md">
                                    <FlareStack
                                        direction="row"
                                        justify="space-between"
                                        align="baseline"
                                        wrap
                                    >
                                        <strong className="rs-heading-sm">{displayLabel}</strong>
                                        <span className="rs-text-caption rs-text-soft">
                                            {ratioLabel} of {displayLabel} total
                                        </span>
                                    </FlareStack>
                                    <FlareStack direction="row" align="center" gap="sm" wrap>
                                        <FlareIconButton
                                            type="button"
                                            variant="solid"
                                            onClick={() => {
                                                const next = clampWeightForTag(
                                                    sentiment.tagId,
                                                    resolvedWeight + 1,
                                                );
                                                if (next === resolvedWeight) {
                                                    return;
                                                }
                                                handleDraftChange(next.toString());
                                                void handleCommitSentiment(sentiment.tagId, next);
                                            }}
                                            disabled={
                                                isBusy ||
                                                (maxWeight !== undefined &&
                                                    resolvedWeight >= maxWeight)
                                            }
                                            aria-label={`Increase ${displayLabel} weight`}
                                        >
                                            <TiPlus />
                                        </FlareIconButton>
                                        <FlareTextInput
                                            name={`sentiment-${sentiment.tagId}`}
                                            inputMode="numeric"
                                            type="number"
                                            min={0}
                                            max={maxWeight}
                                            value={draft}
                                            onChange={(event) =>
                                                handleDraftChange(event.target.value)
                                            }
                                            onBlur={() => {
                                                const currentDraft =
                                                    sentimentDrafts[sentiment.tagId] ?? draft;
                                                const parsed = Number.parseInt(currentDraft, 10);
                                                if (Number.isNaN(parsed)) {
                                                    setSentimentError(
                                                        "Enter a numeric weight for the sentiment.",
                                                    );
                                                    setSentimentDrafts((current) => ({
                                                        ...current,
                                                        [sentiment.tagId]:
                                                            sentiment.weight.toString(),
                                                    }));
                                                    return;
                                                }
                                                setSentimentError(null);
                                                void handleCommitSentiment(sentiment.tagId, parsed);
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    event.currentTarget.blur();
                                                }
                                            }}
                                            disabled={isBusy}
                                            size="numeric"
                                        />
                                        <FlareIconButton
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                const next = clampWeightForTag(
                                                    sentiment.tagId,
                                                    resolvedWeight - 1,
                                                );
                                                if (next === resolvedWeight) {
                                                    return;
                                                }
                                                handleDraftChange(next.toString());
                                                void handleCommitSentiment(sentiment.tagId, next);
                                            }}
                                            disabled={isBusy || resolvedWeight <= 0}
                                            aria-label={`Decrease ${displayLabel} weight`}
                                        >
                                            <TiMinus />
                                        </FlareIconButton>
                                    </FlareStack>
                                    <span className="rs-text-caption rs-text-soft">
                                        {sentiment.totalWeightForTag ?? 0} total points across{" "}
                                        {displayLabel}.
                                    </span>
                                </FlareStack>
                            </FlareCard>
                        ),
                    )}
                </FlareStack>
            ) : (
                <p className="rs-text-soft">
                    No sentiments recorded yet. Use the form below to capture how this{" "}
                    {labels.singular}
                    resonates.
                </p>
            )}
            <form onSubmit={handleCreateSentiment}>
                <FlareStack gap="sm">
                    <FlareStack direction="row" align="flex-end" gap="sm" wrap>
                        <FlareTextInput
                            name="new-sentiment-type"
                            placeholder="Sentiment name"
                            value={newSentimentLabel}
                            onChange={(event) => setNewSentimentLabel(event.target.value)}
                            disabled={isCreatingSentiment}
                        />
                        <FlareTextInput
                            name="new-sentiment-weight"
                            inputMode="numeric"
                            type="number"
                            min={0}
                            value={newSentimentWeight}
                            onChange={(event) => setNewSentimentWeight(event.target.value)}
                            disabled={isCreatingSentiment}
                            size="numeric"
                        />
                        <FlareButton type="submit" disabled={isCreatingSentiment}>
                            {isCreatingSentiment ? "Saving…" : "Add sentiment"}
                        </FlareButton>
                    </FlareStack>
                    <span className="rs-text-caption rs-text-soft">
                        Create a new sentiment tag to adjust its weight for this {labels.singular}.
                    </span>
                </FlareStack>
            </form>
        </FlareStack>
    );
};

export default SentimentSection;
