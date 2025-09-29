import type { MissiveOverview } from "../types.ts";
import type { TagOption } from "../utils/tagFilterUtils.ts";
import {
  useActiveTagDescriptor,
  useFilteredMissives,
  useMissiveTagOptions,
  useSelectedMissiveTag,
  useSetSelectedMissiveTag,
} from "../state/list/index.ts";

export const useMissiveTagFilter = (): {
  filteredMissives: MissiveOverview[];
  tagOptions: TagOption[];
  selectedTag: string | null;
  setSelectedTag: (value: string | null) => void;
  activeTagDescriptor: TagOption | undefined;
} => {
  const filteredMissives = useFilteredMissives();
  const tagOptions = useMissiveTagOptions();
  const selectedTag = useSelectedMissiveTag();
  const setSelectedTag = useSetSelectedMissiveTag();
  const activeTagDescriptor = useActiveTagDescriptor();

  return {
    filteredMissives,
    tagOptions,
    selectedTag,
    setSelectedTag,
    activeTagDescriptor,
  } as const;
};

export default useMissiveTagFilter;
export type { TagOption } from "../utils/tagFilterUtils.ts";
