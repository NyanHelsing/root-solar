export type MissiveCommentInput = {
    missiveId: string;
    body: string;
    parentCommentId?: string;
};

export type MissiveCommentPayload = {
    axiomId: string;
    parentCommentId?: string;
    authorBeingId: string;
    authorDisplayName: string;
    body: string;
};
