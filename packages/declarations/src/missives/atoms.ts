import { atom } from "jotai";
import type { PrimitiveAtom, WritableAtom } from "jotai";

import { client } from "@root-solar/api/client";
import type {
  CommentTreeNode,
  MissiveRecord,
  SentimentAllocation,
} from "@root-solar/api";
import { createAppLogger } from "@root-solar/observability";
import type { MissiveKind } from "@root-solar/planning";

import { beingAtom } from "../beings.ts";

const DEFAULT_MAX_WEIGHT = 100;

const createLogger = (kind: MissiveKind) =>
  createAppLogger(`declarations:missives:${kind}`, {
    tags: ["declarations", "missives", kind],
  });

type DetailStatus = {
  isLoading: boolean;
  error: string | null;
};

type MissiveEntity = {
  record: MissiveRecord;
  sentiments: Record<string, SentimentAllocation>;
  comments?: CommentTreeNode[];
  detailLoadedAt?: number;
};

type MissiveStore = {
  order: string[];
  entities: Record<string, MissiveEntity>;
  listStatus: {
    isLoading: boolean;
    error: string | null;
  };
  detailStatus: Record<string, DetailStatus>;
  activeBeingId: string | null;
};

const createInitialStore = (): MissiveStore => ({
  order: [],
  entities: {},
  listStatus: {
    isLoading: false,
    error: null,
  },
  detailStatus: {},
  activeBeingId: null,
});

const createZeroAllocation = (
  beingId: string,
  missiveId: string,
  type: string,
): SentimentAllocation => ({
  id: `${beingId}:${type}:${missiveId}`,
  beingId,
  missiveId,
  axiomId: missiveId,
  type,
  weight: 0,
  totalWeightForType: 0,
  ratio: 0,
});

const cloneEntity = (entity: MissiveEntity): MissiveEntity => ({
  record: { ...entity.record },
  sentiments: { ...entity.sentiments },
  comments: entity.comments ? [...entity.comments] : undefined,
  detailLoadedAt: entity.detailLoadedAt,
});

const recomputeSentimentTotals = (
  entities: Record<string, MissiveEntity>,
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

type MissiveAtoms = {
  storeAtom: PrimitiveAtom<MissiveStore>;
  loadListAtom: WritableAtom<null, [], Promise<void>>;
  loadDetailAtom: WritableAtom<null, [string], Promise<void>>;
  updateSentimentAtom: WritableAtom<null, [{ missiveId: string; weight: number; type?: string; maxWeight?: number; }], Promise<void>>;
  addCommentAtom: WritableAtom<null, [{ missiveId: string; body: string; parentCommentId?: string; }], Promise<void>>;
  sentimentType: string;
  maxSentimentWeight: number;
};

type MissiveStoreConfig = {
  kind: MissiveKind;
  sentimentType: string;
  maxSentimentWeight?: number;
};

const keyForConfig = (config: MissiveStoreConfig) =>
  `${config.kind}:${config.sentimentType}`;

const atomCache = new Map<string, MissiveAtoms>();

export const getMissiveAtoms = (config: MissiveStoreConfig): MissiveAtoms => {
  const cacheKey = keyForConfig(config);
  const cached = atomCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const logger = createLogger(config.kind);
  const initialStore = createInitialStore();
  const storeAtom = atom<MissiveStore>(initialStore);

  const loadListAtom = atom(null, async (get, set) => {
    const being = get(beingAtom);
    const current = get(storeAtom);
    if (current.listStatus.isLoading && current.activeBeingId === being.id) {
      logger.debug("Missive list load skipped; already running", {
        tags: ["load"],
      });
      return;
    }

    const shouldResetStore =
      current.activeBeingId !== null && current.activeBeingId !== being.id;

    set(storeAtom, {
      ...(shouldResetStore ? { ...initialStore } : { ...current }),
      listStatus: {
        isLoading: true,
        error: null,
      },
      activeBeingId: being.id,
    });

    try {
      const [missives, sentiments] = await Promise.all([
        client.listMissives.query({ kind: config.kind }),
        client.listSentimentsForBeing.query({
          beingId: being.id,
          type: config.sentimentType,
        }),
      ]);

      const nextEntities: Record<string, MissiveEntity> = {};
      const order = missives.map((record) => {
        const existing = current.entities[record.id];
        const base: MissiveEntity = existing
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

      const sentimentMap = new Map(
        sentiments.map((item) => [item.missiveId ?? item.axiomId, item]),
      );
      order.forEach((missiveId) => {
        const entity = nextEntities[missiveId];
        if (!entity) {
          return;
        }
        const found = sentimentMap.get(missiveId);
        if (found) {
          entity.sentiments = {
            ...entity.sentiments,
            [config.sentimentType]: found,
          } satisfies Record<string, SentimentAllocation>;
          return;
        }
        if (!entity.sentiments[config.sentimentType]) {
          entity.sentiments = {
            ...entity.sentiments,
            [config.sentimentType]: createZeroAllocation(
              being.id,
              missiveId,
              config.sentimentType,
            ),
          } satisfies Record<string, SentimentAllocation>;
        }
      });

      recomputeSentimentTotals(nextEntities, order, config.sentimentType);

      const nextDetailStatus: Record<string, DetailStatus> = {};
      order.forEach((id) => {
        const status = current.detailStatus[id];
        if (status) {
          nextDetailStatus[id] = { ...status };
        }
      });

      set(storeAtom, {
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
      logger.error("Failed to load missives", error, {
        tags: ["load"],
      });
      const latest = get(storeAtom);
      set(storeAtom, {
        ...latest,
        listStatus: {
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        activeBeingId: being.id,
      });
    }
  });

  const loadDetailAtom = atom(null, async (get, set, missiveId: string) => {
    if (!missiveId) {
      return;
    }
    const current = get(storeAtom);
    const status = current.detailStatus[missiveId];
    if (status?.isLoading) {
      logger.debug("Missive detail load skipped; already running", {
        missiveId,
        tags: ["load", "detail"],
      });
      return;
    }

    const being = get(beingAtom);

    set(storeAtom, {
      ...current,
      detailStatus: {
        ...current.detailStatus,
        [missiveId]: {
          isLoading: true,
          error: null,
        },
      },
      activeBeingId: being.id,
    });

    try {
      const detail = await client.getMissive.query({
        missiveId,
        beingId: being.id,
      });

      const latest = get(storeAtom);
      if (!detail) {
        set(storeAtom, {
          ...latest,
          detailStatus: {
            ...latest.detailStatus,
            [missiveId]: {
              isLoading: false,
              error: "Missive not found.",
            },
          },
          entities: {
            ...latest.entities,
            [missiveId]: {
              record: latest.entities[missiveId]?.record ?? {
                id: missiveId,
                kind: config.kind,
                slug: missiveId,
                title: missiveId,
              },
              sentiments: latest.entities[missiveId]?.sentiments ?? {},
              comments: [],
              detailLoadedAt: Date.now(),
            },
          },
        });
        return;
      }

      const entity: MissiveEntity = {
        record: detail,
        sentiments: {},
        comments: detail.comments,
        detailLoadedAt: Date.now(),
      } satisfies MissiveEntity;

      const sentimentMap = new Map(
        detail.sentiments.map((item) => [item.missiveId ?? item.axiomId, item]),
      );

      const existing = latest.entities[missiveId];
      const mergedSentiments = existing
        ? { ...existing.sentiments }
        : {};

      const found = sentimentMap.get(missiveId);
      if (found) {
        mergedSentiments[config.sentimentType] = found;
      }

      if (!found) {
        const zero = createZeroAllocation(
          being.id,
          missiveId,
          config.sentimentType,
        );
        mergedSentiments[config.sentimentType] = zero;
      }

      const mergedEntity: MissiveEntity = existing
        ? {
            ...cloneEntity(existing),
            record: { ...existing.record, ...detail },
            sentiments: {
              ...mergedSentiments,
            },
            comments: detail.comments,
            detailLoadedAt: Date.now(),
          }
        : {
            ...entity,
            sentiments: mergedSentiments,
          };

      set(storeAtom, {
        ...latest,
        entities: {
          ...latest.entities,
          [missiveId]: mergedEntity,
        },
        detailStatus: {
          ...latest.detailStatus,
          [missiveId]: {
            isLoading: false,
            error: null,
          },
        },
        activeBeingId: being.id,
      });
    } catch (error) {
      logger.error("Failed to load missive detail", error, {
        missiveId,
        tags: ["load", "detail"],
      });
      const latest = get(storeAtom);
      set(storeAtom, {
        ...latest,
        detailStatus: {
          ...latest.detailStatus,
          [missiveId]: {
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
        activeBeingId: being.id,
      });
    }
  });

  const updateSentimentAtom = atom(null, async (get, set, args: {
    missiveId: string;
    weight: number;
    type?: string;
    maxWeight?: number;
  }) => {
    const { missiveId, weight, type, maxWeight: maxWeightOverride } = args;
    const being = get(beingAtom);
    const current = get(storeAtom);
    const entity = current.entities[missiveId];
    if (!entity) {
      logger.warn("Attempted to update sentiment for unknown missive", {
        missiveId,
        tags: ["sentiment"],
      });
      return;
    }

    const targetType = type ?? config.sentimentType;
    const maxWeight = maxWeightOverride ?? (targetType === config.sentimentType ? config.maxSentimentWeight ?? DEFAULT_MAX_WEIGHT : undefined);

    const normalized = Math.max(0, Math.round(weight));
    const nextWeight = maxWeight !== undefined ? Math.min(normalized, maxWeight) : normalized;

    try {
      const allocation = await client.setSentiment.mutate({
        beingId: being.id,
        axiomId: missiveId,
        type: targetType,
        weight: nextWeight,
        maxWeight,
      });

      const latest = get(storeAtom);
      const latestEntity = latest.entities[missiveId];
      if (!latestEntity) {
        return;
      }

      const sentiments = {
        ...latestEntity.sentiments,
        [targetType]: allocation ??
          createZeroAllocation(being.id, missiveId, targetType),
      } satisfies Record<string, SentimentAllocation>;

      const updatedEntities = {
        ...latest.entities,
        [missiveId]: {
          ...latestEntity,
          sentiments,
        },
      } satisfies Record<string, MissiveEntity>;

      recomputeSentimentTotals(updatedEntities, latest.order, targetType);

      set(storeAtom, {
        ...latest,
        entities: updatedEntities,
      });
    } catch (error) {
      logger.error("Failed to update missive sentiment", error, {
        missiveId,
        tags: ["sentiment"],
      });
      throw error;
    }
  });

  const addCommentAtom = atom(null, async (
    get,
    set,
    input: {
      missiveId: string;
      body: string;
      parentCommentId?: string;
    },
  ) => {
    const being = get(beingAtom);
    const { missiveId, body, parentCommentId } = input;
    try {
      const comment = await client.addAxiomComment.mutate({
        axiomId: missiveId,
        body,
        parentCommentId,
        authorBeingId: being.id,
        authorDisplayName: being.name ?? "Anonymous",
      });
      const latest = get(storeAtom);
      const entity = latest.entities[missiveId];
      if (!entity) {
        return;
      }
      const comments = entity.comments ? [...entity.comments] : [];
      if (parentCommentId) {
        const stack = [...comments];
        while (stack.length > 0) {
          const currentComment = stack.pop();
          if (!currentComment) {
            continue;
          }
          if (currentComment.id === parentCommentId) {
            currentComment.replies = [...currentComment.replies, comment];
            break;
          }
          stack.push(...currentComment.replies);
        }
      } else {
        comments.push(comment);
      }
      set(storeAtom, {
        ...latest,
        entities: {
          ...latest.entities,
          [missiveId]: {
            ...entity,
            comments,
          },
        },
      });
    } catch (error) {
      logger.error("Failed to add comment", error, {
        missiveId,
        tags: ["comment"],
      });
      throw error;
    }
  });

  const atoms: MissiveAtoms = {
    storeAtom,
    loadListAtom,
    loadDetailAtom,
    updateSentimentAtom,
    addCommentAtom,
    sentimentType: config.sentimentType,
    maxSentimentWeight: config.maxSentimentWeight ?? DEFAULT_MAX_WEIGHT,
  };

  atomCache.set(cacheKey, atoms);
  return atoms;
};
