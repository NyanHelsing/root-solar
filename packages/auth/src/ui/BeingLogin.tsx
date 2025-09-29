import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  FlareButton,
  FlareStack,
  FlareTextInput,
} from "@root-solar/flare";

import {
  deserializeBeingCredentialFile,
  decryptBeingCredentialFile,
  readFileAsText,
  type BeingCredentialFile,
} from "../credentials.ts";
import {
  createBeingSession,
  type BeingSessionRecord,
} from "../session.ts";
import { beingSessionAtom } from "../session-atoms.ts";

export type BeingLoginProps = {
  heading?: string;
  description?: string;
  variant?: "login" | "verify";
  expectedBeingId?: string;
  expectedBeingName?: string | null;
  onComplete?: (session: { pin: string | null; record: BeingSessionRecord }) => void;
  onRequestReset?: () => void;
  allowSessionReset?: boolean;
};

type LoginStatus =
  | "idle"
  | "loadingCredential"
  | "credentialReady"
  | "unlocking"
  | "sessionReady"
  | "error";

const defaultHeadings: Record<NonNullable<BeingLoginProps["variant"]>, string> = {
  login: "Sign in with credentials",
  verify: "Verify your credential",
};

const defaultDescriptions: Record<NonNullable<BeingLoginProps["variant"]>, string> = {
  login:
    "Drop your credential file to unlock your keys. We will store the sensitive material encrypted in this browser with a temporary 4-digit PIN so you can authorize actions without re-uploading the file each time.",
  verify:
    "Upload the credential you just downloaded to confirm it unlocks correctly. We will finish by creating a session secured with a temporary 4-digit PIN.",
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const BeingLogin = ({
  heading,
  description,
  variant = "login",
  expectedBeingId,
  expectedBeingName,
  onComplete,
  onRequestReset,
  allowSessionReset = true,
}: BeingLoginProps) => {
  if (variant === "verify" && !expectedBeingId) {
    throw new Error("BeingLogin in verify mode requires an expectedBeingId");
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionRecord = useAtomValue(beingSessionAtom);
  const setSessionRecord = useSetAtom(beingSessionAtom);
  const [dragActive, setDragActive] = useState(false);
  const [credentialFile, setCredentialFile] = useState<BeingCredentialFile | null>(null);
  const [credentialFileName, setCredentialFileName] = useState<string | null>(null);
  const [credentialPassphrase, setCredentialPassphrase] = useState("");
  const [status, setStatus] = useState<LoginStatus>(
    sessionRecord ? "sessionReady" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [sessionPin, setSessionPin] = useState<string | null>(null);

  useEffect(() => {
    if (sessionRecord) {
      setStatus((current) => (current === "sessionReady" ? current : "sessionReady"));
      setError(null);
      return;
    }
    if (!credentialFile) {
      setStatus((current) => (current === "idle" ? current : "idle"));
      setSessionPin(null);
    }
  }, [credentialFile, sessionRecord]);

  const isBusy = useMemo(
    () => status === "loadingCredential" || status === "unlocking",
    [status],
  );

  const resetState = useCallback(() => {
    setCredentialFile(null);
    setCredentialFileName(null);
    setCredentialPassphrase("");
    setStatus("idle");
    setError(null);
    setSessionPin(null);
    if (allowSessionReset) {
      setSessionRecord({ type: "clear" });
    }
    onRequestReset?.();
  }, [allowSessionReset, onRequestReset, setSessionRecord]);

  const handleBrowseRequest = useCallback(() => {
    if (isBusy) {
      return;
    }
    fileInputRef.current?.click();
  }, [isBusy]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    setDragActive(true);
  }, [isBusy]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileParsed = useCallback((file: File, text: string) => {
    const parsed = deserializeBeingCredentialFile(text);
    if (variant === "verify" && expectedBeingId && parsed.being.id !== expectedBeingId) {
      throw new Error("This credential belongs to a different being. Upload the file you just downloaded.");
    }
    setCredentialFile(parsed);
    setCredentialFileName(file.name);
    setCredentialPassphrase("");
    setSessionPin(null);
    setStatus("credentialReady");
  }, [expectedBeingId, variant]);

  const handleFileLoad = useCallback(
    async (file: File) => {
      setError(null);
      setStatus("loadingCredential");
      try {
        const text = await readFileAsText(file);
        handleFileParsed(file, text);
      } catch (fileError) {
        setStatus("error");
        setError(
          getErrorMessage(fileError, "Unable to read credential file. Please try again."),
        );
      }
    },
    [handleFileParsed],
  );

  const onInputChange = useCallback(
    async (event: FormEvent<HTMLInputElement>) => {
      const { files } = event.currentTarget;
      const file = files?.item(0);
      if (!file) {
        return;
      }
      await handleFileLoad(file);
      event.currentTarget.value = "";
    },
    [handleFileLoad],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      if (isBusy) {
        return;
      }
      const files = event.dataTransfer?.files;
      const file = files?.item(0);
      if (!file) {
        return;
      }
      await handleFileLoad(file);
    },
    [handleFileLoad, isBusy],
  );

  const credentialSummary = useMemo(() => {
    if (!credentialFile) {
      return null;
    }
    return {
      id: credentialFile.being.id,
      name: credentialFile.being.name,
      createdAt: credentialFile.createdAt,
    };
  }, [credentialFile]);

  const canUnlock = useMemo(
    () =>
      status === "credentialReady" &&
      credentialFile !== null &&
      credentialPassphrase.trim().length > 0,
    [credentialFile, credentialPassphrase, status],
  );

  const handleUnlock = useCallback(async () => {
    if (!credentialFile || !canUnlock) {
      return;
    }

    try {
      setError(null);
      setStatus("unlocking");
      const bundle = await decryptBeingCredentialFile(
        credentialFile,
        credentialPassphrase,
      );
      if (variant === "verify" && expectedBeingId && bundle.beingId !== expectedBeingId) {
        throw new Error("This credential belongs to a different being. Upload the saved file.");
      }
      const { pin, record } = await createBeingSession(bundle);
      setSessionRecord({ type: "set", record });
      setSessionPin(pin);
      setStatus("sessionReady");
      setCredentialPassphrase("");
      onComplete?.({ pin, record });
    } catch (unlockError) {
      setStatus("credentialReady");
      setError(
        getErrorMessage(
          unlockError,
          "Unable to unlock credential. Check the passphrase and try again.",
        ),
      );
    }
  }, [canUnlock, credentialFile, credentialPassphrase, expectedBeingId, onComplete, setSessionRecord, variant]);

  const sessionSummary = useMemo(() => {
    if (!sessionRecord) {
      return null;
    }
    const displayName = sessionRecord.being.name?.trim() || sessionRecord.being.id;
    return {
      pin: sessionPin,
      createdAt: sessionRecord.createdAt,
      beingId: sessionRecord.being.id,
      beingName: displayName,
    };
  }, [sessionPin, sessionRecord]);

  const resolvedHeading = heading ?? defaultHeadings[variant];
  const resolvedDescription = description ?? defaultDescriptions[variant];

  return (
    <FlareStack gap="lg">
      <FlareStack gap="sm">
        <h2 className="rs-heading-lg">{resolvedHeading}</h2>
        <p className="rs-text-soft">{resolvedDescription}</p>
      </FlareStack>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: "1px dashed rgba(59, 130, 246, 0.5)",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
          background: dragActive ? "rgba(59, 130, 246, 0.08)" : "transparent",
          cursor: isBusy ? "progress" : "pointer",
          outline: "none",
        }}
      >
        <FlareStack gap="sm" align="center">
          <span className="rs-text-soft">
            {dragActive ? "Release to load credential" : "Drag & drop credential JSON or click to browse"}
          </span>
          <FlareButton type="button" variant="ghost" onClick={handleBrowseRequest} disabled={isBusy}>
            Browse files
          </FlareButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onInputChange}
          />
        </FlareStack>
      </div>
      {credentialSummary ? (
        <FlareStack gap="sm">
          <h3 className="rs-heading-md">Credential detected</h3>
          <p className="rs-text-soft">
            Loaded {credentialFileName ?? "credential"} for being <strong>{credentialSummary.name ?? credentialSummary.id}</strong>.
          </p>
          <dl className="rs-description-list">
            <div>
              <dt>Being id</dt>
              <dd>{credentialSummary.id}</dd>
            </div>
            <div>
              <dt>Credential created</dt>
              <dd>{new Date(credentialSummary.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </FlareStack>
      ) : null}
      {status === "credentialReady" || status === "unlocking" || status === "sessionReady" ? (
        <FlareStack gap="md">
          <label className="rs-label" htmlFor="credential-passphrase">
            Credential passphrase
          </label>
          <FlareTextInput
            id="credential-passphrase"
            type="password"
            value={credentialPassphrase}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setCredentialPassphrase(event.target.value)
            }
            placeholder="Enter the passphrase you set when downloading"
            autoComplete={variant === "login" ? "current-password" : "one-time-code"}
            disabled={status === "unlocking"}
            required
          />
          <FlareButton
            type="button"
            onClick={handleUnlock}
            disabled={!canUnlock || status === "unlocking"}
          >
            {status === "unlocking" ? "Unlocking..." : variant === "verify" ? "Verify credential" : "Unlock credential"}
          </FlareButton>
        </FlareStack>
      ) : null}
      {sessionSummary ? (
        <FlareStack
          gap="md"
          style={{
            borderRadius: "0.75rem",
            padding: "1.5rem",
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.32)",
          }}
        >
          <h3 className="rs-heading-md">
            {variant === "verify" ? "Credential verified" : "Session ready"}
          </h3>
          <p>
            Keys for <strong>{sessionSummary.beingName}</strong> are available in this browser.
          </p>
          {sessionSummary.pin ? (
            <>
              <p>
                This PIN is randomly generated for this session. Use it to approve sensitive actions while you stay signed in:
              </p>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.2rem",
                  textAlign: "center",
                }}
                aria-label="Session PIN"
              >
                {sessionSummary.pin}
              </div>
              <p className="rs-text-soft">
                We only store your decrypted keys in memory. If you forget the PIN, drop your credential file to create a new session and receive a fresh PIN.
              </p>
            </>
          ) : (
            <p className="rs-text-soft">
              Use the 4-digit session PIN you saved earlier. If it is misplaced, re-import your credential file to establish a new session.
            </p>
          )}
          <FlareButton type="button" variant="ghost" onClick={resetState}>
            {variant === "verify" ? "Restart verification" : "Use another credential"}
          </FlareButton>
        </FlareStack>
      ) : null}
      {variant === "verify" && expectedBeingName ? (
        <p className="rs-text-soft" style={{ fontStyle: "italic" }}>
          Verifying credential for <strong>{expectedBeingName}</strong>
        </p>
      ) : null}
      {error ? <p className="rs-text-danger">{error}</p> : null}
    </FlareStack>
  );
};

export default BeingLogin;
