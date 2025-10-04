import type { ComponentType, ReactElement } from "react";
import { useEffect, useMemo } from "react";
import { MemoryRouter } from "react-router";

import {
    RootSolarFooter as Footer,
    RootSolarHeader as Header,
    ShellHero as Hero,
} from "@root-solar/layout";
import NetworkStatusIndicator from "../features/network/NetworkStatusIndicator.tsx";
import {
    MissiveDetail,
    MissiveList,
    MissiveListRoute,
    AxiomaticMissiveListRoute,
} from "@root-solar/missives";
import { TagList } from "@root-solar/tagging";
import SearchAndBrowseRoute from "../SearchAndBrowseRoute.tsx";
import { useSetRouteParams, useSetRoutePath } from "@root-solar/routing";

const pluralize = (value: string) => (value.endsWith("s") ? value : `${value}s`);

const MissiveListHarness: ComponentType<Record<string, unknown>> = (props) => {
    const { sentiment, basePath } = props;
    const resolvedSentiment = typeof sentiment === "string" ? sentiment : undefined;
    const resolvedBasePath = typeof basePath === "string" ? basePath : "/missives";
    const setRouteParams = useSetRouteParams();
    const setRoutePath = useSetRoutePath();

    useEffect(() => {
        setRouteParams({});
        setRoutePath(resolvedBasePath);
        return () => {
            setRouteParams({});
            setRoutePath("/");
        };
    }, [setRouteParams, setRoutePath, resolvedBasePath]);

    return (
        <MissiveList
            sentiment={resolvedSentiment}
            basePath={resolvedBasePath}
            showViewAllLink={resolvedBasePath === "/axioms"}
        />
    );
};

const MissiveDetailHarness: ComponentType<Record<string, unknown>> = (props) => {
    const { tag, kind: legacyKind, sentiment, basePath, missiveId } = props;
    const resolvedTag = (() => {
        if (typeof tag === "string") {
            return tag;
        }
        if (typeof legacyKind === "string") {
            return legacyKind;
        }
        return undefined;
    })();
    const resolvedSentiment = typeof sentiment === "string" ? sentiment : undefined;
    const resolvedBasePath = (() => {
        if (typeof basePath === "string") {
            return basePath;
        }
        if (resolvedSentiment === "axiomatic" || resolvedTag === "axiomatic") {
            return "/axioms";
        }
        if (resolvedTag) {
            return `/${pluralize(resolvedTag)}`;
        }
        return "/missives";
    })();
    const resolvedMissiveId = typeof missiveId === "string" ? missiveId : undefined;
    const setRouteParams = useSetRouteParams();
    const setRoutePath = useSetRoutePath();

    useEffect(() => {
        setRouteParams(resolvedMissiveId ? { missiveId: resolvedMissiveId } : {});
        const path = resolvedMissiveId
            ? `${resolvedBasePath}/${resolvedMissiveId}`
            : resolvedBasePath;
        setRoutePath(path);
        return () => {
            setRouteParams({});
            setRoutePath("/");
        };
    }, [resolvedMissiveId, resolvedBasePath, setRouteParams, setRoutePath]);

    return (
        <MissiveDetail
            tagSlug={resolvedTag}
            sentiment={resolvedSentiment}
            basePath={resolvedBasePath}
        />
    );
};

const registry: Record<string, ComponentType<Record<string, unknown>>> = {
    axiom: MissiveDetailHarness,
    axiomatic: MissiveDetailHarness,
    axioms: AxiomaticMissiveListRoute,
    axiomatics: AxiomaticMissiveListRoute,
    "missive-detail": MissiveDetailHarness,
    "missive-list": MissiveListHarness,
    "missive-list-route": MissiveListRoute,
    "tag-list": TagList,
    tags: TagList,
    footer: Footer,
    header: Header,
    hero: Hero,
    main: SearchAndBrowseRoute,
    "network-status-indicator": NetworkStatusIndicator,
};

const normalizeKey = (value: string): string =>
    value
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

const parseProps = (search: string): Record<string, unknown> | undefined => {
    if (!search) {
        return undefined;
    }

    const params = new URLSearchParams(search);
    const raw = params.get("props");

    if (!raw) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null ? parsed : undefined;
    } catch {
        return undefined;
    }
};

const ComponentHarness = ({
    componentName,
}: {
    componentName?: string;
}): ReactElement => {
    const search = typeof window === "undefined" ? "" : window.location.search;
    const componentProps = useMemo(() => parseProps(search), [search]);
    const key = componentName ? normalizeKey(componentName) : "";
    const Component = registry[key];

    if (!Component) {
        return (
            <div data-component-root role="alert">
                Unknown component: {componentName ?? "(unspecified)"}
            </div>
        );
    }

    type HarnessProps = Record<string, unknown> & { initialPath?: unknown };
    const resolvedProps: HarnessProps | undefined = componentProps
        ? ({ ...componentProps } as HarnessProps)
        : undefined;

    let initialPath = "/";
    if (resolvedProps && typeof resolvedProps.initialPath === "string") {
        initialPath = resolvedProps.initialPath;
        resolvedProps.initialPath = undefined;
    }

    return (
        <MemoryRouter initialEntries={[initialPath]}>
            <div data-component-root>
                <Component {...(resolvedProps ?? {})} />
            </div>
        </MemoryRouter>
    );
};

export default ComponentHarness;
