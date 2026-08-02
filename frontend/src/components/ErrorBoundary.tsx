import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 max-w-lg w-full text-center">
            <div className="mx-auto w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="text-rose-500" size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">حدث خطأ غير متوقع</h1>
            <p className="text-slate-500 mb-6 leading-relaxed">
              عذراً، حدث خطأ أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-4 mb-6 text-right">
                <p className="text-xs font-mono text-slate-600 break-all">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                <RefreshCw size={18} />
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                <Home size={18} />
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
