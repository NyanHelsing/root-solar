import { describe, it } from "node:test";

throw new Error("intentional failure");

describe('x', () => {
  it('y', () => {});
});
