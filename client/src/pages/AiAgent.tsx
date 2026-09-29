import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Save,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  Send,
  Wrench,
  Sliders,
  HelpCircle,
  ShieldAlert,
  Zap,
  Target,
  LifeBuoy,
  RefreshCw,
  Cpu,
  Layers,
  Activity,
  Key,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  Mic,
  Volume2,
  Radio,
  Search,
  Check,
  ExternalLink
} from 'lucide-react';
import { AiAgentConfig, KnowledgeDoc } from '../types';
import { api } from '../services/api';

export const AiAgent: React.FC = () => {
  const [config, setConfig] = useState<AiAgentConfig | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [simulatedChat, setSimulatedChat] = useState<Array<{ sender: 'lead' | 'ai'; text: string; action?: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New knowledge doc modal
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<'product' | 'faq' | 'objections' | 'guarantee'>('objections');
  const [newDocContent, setNewDocContent] = useState('');

  // Provedores de IA: Cascata 100% NVIDIA NIM
  const [providers, setProviders] = useState<any[]>([]);
  const [cascadeResults, setCascadeResults] = useState<any[]>([]);
  const [isTestingCascade, setIsTestingCascade] = useState(false);
  const [showKeysConfig, setShowKeysConfig] = useState(false);
  const [customKeys, setCustomKeys] = useState({
    nvidia: localStorage.getItem('whatspix_nvidia_key') || '',
    openrouter: localStorage.getItem('whatspix_openrouter_key') || '',
    fishAudio: localStorage.getItem('whatspix_fish_key') || ''
  });
  const [fishVoiceId, setFishVoiceId] = useState(
    localStorage.getItem('whatspix_fish_voice_id') || '5ead3a4fedda4d1f8419ca8b2452f6d5'
  );
  const [keysSaved, setKeysSaved] = useState(false);

  // Modelos NVIDIA NIM puxados da API
  const [nvidiaModels, setNvidiaModels] = useState<any[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsSource, setModelsSource] = useState<'live_api' | 'catalog'>('catalog');
  const [modelsMessage, setModelsMessage] = useState<string>('');
  const [searchModelQuery, setSearchModelQuery] = useState('');
  const [modelSelectSuccess, setModelSelectSuccess] = useState(false);

  // Módulo de Voz (OpenRouter Fish Audio)
  const [voiceTestText, setVoiceTestText] = useState(
    'Oi! Vi que sua vaga no método com desconto de R$ 197 está quase expirando. Quer que eu segure os bônus pra você?'
  );
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [voiceTestResult, setVoiceTestResult] = useState<any>(null);

  useEffect(() => {
    loadConfig();
    loadProviders();
    loadNvidiaModels();
  }, []);

  const loadNvidiaModels = async (keyToUse?: string) => {
    setIsFetchingModels(true);
    try {
      const data = await api.getNvidiaModels(keyToUse || customKeys.nvidia);
      setNvidiaModels(data.models || []);
      setModelsSource(data.source);
      if (data.message) setModelsMessage(data.message);
      if (data.activeModel && config) {
        setConfig((prev) => (prev ? { ...prev, model: data.activeModel } : null));
      }
    } catch (e) {
      console.error('Erro ao carregar modelos NVIDIA:', e);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSelectNvidiaModel = async (modelId: string) => {
    if (!config) return;
    try {
      await api.selectNvidiaModel(modelId);
      setConfig({ ...config, model: modelId });
      setModelSelectSuccess(true);
      setTimeout(() => setModelSelectSuccess(false), 2000);
    } catch (e) {
      console.error('Erro ao selecionar modelo:', e);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await api.getAiProviders();
      setProviders(data.providers || []);
    } catch (e) {
      console.error('Erro ao buscar provedores:', e);
    }
  };

  const handleTestCascade = async () => {
    setIsTestingCascade(true);
    try {
      const res = await api.testAiCascade({ nvidia: customKeys.nvidia });
      setCascadeResults(res.results || []);
    } catch (e) {
      console.error('Erro ao testar cascata:', e);
    } finally {
      setIsTestingCascade(false);
    }
  };

  const handleTestVoiceApi = async () => {
    setIsTestingVoice(true);
    try {
      const res = await api.testVoice(customKeys.fishAudio || customKeys.openrouter);
      setVoiceTestResult(res);
    } catch (e: any) {
      setVoiceTestResult({ status: 'error', message: e.message });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleSynthesizeAudio = async () => {
    if (!voiceTestText.trim()) return;
    setIsGeneratingVoice(true);
    setVoiceStatusMsg(null);
    try {
      const res = await api.synthesizeVoice(voiceTestText, undefined, fishVoiceId);
      if (res.audioUrl || res.audioBase64) {
        setGeneratedAudioUrl(res.audioUrl || res.audioBase64);
        setVoiceStatusMsg(`✓ Áudio sintetizado com sucesso (${res.durationSeconds}s) via ${res.provider}!`);
      } else {
        setVoiceStatusMsg('Falha ao sintetizar áudio: ' + (res.message || 'Erro'));
      }
    } catch (e: any) {
      setVoiceStatusMsg('Erro na requisição: ' + e.message);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleSaveKeys = () => {
    localStorage.setItem('whatspix_nvidia_key', customKeys.nvidia);
    localStorage.setItem('whatspix_openrouter_key', customKeys.openrouter);
    localStorage.setItem('whatspix_fish_key', customKeys.fishAudio);
    localStorage.setItem('whatspix_fish_voice_id', fishVoiceId);
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);
    loadProviders();
  };

  const loadConfig = async () => {
    try {
      const data = await api.getAiConfig();
      setConfig(data);
    } catch (err) {
      console.error('Erro ao carregar config da IA:', err);
    }
  };

  const handleApplyTemplate = (template: 'leo_vendas' | 'nina_suporte' | 'teo_recuperacao') => {
    if (!config) return;

    if (template === 'leo_vendas') {
      setConfig({
        ...config,
        personaName: 'Leo',
        agentRole: 'Especialista em Vendas X1 & Fechamento',
        tone: 'persuasive',
        customInstructions: `Você é Leo, consultor sênior de vendas no WhatsApp.
Seu foco é qualificar leads vindos de anúncios Meta Ads, conduzir pelo método SPIN Selling, tirar dúvidas frequentes e enviar o link/chave PIX de checkout assim que o lead demonstrar interesse.
Seja direto, empático e conduza para o fechamento. Quando o lead pedir PIX, chame generate_pix_charge. Se enviar comprovante, use check_receipt.`
      });
    } else if (template === 'nina_suporte') {
      setConfig({
        ...config,
        personaName: 'Nina',
        agentRole: 'Suporte ao Cliente & Liberação de Acesso',
        tone: 'friendly',
        customInstructions: `Você é Nina, responsável pelo suporte pós-venda e atendimento ao cliente.
Seu objetivo é ajudar alunos a acessar a plataforma, esclarecer dúvidas sobre os bônus e validar comprovantes bancários.
Se não souber responder a algo com precisão absoluta, transfira gentilmente para um humano usando a tool handoff_human.`
      });
    } else if (template === 'teo_recuperacao') {
      setConfig({
        ...config,
        personaName: 'Teo',
        agentRole: 'Recuperador de Vendas & Carrinho Abandonado',
        tone: 'friendly',
        customInstructions: `Você é Teo, consultor focado em recuperação de vendas e carrinhos abandonados (Kiwify/Hotmart).
Aborde o lead com empatia perguntando se houve alguma falha no pagamento ou na conexão.
Não force a barra com promoções falsas. Se o lead relatar objeção de dinheiro, ofereça uma condição especial de downsell no PIX usando apply_discount.`
      });
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      await api.updateAiConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Erro ao salvar config:', err);
    }
  };

  const handleSimulateChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testMessage.trim()) return;

    const userText = testMessage;
    setTestMessage('');
    setSimulatedChat((prev) => [...prev, { sender: 'lead', text: userText }]);

    setIsSimulating(true);
    try {
      const res = await api.simulateAiMessage(userText, 'Lead Simulado', 197.0);
      setSimulatedChat((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.response.replyText,
          action: res.response.actionTaken !== 'none' ? res.response.actionTaken : undefined
        }
      ]);
    } catch (err) {
      console.error('Erro na simulação:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAddKnowledge = async () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    try {
      const newDoc = await api.addKnowledgeDoc({
        title: newDocTitle,
        category: newDocCategory,
        content: newDocContent
      });
      setConfig((prev) =>
        prev ? { ...prev, knowledgeBase: [...prev.knowledgeBase, newDoc] } : null
      );
      setIsAddingDoc(false);
      setNewDocTitle('');
      setNewDocContent('');
    } catch (err) {
      console.error('Erro ao adicionar documento:', err);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      await api.deleteKnowledgeDoc(id);
      setConfig((prev) =>
        prev
          ? {
              ...prev,
              knowledgeBase: prev.knowledgeBase.filter((d) => d.id !== id)
            }
          : null
      );
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
    }
  };

  if (!config) {
    return <div className="p-8 text-slate-400 text-xs">Carregando configurações do Copiloto IA...</div>;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/50 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Agentes de IA & Treinamento de Vendas X1</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-mono">
                {config.model}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Personalize o tom de voz, instruções de fechamento persuasivo e ferramentas ativas para o WhatsApp.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'Configurações Salvas!' : 'Salvar Treinamento'}</span>
        </button>
      </div>

      {/* Modelos Prontos de Agentes (Inspirado nos templates da Leona) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Modelos de Agentes Prontos para Infoprodutos
          </h3>
          <span className="text-[11px] text-slate-400">Clique para carregar o arquétipo de vendas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div
            onClick={() => handleApplyTemplate('leo_vendas')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              config.personaName === 'Leo'
                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                L
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Leo · Vendas X1</h4>
                <span className="text-[10px] text-emerald-400 font-medium">Conversão & PIX</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Responde anúncios do Instagram, qualifica com SPIN e envia a chave PIX no momento exato.
            </p>
          </div>

          <div
            onClick={() => handleApplyTemplate('nina_suporte')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              config.personaName === 'Nina'
                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                N
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Nina · Suporte & Acesso</h4>
                <span className="text-[10px] text-teal-400 font-medium">Pós-venda & Alunos</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tira dúvidas de login, orienta sobre os módulos e valida comprovantes de pagamento.
            </p>
          </div>

          <div
            onClick={() => handleApplyTemplate('teo_recuperacao')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              config.personaName === 'Teo'
                ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                T
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Teo · Recuperação Kiwify</h4>
                <span className="text-[10px] text-amber-400 font-medium">Carrinho & Downsell</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Recupera carrinhos abandonados com abordagem empática e oferece cupom relâmpago no PIX.
            </p>
          </div>
        </div>
      </div>

      {/* Cascata Multi-Provedores & NVIDIA NIM (Principal) */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-xl shadow-emerald-950/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Cascata Multi-Provedores & NVIDIA NIM (Principal)
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full uppercase tracking-wider">
                  NVIDIA Ativa
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Atendimento X1 blindado: a NVIDIA conduz o fechamento. Em caso de lentidão ou limite de requisições, o sistema aciona Groq, OpenRouter ou OpenAI em milissegundos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowKeysConfig(!showKeysConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{showKeysConfig ? 'Ocultar Chaves' : 'Configurar Chaves'}</span>
              {showKeysConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleTestCascade}
              disabled={isTestingCascade}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isTestingCascade ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
              )}
              <span>{isTestingCascade ? 'Testando Conexões...' : 'Testar Cascata Agora'}</span>
            </button>
          </div>
        </div>

        {/* Visual Pipeline da Cascata 100% NVIDIA */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* 1. NVIDIA Llama 70B */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">1º Principal</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-white">NVIDIA Llama 3.3</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">70B Instruct</p>
            <div className="mt-2 text-[9px] text-emerald-300 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60 text-center">
              Vendas & SPIN Selling
            </div>
          </div>

          {/* 2. NVIDIA DeepSeek R1 */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">2º Fallback</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>
            <h4 className="text-xs font-bold text-white">NVIDIA DeepSeek</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">R1 Reasoning</p>
            <div className="mt-2 text-[9px] text-cyan-300 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 text-center">
              Quebra de Objeções
            </div>
          </div>

          {/* 3. NVIDIA Nemotron */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">3º Fallback</span>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            </div>
            <h4 className="text-xs font-bold text-white">NVIDIA Nemotron</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">70B Instruct</p>
            <div className="mt-2 text-[9px] text-purple-300 font-semibold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60 text-center">
              Otimizado da NVIDIA
            </div>
          </div>

          {/* 4. NVIDIA Llama 405B */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">4º Fallback</span>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <h4 className="text-xs font-bold text-white">NVIDIA Llama 3.1</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">405B Parâmetros</p>
            <div className="mt-2 text-[9px] text-blue-300 font-semibold bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/60 text-center">
              Super Raciocínio
            </div>
          </div>

          {/* 5. NVIDIA Llama 8B */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">5º Fallback</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <h4 className="text-xs font-bold text-white">NVIDIA Llama 3.1</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">8B Ultra-Rápido</p>
            <div className="mt-2 text-[9px] text-amber-300 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 text-center">
              Backup & Velocidade
            </div>
          </div>
        </div>

        {/* Seletor Dinâmico de Modelos NVIDIA da API */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-xs font-bold text-white">
                Escolha o Modelo Ativo da NVIDIA (Puxado da API)
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                Ativo: {config.model}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadNvidiaModels()}
                disabled={isFetchingModels}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                <span>{isFetchingModels ? 'Sincronizando...' : 'Puxar da API NVIDIA'}</span>
              </button>
            </div>
          </div>

          {/* Seletor Rápido Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Seletor Dropdown Rápido (Todos os Modelos da API NVIDIA):</span>
            </label>
            <select
              value={config.model}
              onChange={(e) => handleSelectNvidiaModel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-semibold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              {nvidiaModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100 py-1">
                  [{m.creator}] {m.name} — {m.recommendedRole} ({m.id})
                </option>
              ))}
            </select>
          </div>

          {/* Barra de Pesquisa e Mensagem */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar modelos por texto (ex: llama, deepseek, 70b, 405b, mixtral, nemotron, vision)..."
                value={searchModelQuery}
                onChange={(e) => setSearchModelQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {modelSelectSuccess && (
              <span className="text-xs font-semibold text-emerald-400 animate-pulse shrink-0">
                ✓ Modelo Ativado com Sucesso!
              </span>
            )}
          </div>

          {/* Grid de Modelos Selecionáveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {nvidiaModels
              .filter((m) =>
                m.name.toLowerCase().includes(searchModelQuery.toLowerCase()) ||
                m.id.toLowerCase().includes(searchModelQuery.toLowerCase()) ||
                (m.description && m.description.toLowerCase().includes(searchModelQuery.toLowerCase()))
              )
              .map((m) => {
                const isSelected = config.model === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectNvidiaModel(m.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                          {m.creator}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                            <Check className="w-2.5 h-2.5" /> SELECIONADO
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500">Clique para ativar</span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold truncate">{m.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{m.id}</p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {m.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded font-medium truncate max-w-[170px]">
                        {m.recommendedRole}
                      </span>
                      <span className="text-slate-500 font-mono">128k ctx</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Inputs de Configuração das Chaves NVIDIA */}
        {showKeysConfig && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Chaves de API da NVIDIA NIM
              </h4>
              <span className="text-[11px] text-slate-400">
                Gere em <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">build.nvidia.com</a> ou preencha em <code className="text-emerald-300">server/.env</code>
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-emerald-400 block mb-1">
                NVIDIA API Key(s) (nvapi-...)
              </label>
              <input
                type="password"
                placeholder="nvapi-... (ou cole múltiplas chaves separadas por vírgula para rotação anti-bloqueio)"
                value={customKeys.nvidia}
                onChange={(e) => setCustomKeys({ ...customKeys, nvidia: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Todas as 5 etapas da cascata utilizam esta mesma chave da NVIDIA com rotação automática entre modelos.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-emerald-400 font-medium">
                {keysSaved ? '✓ Chave NVIDIA salva com sucesso!' : ''}
              </span>
              <button
                onClick={handleSaveKeys}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
              >
                Salvar Chave
              </button>
            </div>
          </div>
        )}

        {/* Resultados do Teste de Cascata */}
        {cascadeResults.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-yellow-400" />
              Diagnóstico dos Modelos NVIDIA NIM
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {cascadeResults.map((res: any) => (
                <div
                  key={res.id}
                  className={`p-2.5 rounded-lg border text-xs ${
                    res.status === 'online'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : res.status === 'not_configured'
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{res.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        res.status === 'online'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : res.status === 'not_configured'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {res.status === 'online'
                        ? `ONLINE (${res.latencyMs}ms)`
                        : res.status === 'not_configured'
                        ? 'SEM CHAVE'
                        : 'FALHA'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight truncate">{res.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Áudio & Voz Humanizada de WhatsApp (Fish Audio & OpenRouter) */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/30 shadow-xl shadow-purple-950/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">
                  Estúdio de Voz & Áudios PTT WhatsApp (Fish Audio)
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full uppercase tracking-wider font-mono">
                  Voz: {fishVoiceId.slice(0, 10)}...
                </span>
                <span className="px-2 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono">
                  Personalizada ✓
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sintetize notas de voz humanizadas para o WhatsApp com a voz escolhida do Fish Audio. O robô emula <em>"gravando áudio..."</em> antes do envio para máxima conversão.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestVoiceApi}
            disabled={isTestingVoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/30 transition-all shrink-0"
          >
            {isTestingVoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isTestingVoice ? 'Testando...' : 'Testar Conexão de Voz'}</span>
          </button>
        </div>

        {/* Studio de Áudio & Teste em Tempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          <div className="lg:col-span-2 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Texto para Áudio de Demonstração (Simulação WhatsApp)
              </label>
              <textarea
                rows={2}
                value={voiceTestText}
                onChange={(e) => setVoiceTestText(e.target.value)}
                placeholder="Digite o texto que a IA deve falar no áudio..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSynthesizeAudio}
                disabled={isGeneratingVoice || !voiceTestText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/30 transition-all"
              >
                {isGeneratingVoice ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>{isGeneratingVoice ? 'Sintetizando Voz...' : 'Gerar e Ouvir Áudio (Fish Audio)'}</span>
              </button>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Emulação Anti-ban: Ativa "gravando áudio..." antes do envio</span>
              </div>
            </div>

            {voiceStatusMsg && (
              <p className="text-xs text-purple-300 bg-purple-950/40 border border-purple-800/60 p-2.5 rounded-lg">
                {voiceStatusMsg}
              </p>
            )}

            {generatedAudioUrl && (
              <div className="p-3 bg-slate-950 border border-purple-500/40 rounded-xl flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-purple-400 shrink-0" />
                <audio controls src={generatedAudioUrl} className="w-full h-8" autoPlay />
              </div>
            )}
          </div>

          {/* Configuração das Chaves & ID da Voz */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  ID da Voz (Fish Audio)
                </h4>
                <a
                  href="https://fish.audio/discovery"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-purple-400 hover:text-purple-300 underline"
                >
                  Buscar vozes ↗
                </a>
              </div>
              <input
                type="text"
                placeholder="5ead3a4fedda4d1f8419ca8b2452f6d5"
                value={fishVoiceId}
                onChange={(e) => setFishVoiceId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Cole o ID da voz copiado do site fish.audio
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                Chave Fish Audio API (Opcional)
              </h4>
              <input
                type="password"
                placeholder="sk-fish-..."
                value={customKeys.fishAudio}
                onChange={(e) => setCustomKeys({ ...customKeys, fishAudio: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                Chave OpenRouter (Ativa)
              </h4>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={customKeys.openrouter}
                onChange={(e) => setCustomKeys({ ...customKeys, openrouter: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-400">
                {keysSaved ? 'Configurações salvas!' : ''}
              </span>
              <button
                onClick={handleSaveKeys}
                className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-md shadow-purple-600/30"
              >
                Salvar Voz
              </button>
            </div>

            {voiceTestResult && (
              <div
                className={`p-2 rounded-lg text-[10px] border ${
                  voiceTestResult.status === 'online'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {voiceTestResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Instructions & Persona */}
        <div className="lg:col-span-2 space-y-6">
          {/* Persona & Tone Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Identidade do Atendente & Tom de Voz
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nome da Persona</label>
                <input
                  type="text"
                  value={config.personaName}
                  onChange={(e) => setConfig({ ...config, personaName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Papel no Atendimento</label>
                <input
                  type="text"
                  value={config.agentRole}
                  onChange={(e) => setConfig({ ...config, agentRole: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tom da Conversa</label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="persuasive">Persuasivo & Fechamento Rápido</option>
                  <option value="friendly">Empático & Amigável</option>
                  <option value="expert">Especialista & Autoridade</option>
                  <option value="direct">Direto & Conciso</option>
                </select>
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Prompt Mestre de Vendas (Instruções do Sistema)
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">Variáveis: {"{{nome}}"}, {"{{produto}}"}</span>
              </div>
              <textarea
                rows={9}
                value={config.customInstructions}
                onChange={(e) => setConfig({ ...config, customInstructions: e.target.value })}
                className="w-full p-4 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50 font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Tools / Function Calling */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Ferramentas Ativas para a IA (Function Calling)
                </h3>
                <p className="text-xs text-slate-400">
                  A IA decide automaticamente quando invocar cada ferramenta durante a conversa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">generate_pix_charge</span>
                  <span className="text-[10px] text-slate-400">Gera chave Copia e Cola com QR code instantâneo</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toolsEnabled.generatePix}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      toolsEnabled: { ...config.toolsEnabled, generatePix: e.target.checked }
                    })
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">check_receipt (OCR)</span>
                  <span className="text-[10px] text-slate-400">Analisa comprovante de imagem/PDF com antifraude</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toolsEnabled.checkReceipt}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      toolsEnabled: { ...config.toolsEnabled, checkReceipt: e.target.checked }
                    })
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">apply_discount</span>
                  <span className="text-[10px] text-slate-400">Oferece downsell se o lead disser que tá sem grana</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toolsEnabled.applyDiscount}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      toolsEnabled: { ...config.toolsEnabled, applyDiscount: e.target.checked }
                    })
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">handoff_human</span>
                  <span className="text-[10px] text-slate-400">Pausa a IA e alerta a equipe de suporte humano</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.toolsEnabled.handoffHuman}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      toolsEnabled: { ...config.toolsEnabled, handoffHuman: e.target.checked }
                    })
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Knowledge Base (RAG) */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Base de Conhecimento do Produto (RAG)
                </h3>
                <p className="text-xs text-slate-400">
                  Dúvidas frequentes, garantia, módulos e scripts que alimentam as respostas da IA.
                </p>
              </div>

              <button
                onClick={() => setIsAddingDoc(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Tópico</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.knowledgeBase.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{doc.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{doc.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteKnowledge(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Live Playground Simulator */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col h-[740px]">
          <div className="pb-3 border-b border-slate-800/80 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Playground de Teste da IA
            </h3>
            <p className="text-xs text-slate-400">Simule perguntas de leads para validar o tom e as tools</p>
          </div>

          {/* Playground Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            {simulatedChat.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
                  <Bot className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-300">Playground de Teste em Tempo Real</p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Digite uma mensagem abaixo (ex: "Olá, me explica como funciona?", "Tem garantia?") para conversar diretamente com sua IA conectada na API da NVIDIA!
                </p>
              </div>
            )}

            {simulatedChat.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs ${
                  msg.sender === 'lead'
                    ? 'bg-slate-850 text-slate-200 border border-slate-700/60 ml-4'
                    : 'bg-indigo-950/70 text-slate-100 border border-indigo-500/30 mr-4'
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-400 mb-1">
                  {msg.sender === 'lead' ? 'Lead' : `${config.personaName} (IA)`}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {msg.action && (
                  <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/50 p-1.5 rounded border border-emerald-500/20">
                    ⚡ Tool Executada: {msg.action}
                  </div>
                )}
              </div>
            ))}

            {isSimulating && (
              <div className="text-xs text-indigo-400 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>IA processando com RAG e prompts...</span>
              </div>
            )}
          </div>

          {/* Playground Input */}
          <form onSubmit={handleSimulateChat} className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite como um lead (ex: Tem garantia?)..."
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              type="submit"
              disabled={!testMessage.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Adicionar Tópico na Base de Conhecimento */}
      {isAddingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Novo Documento da Base de Conhecimento
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Título do Tópico</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Ex: Como funciona o suporte após a compra?"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Categoria</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="product">Detalhes do Produto / Conteúdo</option>
                  <option value="faq">Dúvida Frequente (FAQ)</option>
                  <option value="objections">Quebra de Objeção</option>
                  <option value="guarantee">Garantia & Reembolso</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Conteúdo Explicativo</label>
                <textarea
                  rows={4}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Instruções claras que a IA usará para responder aos leads..."
                  className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAddingDoc(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddKnowledge}
                disabled={!newDocTitle.trim() || !newDocContent.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 transition-colors"
              >
                Salvar Tópico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
