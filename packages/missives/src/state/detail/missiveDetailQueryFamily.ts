import { atomFamily } from "jotai/utils";
import type { Getter } from "jotai";

import { trpc } from "@root-solar/api/client";

import { beingAtom } from "@root-solar/auth";

export const missiveDetailQueryFamily = atomFamily((missiveId: string) =>
    trpc.getAxiom.atomWithQuery(
        (get: Getter) => {
            const { id: beingId } = get(beingAtom);
            return { axiomId: missiveId, beingId };
        },
        { disabledOutput: null },
    ),
);

export default missiveDetailQueryFamily;
