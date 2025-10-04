import { useState } from "react";

import { FlareButton, FlareCard, FlareStack } from "@root-solar/flare";
import type { CommentTreeNode } from "@root-solar/api";

import { formatTimestamp } from "../utils/formatTimestamp.ts";
import { CommentForm } from "./CommentForm.tsx";

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

export const CommentThread = ({ comments, onReply, level = 0 }: CommentThreadProps) => {
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

export default CommentThread;
