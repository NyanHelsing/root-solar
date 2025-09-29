import { FlareStack } from "@root-solar/flare";

import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";

export const MissiveDetailLoadingFallback = ({ labels }: { labels: MissiveLabels }) => (
  <FlareStack gap="md">
    <p className="rs-text-soft">Loading {labels.singular}…</p>
  </FlareStack>
);

export default MissiveDetailLoadingFallback;
