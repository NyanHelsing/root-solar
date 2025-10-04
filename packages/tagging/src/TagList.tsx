import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FlareButton, FlareCard, FlareStack } from "@root-solar/flare";
import { client } from "@root-solar/api/client";
import type { TagRecord } from "@root-solar/api";
import { labelFromSlug } from "@root-solar/globalization";

import TagAttachForm from "./TagAttachForm.tsx";
import ScopedTagBadge from "./ScopedTagBadge.tsx";

type LoadStatus = {
    isLoading: boolean;
    error: string | null;
};

const initialStatus: LoadStatus = {
    isLoading: false,
    error: null
};

const normaliseParentLabel = (tagId: string) => (tagId.startsWith("tag:") ? tagId.slice(4) : tagId);

const TagList = () => {
    const [tags, setTags] = useState<TagRecord[]>([]);
    const [status, setStatus] = useState<LoadStatus>(initialStatus);
    const isMountedRef = useRef(true);

    const fetchTags = useCallback(async () => {
        const result = await client.listTags.query();
        return [...result].sort((a, b) => a.label.localeCompare(b.label));
    }, []);

    const hydrate = useCallback(async () => {
        setStatus({ isLoading: true, error: null });
        try {
            const sorted = await fetchTags();
            if (!isMountedRef.current) {
                return;
            }
            setTags(sorted);
            setStatus({ isLoading: false, error: null });
        } catch (error) {
            if (!isMountedRef.current) {
                return;
            }
            setStatus({
                isLoading: false,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }, [fetchTags]);

    useEffect(() => {
        isMountedRef.current = true;
        void hydrate();
        return () => {
            isMountedRef.current = false;
        };
    }, [hydrate]);

    const handleRefresh = useCallback(() => {
        void hydrate();
    }, [hydrate]);

    const tagSummaries = useMemo(
        () =>
            tags.map((tag) => ({
                ...tag,
                parentRecords: (tag.tags ?? []).map((parentId) => {
                    const slug = normaliseParentLabel(parentId);
                    return {
                        id: parentId,
                        slug,
                        label: labelFromSlug(slug)
                    };
                })
            })),
        [tags]
    );

    const handleAddParentTag = useCallback(
        async (tagId: string, parentSlug: string) => {
            await client.addTagTag.mutate({ tagId, tagSlug: parentSlug });
            await hydrate();
        },
        [hydrate]
    );

    return (
        <FlareStack gap="lg">
            <FlareStack as="header" gap="sm">
                <h1 className="rs-heading-xl">Tags</h1>
                <p className="rs-text-body-lg rs-text-soft">
                    Browse all declared tags and their parent tag relationships.
                </p>
                <FlareStack direction="row" gap="sm" wrap align="center">
                    <FlareButton
                        type="button"
                        variant="ghost"
                        onClick={handleRefresh}
                        disabled={status.isLoading}
                    >
                        Refresh
                    </FlareButton>
                    {status.isLoading ? <span className="rs-text-soft">Loading tags…</span> : null}
                </FlareStack>
                {status.error ? (
                    <p role="alert" className="rs-text-soft">
                        {status.error}
                    </p>
                ) : null}
            </FlareStack>
            {tagSummaries.length === 0 && !status.isLoading ? (
                <p className="rs-text-soft">No tags found.</p>
            ) : null}
            <FlareStack as="ul" gap="md" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {tagSummaries.map((tag) => (
                    <FlareCard as="li" key={tag.id} padding="lg">
                        <FlareStack gap="xs">
                            <FlareStack direction="row" gap="sm" align="baseline" wrap>
                                <h2 className="rs-heading-md">{tag.label}</h2>
                                <span className="rs-text-soft">({tag.slug})</span>
                            </FlareStack>
                            {tag.description ? (
                                <p className="rs-text-body-sm rs-text-soft">{tag.description}</p>
                            ) : null}
                            {tag.parentRecords.length > 0 ? (
                                <FlareStack direction="row" wrap gap="xs">
                                    {tag.parentRecords.map((parent) => (
                                        <ScopedTagBadge
                                            key={`${tag.id}-${parent.id}`}
                                            parent={parent}
                                            tag={tag}
                                        />
                                    ))}
                                </FlareStack>
                            ) : (
                                <p className="rs-text-caption rs-text-soft">No parent tags</p>
                            )}
                            <TagAttachForm
                                inputId={`tag-parent-${tag.slug}`}
                                label="Add parent tag"
                                placeholder="e.g. sentimental"
                                submitLabel="Add parent"
                                busyLabel="Linking…"
                                disabled={status.isLoading}
                                onSubmit={(parentSlug) => handleAddParentTag(tag.id, parentSlug)}
                            />
                        </FlareStack>
                    </FlareCard>
                ))}
            </FlareStack>
        </FlareStack>
    );
};

export default TagList;
