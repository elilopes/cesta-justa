import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado ao carregar o aplicativo.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F8F7] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <h1 className="text-xl font-bold text-neutral-900">
              Algo deu errado ao sincronizar os dados
            </h1>
            <p className="text-sm text-neutral-600 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-[#15803D] text-white rounded-lg hover:bg-[#166534] transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
