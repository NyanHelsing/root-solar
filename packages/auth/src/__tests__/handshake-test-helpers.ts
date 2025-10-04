import type { KeyPair } from "../identities.ts";

type OverrideMap = Record<string, unknown>;

const cleanupTasks: Array<() => void> = [];

export const overrideModuleProperty = (
    target: Record<string, unknown>,
    key: string,
    replacement: unknown
) => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);

    if (!descriptor) {
        Object.defineProperty(target, key, {
            value: replacement,
            configurable: true,
            writable: true
        });
        cleanupTasks.push(() => {
            delete target[key];
        });
        return;
    }

    if (descriptor.configurable) {
        Object.defineProperty(target, key, {
            ...descriptor,
            value: replacement
        });
        cleanupTasks.push(() => {
            Object.defineProperty(target, key, descriptor);
        });
        return;
    }

    if ("value" in descriptor && descriptor.writable) {
        const original = descriptor.value;
        Reflect.set(target, key, replacement);
        cleanupTasks.push(() => {
            Reflect.set(target, key, original);
        });
        return;
    }

    throw new Error(`Cannot override ${String(key)} on target module`);
};

export const resetTestOverrides = () => {
    while (cleanupTasks.length > 0) {
        const cleanup = cleanupTasks.pop();
        if (cleanup) {
            cleanup();
        }
    }
};

export const mockOpenpgp = async (overrides: OverrideMap) => {
    const module = await import("openpgp");
    for (const [key, value] of Object.entries(overrides)) {
        overrideModuleProperty(module as OverrideMap, key, value);
    }
};

type SigningKeyGenerator = () => Promise<KeyPair> | KeyPair;

export const mockGenerateSigningKeyPair = async (generator: SigningKeyGenerator) => {
    const identities = await import("../identities.ts");
    const wrappedGenerator: SigningKeyGenerator = async () => await generator();
    overrideModuleProperty(identities as OverrideMap, "generateSigningKeyPair", wrappedGenerator);
};

export const setGenerateSigningKeyPairResult = async (pair: KeyPair) => {
    await mockGenerateSigningKeyPair(async () => pair);
};

export const decode = (value: Uint8Array): string => new TextDecoder().decode(value);

export const encode = (value: string): Uint8Array => new TextEncoder().encode(value);

export const createWebStream = (chunks: Array<string>) =>
    new ReadableStream<string>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(chunk);
            }
            controller.close();
        }
    });
