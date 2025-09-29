import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactElement,
} from "react";
import { useLocation, useNavigate } from "react-router";

import { FlareButton, FlareStack, FlareTextInput } from "@root-solar/flare";
import { labelFromSlug, normalizeOptionalSlug } from "@root-solar/globalization";
import type { TagRecord } from "@root-solar/api";
import { TagAttachForm, TagListDisplay } from "@root-solar/tagging";

import {
  useActiveMissiveId,
  useMissiveDetailView,
  useAddActiveMissiveTag,
  useRemoveActiveMissiveTag,
} from "../state/detail/index.ts";
import {
  useCreateMissive,
  useLoadMissiveDetail,
  useLoadMissives,
  useUpdateMissive,
} from "../hooks/useMissiveActions.ts";

export type MissiveDetailProps = {
  tagSlug?: string;
  sentiment?: string;
  basePath?: string;
};

type TagSummary = Pick<TagRecord, "id" | "slug" | "label">;

const stripTagPrefix = (value: string) =>
  value.length >= 4 && value.slice(0, 4).toLowerCase() === "tag:"
    ? value.slice(4)
    : value;

const stripTagDecorators = (value: string) => {
  const withoutHash = value.startsWith("#") ? value.slice(1) : value;
  return stripTagPrefix(withoutHash);
};

const resolveTagSlug = (input: string): string => {
  const normalized = normalizeOptionalSlug(stripTagDecorators(input.trim()));
  if (!normalized) {
    throw new Error("Provide a valid tag slug.");
  }
  return normalized;
};

const textareaStyles: CSSProperties = {
  minHeight: "6rem",
  padding: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--rs-border-strong, #d0d4dd)",
  font: "inherit",
  color: "inherit",
  background: "var(--flare-surface, #fff)",
  resize: "vertical",
};

const MissiveDetail = ({ tagSlug, sentiment, basePath }: MissiveDetailProps): ReactElement => {
  const activeMissiveId = useActiveMissiveId();
  const detail = useMissiveDetailView();
  const addTag = useAddActiveMissiveTag();
  const removeTag = useRemoveActiveMissiveTag();
  const createMissive = useCreateMissive();
  const updateMissive = useUpdateMissive();
  const loadMissives = useLoadMissives();
  const loadMissiveDetail = useLoadMissiveDetail();
  const location = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [detailsInput, setDetailsInput] = useState("");
  const [draftTags, setDraftTags] = useState<TagSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isCreationPath = location.pathname.toLowerCase().endsWith("/new");

  const resolvedBasePath = basePath ?? "/missives";
  const resolvedTagSlug = tagSlug ?? null;
  const resolvedSentiment = sentiment ?? null;

  const tags = detail.record?.tags ?? [];

  useEffect(() => {
    if (isCreationPath) {
      setTitle("");
      setDetailsInput("");
      setDraftTags([]);
      setFormError(null);
      return;
    }
    if (detail.record) {
      setTitle(detail.record.title);
      setDetailsInput(detail.record.details ?? "");
      setFormError(null);
    }
  }, [isCreationPath, detail.record?.id, detail.record?.title, detail.record?.details]);

  const handleRemoveExistingTag = useCallback(
    async (tag: { id: string; slug?: string | null }) => {
      const slug = tag.slug ?? tag.id.replace(/^tag:/, "");
      if (!slug) {
        return;
      }
      await removeTag(slug);
    },
    [removeTag],
  );

  const handleAddDraftTag = useCallback(
    async (tagInput: string) => {
      const slug = resolveTagSlug(tagInput);
      if (draftTags.some((tag) => tag.slug === slug)) {
        throw new Error("Tag already added.");
      }
      setDraftTags((existing) => [
        ...existing,
        {
          id: `draft:${slug}`,
          slug,
          label: labelFromSlug(slug),
        },
      ]);
    },
    [draftTags],
  );

  const handleRemoveDraftTag = useCallback((tag: TagSummary) => {
    setDraftTags((existing) => existing.filter((candidate) => candidate.slug !== tag.slug));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSubmitting) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDetails = detailsInput.trim();

    if (trimmedTitle.length < 5) {
      setFormError("Title must be at least 5 characters long.");
      return;
    }

    if (trimmedDetails.length > 0 && trimmedDetails.length < 5) {
      setFormError("Details must be at least 5 characters long when provided.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (isCreationPath) {
        const created = await createMissive({
          title: trimmedTitle,
          details: trimmedDetails.length > 0 ? trimmedDetails : undefined,
          tagSlugs: draftTags.map((tag) => tag.slug),
        });

        await loadMissives();
        await loadMissiveDetail(created.id);

        navigate(
          {
            pathname: `${resolvedBasePath}/${created.id}`,
            search: location.search || undefined,
          },
          { replace: true },
        );

        setTitle("");
        setDetailsInput("");
        setDraftTags([]);
      } else {
        if (!activeMissiveId) {
          throw new Error("Select a missive before saving changes.");
        }
        await updateMissive({
          missiveId: activeMissiveId,
          title: trimmedTitle,
          details: trimmedDetails.length > 0 ? trimmedDetails : undefined,
        });

        await loadMissives();
        await loadMissiveDetail(activeMissiveId);

        setTitle(trimmedTitle);
        setDetailsInput(trimmedDetails);
      }
    } catch (cause) {
      const fallbackMessage = isCreationPath
        ? "Unable to create missive."
        : "Unable to save missive.";
      setFormError(cause instanceof Error ? cause.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length >= 5 && !isSubmitting;

  if (isCreationPath) {
    return (
      <section aria-labelledby="missive-create-heading">
        <header>
          <h2 id="missive-create-heading">Create Missive</h2>
          <p className="rs-text-soft">Draft a new missive with optional details and tags.</p>
        </header>
        <FlareStack gap="lg">
          <FlareStack as="form" gap="md" onSubmit={handleSubmit}>
            <FlareStack gap="xs">
              <label className="rs-text-caption" htmlFor="missive-title">
                Title
              </label>
              <FlareTextInput
                id="missive-title"
                name="missive-title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                placeholder="e.g. Establish weekly sync"
                minLength={5}
                required
              />
            </FlareStack>
            <FlareStack gap="xs">
              <label className="rs-text-caption" htmlFor="missive-details">
                Details
              </label>
              <textarea
                id="missive-details"
                name="missive-details"
                value={detailsInput}
                onChange={(event) => {
                  setDetailsInput(event.target.value);
                  if (formError) {
                    setFormError(null);
                  }
                }}
                placeholder="Provide additional context (optional)"
                style={textareaStyles}
                rows={4}
              />
            </FlareStack>
            {formError ? (
              <p role="alert" className="rs-text-soft">
                {formError}
              </p>
            ) : null}
            <FlareButton type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Creating..." : "Create"}
            </FlareButton>
          </FlareStack>
          <FlareStack gap="xs">
            <h3 className="rs-heading-sm">Tags</h3>
            <TagListDisplay tags={draftTags} onRemove={handleRemoveDraftTag} />
            <TagAttachForm
              inputId="new-missive-tag-input"
              onSubmit={handleAddDraftTag}
              disabled={isSubmitting}
              disabledReason={isSubmitting ? "Creating missive..." : null}
            />
          </FlareStack>
        </FlareStack>
      </section>
    );
  }

  if (!detail.record) {
    return (
      <section aria-labelledby="missive-detail-heading">
        <header>
          <h2 id="missive-detail-heading">Missive Detail</h2>
          <p className="rs-text-soft">
            Lightweight view while the full experience is under repair.
          </p>
        </header>
        <p className="rs-text-soft">Select a missive from the list to load its detail.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="missive-detail-heading">
      <header>
        <h2 id="missive-detail-heading">Missive Detail</h2>
        <p className="rs-text-soft">
          Lightweight view while the full experience is under repair.
        </p>
      </header>

      <dl className="rs-stack" data-spacing="sm">
        <div>
          <dt>Active Missive ID</dt>
          <dd>{activeMissiveId ?? "(none)"}</dd>
        </div>
        <div>
          <dt>Base Path</dt>
          <dd>{resolvedBasePath}</dd>
        </div>
        <div>
          <dt>Tag Slug</dt>
          <dd>{resolvedTagSlug ?? "(unset)"}</dd>
        </div>
        <div>
          <dt>Sentiment</dt>
          <dd>{resolvedSentiment ?? "(unset)"}</dd>
        </div>
      </dl>

      <FlareStack gap="lg">
        <FlareStack as="form" gap="md" onSubmit={handleSubmit}>
          <FlareStack gap="xs">
            <label className="rs-text-caption" htmlFor="missive-title">
              Title
            </label>
            <FlareTextInput
              id="missive-title"
              name="missive-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (formError) {
                  setFormError(null);
                }
              }}
              placeholder="Update the missive title"
              minLength={5}
              required
            />
          </FlareStack>
          <FlareStack gap="xs">
            <label className="rs-text-caption" htmlFor="missive-details">
              Details
            </label>
            <textarea
              id="missive-details"
              name="missive-details"
              value={detailsInput}
              onChange={(event) => {
                setDetailsInput(event.target.value);
                if (formError) {
                  setFormError(null);
                }
              }}
              placeholder="Capture additional context (optional)"
              style={textareaStyles}
              rows={4}
            />
          </FlareStack>
          {formError ? (
            <p role="alert" className="rs-text-soft">
              {formError}
            </p>
          ) : null}
          <FlareButton type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </FlareButton>
        </FlareStack>
        <section className="rs-stack" data-spacing="xs">
          <h4 className="rs-heading-sm">Tags</h4>
          <TagListDisplay tags={tags} onRemove={handleRemoveExistingTag} />
          <TagAttachForm
            inputId="missive-tag-input"
            onSubmit={addTag}
            disabled={!activeMissiveId || isSubmitting}
            disabledReason={
              activeMissiveId
                ? isSubmitting
                  ? "Saving changes..."
                  : null
                : "Select a missive before adding tags."
            }
          />
        </section>
      </FlareStack>
    </section>
  );
};

export default MissiveDetail;
