import { z } from "zod";

export const encryptedPayloadSchema = z.object({
    algorithm: z.literal("AES-GCM"),
    ciphertext: z.string(),
    iv: z.string(),
    salt: z.string(),
    iterations: z.number().int().positive(),
    hash: z.string(),
    keyLength: z.number().int().positive()
});

export const beingSessionSchema = z.object({
    version: z.literal(1),
    createdAt: z.string(),
    being: z.object({
        id: z.string(),
        name: z.string().optional(),
        signingPublicKey: z.string(),
        encryptionPublicKey: z.string()
    }),
    encryptedBundle: encryptedPayloadSchema
});

export type BeingSessionRecord = z.infer<typeof beingSessionSchema>;
