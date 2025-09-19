const base64Encode = (input: Uint8Array): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input).toString("base64");
  }
  let binary = "";
  input.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  throw new Error("Base64 encoding not supported in this environment");
};

const base64Decode = (value: string): Uint8Array => {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  if (typeof atob !== "undefined") {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  throw new Error("Base64 decoding not supported in this environment");
};

export const toBase64 = (input: Uint8Array): string => base64Encode(input);

export const fromBase64 = (value: string): Uint8Array => base64Decode(value);

export const utf8ToBytes = (value: string): Uint8Array => new TextEncoder().encode(value);

export const bytesToUtf8 = (input: Uint8Array): string => new TextDecoder().decode(input);

export const concatBytes = (...arrays: Uint8Array[]): Uint8Array => {
  const total = arrays.reduce((sum, current) => sum + current.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
};
