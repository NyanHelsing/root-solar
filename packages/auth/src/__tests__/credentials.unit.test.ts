import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import globalJsdom from "global-jsdom";

const moduleSpecifier = "../credentials.ts";

describe("auth/credentials", () => {
    const originalFileReader = globalThis.FileReader;
    const originalFile = globalThis.File;
    let restoreDom: (() => void) | undefined;

    beforeEach(() => {
        restoreDom = globalJsdom(undefined, { url: "https://root.solar/" });
    });

    afterEach(() => {
        mock.restoreAll();
        if (originalFileReader) {
            Object.defineProperty(globalThis, "FileReader", {
                configurable: true,
                value: originalFileReader
            });
        } else {
            Reflect.deleteProperty(globalThis, "FileReader");
        }
        if (originalFile) {
            Object.defineProperty(globalThis, "File", {
                configurable: true,
                value: originalFile
            });
        } else {
            Reflect.deleteProperty(globalThis, "File");
        }
        restoreDom?.();
        restoreDom = undefined;
    });

    it("creates, serializes, parses, and decrypts credential files", async () => {
        const credentials = await import(moduleSpecifier);

        const bundle = credentials.createBeingCredentialBundle(
            { id: "being-1", name: "Being One" },
            {
                signing: { publicKey: "sign-public", privateKey: "sign-private" },
                encryption: { publicKey: "enc-public", privateKey: "enc-private" }
            }
        );

        assert.deepEqual(bundle, {
            beingId: "being-1",
            beingName: "Being One",
            signing: { publicKey: "sign-public", privateKey: "sign-private" },
            encryption: { publicKey: "enc-public", privateKey: "enc-private" }
        });

        const credentialFile = await credentials.createBeingCredentialFile(bundle, "secret");

        assert.equal(credentialFile.signing.publicKey, bundle.signing.publicKey);
        assert.equal(credentialFile.encryption.publicKey, bundle.encryption.publicKey);
        assert.equal(credentialFile.signing.encryptedKeyPair.algorithm, "AES-GCM");
        assert.equal(credentialFile.encryption.encryptedKeyPair.algorithm, "AES-GCM");
        assert.equal(
            credentialFile.signing.encryptedKeyPair.iterations,
            credentialFile.encryption.encryptedKeyPair.iterations
        );

        const serialized = credentials.serializeBeingCredentialFile(credentialFile, 0);
        assert.match(serialized, /"being"/);

        const parsedFile = credentials.parseBeingCredentialFile(credentialFile);
        assert.deepEqual(parsedFile, credentialFile);

        const deserialized = credentials.deserializeBeingCredentialFile(serialized);
        assert.deepEqual(deserialized, credentialFile);

        const parsedBundle = credentials.parseBeingCredentialBundle(bundle);
        assert.deepEqual(parsedBundle, bundle);

        const decrypted = await credentials.decryptBeingCredentialFile(credentialFile, "secret");

        assert.deepEqual(decrypted, {
            beingId: credentialFile.being.id,
            beingName: credentialFile.being.name,
            signing: bundle.signing,
            encryption: bundle.encryption
        });

        const keyMaterial = credentials.credentialBundleToKeyMaterial(bundle);
        assert.deepEqual(keyMaterial, {
            signing: bundle.signing,
            encryption: bundle.encryption
        });

        const dataUrl = credentials.credentialFileToDataUrl(credentialFile);
        assert.match(dataUrl, /^data:application\/json/);
    });

    it("reads credential files via the File API", async () => {
        class FakeFileReader {
            constructor() {
                this.result = undefined;
                this.error = null;
                this.onload = null;
                this.onerror = null;
            }

            readAsText() {
                queueMicrotask(() => {
                    this.result = "credential-data";
                    if (this.onload) {
                        this.onload();
                    }
                });
            }
        }

        class FakeFile {
            constructor(name) {
                this.name = name;
            }
        }

        Object.defineProperty(globalThis, "FileReader", {
            configurable: true,
            value: FakeFileReader
        });
        Object.defineProperty(globalThis, "File", {
            configurable: true,
            value: FakeFile
        });

        const credentials = await import(moduleSpecifier);
        const content = await credentials.readFileAsText(new FakeFile("test.json"));
        assert.equal(content, "credential-data");
    });

    it("handles file reader failures", async () => {
        class RejectingFileReader {
            constructor() {
                this.result = undefined;
                this.error = new Error("boom");
                this.onload = null;
                this.onerror = null;
            }

            readAsText() {
                queueMicrotask(() => {
                    if (this.onerror) {
                        this.onerror();
                    }
                });
            }
        }

        class NonStringResultReader {
            constructor() {
                this.result = new ArrayBuffer(0);
                this.error = null;
                this.onload = null;
                this.onerror = null;
            }

            readAsText() {
                queueMicrotask(() => {
                    if (this.onload) {
                        this.onload();
                    }
                });
            }
        }

        class FakeFile {
            constructor(name) {
                this.name = name;
            }
        }

        Object.defineProperty(globalThis, "File", {
            configurable: true,
            value: FakeFile
        });

        Object.defineProperty(globalThis, "FileReader", {
            configurable: true,
            value: RejectingFileReader
        });

        const credentials = await import(moduleSpecifier);
        await assert.rejects(credentials.readFileAsText(new FakeFile("reject.json")), /boom/);

        Object.defineProperty(globalThis, "FileReader", {
            configurable: true,
            value: NonStringResultReader
        });

        await assert.rejects(
            credentials.readFileAsText(new FakeFile("binary.json")),
            /Unexpected file reader result type/
        );
    });
});
