import { memo, type ReactElement, type ReactNode } from "react";

import { FlareIconButton, FlareStack, FlareTagGroup } from "@root-solar/flare";
import { RxCross2 } from "react-icons/rx";
import type { TagRecord } from "@root-solar/api";

import TagBadge from "./TagBadge.tsx";

export type TagListDisplayProps = {
    tags: Array<Pick<TagRecord, "id" | "slug" | "label">>;
    gap?: "xs" | "sm" | "md";
    className?: string;
    emptyLabel?: ReactNode | null;
    onRemove?: (tag: Pick<TagRecord, "id" | "slug" | "label">) => void | Promise<void>;
};

const TagListDisplayComponent = ({
    tags,
    gap = "sm",
    className,
    emptyLabel,
    onRemove,
}: TagListDisplayProps): ReactElement | null => {
    if (tags.length === 0) {
        if (emptyLabel === null) {
            return null;
        }
        if (emptyLabel) {
            return <>{emptyLabel}</>;
        }
        return <p className="rs-text-soft">No tags assigned.</p>;
    }

    const renderTag = (tag: Pick<TagRecord, "id" | "slug" | "label">) => {
        if (!onRemove) {
            return <TagBadge key={tag.id} tag={tag} />;
        }

        const handleClick = () => {
            const result = onRemove(tag);
            if (result && typeof (result as Promise<unknown>).then === "function") {
                void result;
            }
        };

        return (
            <FlareStack
                key={tag.id}
                direction="row"
                align="center"
                gap="xs"
                className="rs-tag-item"
            >
                <TagBadge tag={tag} />
                <FlareIconButton
                    type="button"
                    variant="ghost"
                    aria-label={`Remove ${tag.label ?? tag.slug ?? tag.id}`}
                    onClick={handleClick}
                >
                    <RxCross2 />
                </FlareIconButton>
            </FlareStack>
        );
    };

    return (
        <FlareTagGroup gap={gap} className={className}>
            {tags.map((tag) => renderTag(tag))}
        </FlareTagGroup>
    );
};

const TagListDisplay = memo(TagListDisplayComponent);

export default TagListDisplay;
