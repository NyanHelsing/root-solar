import {
    Component,
    createElement,
    type ErrorInfo,
    type PropsWithChildren,
    type ReactNode,
} from "react";

import { createAppLogger } from "@root-solar/observability";

const boundaryLogger = createAppLogger("shell:route-error-boundary");

export type RouteErrorBoundaryProps = PropsWithChildren<{
    fallback?: ReactNode | ((error: Error) => ReactNode);
    onError?: (error: Error, info: ErrorInfo) => void;
}>;

type RouteErrorBoundaryState = {
    error: Error | null;
};

export class RouteErrorBoundary extends Component<
    RouteErrorBoundaryProps,
    RouteErrorBoundaryState
> {
    constructor(props: RouteErrorBoundaryProps) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        boundaryLogger.error("Route rendering failed", { error, info });
        this.props.onError?.(error, info);
    }

    render(): ReactNode {
        const { error } = this.state;

        if (!error) {
            return this.props.children;
        }

        const { fallback } = this.props;

        if (typeof fallback === "function") {
            return fallback(error);
        }

        if (fallback) {
            return fallback;
        }

        return createElement(
            "div",
            { role: "alert" },
            createElement("h1", null, "Something went wrong"),
            createElement("p", null, error.message),
        );
    }
}

export default RouteErrorBoundary;
