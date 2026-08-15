import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside React tree:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 font-mono select-text">
          <div className="max-w-xl w-full bg-zinc-900 border border-rose-800/80 rounded-lg p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Application Runtime Error
              </h2>
            </div>

            <p className="text-xs text-zinc-300">
              {this.state.error?.message || "An unexpected error occurred during rendering."}
            </p>

            {this.state.error?.stack && (
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
                {this.state.error.stack}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="self-start flex items-center gap-2 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
