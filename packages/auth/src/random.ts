const getCrypto = (): {
  getRandomValues: <T extends ArrayBufferView>(array: T) => T;
} => {
  if (typeof globalThis !== "object" || globalThis === null) {
    throw new Error("Secure random source unavailable: global scope missing");
  }

  const candidate = (globalThis as unknown as {
    crypto?: {
      getRandomValues: <T extends ArrayBufferView>(array: T) => T;
    };
  }).crypto;

  if (!candidate || typeof candidate.getRandomValues !== "function") {
    throw new Error(
      "Secure random source unavailable: Web Crypto getRandomValues not supported",
    );
  }

  return candidate;
};

export const getRandomBytes = (length: number): Uint8Array => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Random byte length must be a positive integer");
  }

  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return bytes;
};
