import { FlareButton, FlareStack } from "@root-solar/flare";

import type { MissiveLabels } from "../../utils/resolveMissiveLabels.ts";

export type MissiveDetailErrorFallbackProps = {
    labels: MissiveLabels;
    error: Error;
    onRetry: () => void;
};

export const MissiveDetailErrorFallback = ({
    labels,
    error,
    onRetry,
}: MissiveDetailErrorFallbackProps) => (
    <FlareStack gap="md">
        <p role="alert" className="rs-text-soft">
            {error.message || `Unable to load ${labels.singular} right now.`}
        </p>
        <FlareButton type="button" variant="ghost" onClick={onRetry}>
            Try again
        </FlareButton>
    </FlareStack>
);

export default MissiveDetailErrorFallback;
