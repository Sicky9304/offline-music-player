import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleRedirect = () => {
    // Reset boundary state and redirect to Home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-zinc-950 text-red-400 font-mono h-screen overflow-auto select-text flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 border-b border-red-500/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white font-sans">Something went wrong in the Render</h2>
              <p className="text-xs text-zinc-400 font-sans mt-1">An unexpected error has crashed the display panel.</p>
            </div>
            <button
              onClick={this.handleRedirect}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-sans transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
            >
              Go to Home Page
            </button>
          </div>

          <div className="space-y-4">
            <pre className="bg-black/40 p-4 rounded-2xl border border-red-500/20 whitespace-pre-wrap text-sm leading-relaxed">
              {this.state.error && this.state.error.toString()}
              {"\n\n"}
              {this.state.error && this.state.error.stack}
            </pre>
            <pre className="bg-black/40 p-4 rounded-2xl border border-red-500/20 whitespace-pre-wrap text-xs text-zinc-400 leading-relaxed">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
