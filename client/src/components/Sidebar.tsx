import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  GitFork,
  Bot,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  Settings2,
  Zap,
  Kanban as KanbanIcon
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'live_chat'
  | 'kanban'
  | 'funnels'
  | 'ai_agent'
  | 'antiban'
  | 'proof_reader'
  | 'meta_ads'
  | 'integrations';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, unreadCount = 2 }) => {
  const principalItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard & ROAS',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'live_chat' as NavTab,
      label: 'Chats ao Vivo X1',
      icon: MessageSquare,
      badge: unreadCount > 0 ? `${unreadCount}` : null,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'kanban' as NavTab,
      label: 'Kanban CRM',
      icon: KanbanIcon,
      badge: 'Pipeline',
      badgeColor: 'bg-indigo-600/30 text-indigo-300'
    }
  ];

  const operacoesItems = [
    {
      id: 'funnels' as NavTab,
      label: 'Fluxos & IA Canvas',
      icon: GitFork,
      badge: 'IA',
      badgeColor: 'bg-indigo-600'
    },
    {
      id: 'ai_agent' as NavTab,
      label: 'Agentes de IA',
      icon: Bot,
      badge: 'Modelos',
      badgeColor: 'bg-purple-600/20 text-purple-300'
    },
    {
      id: 'antiban' as NavTab,
      label: 'Escudo Anti-Ban',
      icon: ShieldCheck,
      badge: '96%',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    },
    {
      id: 'proof_reader' as NavTab,
      label: 'Leitor Comprovante',
      icon: FileCheck2,
      badge: 'OCR',
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'meta_ads' as NavTab,
      label: 'Meta Ads & CAPI',
      icon: TrendingUp,
      badge: '5.1x',
      badgeColor: 'bg-cyan-500/20 text-cyan-300'
    },
    {
      id: 'integrations' as NavTab,
      label: 'Configurações & Conexões',
      icon: Settings2,
      badge: '57 IA',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    }
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">WhatsPix</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Automação X1 & IA Vendas</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {/* Seção Principal */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Principal
          </div>
          {principalItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-indigo-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Seção Operações */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Operações & Automação
          </div>
          {operacoesItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-indigo-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* WhatsApp Shield Status Card */}
      <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">WAHA Shield Ativo</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">2/2 Online</span>
        </div>

        <div className="text-[11px] text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Aquecimento de Chips</span>
            <span className="text-slate-300 font-medium">Dia 18 • Seguro</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-[85%]"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span>Digitação natural</span>
            <span>Jitter: 6-15s</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
