import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-mesh-drift rounded-full bg-violet-400/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] animate-mesh-drift rounded-full bg-cyan-400/20 blur-[120px] [animation-delay:-7s]" />
      <div className="relative flex flex-1 min-h-0">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col min-h-0">
          <div className="relative z-40 shrink-0">
            <Topbar />
          </div>
          <main className="relative z-10 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};
