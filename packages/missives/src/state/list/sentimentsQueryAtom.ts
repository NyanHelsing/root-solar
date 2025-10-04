import type { Getter } from "jotai";
import { trpc } from "@root-solar/api/client";
import type { inferProcedureInput } from "@trpc/server";
import type { ApiRouter } from "@root-solar/api/router";

import { beingAtom } from "@root-solar/auth";

type ListSentimentsInput = inferProcedureInput<ApiRouter["listSentimentsForBeing"]>;

export const sentimentsQueryAtom = trpc.listSentimentsForBeing.atomWithQuery((get: Getter) => {
    const being = get(beingAtom);
    return {
        beingId: being.id,
        subjectTable: "missive"
    } satisfies ListSentimentsInput;
});

export default sentimentsQueryAtom;
