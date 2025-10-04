import "global-jsdom/register";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { createStore, Provider } from "jotai";

import { routeQueryParamsAtom } from "../routeQueryParamsAtom.ts";
import { useQueryParamSlug } from "../useQueryParamSlug.ts";

type RenderOptions = {
    store?: ReturnType<typeof createStore>;
    initialEntries?: string[];
    route?: string;
};

type QueryParamSlugProbeProps = {
    slugKey: string;
    nextValue?: string | null;
    defaultValue?: string | null;
};

const QueryParamSlugProbe = ({
    slugKey,
    nextValue = null,
    defaultValue
}: QueryParamSlugProbeProps) => {
    const { value, setValue } = useQueryParamSlug({
        key: slugKey,
        defaultValue
    });
    const location = useLocation();

    return createElement(
        "div",
        null,
        createElement("span", { "data-testid": "value" }, value ?? "null"),
        createElement("span", { "data-testid": "search" }, location.search),
        createElement(
            "button",
            {
                type: "button",
                "data-testid": "apply",
                onClick: () => {
                    setValue(nextValue ?? null);
                }
            },
            "apply"
        )
    );
};

const renderWithProviders = (
    ui: ReactNode,
    { store = createStore(), initialEntries = ["/"], route = "/" }: RenderOptions = {}
) => {
    const Wrapper = ({ children }: { children: ReactNode }) =>
        createElement(
            Provider,
            { store },
            createElement(
                MemoryRouter,
                { initialEntries },
                createElement(
                    Routes,
                    null,
                    createElement(Route, { path: route, element: children })
                )
            )
        );

    return {
        store,
        ...render(ui, { wrapper: Wrapper })
    };
};

afterEach(() => {
    cleanup();
});

describe("useQueryParamSlug", () => {
    it("normalizes the current slug value", () => {
        const store = createStore();
        store.set(routeQueryParamsAtom, { slug: "Tag:Solar" });

        renderWithProviders(createElement(QueryParamSlugProbe, { slugKey: "slug" }), {
            store,
            initialEntries: ["/tags?slug=Tag:Solar"],
            route: "/tags"
        });

        assert.equal(screen.getByTestId("value").textContent, "solar");
        assert.equal(screen.getByTestId("search").textContent, "?slug=Tag:Solar");
    });

    it("falls back when the slug contains only whitespace", () => {
        const store = createStore();
        store.set(routeQueryParamsAtom, { slug: "   " });

        renderWithProviders(
            createElement(QueryParamSlugProbe, {
                slugKey: "slug",
                defaultValue: "fallback"
            }),
            {
                store,
                initialEntries: ["/tags?slug=%20%20%20"],
                route: "/tags"
            }
        );

        assert.equal(screen.getByTestId("value").textContent, "fallback");
    });

    it("uses the provided default when the slug is missing", () => {
        renderWithProviders(
            createElement(QueryParamSlugProbe, {
                slugKey: "slug",
                defaultValue: "fallback"
            }),
            {
                initialEntries: ["/tags"],
                route: "/tags"
            }
        );

        assert.equal(screen.getByTestId("value").textContent, "fallback");
    });

    it("persists updates to the store and URL", () => {
        const store = createStore();
        store.set(routeQueryParamsAtom, { slug: "Tag:Solar" });

        const { rerender } = renderWithProviders(
            createElement(QueryParamSlugProbe, {
                slugKey: "slug",
                nextValue: "SolarWind"
            }),
            {
                store,
                initialEntries: ["/tags?slug=Tag:Solar"],
                route: "/tags"
            }
        );

        fireEvent.click(screen.getByTestId("apply"));

        assert.equal(store.get(routeQueryParamsAtom).slug, "SolarWind");
        assert.equal(screen.getByTestId("value").textContent, "solarwind");
        assert.equal(screen.getByTestId("search").textContent, "?slug=SolarWind");

        rerender(
            createElement(QueryParamSlugProbe, {
                slugKey: "slug",
                nextValue: "   "
            })
        );
        fireEvent.click(screen.getByTestId("apply"));

        assert.deepEqual(store.get(routeQueryParamsAtom), {});
        assert.equal(screen.getByTestId("value").textContent, "null");
        assert.equal(screen.getByTestId("search").textContent, "");

        rerender(
            createElement(QueryParamSlugProbe, {
                slugKey: "slug",
                nextValue: null
            })
        );
        fireEvent.click(screen.getByTestId("apply"));

        assert.deepEqual(store.get(routeQueryParamsAtom), {});
        assert.equal(screen.getByTestId("search").textContent, "");
    });
});
