import type { TagRecord } from "@root-solar/api";

const cloneTag = (tag: TagRecord): TagRecord => ({
  ...tag,
  tags: tag.tags ? [...tag.tags] : undefined,
});

export default cloneTag;
