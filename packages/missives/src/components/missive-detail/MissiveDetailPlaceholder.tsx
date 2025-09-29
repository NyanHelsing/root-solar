import { indefiniteArticle } from "@root-solar/globalization";
import { FlareStack } from "@root-solar/flare";

import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";

export const MissiveDetailPlaceholder = ({ labels }: { labels: MissiveLabels }) => (
  <FlareStack gap="md">
    <p>
      Select {indefiniteArticle(labels.singular)} {labels.singular} to view its details.
    </p>
  </FlareStack>
);

export default MissiveDetailPlaceholder;
