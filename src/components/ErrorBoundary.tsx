import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8 text-center font-mono">
                    <h1 className="text-4xl text-red-500 font-bold mb-4">
                        SYSTEM CRITICAL FAILURE
                    </h1>
                    <p className="mb-4 text-slate-300 max-w-md">
                        The simulation has encountered an unrecoverable error. Just like real
                        hardware.
                    </p>
                    <div className="bg-slate-800 p-4 rounded text-left overflow-auto max-w-2xl w-full mb-8 font-mono text-xs text-red-300 border border-red-900">
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={this.handleReload}
                        className="px-6 py-3 font-bold transition-all cursor-pointer bg-red-600 text-white hover:bg-red-500"
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
