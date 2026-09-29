import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Send,
  Mic,
  QrCode,
  Paperclip,
  Bot,
  User,
  CheckCheck,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Phone,
  Tag,
  DollarSign,
  FileCheck2,
  ExternalLink,
  Plus,
  Trash2,
  FileText,
  Download,
  Volume2
} from 'lucide-react';
import { Lead, ChatMessage } from '../types';
import { api } from '../services/api';

export const LiveChat: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'ai' | 'pix' | 'paid' | 'human'>('all');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await api.getLeads();
      setLeads(data);
      if (data.length > 0 && !activeLead) {
        selectLead(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    }
  };

  const selectLead = async (lead: Lead) => {
    setActiveLead(lead);
    try {
      const msgs = await api.getMessages(lead.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  const handleCreateTestLead = async () => {
    try {
      const newLead = await api.createLead({
        name: `Lead Teste ${Math.floor(Math.random() * 899 + 100)}`,
        phone: `+55 11 9${Math.floor(Math.random() * 8999 + 1000)}-${Math.floor(Math.random() * 8999 + 1000)}`,
        offerValue: 197.0,
        productInterest: 'Método Vendedor Automático X1'
      });
      await loadLeads();
      selectLead(newLead);
    } catch (err) {
      console.error('Erro ao criar lead de teste:', err);
    }
  };

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteLead(leadId);
      if (activeLead?.id === leadId) {
        setActiveLead(null);
        setMessages([]);
      }
      await loadLeads();
    } catch (err) {
      console.error('Erro ao excluir lead:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeLead) return;

    const textToSend = inputText;
    setInputText('');

    // Adiciona otimisticamente mensagem humana
    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      leadId: activeLead.id,
      sender: 'human',
      type: 'text',
      content: textToSend,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await api.sendMessage(activeLead.id, textToSend, 'human');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleSimulateLeadReply = async (replyText: string) => {
    if (!activeLead) return;

    // Lead envia mensagem
    const leadMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      leadId: activeLead.id,
      sender: 'lead',
      type: 'text',
      content: replyText,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    };
    setMessages((prev) => [...prev, leadMsg]);

    // Se IA estiver ativa, exibe "digitando..." humanizado
    if (activeLead.aiActive) {
      setIsTyping(true);
      setTimeout(async () => {
        try {
          const res = await api.sendMessage(activeLead.id, replyText, 'lead');
          // Recarrega mensagens atualizadas
          const updated = await api.getMessages(activeLead.id);
          setMessages(updated);
          loadLeads();
        } finally {
          setIsTyping(false);
        }
      }, 1600);
    }
  };

  const handleToggleAi = async () => {
    if (!activeLead) return;
    try {
      const res = await api.toggleAi(activeLead.id);
      setActiveLead((prev) => (prev ? { ...prev, aiActive: res.aiActive } : null));
      setLeads((prev) =>
        prev.map((l) => (l.id === activeLead.id ? { ...l, aiActive: res.aiActive } : l))
      );
    } catch (err) {
      console.error('Erro ao alternar IA:', err);
    }
  };

  const handleGeneratePix = async () => {
    if (!activeLead) return;
    try {
      const res = await api.generatePix(activeLead.id, activeLead.offerValue);
      setMessages((prev) => [...prev, res.message]);
      setActiveLead((prev) => (prev ? { ...prev, status: 'pix_generated', pixCode: res.pixCode } : null));
      loadLeads();
    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
    }
  };

  const handleSendVoiceNote = async () => {
    if (!activeLead) return;
    setIsSimulatingAudio(true);
    setTimeout(() => {
      setIsSimulatingAudio(false);
      const audioMsg: ChatMessage = {
        id: `msg-voice-${Date.now()}`,
        leadId: activeLead.id,
        sender: 'ai',
        type: 'audio',
        content: 'Áudio gravado com tom humanizado de escassez (0:14s)',
        mediaUrl: '#audio-player',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };
      setMessages((prev) => [...prev, audioMsg]);
    }, 2000);
  };

  const copyPixToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const filteredLeads = leads.filter((lead) => {
    if (filterTab === 'ai') return lead.aiActive;
    if (filterTab === 'pix') return lead.status === 'pix_generated';
    if (filterTab === 'paid') return lead.status === 'paid';
    if (filterTab === 'human') return !lead.aiActive;
    return true;
  });

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden bg-[#080c14]">
      {/* COLUMN 1: Contacts List */}
      <div className="w-80 md:w-96 border-r border-slate-800/80 bg-[#0a0f1d] flex flex-col shrink-0">
        {/* Search & Header */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={handleCreateTestLead}
              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors shrink-0"
              title="Criar Lead de Teste no X1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterTab === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Todos ({leads.length})
            </button>
            <button
              onClick={() => setFilterTab('ai')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterTab === 'ai'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              IA Ativa
            </button>
            <button
              onClick={() => setFilterTab('pix')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterTab === 'pix'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Aguardando PIX
            </button>
            <button
              onClick={() => setFilterTab('paid')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterTab === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Pagos
            </button>
          </div>
        </div>

        {/* Contacts Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredLeads.length === 0 && (
            <div className="p-8 text-center text-slate-500 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">Nenhum contato ativo</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Os leads do WhatsApp aparecerão aqui em tempo real.
                </p>
              </div>
              <button
                onClick={handleCreateTestLead}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Criar Lead de Teste</span>
              </button>
            </div>
          )}

          {filteredLeads.map((lead) => {
            const isSelected = activeLead?.id === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => selectLead(lead)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all group ${
                  isSelected
                    ? 'bg-slate-800/60 border-l-4 border-emerald-500'
                    : 'hover:bg-slate-850/40'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={lead.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={lead.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700"
                  />
                  {lead.aiActive && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white"
                      title="Copiloto IA Ativo"
                    >
                      🤖
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{lead.name}</h4>
                    <button
                      onClick={(e) => handleDeleteLead(lead.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-all text-slate-500 hover:bg-slate-800"
                      title="Excluir Lead"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{lead.phone}</p>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {lead.status === 'pix_generated' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        PIX R$ {lead.offerValue}
                      </span>
                    )}
                    {lead.status === 'paid' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        PAGO ✓
                      </span>
                    )}
                    {lead.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: Active Chat Conversation */}
      <div className="flex-1 flex flex-col bg-[#080c14] border-r border-slate-800/80">
        {activeLead ? (
          <>
            {/* Chat Top Bar */}
            <div className="p-3.5 px-6 border-b border-slate-800/80 bg-[#0a0f1d]/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeLead.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={activeLead.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{activeLead.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{activeLead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online no WhatsApp
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">
                      Origem: {activeLead.adName || 'Meta Ads Direto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Switch & Quick Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleAi}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    activeLead.aiActive
                      ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Ligar ou pausar a IA para este contato"
                >
                  <Bot className={`w-4 h-4 ${activeLead.aiActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{activeLead.aiActive ? 'Copiloto IA Ligado' : 'IA Pausada (Manual)'}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isLead = msg.sender === 'lead';
                const isAi = msg.sender === 'ai';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isLead ? 'items-start' : 'items-end'}`}
                  >
                    {/* Sender Label */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {isLead ? (
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {activeLead.name.split(' ')[0]}
                        </span>
                      ) : isAi ? (
                        <span className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Sofia IA (Vendedora)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-400">
                          Atendente Humano
                        </span>
                      )}
                      <span className="text-[9px] text-slate-600 font-mono">14:23</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isLead
                          ? 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                          : isAi
                          ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 text-slate-100 border border-indigo-500/30 rounded-tr-sm shadow-md'
                          : 'bg-emerald-950/70 text-slate-100 border border-emerald-500/30 rounded-tr-sm'
                      }`}
                    >
                      {/* Text content */}
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Audio Player */}
                      {msg.type === 'audio' && msg.mediaUrl && (
                        <div className="mt-2.5 p-2 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 ml-1" />
                          <audio
                            controls
                            src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `http://localhost:3001${msg.mediaUrl}`}
                            className="h-7 w-full max-w-[260px]"
                          />
                        </div>
                      )}

                      {/* PDF / Document Attachment Box */}
                      {msg.type === 'document' && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate">
                                {msg.content.replace('📄 Arquivo: ', '')}
                              </p>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                Documento PDF Oficial • Entregue via WhatsApp
                              </span>
                            </div>
                          </div>
                          {msg.mediaUrl && (
                            <a
                              href={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `http://localhost:3001${msg.mediaUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-indigo-500/30"
                              title="Visualizar / Baixar PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Baixar</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* PIX Copy & Paste Box */}
                      {msg.type === 'pix' && activeLead.pixCode && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                              <QrCode className="w-3.5 h-3.5" /> Chave PIX Copia e Cola
                            </span>
                            <span className="text-slate-500">Validade: 30 min</span>
                          </div>

                          <div className="p-2 rounded bg-slate-900 font-mono text-[10px] text-slate-300 break-all border border-slate-800">
                            {activeLead.pixCode}
                          </div>

                          <button
                            onClick={() => copyPixToClipboard(activeLead.pixCode || '')}
                            className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/30"
                          >
                            {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPix ? 'Copiado para Área de Transferência!' : 'Copiar Código PIX'}</span>
                          </button>
                        </div>
                      )}

                      {/* Receipt OCR Validation Card */}
                      {msg.isProofReceipt && msg.proofData && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4" /> COMPROVANTE VALIDADO POR IA
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                              {msg.proofData.confidenceScore}% Confiabilidade
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <div>
                              <span className="text-slate-500 block">Banco Emissor:</span>
                              <span className="text-slate-200 font-semibold">{msg.proofData.bankName}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Valor Confirmado:</span>
                              <span className="text-emerald-400 font-bold font-mono">
                                R$ {msg.proofData.amount.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Autenticação E2E:</span>
                              <span className="text-slate-300 font-mono truncate block">
                                {msg.proofData.transactionId}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Tipo de Liquidação:</span>
                              <span className="text-emerald-300 font-semibold">Instantânea (Não agendado)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
                  <Bot className="w-4 h-4" />
                  <span>Sofia digitando humanamente com delay natural...</span>
                </div>
              )}

              {isSimulatingAudio && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse">
                  <Mic className="w-4 h-4 animate-bounce" />
                  <span>Gravando áudio com tom de voz humanizado...</span>
                </div>
              )}
            </div>

            {/* Quick Simulation Suggestions for the Lead */}
            <div className="px-6 py-2 bg-slate-950/80 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-medium whitespace-nowrap">Simular fala do lead:</span>
              <button
                onClick={() => handleSimulateLeadReply('Pode me mandar o PIX para pagar agora?')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                "Manda a chave PIX"
              </button>
              <button
                onClick={() => handleSimulateLeadReply('Achei um pouco caro, tem algum desconto?')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                "Tem desconto? (Downsell)"
              </button>
              <button
                onClick={() => handleSimulateLeadReply('Como funciona a garantia se eu não gostar?')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition-colors"
              >
                "Qual a garantia?"
              </button>
              <button
                onClick={() => handleSimulateLeadReply('Já fiz o PIX! Segue o comprovante em anexo.')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 whitespace-nowrap transition-colors"
              >
                "Comprovante enviado"
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[#0a0f1d] border-t border-slate-800/80 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleGeneratePix}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                title="Gerar e Enviar PIX Imediato"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSendVoiceNote}
                className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                title="Enviar Áudio Humanizado"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite uma mensagem humana ou comando..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 transition-all font-semibold shadow-md shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Selecione uma conversa para iniciar o atendimento.
          </div>
        )}
      </div>

      {/* COLUMN 3: Lead CRM & Funnel Drawer */}
      {activeLead && (
        <div className="hidden xl:flex w-80 bg-[#0a0f1d] border-l border-slate-800/80 p-5 flex-col overflow-y-auto space-y-5 shrink-0">
          <div className="text-center pb-4 border-b border-slate-800/80">
            <img
              src={activeLead.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={activeLead.name}
              className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-emerald-500/40 mb-2"
            />
            <h3 className="text-sm font-bold text-white">{activeLead.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{activeLead.phone}</p>
          </div>

          {/* Deal & Offer Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Oferta em Negociação</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono">
              R$ {activeLead.offerValue.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-[11px] text-slate-300 font-medium">{activeLead.productInterest}</p>
          </div>

          {/* Anti-Ban & Funnel Details */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Funil Atribuído:</span>
              <span className="text-slate-200 font-medium">Método X1 Direto</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Origem do Tráfego:</span>
              <span className="text-cyan-400 font-medium">{activeLead.origin}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Campanha Meta:</span>
              <span className="text-slate-300 font-mono text-[10px]">{activeLead.adName || 'Geral'}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Status Anti-Ban:</span>
              <span className="text-emerald-400 font-semibold font-mono">Seguro (Jitter Ativo)</span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Tag className="w-3.5 h-3.5" /> Tags do Lead
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeLead.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              onClick={handleGeneratePix}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-500/30 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Gerar PIX Imediato</span>
            </button>

            <button
              onClick={handleToggleAi}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>{activeLead.aiActive ? 'Pausar Atendimento IA' : 'Ativar IA'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
