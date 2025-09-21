import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { TiMinus, TiPlus } from "react-icons/ti";
import { Link, useParams } from "react-router";

import {
  FlareButton,
  FlareCard,
  FlareIconButton,
  FlareStack,
  FlareTextInput,
} from "@root-solar/flare";
import type { CommentTreeNode } from "@root-solar/api";

import { MAX_SENTIMENT_WEIGHT, SENTIMENT_TYPE } from "../axioms/atoms.ts";
import {
  useAddAxiomComment,
  useAxiomDetailState,
  useLoadAxiomDetail,
  useLoadAxioms,
  useUpdateAxiomSentiment,
} from "../axioms/hooks.ts";
import { useBeing } from "../beings.ts";

const pluralize = (value: string) => (value.endsWith("s") ? value : `${value}s`);

const resolveBasePath = (basePath: string | undefined, kind: string | undefined) => {
  if (basePath) {
    return basePath;
  }
  if (!kind) {
    return "/missives";
  }
  return `/${pluralize(kind)}`;
};

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const indefiniteArticle = (value: string) => (/[aeiou]/i.test(value[0] ?? "u") ? "an" : "a");

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const countComments = (nodes: CommentTreeNode[]): number =>
  nodes.reduce((total, node) => total + 1 + countComments(node.replies), 0);

type CommentFormProps = {
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
  busy?: boolean;
};

const CommentForm = ({
  onSubmit,
  onCancel,
  submitLabel = "Post comment",
  placeholder = "Share your perspective…",
  autoFocus = false,
  busy = false,
}: CommentFormProps) => {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      setLocalError("Please add a comment before submitting.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit(body);
      setDraft("");
      onCancel?.();
    } catch (error) {
      console.error("Failed to submit comment", error);
      setLocalError("Unable to post comment right now. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FlareStack gap="sm">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder={placeholder}
          disabled={busy}
          autoFocus={autoFocus}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--rs-border-strong, #d0d4dd)",
            font: "inherit",
            resize: "vertical",
          }}
        />
        {localError ? (
          <p role="alert" className="rs-text-soft">
            {localError}
          </p>
        ) : null}
        <FlareStack direction="row" justify="flex-end" gap="sm">
          {onCancel ? (
            <FlareButton
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </FlareButton>
          ) : null}
          <FlareButton type="submit" disabled={busy}>
            {submitLabel}
          </FlareButton>
        </FlareStack>
      </FlareStack>
    </form>
  );
};

type CommentItemProps = {
  comment: CommentTreeNode;
  onReply: (parentId: string, body: string) => Promise<void>;
  level: number;
};

const CommentItem = ({ comment, onReply, level }: CommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleReplySubmit = async (body: string) => {
    setIsPosting(true);
    try {
      await onReply(comment.id, body);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <FlareStack gap="md" style={{ marginLeft: level > 0 ? "1.5rem" : 0 }}>
      <FlareCard padding="md">
        <FlareStack gap="sm">
          <FlareStack direction="row" justify="space-between" align="baseline">
            <strong>{comment.authorDisplayName}</strong>
            <span className="rs-text-caption rs-text-soft">
              {formatTimestamp(comment.createdAt)}
            </span>
          </FlareStack>
          <p className="rs-text-body">{comment.body}</p>
          <FlareButton
            type="button"
            variant="ghost"
            onClick={() => setIsReplying((current) => !current)}
            disabled={isPosting}
          >
            {isReplying ? "Close reply" : "Reply"}
          </FlareButton>
          {isReplying ? (
            <CommentForm
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
              submitLabel="Post reply"
              placeholder="Add your reply…"
              autoFocus
              busy={isPosting}
            />
          ) : null}
        </FlareStack>
      </FlareCard>
      {comment.replies.length > 0 ? (
        <CommentThread comments={comment.replies} onReply={onReply} level={level + 1} />
      ) : null}
    </FlareStack>
  );
};

type CommentThreadProps = {
  comments: CommentTreeNode[];
  onReply: (parentId: string, body: string) => Promise<void>;
  level?: number;
};

const CommentThread = ({ comments, onReply, level = 0 }: CommentThreadProps) => {
  if (comments.length === 0) {
    return <p className="rs-text-soft">No comments yet.</p>;
  }

  return (
    <FlareStack gap="lg">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onReply={onReply} level={level} />
      ))}
    </FlareStack>
  );
};

type MissiveDetailProps = {
  kind?: string;
  basePath?: string;
  paramKey?: string;
  missiveId?: string;
};

const resolveLabels = (kind?: string) => {
  if (kind === "axiom") {
    return {
      singular: "axiom",
      plural: "axioms",
      capitalized: "Axiom",
    };
  }
  const singular = kind ?? "missive";
  return {
    singular,
    plural: pluralize(singular),
    capitalized: capitalize(singular),
  };
};

const MissiveDetail = ({ kind, basePath, paramKey = "missiveId", missiveId }: MissiveDetailProps) => {
  const params = useParams<Record<string, string | undefined>>();
  const tentativeId = missiveId ?? params[paramKey] ?? params.missiveId ?? params.axiomId;
  const activeMissiveId = tentativeId;

  const being = useBeing();
  const loadDetail = useLoadAxiomDetail();
  const loadAxioms = useLoadAxioms();
  const detail = useAxiomDetailState(activeMissiveId);
  const updateSentiment = useUpdateAxiomSentiment();
  const addComment = useAddAxiomComment();

  const labels = useMemo(() => resolveLabels(kind), [kind]);
  const resolvedBasePath = useMemo(() => resolveBasePath(basePath, kind), [basePath, kind]);

  const [busySentimentType, setBusySentimentType] = useState<string | null>(null);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [sentimentDrafts, setSentimentDrafts] = useState<Record<string, string>>({});
  const [newSentimentType, setNewSentimentType] = useState("");
  const [newSentimentWeight, setNewSentimentWeight] = useState("1");
  const [isCreatingSentiment, setIsCreatingSentiment] = useState(false);
  const [isDiscussionVisible, setIsDiscussionVisible] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!activeMissiveId) {
      return;
    }
    void loadAxioms();
  }, [activeMissiveId, being.id, loadAxioms]);

  useEffect(() => {
    if (!activeMissiveId) {
      return;
    }
    void loadDetail(activeMissiveId);
  }, [activeMissiveId, being.id, loadDetail]);

  useEffect(() => {
    if (detail.sentiments.length === 0) {
      setSentimentDrafts({});
      return;
    }
    setSentimentDrafts((current) => {
      const next: Record<string, string> = {};
      let changed = Object.keys(current).length !== detail.sentiments.length;
      detail.sentiments.forEach((sentiment) => {
        const value = sentiment.weight.toString();
        next[sentiment.type] = value;
        if (!changed && current[sentiment.type] !== value) {
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [detail.sentiments]);

  const clampWeightForType = useCallback((type: string, weight: number) => {
    const normalized = Math.max(0, Math.round(weight));
    if (type === SENTIMENT_TYPE) {
      return Math.min(MAX_SENTIMENT_WEIGHT, normalized);
    }
    return normalized;
  }, []);

  const commitSentimentWeight = useCallback(
    async (type: string, weight: number) => {
      if (!activeMissiveId) {
        setSentimentError(`Select ${indefiniteArticle(labels.singular)} ${labels.singular} before adjusting sentiments.`);
        return;
      }
      const nextWeight = clampWeightForType(type, weight);
      const previous = detail.sentiments.find((sentiment) => sentiment.type === type);
      const previousWeight = previous?.weight ?? 0;
      if (nextWeight === previousWeight) {
        setSentimentDrafts((current) => ({
          ...current,
          [type]: nextWeight.toString(),
        }));
        return;
      }
      setBusySentimentType(type);
      setSentimentError(null);
      try {
        await updateSentiment({ axiomId: activeMissiveId, type, weight: nextWeight });
        setSentimentDrafts((current) => ({
          ...current,
          [type]: nextWeight.toString(),
        }));
      } catch (error) {
        console.error("Failed to update sentiment weight", error);
        setSentimentError("Unable to update sentiment weight. Please try again.");
        setSentimentDrafts((current) => ({
          ...current,
          [type]: previousWeight.toString(),
        }));
      } finally {
        setBusySentimentType(null);
      }
    },
    [activeMissiveId, clampWeightForType, detail.sentiments, labels.singular, updateSentiment],
  );

  const handleCreateSentiment = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!activeMissiveId) {
        setSentimentError(`Select ${indefiniteArticle(labels.singular)} ${labels.singular} before creating sentiments.`);
        return;
      }
      const type = newSentimentType.trim();
      const parsedWeight = Number.parseInt(newSentimentWeight, 10);
      if (!type) {
        setSentimentError("Provide a name for the new sentiment type.");
        return;
      }
      if (Number.isNaN(parsedWeight)) {
        setSentimentError("Enter a numeric weight for the new sentiment.");
        return;
      }

      const existing = detail.sentiments.find(
        (sentiment) => sentiment.type.toLowerCase() === type.toLowerCase(),
      );
      const resolvedType = existing?.type ?? type;
      const nextWeight = clampWeightForType(resolvedType, parsedWeight);

      setSentimentError(null);
      setIsCreatingSentiment(true);
      try {
        await updateSentiment({ axiomId: activeMissiveId, type: resolvedType, weight: nextWeight });
        setNewSentimentType("");
        setNewSentimentWeight("1");
      } catch (error) {
        console.error("Failed to create sentiment type", error);
        setSentimentError("Unable to create sentiment type. Please try again.");
      } finally {
        setIsCreatingSentiment(false);
      }
    },
    [
      activeMissiveId,
      clampWeightForType,
      detail.sentiments,
      labels.singular,
      newSentimentType,
      newSentimentWeight,
      updateSentiment,
    ],
  );

  const handleRootComment = useCallback(
    async (body: string) => {
      if (!activeMissiveId) {
        throw new Error("Missive details are not loaded");
      }
      setIsPosting(true);
      try {
        await addComment({ axiomId: activeMissiveId, body });
      } finally {
        setIsPosting(false);
      }
    },
    [addComment, activeMissiveId],
  );

  const handleReply = useCallback(
    async (parentId: string, body: string) => {
      if (!activeMissiveId) {
        throw new Error("Missive details are not loaded");
      }
      await addComment({ axiomId: activeMissiveId, parentCommentId: parentId, body });
    },
    [addComment, activeMissiveId],
  );

  const commentCount = useMemo(() => countComments(detail.comments), [detail.comments]);

  if (!activeMissiveId) {
    return (
      <FlareStack gap="md">
        <p>
          Select {indefiniteArticle(labels.singular)} {labels.singular} to view its details.
        </p>
      </FlareStack>
    );
  }

  const isInitialLoading = detail.isLoading && !detail.hasDetail;

  return (
    <FlareStack gap="lg">
      <FlareStack gap="sm" as="header">
        <Link to={resolvedBasePath} className="rs-link">
          {kind === "axiom" ? "Back to priorities" : `Back to ${labels.plural}`}
        </Link>
        {detail.record ? (
          <>
            <h1 className="rs-heading-xl">{detail.record.title}</h1>
            {detail.record.details ? (
              <p className="rs-text-body-lg">{detail.record.details}</p>
            ) : (
              <p className="rs-text-soft">No additional details recorded yet.</p>
            )}
          </>
        ) : null}
      </FlareStack>
      {isInitialLoading ? <p className="rs-text-soft">Loading {labels.singular}…</p> : null}
      {detail.error ? (
        <p role="alert" className="rs-text-soft">
          {detail.error}
        </p>
      ) : null}
      {detail.record ? (
        <FlareStack gap="lg">
          <FlareStack gap="md">
            <FlareStack direction="row" justify="space-between" align="baseline" wrap>
              <h2 className="rs-heading-lg">Sentiments</h2>
              <span className="rs-text-soft">
                Tune how strongly this {labels.singular} registers across each sentiment type.
              </span>
            </FlareStack>
            {sentimentError ? (
              <p role="alert" className="rs-text-soft">
                {sentimentError}
              </p>
            ) : null}
            {detail.sentiments.length > 0 ? (
              <FlareStack gap="md">
                {detail.sentiments.map((sentiment) => {
                  const draft = sentimentDrafts[sentiment.type] ?? sentiment.weight.toString();
                  const parsedDraft = Number.parseInt(draft, 10);
                  const resolvedWeight = Number.isNaN(parsedDraft)
                    ? sentiment.weight
                    : parsedDraft;
                  const maxWeight =
                    sentiment.type === SENTIMENT_TYPE ? MAX_SENTIMENT_WEIGHT : sentiment.maxWeight;
                  const isBusy = busySentimentType === sentiment.type;
                  const ratioLabel = `${Math.round((sentiment.ratio ?? 0) * 100)}%`;
                  return (
                    <FlareCard key={sentiment.type} padding="md">
                      <FlareStack gap="md">
                        <FlareStack direction="row" justify="space-between" align="baseline" wrap>
                          <strong className="rs-heading-sm">{sentiment.type}</strong>
                          <span className="rs-text-caption rs-text-soft">
                            {ratioLabel} of {sentiment.type} total
                          </span>
                        </FlareStack>
                        <FlareStack direction="row" align="center" gap="sm" wrap>
                          <FlareIconButton
                            type="button"
                            variant="solid"
                            onClick={() => {
                              const next = clampWeightForType(
                                sentiment.type,
                                resolvedWeight + 1,
                              );
                              if (next === resolvedWeight) {
                                return;
                              }
                              setSentimentDrafts((current) => ({
                                ...current,
                                [sentiment.type]: next.toString(),
                              }));
                              void commitSentimentWeight(sentiment.type, next);
                            }}
                            disabled={
                              isBusy || (maxWeight !== undefined && resolvedWeight >= maxWeight)
                            }
                            aria-label={`Increase ${sentiment.type} weight`}
                          >
                            <TiPlus />
                          </FlareIconButton>
                          <FlareTextInput
                            name={`sentiment-${sentiment.type}`}
                            inputMode="numeric"
                            type="number"
                            min={0}
                            max={maxWeight}
                            value={draft}
                            onChange={(event) =>
                              setSentimentDrafts((current) => ({
                                ...current,
                                [sentiment.type]: event.target.value,
                              }))
                            }
                            onBlur={() => {
                              const parsed = Number.parseInt(draft, 10);
                              if (Number.isNaN(parsed)) {
                                setSentimentError("Enter a numeric weight for the sentiment.");
                                setSentimentDrafts((current) => ({
                                  ...current,
                                  [sentiment.type]: sentiment.weight.toString(),
                                }));
                                return;
                              }
                              setSentimentError(null);
                              void commitSentimentWeight(sentiment.type, parsed);
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
                              const next = clampWeightForType(
                                sentiment.type,
                                resolvedWeight - 1,
                              );
                              if (next === resolvedWeight) {
                                return;
                              }
                              setSentimentDrafts((current) => ({
                                ...current,
                                [sentiment.type]: next.toString(),
                              }));
                              void commitSentimentWeight(sentiment.type, next);
                            }}
                            disabled={isBusy || resolvedWeight <= 0}
                            aria-label={`Decrease ${sentiment.type} weight`}
                          >
                            <TiMinus />
                          </FlareIconButton>
                        </FlareStack>
                        <span className="rs-text-caption rs-text-soft">
                          {sentiment.totalWeightForType ?? 0} total points across {sentiment.type}.
                        </span>
                      </FlareStack>
                    </FlareCard>
                  );
                })}
              </FlareStack>
            ) : (
              <p className="rs-text-soft">
                No sentiments recorded yet. Use the form below to capture how this {labels.singular} resonates.
              </p>
            )}
            <form onSubmit={handleCreateSentiment}>
              <FlareStack gap="sm">
                <FlareStack direction="row" align="flex-end" gap="sm" wrap>
                  <FlareTextInput
                    name="new-sentiment-type"
                    placeholder="Sentiment name"
                    value={newSentimentType}
                    onChange={(event) => setNewSentimentType(event.target.value)}
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
                  Create a new sentiment type to adjust its weight for this {labels.singular}.
                </span>
              </FlareStack>
            </form>
          </FlareStack>
          <FlareStack gap="sm">
            <FlareStack direction="row" justify="space-between" align="center" wrap>
              <h2 className="rs-heading-lg">Discussion</h2>
              <FlareButton
                type="button"
                variant="ghost"
                onClick={() => setIsDiscussionVisible((current) => !current)}
                aria-pressed={isDiscussionVisible}
              >
                {isDiscussionVisible ? "Hide discussion" : "Show discussion"}
              </FlareButton>
            </FlareStack>
            {isDiscussionVisible ? (
              <>
                <p className="rs-text-soft">
                  {commentCount === 0
                    ? `Start the discussion by adding the first comment about this ${labels.singular}.`
                    : `${commentCount} comment${commentCount === 1 ? "" : "s"} so far.`}
                </p>
                <CommentForm
                  onSubmit={handleRootComment}
                  submitLabel="Post comment"
                  placeholder={`Add a comment about this ${labels.singular}…`}
                  busy={isPosting}
                />
                {detail.comments.length > 0 ? (
                  <CommentThread comments={detail.comments} onReply={handleReply} />
                ) : null}
              </>
            ) : (
              <p className="rs-text-soft">
                Discussion hidden. Use the toggle to reveal comments when you're ready.
              </p>
            )}
          </FlareStack>
        </FlareStack>
      ) : null}
    </FlareStack>
  );
};

export default MissiveDetail;
