import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

import { resolveMissiveLabels } from "../../utils/resolveMissiveLabels.ts";
import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";

const resolvedMissiveLabelsFamily = atomFamily((tagSlug?: string) =>
    atom<MissiveLabels>(() => resolveMissiveLabels(tagSlug)),
);

export const useResolvedMissiveLabels = (tagSlug?: string) =>
    useAtomValue(resolvedMissiveLabelsFamily(tagSlug));

export default resolvedMissiveLabelsFamily;
