/**
 * ErrorBoundary.jsx — Catches React render crashes and prevents full page blackouts.
 */
import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[340px] flex flex-col items-center justify-center p-6 text-center bg-surface border border-border/80 rounded-2xl m-4">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4 border border-danger/20">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-[17px] font-bold text-ink tracking-tight mb-1">Something went wrong</h2>
          <p className="text-[13px] text-ink-3 max-w-md mb-5">
            {this.state.error?.message || 'An unexpected UI error occurred while rendering this view.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-ink text-[12.5px] font-semibold transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-[12.5px] font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
