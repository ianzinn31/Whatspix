import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Server,
  Plus,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Webhook,
  Database,
  Save,
  Trash2,
  Bot,
  Cpu,
  Sparkles,
  Search,
  Zap,
  Sliders,
  Filter,
  CheckSquare,
  Key,
  Layers,
  GitFork,
  Power
} from 'lucide-react';
import { WhatsAppInstance, SalesFunnel } from '../types';
import { api } from '../services/api';
import { isSupabaseConfigured, configureSupabase } from '../services/supabase';

export const Integrations: React.FC = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [funnels, setFunnels] = useState<SalesFunnel[]>([]);
  const [assignedSuccessId, setAssignedSuccessId] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<WhatsAppInstance | null>(null);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrConnectedSuccess, setQrConnectedSuccess] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isAddingInstance, setIsAddingInstance] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('WhatsApp Vendas');
  const [newInstancePhone, setNewInstancePhone] = useState('+55 88 99695-4721');
  const [newInstanceUrl, setNewInstanceUrl] = useState('http://localhost:3000');

  // Supabase settings
  const [sbUrl, setSbUrl] = useState(
    import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('whatspix_supabase_url') || ''
  );
  const [sbKey, setSbKey] = useState(
    import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('whatspix_supabase_key') || ''
  );
  const [sbSaved, setSbSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Modelos NVIDIA NIM da API
  const [nvidiaModels, setNvidiaModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('meta/llama-3.2-11b-vision-instruct');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [searchModel, setSearchModel] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'recommended' | 'meta' | 'nvidia' | 'deepseek' | 'vision'>('all');
  const [modelChangeToast, setModelChangeToast] = useState<string | null>(null);
  const [modelSelectSuccess, setModelSelectSuccess] = useState(false);
  const [modelsSource, setModelsSource] = useState<'live_api' | 'catalog'>('live_api');
  const [modelsMessage, setModelsMessage] = useState<string>('');

  useEffect(() => {
    loadInstances();
    loadNvidiaModels();
    loadFunnels();
  }, []);

  const loadFunnels = async () => {
    try {
      const data = await api.getFunnels();
      setFunnels(data || []);
    } catch (err) {
      console.error('Erro ao carregar funis:', err);
    }
  };

  const handleAssignFunnel = async (instanceId: string, funnelId: string) => {
    try {
      await api.updateInstance(instanceId, { assignedFunnelId: funnelId || undefined });
      setAssignedSuccessId(instanceId);
      setTimeout(() => setAssignedSuccessId(null), 2500);
      await loadInstances();
    } catch (err) {
      console.error('Erro ao vincular funil à instância:', err);
    }
  };

  const loadNvidiaModels = async () => {
    setIsFetchingModels(true);
    try {
      const data = await api.getNvidiaModels();
      setNvidiaModels(data.models || []);
      setModelsSource(data.source);
      if (data.activeModel) {
        setSelectedModel(data.activeModel);
      }
      if (data.message) {
        setModelsMessage(data.message);
      }
    } catch (err) {
      console.error('Erro ao carregar modelos da NVIDIA:', err);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSelectModel = async (modelId: string) => {
    try {
      const res = await api.selectNvidiaModel(modelId);
      if (res.success) {
        setSelectedModel(res.activeModel || modelId);
        setModelSelectSuccess(true);
        setModelChangeToast(`Modelo "${modelId}" ativado com sucesso em todo o sistema!`);
        setTimeout(() => {
          setModelSelectSuccess(false);
          setModelChangeToast(null);
        }, 3500);
      }
    } catch (err) {
      console.error('Erro ao selecionar modelo:', err);
    }
  };

  const filteredModels = nvidiaModels.filter((m) => {
    const matchesSearch =
      !searchModel ||
      m.name.toLowerCase().includes(searchModel.toLowerCase()) ||
      m.id.toLowerCase().includes(searchModel.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchModel.toLowerCase())) ||
      (m.creator && m.creator.toLowerCase().includes(searchModel.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'recommended') {
      return (
        m.id.includes('llama-3.2-11b') ||
        m.id.includes('llama-3.3-70b') ||
        m.id.includes('nemotron-70b') ||
        m.id.includes('deepseek-r1') ||
        m.id.includes('llama-3.1-70b')
      );
    }
    if (categoryFilter === 'meta') {
      return m.id.toLowerCase().includes('meta') || (m.creator && m.creator.toLowerCase().includes('meta'));
    }
    if (categoryFilter === 'nvidia') {
      return m.id.toLowerCase().includes('nvidia') || (m.creator && m.creator.toLowerCase().includes('nvidia'));
    }
    if (categoryFilter === 'deepseek') {
      return m.id.toLowerCase().includes('deepseek') || (m.creator && m.creator.toLowerCase().includes('deepseek'));
    }
    if (categoryFilter === 'vision') {
      return (
        m.id.toLowerCase().includes('vision') ||
        m.id.toLowerCase().includes('vl') ||
        (m.description && m.description.toLowerCase().includes('visão'))
      );
    }
    return true;
  });

  const loadInstances = async () => {
    try {
      const data = await api.getInstances();
      setInstances(data);
    } catch (err) {
      console.error('Erro ao carregar instâncias:', err);
    }
  };

  // Polling automático enquanto o modal do QR Code estiver aberto
  useEffect(() => {
    if (!activeQrModal) {
      setQrConnectedSuccess(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.getInstanceStatus(activeQrModal.id);
        if (res.status === 'connected') {
          setQrConnectedSuccess(true);
          await loadInstances();
          setTimeout(() => {
            setActiveQrModal(null);
            setQrConnectedSuccess(false);
          }, 2500);
        }
      } catch (err) {
        // silencioso
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeQrModal]);

  const handleStartSession = async (instance: WhatsAppInstance) => {
    setConnectingId(instance.id);
    try {
      const res = await api.startInstanceSession(instance.id);
      setActiveQrModal(res.instance);
      if (res.instance?.status === 'connected') {
        setQrConnectedSuccess(true);
        setTimeout(() => {
          setActiveQrModal(null);
          setQrConnectedSuccess(false);
        }, 2500);
      }
      loadInstances();
    } catch (err) {
      console.error('Erro ao iniciar sessão:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const handleRefreshQr = async () => {
    if (!activeQrModal) return;
    setIsRefreshingQr(true);
    try {
      const res = await api.startInstanceSession(activeQrModal.id);
      setActiveQrModal(res.instance);
      if (res.instance?.status === 'connected') {
        setQrConnectedSuccess(true);
        await loadInstances();
        setTimeout(() => {
          setActiveQrModal(null);
          setQrConnectedSuccess(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Erro ao atualizar QR Code:', err);
    } finally {
      setIsRefreshingQr(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await api.logoutInstance(id);
      await loadInstances();
    } catch (err) {
      console.error('Erro ao desconectar instância:', err);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createInstance({
        name: newInstanceName || 'WhatsApp Vendas',
        phone: newInstancePhone || '+55 11 99999-9999',
        serverUrl: newInstanceUrl || 'http://localhost:3000',
        provider: 'waha'
      });
      setIsAddingInstance(false);
      await loadInstances();
      handleStartSession(created);
    } catch (err) {
      console.error('Erro ao criar instância:', err);
    }
  };

  const handleDeleteInstance = async (id: string) => {
    try {
      await api.deleteInstance(id);
      loadInstances();
    } catch (err) {
      console.error('Erro ao excluir instância:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(id);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const handleSaveSupabase = () => {
    configureSupabase(sbUrl, sbKey);
    setSbSaved(true);
    setTimeout(() => setSbSaved(false), 2000);
  };

  const handleCopySqlSchema = () => {
    const sqlSchemaHint = `-- Execute o script server/supabase_schema.sql no SQL Editor do Supabase\n-- Contém tabelas: instances, funnels, leads, messages, ai_agent_configs, meta_campaigns, storage buckets e realtime!`;
    navigator.clipboard.writeText(sqlSchemaHint);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const webhooks = [
    {
      id: 'kiwify',
      name: 'Kiwify (Abandono de Carrinho & Venda Aprovada)',
      url: `${window.location.origin}/api/webhooks/kiwify`
    },
    {
      id: 'hotmart',
      name: 'Hotmart (Hotmart Webhook 2.0)',
      url: `${window.location.origin}/api/webhooks/hotmart`
    },
    {
      id: 'waha',
      name: 'WAHA WhatsApp Inbound Webhook',
      url: `${window.location.origin}/api/webhooks/waha`
    }
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/50 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Configurações Gerais & Modelos de IA</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                NVIDIA NIM LIVE API
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Escolha os modelos de IA da NVIDIA oferecidos pela API, conecte chips de WhatsApp via QR Code (WAHA), banco Supabase e webhooks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Modelo Ativo:</span>
            <span className="text-emerald-300 font-mono font-bold truncate max-w-[200px]">
              {selectedModel.split('/').pop()}
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: MODELOS DE INTELIGÊNCIA ARTIFICIAL DA API NVIDIA */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 space-y-5">
        {/* Header do Card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Modelos de Inteligência Artificial da API (NVIDIA NIM)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {nvidiaModels.length > 0 ? `${nvidiaModels.length} Modelos Disponíveis` : 'Carregando...'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {modelsSource === 'live_api' ? 'Sincronizado da API Oficial' : 'Catálogo'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Aqui você escolhe qual modelo fornecido pela API da NVIDIA deve responder no WhatsApp, alimentar o copiloto de atendimento e construir os funis de venda.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadNvidiaModels}
              disabled={isFetchingModels}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 shadow transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
              <span>{isFetchingModels ? 'Buscando da API...' : 'Sincronizar Modelos'}</span>
            </button>
          </div>
        </div>

        {/* Notificação Toast de Modelo Alterado */}
        {modelChangeToast && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{modelChangeToast}</span>
          </div>
        )}

        {/* Barra de Seleção Imediata (Dropdown) & Busca */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="lg:col-span-7 space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Seletor Rápido de Modelo da API (Troca Instantânea):</span>
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => handleSelectModel(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-semibold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {nvidiaModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100 py-1">
                    [{m.creator}] {m.name} — {m.recommendedRole} ({m.id})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-slate-400">
              Ao selecionar acima, o modelo é alterado imediatamente no servidor e passa a responder aos clientes no WhatsApp.
            </span>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filtrar Modelos da API:</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                placeholder="Buscar por nome, Llama, 70B, Vision, DeepSeek..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-[10px] text-slate-400">
              Exibindo {filteredModels.length} de {nvidiaModels.length} modelos oferecidos pela API.
            </span>
          </div>
        </div>

        {/* Chips de Categorias */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Categorias:
          </span>
          {[
            { id: 'all', label: `Todos (${nvidiaModels.length})` },
            { id: 'recommended', label: '⭐ Recomendados Vendas' },
            { id: 'meta', label: 'Meta Llama' },
            { id: 'nvidia', label: 'NVIDIA Nemotron' },
            { id: 'deepseek', label: 'DeepSeek R1 (Raciocínio)' },
            { id: 'vision', label: 'Visão & OCR' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid de Modelos Oferecidos pela API */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
          {filteredModels.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-950/60 to-slate-950 border-emerald-500 ring-1 ring-emerald-500/70 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                      {m.creator}
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <Check className="w-3 h-3 text-emerald-400" /> ATIVO
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">API NVIDIA NIM</span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white mt-1">{m.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{m.id}</p>

                  <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {m.description || `Modelo homologado de alta performance da NVIDIA NIM.`}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded font-semibold truncate max-w-[180px]">
                      {m.recommendedRole}
                    </span>
                    <span className="text-slate-400 font-mono font-medium">128k ctx</span>
                  </div>

                  <button
                    onClick={() => handleSelectModel(m.id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                        <span>Modelo Ativo no Sistema</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ativar Este Modelo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase Database Connection Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Banco de Dados Supabase (PostgreSQL)</h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    isSupabaseConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isSupabaseConfigured ? 'CONECTADO AO SUPABASE ✓' : 'MODO LOCAL / DEMO ATIVO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Armazene leads, mensagens, histórico de comprovantes e os nós do ReactFlow no Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySqlSchema}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copiado!' : 'Script SQL Schema'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Project URL do Supabase
            </label>
            <input
              type="text"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Anon / Service Public Key
            </label>
            <input
              type="password"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500">
            Script completo salvo em: <code className="text-indigo-400">server/supabase_schema.sql</code>
          </span>

          <button
            onClick={handleSaveSupabase}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            {sbSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{sbSaved ? 'Credenciais Salvas!' : 'Salvar Conexão Supabase'}</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Instances Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Chips de WhatsApp Conectados (WAHA)
            </h3>
            <p className="text-xs text-slate-400">
              Gerencie suas instâncias de WhatsApp conectadas para envio de mensagens e atendimento por IA.
            </p>
          </div>
          <button
            onClick={() => setIsAddingInstance(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Conectar Novo WhatsApp</span>
          </button>
        </div>

        {instances.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-white">Nenhum WhatsApp Conectado</h4>
              <p className="text-xs text-slate-400 mt-1">
                Conecte seu chip de WhatsApp agora via QR Code para iniciar os atendimentos automáticos com os modelos NVIDIA NIM e áudios Fish Audio.
              </p>
            </div>
            <button
              onClick={() => setIsAddingInstance(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <QrCode className="w-4 h-4" />
              <span>Conectar WhatsApp Agora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances.map((inst) => (
              <div
                key={inst.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{inst.name}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        inst.status === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {inst.status === 'connected' ? 'CONECTADO ✓' : 'DESCONECTADO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{inst.phone}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inst.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect(inst.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
                        title="Desconectar do WhatsApp"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Desconectar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartSession(inst)}
                        disabled={connectingId === inst.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-colors flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{connectingId === inst.id ? 'Gerando QR...' : 'Conectar / QR Code'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInstance(inst.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir instância"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Health Score:</span>
                    <span className="text-emerald-400 font-bold font-mono">{inst.healthScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Aquecimento:</span>
                    <span className="text-slate-200 font-medium">Dia {inst.warmupDay}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Disparos Hoje:</span>
                    <span className="text-slate-200 font-mono">
                      {inst.messagesSentToday}/{inst.warmupTarget}
                    </span>
                  </div>
                </div>

                {/* Seletor do Funil Vinculado a este Número */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-slate-950 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5 text-purple-400" />
                      <span>Funil Ativo neste Número (WhatsApp):</span>
                    </label>
                    {assignedSuccessId === inst.id ? (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold animate-pulse">
                        VÍNCULO SALVO! ✓
                      </span>
                    ) : inst.assignedFunnelId ? (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-mono font-bold">
                        VINCULADO
                      </span>
                    ) : null}
                  </div>

                  <select
                    value={inst.assignedFunnelId || ''}
                    onChange={(e) => handleAssignFunnel(inst.id, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500/60 font-medium"
                  >
                    <option value="">⚡ Automático (Palavras-chave globais ou 1º Funil Ativo)</option>
                    {funnels.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.active ? '🟢' : '⚪'} {f.name} {f.active ? '(Ativo)' : '(Pausado)'}
                      </option>
                    ))}
                  </select>

                  <span className="text-[10px] text-slate-400 block leading-tight">
                    {inst.assignedFunnelId ? (
                      <span className="text-purple-300">
                        Qualquer pessoa que enviar mensagem para o número <strong>{inst.phone}</strong> será atendida por este funil automaticamente.
                      </span>
                    ) : (
                      <span>
                        Responde pelo funil ativo correspondente às palavras-chave do anúncio ou conversa.
                      </span>
                    )}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Servidor: <code className="text-indigo-400">{inst.serverUrl}</code></span>
                  <span className="text-slate-500">Provider: {inst.provider.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Adicionar Instância */}
      {isAddingInstance && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateInstance}
            className="bg-[#0f172a] border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Conectar Novo Chip WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingInstance(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome da Instância / Atendente
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="Ex: WhatsApp Vendas Principal"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Número de WhatsApp (com DDI e DDD)
                </label>
                <input
                  type="text"
                  value={newInstancePhone}
                  onChange={(e) => setNewInstancePhone(e.target.value)}
                  placeholder="+55 11 98765-4321"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  URL do Servidor WAHA
                </label>
                <input
                  type="text"
                  value={newInstanceUrl}
                  onChange={(e) => setNewInstanceUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Padrão local: <code>http://localhost:3000</code> (ou URL da sua VPS).
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingInstance(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20"
              >
                Criar e Gerar QR Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Webhooks de Plataformas */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Webhook className="w-4 h-4 text-indigo-400" />
              URLs de Webhook para Plataformas de Infoprodutos
            </h3>
            <p className="text-xs text-slate-400">
              Copie e cole essas URLs nas configurações de webhook da Kiwify, Hotmart ou Eduzz para disparar funis de carrinho abandonado.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block">{wh.name}</span>
                <span className="text-xs font-mono text-emerald-400 break-all">{wh.url}</span>
              </div>

              <button
                onClick={() => copyToClipboard(wh.url, wh.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedWebhook === wh.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedWebhook === wh.id ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Connection Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            {qrConnectedSuccess ? (
              <div className="py-6 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl border border-emerald-500/40 animate-bounce">
                  ✓
                </div>
                <h3 className="text-base font-bold text-white">WhatsApp Conectado com Sucesso!</h3>
                <p className="text-xs text-slate-300">
                  Sua sessão do WhatsApp está ativa e o agente de IA já pode responder leads.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-white">Escanear QR Code no WhatsApp</h3>
                <p className="text-xs text-slate-400">
                  Abra o WhatsApp no celular &gt; Aparelhos Conectados &gt; Conectar um Aparelho.
                </p>

                <div className="p-4 bg-white rounded-2xl inline-block shadow-inner min-w-[220px] min-h-[220px]">
                  {activeQrModal.qrCode ? (
                    <img
                      src={activeQrModal.qrCode}
                      alt="WhatsApp QR Code"
                      className="w-52 h-52 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-800 text-xs gap-3">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                      <span className="text-center font-medium">
                        Gerando QR Code Oficial do WhatsApp...
                        <br />
                        <span className="text-[10px] text-slate-500">aguarde alguns instantes</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Aguardando leitura do aparelho...</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleRefreshQr}
                    disabled={isRefreshingQr}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingQr ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingQr ? 'Atualizando...' : 'Atualizar QR'}</span>
                  </button>
                  <button
                    onClick={() => setActiveQrModal(null)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
