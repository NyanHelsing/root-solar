import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

export type MissiveDetailErrorBoundaryProps = PropsWithChildren<{
  fallback?: (error: Error, reset: () => void) => ReactNode;
}>;

type MissiveDetailErrorBoundaryState = {
  error: Error | null;
};

export class MissiveDetailErrorBoundary extends Component<
  MissiveDetailErrorBoundaryProps,
  MissiveDetailErrorBoundaryState
> {
  state: MissiveDetailErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): MissiveDetailErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Failed to render missive detail", error, errorInfo);
  }

  private readonly reset = () => {
    this.setState({ error: null });
  };

  override componentDidUpdate(prevProps: MissiveDetailErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.error) {
      this.reset();
    }
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      if (fallback) {
        return fallback(error, this.reset);
      }
      return null;
    }
    return this.props.children;
  }
}

export default MissiveDetailErrorBoundary;
