import { useId, useState, type FormEvent, type ReactElement } from "react";

import { FlareButton, FlareStack, FlareTextInput } from "@root-solar/flare";

export type TagAttachFormProps = {
    onSubmit: (tagSlug: string) => Promise<void>;
    inputId?: string;
    label?: string;
    placeholder?: string;
    submitLabel?: string;
    busyLabel?: string;
    disabled?: boolean;
    disabledReason?: string | null;
    className?: string;
    onSuccess?: () => void;
};

const defaultSubmitLabel = "Add tag";
const defaultBusyLabel = "Adding…";
const defaultPlaceholder = "e.g. alignment";

const TagAttachForm = ({
    onSubmit,
    inputId,
    label = "Add tag",
    placeholder = defaultPlaceholder,
    submitLabel = defaultSubmitLabel,
    busyLabel = defaultBusyLabel,
    disabled = false,
    disabledReason = null,
    className,
    onSuccess,
}: TagAttachFormProps): ReactElement => {
    const generatedId = useId();
    const fieldId = inputId ?? `${generatedId}-tag-input`;
    const [value, setValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled || isSubmitting) {
            return;
        }
        const trimmed = value.trim();
        if (!trimmed) {
            setError("Provide a tag slug to add.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit(trimmed);
            setValue("");
            onSuccess?.();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to add tag.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const errorId = error ? `${fieldId}-error` : undefined;
    const helpId = disabled && disabledReason ? `${fieldId}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

    return (
        <FlareStack as="form" gap="xs" className={className} onSubmit={handleSubmit}>
            <FlareStack gap="2xs">
                <label className="rs-text-caption" htmlFor={fieldId}>
                    {label}
                </label>
                <FlareStack direction="row" gap="xs" wrap align="flex-start">
                    <FlareTextInput
                        id={fieldId}
                        name={fieldId}
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        disabled={disabled || isSubmitting}
                        placeholder={placeholder}
                        invalid={Boolean(error)}
                        aria-describedby={describedBy}
                    />
                    <FlareButton
                        type="submit"
                        size="sm"
                        disabled={disabled || isSubmitting || value.trim().length === 0}
                    >
                        {isSubmitting ? busyLabel : submitLabel}
                    </FlareButton>
                </FlareStack>
            </FlareStack>
            {error ? (
                <p id={errorId} role="alert" className="rs-text-soft">
                    {error}
                </p>
            ) : null}
            {helpId ? (
                <p id={helpId} className="rs-text-soft">
                    {disabledReason}
                </p>
            ) : null}
        </FlareStack>
    );
};

export default TagAttachForm;
