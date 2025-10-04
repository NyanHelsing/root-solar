import { useMemo, type ReactElement } from "react";
import { HashRouter, MemoryRouter, Route, Routes, useLocation, useParams } from "react-router";

import { buildComponentUrl, COMPONENT_ROUTE_PATTERN } from "../routes.ts";
import { resolveComponent } from "../registry.ts";

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
        return typeof parsed === "object" && parsed !== null
            ? (parsed as Record<string, unknown>)
            : undefined;
    } catch {
        return undefined;
    }
};

const UnknownComponent = ({ componentName }: { componentName?: string }): ReactElement => (
    <div data-component-root role="alert">
        Unknown component: {componentName ?? "(unspecified)"}
    </div>
);

const UnexpectedRoute = (): ReactElement => {
    const location = useLocation();
    return (
        <div data-component-root role="alert">
            Unsupported harness route. Try {buildComponentUrl("RootSolarHomepage")} instead of{" "}
            {location.pathname}.
        </div>
    );
};

const ComponentRenderer = (): ReactElement => {
    const { componentSlug } = useParams<{ componentSlug?: string }>();
    const location = useLocation();
    const componentProps = useMemo(() => parseProps(location.search), [location.search]);
    const componentName = componentSlug ? decodeURIComponent(componentSlug) : undefined;
    const Component = componentName ? resolveComponent(componentName) : undefined;

    if (!Component) {
        return <UnknownComponent componentName={componentName} />;
    }

    type HarnessProps = Record<string, unknown> & { initialPath?: unknown };
    const resolvedProps: HarnessProps | undefined = componentProps
        ? ({ ...componentProps } as HarnessProps)
        : undefined;

    let initialPath: string | undefined;
    if (resolvedProps && typeof resolvedProps.initialPath === "string") {
        initialPath = resolvedProps.initialPath;
        resolvedProps.initialPath = undefined;
    }

    const content = <Component {...(resolvedProps ?? {})} />;

    return (
        <div data-component-root>
            {initialPath ? (
                <MemoryRouter initialEntries={[initialPath]}>{content}</MemoryRouter>
            ) : (
                content
            )}
        </div>
    );
};

const HarnessApp = (): ReactElement => (
    <HashRouter>
        <Routes>
            <Route path={COMPONENT_ROUTE_PATTERN} element={<ComponentRenderer />} />
            <Route path="*" element={<UnexpectedRoute />} />
        </Routes>
    </HashRouter>
);

export default HarnessApp;
