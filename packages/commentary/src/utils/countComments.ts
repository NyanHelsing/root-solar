import type { CommentTreeNode } from "@root-solar/api";

// TODO: create a @root-solar/prelude package and move this function to it with a generic implementation
// that can be used to count items in an arbitrary tree of arbitrary types. Bonus for using an optic to
// get the leaves.
export const countComments = (nodes: CommentTreeNode[]): number =>
  nodes.reduce((total, node) => total + 1 + countComments(node.replies), 0);

export default countComments;
