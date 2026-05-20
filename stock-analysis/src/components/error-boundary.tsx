"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("UI error boundary:", error);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="glass-card rounded-2xl p-8 text-center max-w-lg mx-auto my-10">
          <h2 className="text-lg font-semibold text-white mb-2">Something broke on this page</h2>
          <p className="text-sm text-zinc-400 mb-4">{this.state.error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
