import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { TiMinus, TiPlus } from "react-icons/ti";

import {
  FlareCard,
  FlareIconButton,
  FlareStack,
  FlareTextInput,
} from "@root-solar/flare";

import { useBeing } from "../beings.ts";
import {
  type AxiomOverview,
  useAxiomsListError,
  useAxiomsListLoading,
  useAxiomsOverview,
  useLoadAxioms,
  useUpdateAxiomSentiment,
} from "../axioms/hooks.ts";
import { MAX_SENTIMENT_WEIGHT, SENTIMENT_TYPE } from "../axioms/atoms.ts";

const pluralize = (value: string) => (value.endsWith("s") ? value : `${value}s`);

const resolveBasePath = (basePath: string | undefined, kind: string | undefined) => {
  if (basePath) {
    return basePath;
  }
  if (!kind) {
    return "/missives";
  }
  return `/${pluralize(kind)}`;
};

const describeKind = (value: string) => {
  if (value === "axiom") {
    return "Axioms";
  }
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatRatio = (ratio: number) => `${Math.round(ratio * 100)}%`;

type MissiveListProps = {
  kind?: string;
  basePath?: string;
};

type MissiveOverview = AxiomOverview;

type MissiveListCopy = {
  title: string;
  description: string;
  totalLabel: string;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
  moreInfoLabel: string;
};

const createCopy = (kind?: string): MissiveListCopy => {
  if (kind === "axiom") {
    return {
      title: "Aggregate Prioritization",
      description: "Calculated by summing the weights of individual participant's priorities",
      totalLabel: "Total personal allocation",
      loadingLabel: "Refreshing priorities…",
      errorLabel: "Unable to load priorities right now.",
      emptyLabel: "No axioms found yet.",
      moreInfoLabel: "More Info",
    } satisfies MissiveListCopy;
  }

  const label = kind ? kind.replaceAll("-", " ") : "missives";
  return {
    title: `Missives${kind ? `: ${label}` : ""}`,
    description: "Curated declarations filtered by the selected kind.",
    totalLabel: "Total weight",
    loadingLabel: "Refreshing missives…",
    errorLabel: "Unable to load missives right now.",
    emptyLabel: "No missives found for this filter.",
    moreInfoLabel: "Details",
  } satisfies MissiveListCopy;
};

const MissiveCard = ({
  id,
  title,
  weight,
  ratio,
  basePath,
  moreInfoLabel,
}: MissiveOverview & { basePath: string; moreInfoLabel: string }) => {
  const updateSentiment = useUpdateAxiomSentiment();
  const [draft, setDraft] = useState(() => weight.toString());

  useEffect(() => {
    setDraft(weight.toString());
  }, [weight]);

  const commitWeight = useCallback(
    (next: number) => {
      void updateSentiment({ axiomId: id, type: SENTIMENT_TYPE, weight: next });
    },
    [id, updateSentiment],
  );

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(MAX_SENTIMENT_WEIGHT, weight + delta));
    commitWeight(next);
  };

  const handleBlur = () => {
    const next = Number.parseInt(draft, 10);
    if (Number.isNaN(next)) {
      commitWeight(0);
      return;
    }
    commitWeight(next);
  };

  const ratioLabel = useMemo(() => formatRatio(ratio), [ratio]);

  return (
    <FlareCard padding="lg">
      <FlareStack gap="lg">
        <FlareStack direction="row" wrap align="baseline" justify="space-between" gap="md">
          <h2 className="rs-heading-md">{title}</h2>
          <FlareStack direction="row" align="baseline" gap="sm" className="rs-text-soft">
            <strong>{ratioLabel}</strong>
            <span className="rs-text-caption">{weight}</span>
          </FlareStack>
        </FlareStack>
        <FlareStack direction="row" justify="flex-end" align="center" gap="sm" wrap>
          <FlareIconButton
            type="button"
            variant="solid"
            onClick={() => adjust(1)}
            aria-label="Increase weight"
            disabled={weight >= MAX_SENTIMENT_WEIGHT}
          >
            <TiPlus />
          </FlareIconButton>
          <FlareTextInput
            name="weight"
            inputMode="numeric"
            type="number"
            min={0}
            max={MAX_SENTIMENT_WEIGHT}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={handleBlur}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            size="numeric"
          />
          <FlareIconButton
            type="button"
            variant="ghost"
            onClick={() => adjust(-1)}
            aria-label="Decrease weight"
            disabled={weight <= 0}
          >
            <TiMinus />
          </FlareIconButton>
        </FlareStack>
        <FlareStack direction="row" justify="flex-end" gap="sm" fullWidth>
          <Link to={`${basePath}/${id}`} className="rs-link">
            {moreInfoLabel}
          </Link>
        </FlareStack>
      </FlareStack>
    </FlareCard>
  );
};

const normalizeKind = (value?: string) => value?.trim().toLowerCase() ?? null;

const MissiveList = ({ kind, basePath }: MissiveListProps) => {
  const being = useBeing();
  const axioms = useAxiomsOverview();
  const isLoading = useAxiomsListLoading();
  const error = useAxiomsListError();
  const loadAxioms = useLoadAxioms();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const filterControlId = useId();

  useEffect(() => {
    void loadAxioms();
  }, [loadAxioms, being.id]);

  const routeKind = useMemo(() => normalizeKind(kind), [kind]);
  const queryKind = useMemo(
    () => normalizeKind(searchParams.get("kind") ?? undefined),
    [searchParams],
  );
  const activeKind = routeKind ?? queryKind;

  const copy = useMemo(() => createCopy(activeKind ?? undefined), [activeKind]);
  const resolvedBasePath = useMemo(
    () => resolveBasePath(basePath, activeKind ?? undefined),
    [basePath, activeKind],
  );

  const availableKinds = useMemo(() => {
    const kinds = new Set<string>();
    axioms.forEach((item) => {
      const normalized = normalizeKind(item.kind);
      if (normalized) {
        kinds.add(normalized);
      }
    });
    if (activeKind) {
      kinds.add(activeKind);
    }
    kinds.add("axiom");
    return Array.from(kinds).sort((a, b) => a.localeCompare(b));
  }, [activeKind, axioms]);

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextKind = normalizeKind(event.target.value || undefined);
      let targetPath = "/missives";
      if (nextKind === "axiom") {
        targetPath = "/axioms";
      } else if (nextKind) {
        const params = new URLSearchParams();
        params.set("kind", nextKind);
        targetPath = `/missives?${params.toString()}`;
      }
      const currentPath = `${location.pathname}${location.search}`;
      if (currentPath !== targetPath) {
        navigate(targetPath);
      }
    },
    [location.pathname, location.search, navigate],
  );

  const missives = useMemo(() => {
    if (!activeKind) {
      return axioms;
    }
    return axioms.filter((item) =>
      item.kind ? normalizeKind(item.kind) === activeKind : false,
    );
  }, [activeKind, axioms]);

  const totalWeight = useMemo(
    () => missives.reduce((total, missive) => total + missive.weight, 0),
    [missives],
  );

  const filterValue = activeKind ?? "";
  const showViewAllLink = (routeKind ?? activeKind) === "axiom";

  return (
    <FlareStack gap="lg">
      <FlareStack as="header" gap="sm">
        <h1 className="rs-heading-xl">{copy.title}</h1>
        <p className="rs-text-body-lg rs-text-soft">{copy.description}</p>
        <p className="rs-text-soft">
          {copy.totalLabel}: <strong>{totalWeight}</strong>
        </p>
        <FlareStack direction="row" align="center" gap="sm" wrap>
          <label htmlFor={filterControlId} className="rs-text-caption rs-text-soft">
            Filter by kind
          </label>
          <select
            id={filterControlId}
            value={filterValue}
            onChange={handleFilterChange}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--rs-border-strong, #d0d4dd)",
              background: "var(--flare-surface, #fff)",
              color: "inherit",
            }}
          >
            <option value="">All missives</option>
            {availableKinds.map((availableKind) => (
              <option key={availableKind} value={availableKind}>
                {describeKind(availableKind)}
              </option>
            ))}
          </select>
          {showViewAllLink ? (
            <Link to="/missives" className="rs-link">
              View all missives
            </Link>
          ) : null}
        </FlareStack>
      </FlareStack>
      {isLoading ? <p className="rs-text-soft">{copy.loadingLabel}</p> : null}
      {error ? (
        <p role="alert" className="rs-text-soft">
          {error}
        </p>
      ) : null}
      {!isLoading && missives.length === 0 ? (
        <p className="rs-text-soft">{copy.emptyLabel}</p>
      ) : null}
      <FlareStack gap="md">
        {missives.map((missive) => (
          <MissiveCard
            key={missive.id}
            {...missive}
            basePath={resolvedBasePath}
            moreInfoLabel={copy.moreInfoLabel}
          />
        ))}
      </FlareStack>
    </FlareStack>
  );
};

export default MissiveList;
