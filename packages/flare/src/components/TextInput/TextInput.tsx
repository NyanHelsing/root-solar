import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./TextInput.module.scss";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    invalid?: boolean;
    size?: "md" | "compact" | "numeric";
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { invalid = false, size = "md", className, ...props },
    ref,
) {
    const sizeClass =
        size !== "md" ? styles[`input--${size}` as "input--compact" | "input--numeric"] : undefined;

    const classes = [styles.input, sizeClass, className].filter(Boolean).join(" ");

    return <input ref={ref} className={classes} data-invalid={invalid || undefined} {...props} />;
});

export default TextInput;
