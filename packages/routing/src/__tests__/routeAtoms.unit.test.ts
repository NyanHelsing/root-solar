import "global-jsdom/register";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { createStore, Provider } from "jotai";

import {
    routeParamsAtom,
    setRouteParamsAtom,
    useRouteParams,
    useSetRouteParams
} from "../routeParamsAtom.ts";
import { routePathAtom, useRoutePath, useSetRoutePath } from "../routePathAtom.ts";
import {
    routeQueryParamsAtom,
    setRouteQueryParamsAtom,
    setRouteQueryParamAtom
} from "../routeQueryParamsAtom.ts";

const withProvider = (store: ReturnType<typeof createStore>, ui: ReactNode) => {
    const Wrapper = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { store }, children);

    return render(ui, { wrapper: Wrapper });
};

afterEach(() => {
    cleanup();
});

describe("routing atoms", () => {
    it("replaces the current route params", () => {
        const store = createStore();
        store.set(setRouteParamsAtom, { id: "abc" });
        assert.deepEqual(store.get(routeParamsAtom), { id: "abc" });

        store.set(setRouteParamsAtom, { view: "home" });
        assert.deepEqual(store.get(routeParamsAtom), { view: "home" });
    });

    it("tracks the active route path", () => {
        const store = createStore();
        assert.equal(store.get(routePathAtom), "/");

        store.set(routePathAtom, "/library");
        assert.equal(store.get(routePathAtom), "/library");
    });

    it("overwrites all query params when requested", () => {
        const store = createStore();
        store.set(setRouteQueryParamsAtom, { tag: "solar" });
        assert.deepEqual(store.get(routeQueryParamsAtom), { tag: "solar" });

        store.set(setRouteQueryParamsAtom, { view: "grid" });
        assert.deepEqual(store.get(routeQueryParamsAtom), { view: "grid" });
    });

    it("adds, deduplicates, and removes individual query params", () => {
        const store = createStore();

        store.set(setRouteQueryParamAtom, { key: "tag", value: "sun" });
        assert.deepEqual(store.get(routeQueryParamsAtom), { tag: "sun" });

        const current = store.get(routeQueryParamsAtom);
        store.set(setRouteQueryParamAtom, { key: "tag", value: "sun" });
        assert.equal(store.get(routeQueryParamsAtom), current);

        store.set(setRouteQueryParamAtom, { key: "tag", value: "   " });
        assert.deepEqual(store.get(routeQueryParamsAtom), {});

        store.set(setRouteQueryParamAtom, { key: "tag", value: "flare" });
        store.set(setRouteQueryParamAtom, { key: "tag", value: null });
        assert.deepEqual(store.get(routeQueryParamsAtom), {});
    });

    it("preserves non-empty values exactly as provided", () => {
        const store = createStore();
        store.set(setRouteQueryParamAtom, { key: "tag", value: "  Solar  " });
        assert.deepEqual(store.get(routeQueryParamsAtom), { tag: "  Solar  " });
    });

    it("exposes hooks that read and update route params", () => {
        const store = createStore();

        const HookProbe = () => {
            const params = useRouteParams();
            const setParams = useSetRouteParams();
            return createElement(
                "div",
                null,
                createElement("span", { "data-testid": "params" }, JSON.stringify(params)),
                createElement(
                    "button",
                    {
                        type: "button",
                        "data-testid": "set",
                        onClick: () => {
                            setParams({ view: "hooks" });
                        }
                    },
                    "update"
                )
            );
        };

        withProvider(store, createElement(HookProbe));

        assert.equal(screen.getByTestId("params").textContent, "{}");
        fireEvent.click(screen.getByTestId("set"));
        assert.equal(screen.getByTestId("params").textContent, '{"view":"hooks"}');
    });

    it("exposes hooks that read and update the route path", () => {
        const store = createStore();

        const PathProbe = () => {
            const path = useRoutePath();
            const setPath = useSetRoutePath();
            return createElement(
                "div",
                null,
                createElement("span", { "data-testid": "path" }, path),
                createElement(
                    "button",
                    {
                        type: "button",
                        "data-testid": "set-path",
                        onClick: () => {
                            setPath("/hooks");
                        }
                    },
                    "update"
                )
            );
        };

        withProvider(store, createElement(PathProbe));

        assert.equal(screen.getByTestId("path").textContent, "/");
        fireEvent.click(screen.getByTestId("set-path"));
        assert.equal(screen.getByTestId("path").textContent, "/hooks");
    });
});
