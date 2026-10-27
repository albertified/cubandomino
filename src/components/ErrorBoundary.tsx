import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CubanDominoes ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      safeStorage.removeItem('cuban_dominoes_player_id');
      safeStorage.removeItem('cuban_dominoes_training_progress');
      safeStorage.removeItem('cuban_dominoes_saved_session');
    } catch (e) {
      console.warn('Failed clearing storage', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#140b07] text-[#f4efe4] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#200d07] border-2 border-[#fe7328]/60 rounded-lg p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#fe7328]/20 flex items-center justify-center text-[#fe7328] font-bold text-2xl">
              🁢
            </div>
            
            <h1 className="text-xl font-bold font-serif text-[#fe7328]">
              Cuban Domino Online
            </h1>
            
            <p className="text-sm text-[#d5c3bd] leading-relaxed">
              An unexpected issue occurred while rendering the game table.
            </p>

            {this.state.error && (
              <div className="p-3 bg-[#100603] border border-[#83746f]/40 rounded text-left overflow-auto max-h-32 text-xs font-mono text-red-300">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#006876] hover:bg-[#008294] text-white font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
              >
                Reload Game
              </button>
              <button
                onClick={this.handleResetState}
                className="flex-1 py-2.5 px-4 bg-[#32170d] hover:bg-[#482012] text-[#d5c3bd] border border-[#83746f]/50 font-mono text-xs font-bold uppercase rounded transition-colors cursor-pointer"
              >
                Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
