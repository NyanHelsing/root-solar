import { useCallback, useMemo, useState } from "react";

import { FlareButton, FlareStack } from "@root-solar/flare";
import type { CommentTreeNode } from "@root-solar/api";

import { CommentForm, CommentThread, countComments } from "@root-solar/commentary";
import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";

type DiscussionSectionProps = {
  labels: MissiveLabels;
  comments: CommentTreeNode[];
  onSubmitComment: (body: string, parentCommentId?: string) => Promise<void>;
};

export const DiscussionSection = ({ labels, comments, onSubmitComment }: DiscussionSectionProps) => {
  const [isDiscussionVisible, setIsDiscussionVisible] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const commentCount = useMemo(() => countComments(comments), [comments]);

  const handleRootComment = useCallback(
    async (body: string) => {
      setIsPosting(true);
      try {
        await onSubmitComment(body);
      } finally {
        setIsPosting(false);
      }
    },
    [onSubmitComment],
  );

  const handleReply = useCallback(
    (parentId: string, body: string) => onSubmitComment(body, parentId),
    [onSubmitComment],
  );

  return (
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
          {comments.length > 0 ? (
            <CommentThread comments={comments} onReply={handleReply} />
          ) : null}
        </>
      ) : (
        <p className="rs-text-soft">
          Discussion hidden. Use the toggle to reveal comments when you're ready.
        </p>
      )}
    </FlareStack>
  );
};

export default DiscussionSection;
