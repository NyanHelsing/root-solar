import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

import { routePathAtom } from "@root-solar/routing";

import { resolveBasePath } from "../../utils/resolveBasePath.ts";

export type ResolvedBasePathInput = {
    basePath?: string;
    tagSlug?: string;
};

const resolvedMissiveBasePathFamily = atomFamily((input: ResolvedBasePathInput) =>
    atom<string>((get) => {
        const routePath = get(routePathAtom);
        return resolveBasePath(input.basePath ?? routePath, input.tagSlug);
    }),
);

export const useResolvedMissiveBasePath = (input: ResolvedBasePathInput) =>
    useAtomValue(resolvedMissiveBasePathFamily(input));

export default resolvedMissiveBasePathFamily;
