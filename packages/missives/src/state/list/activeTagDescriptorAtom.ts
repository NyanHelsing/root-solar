import { labelFromSlug } from "@root-solar/globalization";
import { atom, useAtomValue } from "jotai";

import type { TagOption } from "../../utils/tagFilterUtils.ts";
import { missiveTagOptionsAtom } from "./missiveTagOptionsAtom.ts";
import { missiveTagSelectionAtom } from "./missiveTagSelectionAtom.ts";

export const activeTagDescriptorAtom = atom<TagOption | undefined>((get) => {
    const selectedTag = get(missiveTagSelectionAtom);
    if (!selectedTag) {
        return undefined;
    }
    const options = get(missiveTagOptionsAtom);
    const match = options.find((option) => option.slug === selectedTag);
    if (match) {
        return match;
    }
    return {
        slug: selectedTag,
        label: labelFromSlug(selectedTag),
    } satisfies TagOption;
});

export const useActiveTagDescriptor = () => useAtomValue(activeTagDescriptorAtom);

export default activeTagDescriptorAtom;
