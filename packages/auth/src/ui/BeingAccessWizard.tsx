import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAtomValue } from "jotai";

import {
  FlareButton,
  FlareCard,
  FlareStack,
  FlareTextInput,
} from "@root-solar/flare";

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
import type { AuthRequest, IdpChallenge } from "../handshake/index.ts";
import {
  createAuthRequest,
  createChallengeResponse,
} from "../handshake/index.ts";
import {
  generateBeingKeyMaterial,
  type BeingKeyMaterial,
} from "../identities.ts";
import {
  createBeingCredentialBundle,
  createBeingCredentialFile,
  serializeBeingCredentialFile,
} from "../credentials.ts";
import BeingLogin from "./BeingLogin.tsx";
import { beingSessionAtom } from "../session-atoms.ts";
import type { BeingSessionRecord } from "../session.ts";

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

type WizardStage =
  | "choose"
  | "login"
  | "register"
  | "download"
  | "verify"
  | "session";

const REGISTRATION_STEPS = [
  { key: "register", label: "Create being" },
  { key: "download", label: "Save credential" },
  { key: "verify", label: "Verify credential" },
  { key: "session", label: "Session ready" },
] as const;

type RegistrationStepKey = (typeof REGISTRATION_STEPS)[number]["key"];

const getStepIndex = (stage: WizardStage): number | null => {
  const index = REGISTRATION_STEPS.findIndex((step) => step.key === stage);
  return index === -1 ? null : index;
};

const formatPassphraseHint = (beingName?: string | null) =>
  beingName ? `Passphrase for ${beingName}` : "Credential passphrase";

export const BeingAccessWizard = <
  BeingRecord extends BeingRegistrationProfile,
>({
  startRegistration,
  completeRegistration,
}: BeingRegistrationComponentProps<BeingRecord>) => {
  const sessionRecord = useAtomValue(beingSessionAtom);

  const [stage, setStage] = useState<WizardStage>(() =>
    sessionRecord ? "session" : "choose",
  );
  const [status, setStatus] = useState<RegistrationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [snapshot, setSnapshot] =
    useState<BeingRegistrationSnapshot<BeingRecord> | null>(null);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [credentialPasswordConfirm, setCredentialPasswordConfirm] = useState("");
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<
    "idle" | "creating" | "saved"
  >("idle");
  const [sessionPin, setSessionPin] = useState<string | null>(null);

  useEffect(() => {
    if (sessionRecord && stage === "choose") {
      setStage("session");
    }
    if (!sessionRecord && stage === "session") {
      setStage("choose");
    }
  }, [sessionRecord, stage]);

  const resetRegistrationState = useCallback(() => {
    setStatus("idle");
    setError(null);
    setName("");
    setSnapshot(null);
    setCredentialPassword("");
    setCredentialPasswordConfirm("");
    setCredentialStatus("idle");
    setCredentialError(null);
    setSessionPin(null);
  }, []);

  const goToChoose = useCallback(() => {
    resetRegistrationState();
    setStage("choose");
  }, [resetRegistrationState]);

  const handleStartRegistration = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!name.trim()) {
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
        const startResult = await startRegistration({
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
        const completion = await completeRegistration({
          response,
        } satisfies BeingRegistrationCompleteInput);

        setSnapshot({
          being: completion.being,
          keyMaterial,
          challenge: startResult.challenge,
          authRequest,
        });
        setStatus("completed");
        setStage("download");
        setCredentialPassword("");
        setCredentialPasswordConfirm("");
        setCredentialStatus("idle");
      } catch (registrationError) {
        const message =
          registrationError instanceof Error
            ? registrationError.message
            : "Unexpected error during registration";
        setError(message);
        setStatus("error");
      }
    },
    [completeRegistration, name, startRegistration],
  );

  const isBusy = useMemo(
    () =>
      status === "generatingKeys" ||
      status === "creatingRequest" ||
      status === "startingChallenge" ||
      status === "respondingToChallenge",
    [status],
  );

  const credentialFileName = useMemo(
    () =>
      snapshot
        ? `root-solar-being-${snapshot.being.id}.credential.json`
        : "root-solar-being-credentials.json",
    [snapshot],
  );

  const handleCredentialDownload = useCallback(async () => {
    if (!snapshot) {
      return;
    }

    if (!credentialPassword.trim()) {
      setCredentialError("Set a credential passphrase before downloading.");
      return;
    }
    if (credentialPassword !== credentialPasswordConfirm) {
      setCredentialError("Passphrases do not match.");
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      setCredentialError("Credential downloads are only supported in the browser.");
      return;
    }

    try {
      setCredentialError(null);
      setCredentialStatus("creating");
      const bundle = createBeingCredentialBundle(
        {
          id: snapshot.being.id,
          name: snapshot.being.name,
        },
        snapshot.keyMaterial,
      );
      const credentialFile = await createBeingCredentialFile(
        bundle,
        credentialPassword,
      );
      const serialized = serializeBeingCredentialFile(credentialFile);
      const blob = new Blob([serialized], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = credentialFileName;
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
      setCredentialStatus("saved");
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to create credential file";
      setCredentialStatus("idle");
      setCredentialError(message);
    }
  }, [credentialFileName, credentialPassword, credentialPasswordConfirm, snapshot]);

  const hasSavedCredential = credentialStatus === "saved";
  const currentRegistrationStepIndex = getStepIndex(stage);

  const renderStepIndicator = () => {
    if (stage === "choose" || stage === "login") {
      return null;
    }

    if (currentRegistrationStepIndex === null) {
      return null;
    }

    const step = currentRegistrationStepIndex + 1;
    const total = REGISTRATION_STEPS.length;
    const label = REGISTRATION_STEPS[currentRegistrationStepIndex]?.label ?? "";

    return (
      <FlareStack gap="xs">
        <span className="rs-text-soft">Step {step} of {total}</span>
        <span className="rs-heading-sm">{label}</span>
      </FlareStack>
    );
  };

  const handleLoginComplete = useCallback(
    ({ pin }: { pin: string | null; record: BeingSessionRecord }) => {
      setSessionPin(pin);
      setStage("session");
    },
    [],
  );

  const handleVerificationComplete = useCallback(
    ({ pin }: { pin: string | null; record: BeingSessionRecord }) => {
      setSessionPin(pin);
      setStage("session");
      setSnapshot(null);
    },
    [],
  );

  const handleNavigateToAxioms = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.assign("/axioms");
    }
  }, []);

  const displaySession = useMemo(() => {
    if (!sessionRecord) {
      return null;
    }
    const displayName = sessionRecord.being.name?.trim() || sessionRecord.being.id;
    return {
      id: sessionRecord.being.id,
      name: displayName,
    } as const;
  }, [sessionRecord]);

  if (stage === "choose") {
    return (
      <FlareStack gap="lg">
        <h2 className="rs-heading-lg">Access the commons</h2>
        <p className="rs-text-soft">
          Sign in with an existing credential or create a new being to join the root.solar commons.
        </p>
        <FlareStack direction="row" gap="lg" wrap>
          <FlareCard
            tone="muted"
            padding="lg"
            style={{ flex: "1 1 18rem", minWidth: "18rem" }}
          >
            <FlareStack gap="md">
              <h3 className="rs-heading-md">I already have a credential</h3>
              <p className="rs-text-soft">
                Import your credential file to unlock your keys and continue where you left off.
              </p>
              <FlareButton
                type="button"
                onClick={() => {
                  resetRegistrationState();
                  setStage("login");
                }}
              >
                Sign in
              </FlareButton>
            </FlareStack>
          </FlareCard>
          <FlareCard
            tone="muted"
            padding="lg"
            style={{ flex: "1 1 18rem", minWidth: "18rem" }}
          >
            <FlareStack gap="md">
              <h3 className="rs-heading-md">I need to create a being</h3>
              <p className="rs-text-soft">
                Generate signing and encryption keys, download a credential file, then verify it to finish setup.
              </p>
              <FlareButton
                type="button"
                onClick={() => {
                  resetRegistrationState();
                  setStage("register");
                }}
              >
                Create a being
              </FlareButton>
            </FlareStack>
          </FlareCard>
        </FlareStack>
      </FlareStack>
    );
  }

  if (stage === "login") {
    return (
      <FlareStack gap="lg">
        <FlareButton type="button" variant="ghost" onClick={goToChoose} style={{ alignSelf: "flex-start" }}>
          ← Back
        </FlareButton>
        <FlareCard tone="muted" padding="lg">
          <BeingLogin onComplete={handleLoginComplete} />
        </FlareCard>
      </FlareStack>
    );
  }

  return (
    <FlareStack gap="lg">
      <FlareStack direction="row" align="center" justify="space-between">
        {renderStepIndicator()}
        <FlareButton type="button" variant="ghost" onClick={goToChoose}>
          Start over
        </FlareButton>
      </FlareStack>

      {stage === "register" ? (
        <FlareCard tone="muted" padding="lg">
          <FlareStack gap="lg">
            <FlareStack as="form" gap="md" onSubmit={handleStartRegistration}>
              <label className="rs-label" htmlFor="being-name">
                Being name
              </label>
              <FlareTextInput
                id="being-name"
                type="text"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setName(event.target.value)
                }
                placeholder="e.g. horizon-keeper"
                disabled={isBusy}
                required
                minLength={3}
              />
              <FlareButton type="submit" disabled={isBusy}>
                {isBusy ? "Registering..." : "Generate credentials"}
              </FlareButton>
            </FlareStack>
            {status !== "idle" && status !== "completed" ? (
              <p className="rs-text-soft">Status: {status}</p>
            ) : null}
            {error ? <p className="rs-text-danger">{error}</p> : null}
          </FlareStack>
        </FlareCard>
      ) : null}

      {stage === "download" && snapshot ? (
        <FlareCard tone="muted" padding="lg">
          <FlareStack gap="lg">
            <p>
              Set a passphrase and download the credential file. Store the file and passphrase securely—you will need them to sign in.
            </p>
            <FlareStack gap="md">
              <label className="rs-label" htmlFor="credential-passphrase">
                {formatPassphraseHint(snapshot.being.name)}
              </label>
              <FlareTextInput
                id="credential-passphrase"
                type="password"
                value={credentialPassword}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setCredentialPassword(event.target.value)
                }
                placeholder="Create a strong passphrase"
                autoComplete="new-password"
              />
              <label className="rs-label" htmlFor="credential-passphrase-confirm">
                Confirm passphrase
              </label>
              <FlareTextInput
                id="credential-passphrase-confirm"
                type="password"
                value={credentialPasswordConfirm}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setCredentialPasswordConfirm(event.target.value)
                }
                placeholder="Re-enter the passphrase"
                autoComplete="new-password"
              />
              {credentialError ? (
                <p className="rs-text-danger">{credentialError}</p>
              ) : null}
              {credentialStatus === "saved" ? (
                <p className="rs-text-success">
                  Credential file saved. Keep it safe—you will verify it in the next step.
                </p>
              ) : null}
              <FlareButton
                type="button"
                disabled={credentialStatus === "creating"}
                onClick={handleCredentialDownload}
              >
                {credentialStatus === "creating" ? "Preparing credential..." : "Download credential"}
              </FlareButton>
            </FlareStack>
            <FlareStack direction="row" gap="sm">
              <FlareButton
                type="button"
                variant="primary"
                disabled={!hasSavedCredential}
                onClick={() => setStage("verify")}
              >
                Continue to verification
              </FlareButton>
              <FlareButton
                type="button"
                variant="ghost"
                onClick={() => setStage("register")}
              >
                Back
              </FlareButton>
            </FlareStack>
          </FlareStack>
        </FlareCard>
      ) : null}

      {stage === "verify" && snapshot ? (
        <FlareCard tone="muted" padding="lg">
          <BeingLogin
            variant="verify"
            expectedBeingId={snapshot.being.id}
            expectedBeingName={snapshot.being.name}
            heading="Verify your credential"
            description="Upload the credential file you just downloaded and enter the passphrase to confirm it unlocks before proceeding."
            onComplete={handleVerificationComplete}
            onRequestReset={() => setSessionPin(null)}
          />
        </FlareCard>
      ) : null}

      {stage === "session" && displaySession ? (
        <FlareCard tone="muted" padding="lg">
          <FlareStack gap="lg">
            <FlareStack gap="sm">
              <h2 className="rs-heading-lg">You are signed in</h2>
              <p>
                Welcome, <strong>{displaySession.name}</strong>. Your credential is unlocked in this browser.
              </p>
              {!sessionPin ? (
                <p className="rs-text-soft">
                  Use the 4-digit session PIN you saved earlier. If it is misplaced, import your credential file again to generate a new session and PIN.
                </p>
              ) : null}
            </FlareStack>
            {sessionPin ? (
              <FlareStack
                gap="sm"
                style={{
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.32)",
                }}
              >
                <span>This session PIN authorizes sensitive actions:</span>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    letterSpacing: "0.2rem",
                    textAlign: "center",
                  }}
                  aria-label="Session PIN"
                >
                  {sessionPin}
                </div>
                <span className="rs-text-soft">
                  Keep the PIN handy while you work. If you forget it, re-import your credential file to start a new session.
                </span>
              </FlareStack>
            ) : null}
            <FlareStack direction="row" gap="sm" wrap>
              <FlareButton type="button" onClick={handleNavigateToAxioms}>
                Enter the commons
              </FlareButton>
              <FlareButton
                type="button"
                variant="ghost"
                onClick={() => {
                  resetRegistrationState();
                  setStage("login");
                }}
              >
                Use a different credential
              </FlareButton>
              <FlareButton
                type="button"
                variant="ghost"
                onClick={() => {
                  resetRegistrationState();
                  setStage("register");
                }}
              >
                Register another being
              </FlareButton>
            </FlareStack>
          </FlareStack>
        </FlareCard>
      ) : null}
    </FlareStack>
  );
};

export default BeingAccessWizard;
