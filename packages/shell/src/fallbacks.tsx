import type { ReactElement } from "react";

import { ShellLayout } from "@root-solar/layout";

export const shellDefaultFallback = <output aria-live="polite">Loading application shell…</output>;

export const defaultShellErrorFallback = (error: Error): ReactElement => (
    <div role="alert">
        <h1>Something went wrong</h1>
        <p>{error.message ?? "An unexpected error occurred while rendering the shell."}</p>
    </div>
);

export const defaultRouteFallback = (error: Error): ReactElement => (
    <ShellLayout>
        <section>{defaultShellErrorFallback(error)}</section>
    </ShellLayout>
);

export default defaultShellErrorFallback;
