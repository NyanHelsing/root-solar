import { Link } from "react-router";

import { FlareStack } from "@root-solar/flare";
import type { CommentTreeNode, SentimentAllocation } from "@root-solar/api";

import { SENTIMENT_TAG_SLUG } from "../../constants.ts";
import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";
import SentimentSection from "./SentimentSection.tsx";
import DiscussionSection from "./DiscussionSection.tsx";
import type { MissiveRecord } from "../../types.ts";

type MissiveDetailContentProps = {
    labels: MissiveLabels;
    tagSlug?: string;
    resolvedBasePath: string;
    activeSentimentId: string;
    sentiments: SentimentAllocation[];
    comments: CommentTreeNode[];
    record: MissiveRecord | null;
    onCommitSentiment: (tagId: string, weight: number) => Promise<number>;
    onSubmitComment: (body: string, parentCommentId?: string) => Promise<void>;
};

export const MissiveDetailContent = ({
    labels,
    tagSlug,
    resolvedBasePath,
    activeSentimentId,
    sentiments,
    comments,
    record,
    onCommitSentiment,
    onSubmitComment,
}: MissiveDetailContentProps) => (
    <FlareStack gap="lg">
        <FlareStack gap="sm" as="header">
            <Link to={resolvedBasePath} className="rs-link">
                {tagSlug === SENTIMENT_TAG_SLUG ? "Back to axioms" : `Back to ${labels.plural}`}
            </Link>
            {record ? (
                <>
                    <h1 className="rs-heading-xl">{record.title}</h1>
                    {record.details ? (
                        <p className="rs-text-body-lg">{record.details}</p>
                    ) : (
                        <p className="rs-text-soft">No additional details recorded yet.</p>
                    )}
                </>
            ) : (
                <p className="rs-text-soft">No {labels.singular} is currently selected.</p>
            )}
        </FlareStack>
        {record ? (
            <FlareStack gap="lg">
                <SentimentSection
                    sentiments={sentiments}
                    labels={labels}
                    activeSentimentId={activeSentimentId}
                    onCommitSentiment={onCommitSentiment}
                />
                <DiscussionSection
                    labels={labels}
                    comments={comments}
                    onSubmitComment={onSubmitComment}
                />
            </FlareStack>
        ) : null}
    </FlareStack>
);

export default MissiveDetailContent;
