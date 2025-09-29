import { trpc } from "@root-solar/api/client";

export const addCommentMutationAtom = trpc.addAxiomComment.atomWithMutation();

export default addCommentMutationAtom;
