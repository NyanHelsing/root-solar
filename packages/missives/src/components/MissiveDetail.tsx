import { useCallback, type ReactElement } from "react";

import {
  useActiveMissiveId,
  useMissiveDetailView,
  useAddActiveMissiveTag,
  useRemoveActiveMissiveTag,
} from "../state/detail/index.ts";
import { TagAttachForm, TagListDisplay } from "@root-solar/tagging";

export type MissiveDetailProps = {
  tagSlug?: string;
  sentiment?: string;
  basePath?: string;
};

const MissiveDetail = ({ tagSlug, sentiment, basePath }: MissiveDetailProps): ReactElement => {
  const activeMissiveId = useActiveMissiveId();
  const detail = useMissiveDetailView();
  const addTag = useAddActiveMissiveTag();
  const removeTag = useRemoveActiveMissiveTag();

  const tags = detail.record?.tags ?? [];

  const resolvedBasePath = basePath ?? "/missives";
  const resolvedTagSlug = tagSlug ?? null;
  const resolvedSentiment = sentiment ?? null;

  const handleRemoveTag = useCallback(
    async (tag: { id: string; slug?: string | null }) => {
      const slug = tag.slug ?? tag.id.replace(/^tag:/, "");
      if (!slug) {
        return;
      }
      await removeTag(slug);
    },
    [removeTag],
  );

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

      {detail.record ? (
        <article className="rs-stack" data-spacing="sm">
          <h3 className="rs-heading-md">{detail.record.title}</h3>
          {detail.record.details ? (
            <p>{detail.record.details}</p>
          ) : (
            <p className="rs-text-soft">No additional details provided.</p>
          )}
          <section className="rs-stack" data-spacing="xs">
            <h4 className="rs-heading-sm">Tags</h4>
            <TagListDisplay tags={tags} onRemove={handleRemoveTag} />
            <TagAttachForm
              inputId="missive-tag-input"
              onSubmit={addTag}
              disabled={!activeMissiveId}
              disabledReason={
                activeMissiveId ? null : "Select a missive before adding tags."
              }
            />
          </section>
        </article>
      ) : (
        <p className="rs-text-soft">Select a missive from the list to load its detail.</p>
      )}
    </section>
  );
};

export default MissiveDetail;
