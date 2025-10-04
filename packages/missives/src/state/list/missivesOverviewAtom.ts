import { atom, useAtomValue } from "jotai";

import type { MissiveOverview } from "../../types.ts";
import cloneTag from "../../utils/cloneTag.ts";
import { activeSentimentAtom } from "../sentiment/activeSentimentAtom.ts";
import { missivesLoadableAtom } from "./missivesLoadableAtom.ts";
import { sentimentsLoadableAtom } from "./sentimentsLoadableAtom.ts";
import { selectActiveSentiments } from "./selectActiveSentiments.ts";
import { toMissiveRecord } from "./toMissiveRecord.ts";

export const missivesOverviewAtom = atom<MissiveOverview[]>((get) => {
    const loadableMissives = get(missivesLoadableAtom);
    const loadableSentiments = get(sentimentsLoadableAtom);
    const { id: activeSentimentId } = get(activeSentimentAtom);

    if (loadableMissives.state !== "hasData") {
        return [];
    }

    const missives = loadableMissives.data.map(toMissiveRecord);
    const activeSentiments = selectActiveSentiments(loadableSentiments, activeSentimentId);
    const sentimentBySubject = new Map(
        activeSentiments.map((allocation) => [allocation.subjectId, allocation]),
    );

    const totalWeightForTag = activeSentiments.reduce(
        (total, allocation) => total + allocation.weight,
        0,
    );

    return missives.map((record) => {
        const allocation = sentimentBySubject.get(record.id);
        const weight = allocation?.weight ?? 0;
        const ratio =
            allocation?.ratio ?? (totalWeightForTag === 0 ? 0 : weight / totalWeightForTag);
        return {
            id: record.id,
            title: record.title,
            details: record.details,
            weight,
            ratio,
            tags: record.tags.map(cloneTag),
        } satisfies MissiveOverview;
    });
});

export const useMissivesOverview = (): MissiveOverview[] => useAtomValue(missivesOverviewAtom);

export default missivesOverviewAtom;
