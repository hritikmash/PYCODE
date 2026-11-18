import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.removeItem('pycode_history_v1');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131314] text-[#e3e3e3] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#1e1f20] border border-[#282a2c] shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Unable to load application
              </h2>
              <p className="text-sm text-[#8e918f] leading-relaxed">
                Pycode encountered an unexpected client error. You can refresh the page or reset the local workspace.
              </p>
            </div>

            {this.state.error?.message && (
              <pre className="text-xs text-red-300 font-mono bg-[#131314] p-3 rounded-xl border border-red-900/50 text-left overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#004a77] hover:bg-[#005a92] text-white text-xs font-medium transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
