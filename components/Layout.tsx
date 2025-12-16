import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  stepName?: string;
  progress: number; // 0 to 100
}

const Layout: React.FC<LayoutProps> = ({ children, stepName, progress }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header / Progress */}
      <div className="w-full max-w-2xl bg-white shadow-sm sticky top-0 z-10">
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="px-6 py-3 flex justify-between items-center text-sm text-slate-500">
          <span className="font-medium text-slate-700">EcoAction Experiment</span>
          <span>{stepName}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl px-6 py-8 flex flex-col gap-6 mb-24">
        {children}
      </main>

      {/* Footer Branding (Optional) */}
      <div className="fixed bottom-2 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-slate-300">Research System v1.0</p>
      </div>
    </div>
  );
};

export default Layout;