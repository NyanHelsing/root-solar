const ensureWebCrypto = () => {
  if (typeof globalThis !== "object" || globalThis === null) {
    throw new Error("Web Crypto unavailable: missing global scope");
  }

  const cryptoReference = (globalThis as unknown as {
    crypto?: Crypto;
  }).crypto;

  if (!cryptoReference) {
    throw new Error("Web Crypto unavailable: global crypto missing");
  }

  return cryptoReference;
};

export const getWebCrypto = (): Crypto => ensureWebCrypto();

export const getSubtleCrypto = (): SubtleCrypto => {
  const cryptoReference = ensureWebCrypto();
  if (!cryptoReference.subtle) {
    throw new Error("Web Crypto unavailable: subtle crypto missing");
  }
  return cryptoReference.subtle;
};
