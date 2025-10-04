import { memo, type ReactElement } from "react";

import { FlareScopedPill, type PillTone } from "@root-solar/flare";
import type { TagRecord } from "@root-solar/api";
import { labelFromSlug } from "@root-solar/globalization";

export type ScopedTagBadgeProps = {
    parent: Pick<TagRecord, "id" | "slug" | "label">;
    tag: Pick<TagRecord, "id" | "slug" | "label">;
    tone?: PillTone;
    className?: string;
};

const slugLabel = (tag: Pick<TagRecord, "slug" | "label">) =>
    tag.label ?? (tag.slug ? labelFromSlug(tag.slug) : "");

const deriveTone = (slug: string | undefined): PillTone => {
    if (!slug) return "neutral";
    if (slug === "axiom" || slug === "axiomatic") {
        return "accent";
    }
    if (slug === "priority") {
        return "warning";
    }
    return "neutral";
};

const ScopedTagBadgeComponent = ({
    parent,
    tag,
    tone,
    className,
}: ScopedTagBadgeProps): ReactElement => (
    <FlareScopedPill
        scopeLabel={slugLabel(parent)}
        valueLabel={slugLabel(tag)}
        tone={tone ?? deriveTone(tag.slug)}
        className={className}
    />
);

const ScopedTagBadge = memo(ScopedTagBadgeComponent);

export default ScopedTagBadge;
