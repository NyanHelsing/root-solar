import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { describe, it } from "node:test";

const importPasswordModule = async () => import("../crypto/password.ts");

describe("auth/crypto/password", () => {
  it("encrypts and decrypts UTF-8 payloads", async () => {
    const passwordModule = await importPasswordModule();
    const encrypted = await passwordModule.encryptWithPassword("hello world", "s3cret", {
      iterations: 64,
      keyLength: 256,
    });

    assert.equal(encrypted.algorithm, "AES-GCM");
    assert.equal(encrypted.iterations, 64);
    assert.equal(encrypted.keyLength, 256);
    assert.equal(encrypted.hash, "SHA-256");
    assert.ok(encrypted.ciphertext.length > 0);
    assert.ok(encrypted.salt.length > 0);
    assert.ok(encrypted.iv.length > 0);

    const decrypted = await passwordModule.decryptToUtf8(encrypted, "s3cret");
    assert.equal(decrypted, "hello world");
  });

  it("round-trips binary payloads", async () => {
    const passwordModule = await importPasswordModule();
    const payload = Buffer.from([1, 2, 3, 4, 5]);
    const encrypted = await passwordModule.encryptWithPassword(payload, "pw");
    const decrypted = await passwordModule.decryptWithPassword(encrypted, "pw");

    assert.equal(Buffer.compare(Buffer.from(decrypted), payload), 0);
  });
});
