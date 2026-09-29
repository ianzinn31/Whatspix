import React, { useState, useEffect } from 'react';
import {
  Kanban as KanbanIcon,
  Plus,
  DollarSign,
  User,
  Clock,
  MessageSquare,
  Sparkles,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Lead } from '../types';
import { api } from '../services/api';

interface KanbanColumn {
  id: string;
  title: string;
  statusMatch: Lead['status'][];
  color: string;
  bgColor: string;
}

export const KanbanBoard: React.FC<{ onOpenChat?: (leadId: string) => void }> = ({ onOpenChat }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: KanbanColumn[] = [
    {
      id: 'col-new',
      title: '1. Novos Leads (Meta Ads)',
      statusMatch: ['new'],
      color: 'border-cyan-500/40 text-cyan-300',
      bgColor: 'bg-cyan-500/10'
    },
    {
      id: 'col-negotiating',
      title: '2. Qualificação IA (X1)',
      statusMatch: ['negotiating'],
      color: 'border-indigo-500/40 text-indigo-300',
      bgColor: 'bg-indigo-500/10'
    },
    {
      id: 'col-pix',
      title: '3. Chave PIX Emitida',
      statusMatch: ['pix_generated'],
      color: 'border-amber-500/40 text-amber-300',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 'col-paid',
      title: '4. Comprovante Validado (Pago)',
      statusMatch: ['paid'],
      color: 'border-emerald-500/40 text-emerald-300',
      bgColor: 'bg-emerald-500/10'
    },
    {
      id: 'col-human',
      title: '5. Suporte Humano / Transbordo',
      statusMatch: ['transferred', 'lost'],
      color: 'border-purple-500/40 text-purple-300',
      bgColor: 'bg-purple-500/10'
    }
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Erro ao carregar leads para o Kanban:', err);
    } finally {
      setLoading(false);
    }
  };

  const moveLeadToStatus = (leadId: string, newStatus: Lead['status']) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#080c14]">
      {/* Top Bar */}
      <div className="p-4 px-6 border-b border-slate-800/80 bg-[#0a0f1d] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <KanbanIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Pipeline Comercial & CRM WhatsApp
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Funil X1 Ativo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhe o avanço dos leads no WhatsApp desde o clique do anúncio até o PIX confirmado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={async () => {
              await api.createLead({
                name: `Lead Teste ${Math.floor(Math.random() * 899 + 100)}`,
                phone: `+55 11 9${Math.floor(Math.random() * 8999 + 1000)}-${Math.floor(Math.random() * 8999 + 1000)}`,
                offerValue: 197.0,
                productInterest: 'Método Vendedor Automático X1'
              });
              loadLeads();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Lead de Teste</span>
          </button>
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span>Total no Pipeline:</span>
            <strong className="text-white font-mono">{leads.length} leads</strong>
          </div>
        </div>
      </div>

      {/* Kanban Columns Canvas */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-4 bg-[#080c14]">
        {columns.map((col) => {
          const colLeads = leads.filter((l) => col.statusMatch.includes(l.status));
          const colTotalRevenue = colLeads.reduce((acc, l) => acc + (l.offerValue || 0), 0);

          return (
            <div
              key={col.id}
              className="w-80 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 shrink-0 max-h-full"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{col.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${col.bgColor} ${col.color}`}
                    >
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Total: R$ {colTotalRevenue.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {colLeads.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-center p-3 text-slate-600 text-[11px]">
                    <span>Nenhum lead nesta etapa</span>
                  </div>
                ) : (
                  colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5 shadow-sm group"
                  >
                    {/* Lead Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={lead.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={lead.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200">{lead.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{lead.phone}</span>
                        </div>
                      </div>

                      {lead.aiActive && (
                        <span
                          className="p-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px]"
                          title="Copiloto IA Ativo"
                        >
                          🤖
                        </span>
                      )}
                    </div>

                    {/* Product & Value */}
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/70 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-300 truncate max-w-[150px]">
                        {lead.productInterest || 'Infoproduto X1'}
                      </span>
                      <span className="font-bold font-mono text-emerald-400">
                        R$ {lead.offerValue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {/* Origin / Campaign info */}
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Anúncio: {lead.adName?.slice(0, 18) || 'Meta Ads'}</span>
                      <span className="font-mono">Há 14 min</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-slate-850 text-slate-400 border border-slate-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      {onOpenChat && (
                        <button
                          onClick={() => onOpenChat(lead.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Abrir Chat</span>
                        </button>
                      )}

                      {/* Quick Move Selector */}
                      <select
                        value={lead.status}
                        onChange={(e) => moveLeadToStatus(lead.id, e.target.value as any)}
                        className="text-[10px] bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-400 focus:outline-none"
                      >
                        <option value="new">Mover: Novo</option>
                        <option value="negotiating">Mover: Qualificação</option>
                        <option value="pix_generated">Mover: PIX Emitido</option>
                        <option value="paid">Mover: Pago ✓</option>
                        <option value="transferred">Mover: Suporte</option>
                      </select>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
