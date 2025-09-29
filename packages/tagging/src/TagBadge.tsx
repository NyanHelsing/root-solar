import { memo, type ReactElement } from "react";

import { FlarePill, type PillTone } from "@root-solar/flare";
import type { TagRecord } from "@root-solar/api";
import { labelFromSlug } from "@root-solar/globalization";

export type TagBadgeProps = {
  tag: Pick<TagRecord, "id" | "slug" | "label">;
  tone?: PillTone;
  className?: string;
};

const deriveTone = (slug: string): PillTone => {
  if (slug === "axiom" || slug === "axiomatic") {
    return "accent";
  }
  if (slug === "priority") {
    return "warning";
  }
  return "neutral";
};

const resolveLabel = (tag: TagBadgeProps["tag"]): string =>
  tag.label ?? (tag.slug ? labelFromSlug(tag.slug) : tag.id);

const TagBadgeComponent = ({ tag, tone, className }: TagBadgeProps): ReactElement => (
  <FlarePill
    tone={tone ?? deriveTone(tag.slug)}
    label={resolveLabel(tag)}
    className={className}
  />
);

const TagBadge = memo(TagBadgeComponent);

export default TagBadge;
