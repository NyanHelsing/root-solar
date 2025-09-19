import { type FormEvent, useCallback, useMemo, useState } from "react";

import type {
  BeingRegistrationCompleteInput,
  BeingRegistrationCompleteOutput,
  BeingRegistrationProfile,
  BeingRegistrationStartInput,
  BeingRegistrationStartOutput,
} from "../procedures/being-registration.ts";
import {
  beingRegistrationCompleteInputSchema,
  beingRegistrationStartInputSchema,
} from "../procedures/being-registration.ts";
import type { AuthRequest, IdpChallenge } from "../handshake.ts";
import {
  createAuthRequest,
  createChallengeResponse,
} from "../handshake.ts";
import {
  generateBeingKeyMaterial,
  type BeingKeyMaterial,
} from "../identities.ts";

export type BeingRegistrationComponentProps<
  BeingRecord extends BeingRegistrationProfile,
> = {
  startRegistration: (
    input: BeingRegistrationStartInput,
  ) => Promise<BeingRegistrationStartOutput>;
  completeRegistration: (
    input: BeingRegistrationCompleteInput,
  ) => Promise<BeingRegistrationCompleteOutput<BeingRecord>>;
};

type RegistrationStatus =
  | "idle"
  | "generatingKeys"
  | "creatingRequest"
  | "startingChallenge"
  | "respondingToChallenge"
  | "completed"
  | "error";

type BeingRegistrationSnapshot<BeingRecord extends BeingRegistrationProfile> = {
  being: BeingRecord;
  keyMaterial: BeingKeyMaterial;
  challenge: IdpChallenge;
  authRequest: AuthRequest;
};

export const BeingRegistration = <
  BeingRecord extends BeingRegistrationProfile,
>(
  props: BeingRegistrationComponentProps<BeingRecord>,
) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RegistrationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] =
    useState<BeingRegistrationSnapshot<BeingRecord> | null>(null);

  const isBusy = useMemo(
    () =>
      status === "generatingKeys" ||
      status === "creatingRequest" ||
      status === "startingChallenge" ||
      status === "respondingToChallenge",
    [status],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name.trim() || isBusy) {
        return;
      }

      const trimmedName = name.trim();
      setError(null);
      setStatus("generatingKeys");

      try {
        const keyMaterial = await generateBeingKeyMaterial();

        setStatus("creatingRequest");
        const authRequest = await createAuthRequest(keyMaterial);

        setStatus("startingChallenge");
        beingRegistrationStartInputSchema.parse({
          name: trimmedName,
          request: authRequest,
        });
        const startResult = await props.startRegistration({
          name: trimmedName,
          request: authRequest,
        } satisfies BeingRegistrationStartInput);

        setStatus("respondingToChallenge");
        const response = await createChallengeResponse(
          startResult.challenge,
          keyMaterial,
        );
        beingRegistrationCompleteInputSchema.parse({
          response,
        });
        const completion = await props.completeRegistration({
          response,
        } satisfies BeingRegistrationCompleteInput);

        setSnapshot({
          being: completion.being,
          keyMaterial,
          challenge: startResult.challenge,
          authRequest,
        });
        setStatus("completed");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected error during registration";
        setError(message);
        setStatus("error");
      }
    },
    [isBusy, name, props],
  );

  const reset = useCallback(() => {
    setName("");
    setError(null);
    setStatus("idle");
    setSnapshot(null);
  }, []);

  if (status === "completed" && snapshot) {
    return (
      <div className="being-registration">
        <h2>Being Registered</h2>
        <p>
          Being <strong>{snapshot.being.name}</strong> registered with id {snapshot.being.id}.
        </p>
        <section>
          <h3>Public Keys</h3>
          <details>
            <summary>Signing Public Key</summary>
            <pre>{snapshot.being.signingPublicKey}</pre>
          </details>
          <details>
            <summary>Encryption Public Key</summary>
            <pre>{snapshot.being.encryptionPublicKey}</pre>
          </details>
        </section>
        <section>
          <h3>Private Key Material</h3>
          <details>
            <summary>Signing Private Key</summary>
            <pre>{snapshot.keyMaterial.signing.privateKey}</pre>
          </details>
          <details>
            <summary>Encryption Private Key</summary>
            <pre>{snapshot.keyMaterial.encryption.privateKey}</pre>
          </details>
        </section>
        <button type="button" onClick={reset}>
          Register Another Being
        </button>
      </div>
    );
  }

  return (
    <div className="being-registration">
      <h2>Create a new being</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="being-name">Being name</label>
        <input
          id="being-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. horizon-keeper"
          disabled={isBusy}
          required
          minLength={3}
        />
        <button type="submit" disabled={isBusy}>
          {isBusy ? "Registering..." : "Generate credentials"}
        </button>
      </form>
      {status !== "idle" && status !== "completed" && (
        <p className="status">Status: {status}</p>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default BeingRegistration;
