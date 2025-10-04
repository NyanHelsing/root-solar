import { useMemo } from "react";

import type { MissiveOverview } from "../types.ts";

const useMissiveTotals = (missives: MissiveOverview[]) => {
    const totalWeight = useMemo(
        () => missives.reduce((total, missive) => total + missive.weight, 0),
        [missives]
    );

    return {
        missives,
        totalWeight
    } as const;
};

export default useMissiveTotals;
