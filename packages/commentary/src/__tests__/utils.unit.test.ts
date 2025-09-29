import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CommentTreeNode } from "@root-solar/api";

import { countComments } from "../utils/countComments.ts";
import { formatTimestamp } from "../utils/formatTimestamp.ts";

describe("commentary/utils", () => {
  it("counts nested comment threads", () => {
    const comments: CommentTreeNode[] = [
      {
        id: "root-1",
        axiomId: "axiom-1",
        parentCommentId: null,
        authorBeingId: "being-1",
        authorDisplayName: "Being One",
        body: "Root comment",
        createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
        replies: [
          {
            id: "child-1",
            axiomId: "axiom-1",
            parentCommentId: "root-1",
            authorBeingId: "being-2",
            authorDisplayName: "Being Two",
            body: "First reply",
            createdAt: new Date("2024-01-01T01:00:00Z").toISOString(),
            replies: [],
          },
          {
            id: "child-2",
            axiomId: "axiom-1",
            parentCommentId: "root-1",
            authorBeingId: "being-3",
            authorDisplayName: "Being Three",
            body: "Second reply",
            createdAt: new Date("2024-01-01T02:00:00Z").toISOString(),
            replies: [
              {
                id: "grandchild-1",
                axiomId: "axiom-1",
                parentCommentId: "child-2",
                authorBeingId: "being-4",
                authorDisplayName: "Being Four",
                body: "Nested reply",
                createdAt: new Date("2024-01-01T02:30:00Z").toISOString(),
                replies: [],
              },
            ],
          },
        ],
      },
    ];

    assert.equal(countComments(comments), 4);
  });

  it("formats timestamps using locale aware output", () => {
    const iso = "2024-07-15T12:34:56.000Z";
    const expected = new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

    assert.equal(formatTimestamp(iso), expected);
  });

  it("falls back to original input when timestamp is invalid", () => {
    const invalid = "not-a-date";
    assert.equal(formatTimestamp(invalid), invalid);
  });
});
