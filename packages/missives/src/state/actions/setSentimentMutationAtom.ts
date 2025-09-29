import { trpc } from "@root-solar/api/client";

export const setSentimentMutationAtom = trpc.setSentiment.atomWithMutation();

export default setSentimentMutationAtom;
