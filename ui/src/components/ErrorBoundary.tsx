import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-lg shadow-2xl backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">Component Crashed</h2>
            <p className="text-sm text-red-300/80 mb-6 font-mono break-all">
              {this.state.error?.message || "An unexpected rendering error occurred"}
            </p>
            <button
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition-colors"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Attempt Recovery
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
