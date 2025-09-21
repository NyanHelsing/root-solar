import { atom } from "jotai";

import { client } from "@root-solar/api/client";
import type {
  AxiomRecord,
  CommentTreeNode,
  SentimentAllocation,
} from "@root-solar/api";
import { createAppLogger } from "@root-solar/observability";

import { beingAtom } from "../beings.ts";

export const SENTIMENT_TYPE = "priority" as const;
export const MAX_SENTIMENT_WEIGHT = 100;

const logger = createAppLogger("declarations:axioms", {
  tags: ["declarations", "axioms"],
});

type DetailStatus = {
  isLoading: boolean;
  error: string | null;
};

type AxiomEntity = {
  record: AxiomRecord;
  sentiments: Record<string, SentimentAllocation>;
  comments?: CommentTreeNode[];
  detailLoadedAt?: number;
};

type AxiomsStore = {
  order: string[];
  entities: Record<string, AxiomEntity>;
  listStatus: {
    isLoading: boolean;
    error: string | null;
  };
  detailStatus: Record<string, DetailStatus>;
  activeBeingId: string | null;
};

const initialStore: AxiomsStore = {
  order: [],
  entities: {},
  listStatus: {
    isLoading: false,
    error: null,
  },
  detailStatus: {},
  activeBeingId: null,
};

const createZeroAllocation = (
  beingId: string,
  axiomId: string,
  type: string,
): SentimentAllocation => ({
  id: `${beingId}:${type}:${axiomId}`,
  beingId,
  axiomId,
  type,
  weight: 0,
  totalWeightForType: 0,
  ratio: 0,
});

const cloneEntity = (entity: AxiomEntity): AxiomEntity => ({
  record: { ...entity.record },
  sentiments: { ...entity.sentiments },
  comments: entity.comments ? [...entity.comments] : undefined,
  detailLoadedAt: entity.detailLoadedAt,
});

const recomputeSentimentTotals = (
  entities: Record<string, AxiomEntity>,
  orderedIds: string[],
  type: string,
) => {
  const ids = orderedIds.length > 0 ? orderedIds : Object.keys(entities);
  const total = ids.reduce((sum, id) => {
    const entity = entities[id];
    if (!entity) {
      return sum;
    }
    const allocation = entity.sentiments[type];
    return sum + (allocation?.weight ?? 0);
  }, 0);

  ids.forEach((id) => {
    const entity = entities[id];
    if (!entity) {
      return;
    }
    const allocation = entity.sentiments[type];
    if (!allocation) {
      return;
    }
    entity.sentiments = {
      ...entity.sentiments,
      [type]: {
        ...allocation,
        totalWeightForType: total,
        ratio: total === 0 ? 0 : allocation.weight / total,
      },
    } satisfies Record<string, SentimentAllocation>;
  });
};

export const axiomsStoreAtom = atom<AxiomsStore>(initialStore);

export const loadAxiomsAtom = atom(null, async (get, set) => {
  const being = get(beingAtom);
  const current = get(axiomsStoreAtom);
  if (current.listStatus.isLoading && current.activeBeingId === being.id) {
    logger.debug("Axiom list load skipped; already running", {
      tags: ["load"],
    });
    return;
  }

  const shouldResetStore =
    current.activeBeingId !== null && current.activeBeingId !== being.id;

  set(axiomsStoreAtom, {
    ...(shouldResetStore ? { ...initialStore } : { ...current }),
    listStatus: {
      isLoading: true,
      error: null,
    },
    activeBeingId: being.id,
  });

  try {
    const [axioms, prioritySentiments] = await Promise.all([
      client.listAxioms.query(),
      client.listSentimentsForBeing.query({
        beingId: being.id,
        type: SENTIMENT_TYPE,
      }),
    ]);

    const nextEntities: Record<string, AxiomEntity> = {};
    const order = axioms.map((record) => {
      const existing = current.entities[record.id];
      const base: AxiomEntity = existing
        ? {
            ...cloneEntity(existing),
            record: { ...existing.record, ...record },
          }
        : {
            record,
            sentiments: {},
          };
      nextEntities[record.id] = base;
      return record.id;
    });

    const priorityMap = new Map(prioritySentiments.map((item) => [item.axiomId, item]));
    order.forEach((axiomId) => {
      const entity = nextEntities[axiomId];
      if (!entity) {
        return;
      }
      const found = priorityMap.get(axiomId);
      if (found) {
        entity.sentiments = {
          ...entity.sentiments,
          [SENTIMENT_TYPE]: found,
        } satisfies Record<string, SentimentAllocation>;
        return;
      }
      if (!entity.sentiments[SENTIMENT_TYPE]) {
        entity.sentiments = {
          ...entity.sentiments,
          [SENTIMENT_TYPE]: createZeroAllocation(being.id, axiomId, SENTIMENT_TYPE),
        } satisfies Record<string, SentimentAllocation>;
      }
    });

    recomputeSentimentTotals(nextEntities, order, SENTIMENT_TYPE);

    const nextDetailStatus: Record<string, DetailStatus> = {};
    order.forEach((id) => {
      const status = current.detailStatus[id];
      if (status) {
        nextDetailStatus[id] = { ...status };
      }
    });

    set(axiomsStoreAtom, {
      order,
      entities: nextEntities,
      listStatus: {
        isLoading: false,
        error: null,
      },
      detailStatus: nextDetailStatus,
      activeBeingId: being.id,
    });
  } catch (error) {
    logger.error("Failed to load axioms", error, {
      tags: ["load"],
    });
    const latest = get(axiomsStoreAtom);
    set(axiomsStoreAtom, {
      ...latest,
      listStatus: {
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      activeBeingId: being.id,
    });
  }
});

export const loadAxiomDetailAtom = atom(null, async (get, set, axiomId: string) => {
  if (!axiomId) {
    return;
  }
  const current = get(axiomsStoreAtom);
  const status = current.detailStatus[axiomId];
  if (status?.isLoading) {
    logger.debug("Axiom detail load skipped; already running", {
      axiomId,
      tags: ["load", "detail"],
    });
    return;
  }

  const being = get(beingAtom);

  set(axiomsStoreAtom, {
    ...current,
    detailStatus: {
      ...current.detailStatus,
      [axiomId]: {
        isLoading: true,
        error: null,
      },
    },
    activeBeingId: being.id,
  });

  try {
    const detail = await client.getAxiom.query({
      axiomId,
      beingId: being.id,
    });

    const latest = get(axiomsStoreAtom);
    if (!detail) {
      set(axiomsStoreAtom, {
        ...latest,
        detailStatus: {
          ...latest.detailStatus,
          [axiomId]: {
            isLoading: false,
            error: "Axiom not found.",
          },
        },
        activeBeingId: being.id,
      });
      return;
    }

    const existing = latest.entities[axiomId];
    const entity: AxiomEntity = existing ? cloneEntity(existing) : {
      record: {
        id: detail.id,
        title: detail.title,
        details: detail.details,
      },
      sentiments: {},
    };

    entity.record = {
      ...entity.record,
      title: detail.title,
      details: detail.details,
    } satisfies AxiomRecord;
    entity.comments = detail.comments;
    entity.detailLoadedAt = Date.now();

    const sentimentsByType = new Map(detail.sentiments.map((item) => [item.type, item]));
    const updatedSentiments: Record<string, SentimentAllocation> = {
      ...entity.sentiments,
    };
    sentimentsByType.forEach((allocation, type) => {
      updatedSentiments[type] = allocation;
    });
    entity.sentiments = updatedSentiments;

    if (!entity.sentiments[SENTIMENT_TYPE]) {
      entity.sentiments = {
        ...entity.sentiments,
        [SENTIMENT_TYPE]: createZeroAllocation(being.id, axiomId, SENTIMENT_TYPE),
      } satisfies Record<string, SentimentAllocation>;
    }

    const nextEntities: Record<string, AxiomEntity> = {
      ...latest.entities,
      [axiomId]: entity,
    };

    const order = latest.order.includes(axiomId)
      ? [...latest.order]
      : [...latest.order, axiomId];

    if (entity.sentiments[SENTIMENT_TYPE]) {
      recomputeSentimentTotals(nextEntities, order, SENTIMENT_TYPE);
    }

    set(axiomsStoreAtom, {
      order,
      entities: nextEntities,
      listStatus: latest.listStatus,
      detailStatus: {
        ...latest.detailStatus,
        [axiomId]: {
          isLoading: false,
          error: null,
        },
      },
      activeBeingId: being.id,
    });
  } catch (error) {
    logger.error("Failed to load axiom detail", error, {
      axiomId,
      tags: ["load", "detail"],
    });
    const latest = get(axiomsStoreAtom);
    set(axiomsStoreAtom, {
      ...latest,
      detailStatus: {
        ...latest.detailStatus,
        [axiomId]: {
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      activeBeingId: being.id,
    });
  }
});

export const updateAxiomSentimentAtom = atom(
  null,
  async (
    get,
    set,
    {
      axiomId,
      type,
      weight,
    }: {
      axiomId: string;
      type: string;
      weight: number;
    },
  ) => {
    const being = get(beingAtom);
    const maxWeight = type === SENTIMENT_TYPE ? MAX_SENTIMENT_WEIGHT : undefined;
    const normalizedWeight = Math.max(0, Math.round(weight));
    const clampedWeight =
      maxWeight !== undefined ? Math.min(maxWeight, normalizedWeight) : normalizedWeight;

    try {
      const allocation = await client.setSentiment.mutate({
        beingId: being.id,
        axiomId,
        type,
        weight: clampedWeight,
        ...(maxWeight !== undefined ? { maxWeight } : {}),
      });

      const latest = get(axiomsStoreAtom);
      const existing = latest.entities[axiomId];
      if (!existing) {
        logger.warn("Updated sentiment for unknown axiom; refreshing detail", {
          axiomId,
          type,
          tags: ["mutation", "sentiment"],
        });
        await set(loadAxiomDetailAtom, axiomId);
        return;
      }

      const entity = cloneEntity(existing);
      const nextAllocation = allocation ?? {
        ...createZeroAllocation(being.id, axiomId, type),
        weight: 0,
      };
      entity.sentiments = {
        ...entity.sentiments,
        [type]: nextAllocation,
      } satisfies Record<string, SentimentAllocation>;

      const nextEntities: Record<string, AxiomEntity> = {
        ...latest.entities,
        [axiomId]: entity,
      };

      if (type === SENTIMENT_TYPE) {
        recomputeSentimentTotals(nextEntities, latest.order, type);
      }

      set(axiomsStoreAtom, {
        order: latest.order,
        entities: nextEntities,
        listStatus: latest.listStatus,
        detailStatus: latest.detailStatus,
        activeBeingId: being.id,
      });
    } catch (error) {
      logger.error("Failed to update axiom sentiment", error, {
        axiomId,
        type,
        tags: ["mutation", "sentiment"],
      });
      throw error;
    }
  },
);

export const addAxiomCommentAtom = atom(
  null,
  async (
    get,
    set,
    {
      axiomId,
      body,
      parentCommentId,
    }: {
      axiomId: string;
      body: string;
      parentCommentId?: string;
    },
  ) => {
    const being = get(beingAtom);
    await client.addAxiomComment.mutate({
      axiomId,
      parentCommentId,
      authorBeingId: being.id,
      authorDisplayName: being.name,
      body,
    });
    await set(loadAxiomDetailAtom, axiomId);
  },
);
