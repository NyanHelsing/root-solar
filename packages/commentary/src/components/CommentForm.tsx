import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { FlareButton, FlareStack } from "@root-solar/flare";

type CommentFormProps = {
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
  busy?: boolean;
};

export const CommentForm = ({
  onSubmit,
  onCancel,
  submitLabel = "Post comment",
  placeholder = "Share your perspective…",
  autoFocus = false,
  busy = false,
}: CommentFormProps) => {
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const submitDraft = async () => {
    if (busy) {
      return;
    }
    const body = draft.trim();
    if (!body) {
      setLocalError("Please add a comment before submitting.");
      return;
    }
    setLocalError(null);
    try {
      await onSubmit(body);
      setDraft("");
      onCancel?.();
    } catch (error) {
      console.error("Failed to submit comment", error);
      setLocalError("Unable to post comment right now. Please try again.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await submitDraft();
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void submitDraft();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FlareStack gap="sm">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          rows={4}
          placeholder={placeholder}
          disabled={busy}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--rs-border-strong, #d0d4dd)",
            font: "inherit",
            resize: "vertical",
          }}
        />
        {localError ? (
          <p role="alert" className="rs-text-soft">
            {localError}
          </p>
        ) : null}
        <FlareStack direction="row" justify="flex-end" gap="sm">
          {onCancel ? (
            <FlareButton
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </FlareButton>
          ) : null}
          <FlareButton type="button" onClick={submitDraft} disabled={busy}>
            {submitLabel}
          </FlareButton>
        </FlareStack>
      </FlareStack>
    </form>
  );
};

export default CommentForm;
