import { describe, it, mock } from "node:test";

console.log("mock module type", typeof mock.module);

describe("sample", () => {
    it("works", () => {
        if (typeof mock.module !== "function") {
            throw new Error("no mock.module");
        }
    });
});
