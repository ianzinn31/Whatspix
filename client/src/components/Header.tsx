import React from 'react';
import { Sparkles, Shield, Smartphone, Bell, PlusCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onSimulateLead?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onSimulateLead }) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0a0f1d]/80 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Anti-ban Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Anti-Ban:</span>
          <span className="text-emerald-400 font-semibold font-mono">96% Blindado</span>
        </div>

        {/* AI Agent Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-300">Copiloto IA:</span>
          <span className="text-indigo-300 font-semibold">Sofia (Vendas X1)</span>
        </div>

        {/* Simulate New Lead Button */}
        {onSimulateLead && (
          <button
            onClick={onSimulateLead}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simular Lead CTWA</span>
          </button>
        )}

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      </div>
    </header>
  );
};
