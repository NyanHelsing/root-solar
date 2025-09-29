import { describe, it, mock } from "node:test";

console.log('mock keys', Object.keys(mock));
console.log('has importModule', 'importModule' in mock);

describe('noop', () => {
  it('passes', () => {});
});
