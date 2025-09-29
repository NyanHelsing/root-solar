import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStore } from "jotai";

import { routeParamsAtom, routePathAtom } from "@root-solar/routing";

import { activeMissiveIdAtom } from "../activeMissiveIdAtom.ts";

const createTestStore = () => {
  const store = createStore();
  // ensure known defaults
  store.set(routeParamsAtom, {});
  store.set(routePathAtom, "/");
  return store;
};

describe("missives/state/detail/activeMissiveIdAtom", () => {
  it("prefers the explicit route param", () => {
    const store = createTestStore();
    store.set(routeParamsAtom, { missiveId: "missive:123" });

    const value = store.get(activeMissiveIdAtom);

    assert.equal(value, "missive:123");
  });

  it("falls back to the missive segment in the path", () => {
    const store = createTestStore();
    store.set(routePathAtom, "/missives/missive:999");

    const value = store.get(activeMissiveIdAtom);

    assert.equal(value, "missive:999");
  });

  it("decodes encoded path segments", () => {
    const store = createTestStore();
    store.set(routePathAtom, "/axioms/missive%3Aencoded");

    const value = store.get(activeMissiveIdAtom);

    assert.equal(value, "missive:encoded");
  });
});
