import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import type { SentimentNetwork, SentimentNetworkStatus } from "../index.ts";
import {
  clearSentimentNetwork,
  getSentimentNetwork,
  getSentimentNetworkStatus,
  registerSentimentNetwork,
  setSentimentNetworkStatus,
} from "../runtime.ts";

type StatusListener = (status: SentimentNetworkStatus) => void;

const createSentimentNetworkStub = (initialStatus: SentimentNetworkStatus) => {
  let currentStatus = initialStatus;
  let listeners: StatusListener[] = [];

  const network: SentimentNetwork = {
    protocol: "test-protocol",
    async querySentiment() {
      return null;
    },
    async close() {
      listeners = [];
    },
    getStatus() {
      return currentStatus;
    },
    onStatusChange(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((candidate) => candidate !== listener);
      };
    },
  };

  return {
    network,
    emit(status: SentimentNetworkStatus) {
      currentStatus = status;
      for (const listener of listeners) {
        listener(status);
      }
    },
    listenerCount() {
      return listeners.length;
    },
  };
};

describe("net/runtime", () => {
  afterEach(() => {
    clearSentimentNetwork();
  });

  it("tracks the active network instance and status updates", () => {
    const initialStatus: SentimentNetworkStatus = {
      state: "ready",
      peerId: "peer-id",
      protocol: "test-protocol",
    };
    const stub = createSentimentNetworkStub(initialStatus);

    registerSentimentNetwork(stub.network);
    assert.equal(getSentimentNetwork(), stub.network);
    assert.deepEqual(getSentimentNetworkStatus(), initialStatus);

    const nextStatus: SentimentNetworkStatus = {
      state: "error",
      message: "boom",
    };
    stub.emit(nextStatus);
    assert.deepEqual(getSentimentNetworkStatus(), nextStatus);
  });

  it("clears the active network and resets status to offline", () => {
    const stub = createSentimentNetworkStub({
      state: "ready",
      peerId: "peer-id",
      protocol: "test-protocol",
    });
    registerSentimentNetwork(stub.network);
    assert.equal(stub.listenerCount(), 1);

    stub.emit({ state: "error", message: "failure" });
    clearSentimentNetwork();

    assert.equal(getSentimentNetwork(), null);
    assert.equal(stub.listenerCount(), 0);
    assert.deepEqual(getSentimentNetworkStatus(), { state: "offline" });

    stub.emit({
      state: "ready",
      peerId: "peer-id",
      protocol: "test-protocol",
    });
    assert.deepEqual(getSentimentNetworkStatus(), { state: "offline" });
  });

  it("handles networks without status helpers", () => {
    const minimalNetwork: SentimentNetwork = {
      protocol: "test-protocol",
      async querySentiment() {
        return null;
      },
      async close() {},
    };

    registerSentimentNetwork(minimalNetwork);

    assert.equal(getSentimentNetwork(), minimalNetwork);
    assert.deepEqual(getSentimentNetworkStatus(), { state: "offline" });

    clearSentimentNetwork();
    assert.equal(getSentimentNetwork(), null);
    assert.deepEqual(getSentimentNetworkStatus(), { state: "offline" });
  });

  it("allows manually overriding the network status", () => {
    setSentimentNetworkStatus({ state: "ready", peerId: "manual" });
    assert.deepEqual(getSentimentNetworkStatus(), {
      state: "ready",
      peerId: "manual",
    });
    clearSentimentNetwork();
    assert.deepEqual(getSentimentNetworkStatus(), { state: "offline" });
  });
});
