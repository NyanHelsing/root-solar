import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("net/status", () => {
    it("updates the cached network status", async () => {
        const { getNetworkStatus, setNetworkStatus } = await import(
            `../status.ts?test=net-status-${Date.now()}`
        );

        assert.deepEqual(getNetworkStatus(), { state: "offline" });

        const nextStatus = {
            state: "ready" as const,
            protocol: "proto",
            peerId: "peer",
        };

        setNetworkStatus(nextStatus);
        assert.deepEqual(getNetworkStatus(), nextStatus);
    });
});
