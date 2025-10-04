import { describe, it } from "node:test";

describe("dynamic import", () => {
    it("works", async () => {
        await import("./packages/auth/src/handshake/index.ts");
    });
});
