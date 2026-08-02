import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-brand-bg)] w-full print:h-auto print:overflow-visible">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block print:hidden">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 print:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full w-64 animate-in slide-in-from-right duration-200">
            <Sidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 -left-12 bg-white/90 text-slate-700 p-2 rounded-xl shadow-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative print:h-auto print:overflow-visible">
        <div className="print:hidden flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 mr-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
