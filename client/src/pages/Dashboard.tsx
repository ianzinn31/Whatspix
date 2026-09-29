import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Zap,
  Target,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DashboardMetrics, MetaAdsMetric } from '../types';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<MetaAdsMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setMetrics(data.metrics);
      setCampaigns(data.campaigns);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  if (loading || !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-emerald-400" />
        <span>Carregando métricas de vendas e Meta Ads...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Top Banner Alert / Meta ROAS Status */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Máquina de Vendas X1 no WhatsApp Operando</h2>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                metrics.blendedRoas > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {metrics.blendedRoas > 0 ? `ROAS ${metrics.blendedRoas}x ATIVO` : 'SEM TRÁFEGO PAGO ATIVO'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Copiloto IA qualificando leads em tempo real, gerando PIX Copia e Cola e validando comprovantes bancários.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerConfetti}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <span>🎉 Comemorar Venda</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Hoje */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium">Faturamento Hoje</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            R$ {metrics.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-slate-400">
              {metrics.salesCountToday > 0 ? `${metrics.salesCountToday} vendas confirmadas` : 'Aguardando primeiros pagamentos'}
            </span>
          </div>
        </div>

        {/* Card 2: Vendas Aprovadas Hoje */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium">Vendas Aprovadas</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.salesCountToday} vendas
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-slate-400">Ticket Médio:</span>
            <span className="text-emerald-400 font-semibold font-mono">
              R$ {metrics.salesCountToday > 0 ? (metrics.revenueToday / metrics.salesCountToday).toFixed(2).replace('.', ',') : '0,00'}
            </span>
          </div>
        </div>

        {/* Card 3: Gasto Meta Ads & ROAS */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium">Gasto Meta Ads (Hoje)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            R$ {metrics.metaAdsSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-slate-400">ROAS WhatsApp:</span>
            <span className="px-2 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {metrics.blendedRoas}x
            </span>
          </div>
        </div>

        {/* Card 4: Taxa de Conversão X1 */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-medium">Conversão X1 (Whats)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {metrics.conversionRate}%
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-semibold">{metrics.recoveredCartsCount} carrinhos</span>
            <span className="text-slate-500">recuperados</span>
          </div>
        </div>
      </div>

      {/* Visual Funnel Progression */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Etapas do Funil de Conversão no WhatsApp</h3>
            <p className="text-xs text-slate-400">Taxa de passagem entre o clique no anúncio e o PIX aprovado</p>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Funil Ativo: Método Vendedor X1
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-[10px] font-semibold uppercase text-slate-500">1. Cliques Meta Ads</span>
            <div className="text-lg font-bold text-white mt-1">
              {campaigns.reduce((acc, c) => acc + c.clicks, 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {campaigns.length > 0 ? `CTR médio ${(campaigns.reduce((acc, c) => acc + c.ctr, 0) / campaigns.length).toFixed(1)}%` : '0 cliques'}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: campaigns.length > 0 ? '100%' : '0%' }}></div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-[10px] font-semibold uppercase text-slate-500">2. Conversa Aberta</span>
            <div className="text-lg font-bold text-white mt-1">
              {metrics.totalLeads}
            </div>
            <div className="text-[11px] text-indigo-400 mt-0.5">
              {metrics.totalLeads > 0 ? `${metrics.activeConversations} ativas` : '0 leads'}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: metrics.totalLeads > 0 ? '80%' : '0%' }}></div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-[10px] font-semibold uppercase text-slate-500">3. Qualificado pela IA</span>
            <div className="text-lg font-bold text-white mt-1">
              {metrics.activeConversations}
            </div>
            <div className="text-[11px] text-indigo-400 mt-0.5">
              {metrics.totalLeads > 0 ? `${((metrics.activeConversations / metrics.totalLeads) * 100).toFixed(0)}% avanço` : '0 em triagem'}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: metrics.activeConversations > 0 ? '60%' : '0%' }}></div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
            <span className="text-[10px] font-semibold uppercase text-slate-500">4. PIX Gerado</span>
            <div className="text-lg font-bold text-amber-400 mt-1">
              {metrics.salesCountToday}
            </div>
            <div className="text-[11px] text-amber-400 mt-0.5">
              {metrics.salesCountToday > 0 ? 'Pagamento gerado' : '0 emitidos'}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: metrics.salesCountToday > 0 ? '45%' : '0%' }}></div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-[10px] font-semibold uppercase text-emerald-400">5. Comprovante Aprovado</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {metrics.salesCountToday}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              {metrics.totalLeads > 0 ? `${metrics.conversionRate}% conversão` : '0 aprovados'}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: metrics.salesCountToday > 0 ? '30%' : '0%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Meta Ads Performance & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meta Ads Campaigns Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Desempenho de Campanhas Meta Ads</h3>
              <p className="text-xs text-slate-400">Cruzamento de gasto de anúncios com faturamento no WhatsApp</p>
            </div>
            <span className="text-xs text-cyan-400 font-semibold font-mono">Meta CAPI Ativo</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Campanha</th>
                  <th className="pb-3 font-semibold">Gasto</th>
                  <th className="pb-3 font-semibold">Conversas</th>
                  <th className="pb-3 font-semibold">Custo/Conv.</th>
                  <th className="pb-3 font-semibold">Faturamento</th>
                  <th className="pb-3 font-semibold text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhuma campanha do Meta Ads conectada ainda. As campanhas sincronizadas aparecerão aqui.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.campaignId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-medium text-slate-200">
                        <div>{camp.campaignName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{camp.campaignId}</span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono">
                        R$ {camp.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-slate-300">{camp.whatsappConversations}</td>
                      <td className="py-3 text-slate-300 font-mono">
                        R$ {camp.costPerConversation.toFixed(2)}
                      </td>
                      <td className="py-3 text-emerald-400 font-semibold font-mono">
                        R$ {camp.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded font-bold font-mono text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {camp.roas}x
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Sales Stream (Gateways) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Vendas no X1 em Tempo Real
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">WhatsApp PIX</span>
          </div>

          <div className="space-y-3">
            {metrics.recentSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-1">
                <p className="font-semibold text-slate-400">Nenhuma venda registrada ainda</p>
                <p className="text-[11px] text-slate-600">
                  Os pagamentos e comprovantes PIX aprovados pela IA aparecerão aqui em tempo real.
                </p>
              </div>
            ) : (
              metrics.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between hover:border-emerald-500/30 transition-all"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{sale.leadName}</div>
                    <div className="text-[11px] text-slate-400">{sale.product}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {sale.method}
                      </span>
                      <span className="text-[10px] text-slate-500">{sale.gateway}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      R$ {sale.amount.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{sale.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
