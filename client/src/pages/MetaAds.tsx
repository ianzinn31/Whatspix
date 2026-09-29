import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  DollarSign,
  Zap,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Save
} from 'lucide-react';
import { MetaAdsMetric } from '../types';
import { api } from '../services/api';

export const MetaAds: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MetaAdsMetric[]>([]);
  const [pixelId, setPixelId] = useState(
    () => localStorage.getItem('whatspix_meta_pixel_id') || ''
  );
  const [capiToken, setCapiToken] = useState(
    () => localStorage.getItem('whatspix_meta_capi_token') || ''
  );
  const [testSuccess, setTestSuccess] = useState(false);
  const [isSendingEvent, setIsSendingEvent] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await api.getMetaCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Erro ao carregar campanhas Meta:', err);
    }
  };

  const handleSaveMetaConfig = () => {
    localStorage.setItem('whatspix_meta_pixel_id', pixelId);
    localStorage.setItem('whatspix_meta_capi_token', capiToken);
    setSavedConfig(true);
    setTimeout(() => setSavedConfig(false), 2000);
  };

  const handleTestCapi = async () => {
    setIsSendingEvent(true);
    try {
      await api.triggerMetaConversion('Purchase', '+55 11 99123-4567', 197.0);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 2500);
    } catch (err) {
      console.error('Erro no CAPI:', err);
    } finally {
      setIsSendingEvent(false);
    }
  };

  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalRev = campaigns.reduce((acc, c) => acc + c.revenue, 0);
  const blendedRoas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : '0';

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/50 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Integração Meta Ads & Conversions API (CAPI)</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-mono">
                ROAS Blended: {blendedRoas}x
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Rastreie o custo por conversa iniciada no WhatsApp e envie eventos de compra de volta para o algoritmo do Facebook otimizar suas vendas.
            </p>
          </div>
        </div>

        <button
          onClick={handleTestCapi}
          disabled={isSendingEvent}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all shrink-0"
        >
          {testSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          <span>{testSuccess ? 'Evento Enviado com Sucesso!' : 'Disparar Purchase CAPI Teste'}</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400">Total Gasto em Anúncios</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            R$ {totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-cyan-400 mt-2 block font-medium">Campanhas CTWA Ativas</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400">Faturamento no WhatsApp</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            R$ {totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-400 mt-2 block font-medium">Retorno Direto no X1</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400">ROAS Médio Consolidado</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">{blendedRoas}x</div>
          <span className="text-[11px] text-emerald-400 mt-2 block font-medium">Margem Operacional Alta</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400">Conversas Iniciadas</span>
          <div className="text-2xl font-black text-indigo-400 mt-1">1.059</div>
          <span className="text-[11px] text-indigo-400 mt-2 block font-medium">Custo Médio: R$ 2,09/lead</span>
        </div>
      </div>

      {/* CAPI Settings & Campaigns Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white">Detalhamento por Criativo / Campanha</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Campanha</th>
                  <th className="pb-3 font-semibold">Investimento</th>
                  <th className="pb-3 font-semibold">Cliques</th>
                  <th className="pb-3 font-semibold">Conversas</th>
                  <th className="pb-3 font-semibold">Receita</th>
                  <th className="pb-3 font-semibold text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      Nenhuma campanha Meta Ads vinculada ainda. As métricas serão atualizadas automaticamente conforme os leads chegarem com tags de anúncio ou quando você disparar eventos CAPI.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.campaignId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-slate-200">
                        <div>{camp.campaignName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{camp.campaignId}</span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono">
                        R$ {camp.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-slate-300">{camp.clicks}</td>
                      <td className="py-3 text-slate-300">{camp.whatsappConversations}</td>
                      <td className="py-3 text-emerald-400 font-bold font-mono">
                        R$ {camp.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30">
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

        {/* Pixel & CAPI Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Parâmetros do Pixel & Token CAPI
          </h3>
          <p className="text-xs text-slate-400">
            Conecte o token de acesso do Gerenciador de Negócios da Meta para disparar conversões automáticas.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">ID do Pixel Meta</label>
              <input
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="Ex: 84920194829104"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Token de Acesso CAPI</label>
              <input
                type="password"
                value={capiToken}
                onChange={(e) => setCapiToken(e.target.value)}
                placeholder="Ex: EAAG8921829..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <button
              onClick={handleSaveMetaConfig}
              className="w-full py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{savedConfig ? 'Configurações Salvas!' : 'Salvar Credenciais Meta'}</span>
            </button>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <span className="font-semibold text-slate-200 block">Eventos Mapeados:</span>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contact / Lead (Nova conversa)</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>InitiateCheckout (PIX emitido)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Purchase (Comprovante aprovado)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
