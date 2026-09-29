import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  MarkerType,
  BackgroundVariant,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  ArrowLeft,
  Edit2,
  Sparkles,
  Plus,
  Play,
  Pause,
  Save,
  CheckCircle2,
  RotateCcw,
  X,
  MessageSquare,
  Mic,
  Volume2,
  RefreshCw,
  GitFork,
  QrCode,
  FileCheck2,
  Users,
  Settings2,
  Clock,
  Send,
  Kanban,
  Copy,
  Trash2,
  Tag as TagIcon,
  Sliders,
  FolderKanban,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  PhoneCall,
  ListFilter,
  LayoutGrid,
  Target,
  Timer,
  Building2,
  Globe,
  DollarSign,
  Share2,
  LayoutTemplate,
  Bell,
  Bot,
  Columns3,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Paperclip,
  History,
  Brain,
  Zap,
  MoreHorizontal,
  Wand2
} from 'lucide-react';
import { customNodeTypes } from '../components/flow/CustomNodes';
import { SalesFunnel, AiCopilotMessage } from '../types';
import { api } from '../services/api';
import { ensurePlayableAudioUrl } from '../utils/audioUtils';

// Multi-flow initial seeds
const defaultFunnels: SalesFunnel[] = [
  {
    id: 'funnel-low-ticket',
    name: 'Template Low Ticket (com IA)',
    description: 'Funil principal de conversão rápida para infoprodutos de R$ 47 a R$ 197 com qualificação, distribuidor e PIX.',
    active: true,
    triggerType: 'meta_ads_keyword',
    triggerKeywords: ['QUERO', 'VENDEDOR', 'SABER MAIS'],
    stats: {
      started: 0,
      completed: 0,
      conversions: 0,
      conversionRate: 0
    },
    createdAt: '2026-09-01',
    nodes: [],
    edges: []
  },
  {
    id: 'funnel-recovery',
    name: 'Recuperação de Carrinho Abandonado (Kiwify/Hotmart)',
    description: 'Disparado automaticamente via webhook de checkout abandonado com abordagem empática e downsell relâmpago.',
    active: true,
    triggerType: 'cart_abandoned',
    triggerKeywords: ['CHECKOUT_ABANDONED'],
    stats: {
      started: 0,
      completed: 0,
      conversions: 0,
      conversionRate: 0
    },
    createdAt: '2026-09-10',
    nodes: [],
    edges: []
  },
  {
    id: 'funnel-high-ticket',
    name: 'Funil High Ticket Mentoria VIP (R$ 997+)',
    description: 'Filtragem profunda de faturamento, aplicação por formulário e agendamento de call ou fechamento no 1 a 1.',
    active: false,
    triggerType: 'new_lead',
    triggerKeywords: ['MENTORIA', 'VIP'],
    stats: {
      started: 0,
      completed: 0,
      conversions: 0,
      conversionRate: 0
    },
    createdAt: '2026-09-15',
    nodes: [],
    edges: []
  },
  {
    id: 'funnel-downsell',
    name: 'Downsell Relâmpago 50% OFF (Objeção de Grana)',
    description: 'Acionado automaticamente pela IA quando o lead disser que está sem dinheiro para a oferta principal.',
    active: true,
    triggerType: 'meta_ads_keyword',
    triggerKeywords: ['DESCONTO', 'PARCELA'],
    stats: {
      started: 0,
      completed: 0,
      conversions: 0,
      conversionRate: 0
    },
    createdAt: '2026-09-20',
    nodes: [],
    edges: []
  }
];

export interface ToolBlockItem {
  type: string;
  title: string;
  category: string;
  desc: string;
  tooltip: string;
  icon: any;
  color: string;
  iconBg: string;
  defaultData: Record<string, any>;
}

export const TOOL_BLOCKS: ToolBlockItem[] = [
  {
    type: 'messageNode',
    title: 'Mensagem',
    category: 'Comunicação',
    desc: 'Texto formatado com delay humanizado e arquivos',
    tooltip: 'Envia mensagem de texto no WhatsApp com simulação de digitação e anexos (PDF, áudio).',
    icon: MessageSquare,
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/15 border border-sky-500/30',
    defaultData: {
      delay: '5s - 10s',
      text: 'Oi {{nome}}, tudo bem? Temos uma oportunidade única para você!',
      files: []
    }
  },
  {
    type: 'templateNode',
    title: 'Template WhatsApp',
    category: 'Comunicação',
    desc: 'Mensagem ativa HSM aprovada pela Meta',
    tooltip: 'Inicia conversas ou reativa clientes após 24h usando template oficial HSM.',
    icon: LayoutTemplate,
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/15 border border-sky-500/30',
    defaultData: {
      templateName: 'aviso_oferta_exclusiva'
    }
  },
  {
    type: 'tagNode',
    title: 'Etiquetas',
    category: 'Comunicação',
    desc: 'Adicionar ou remover etiquetas do contato',
    tooltip: 'Aplica tags ao lead para segmentação e automações.',
    icon: TagIcon,
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/15 border border-purple-500/30',
    defaultData: {
      tags: ['PARTE 1'],
      tag: 'PARTE 1'
    }
  },
  {
    type: 'pixButtonNode',
    title: 'Botão PIX',
    category: 'Financeiro',
    desc: 'Copia e Cola + QR Code Dinâmico com valor',
    tooltip: 'Gera e envia cobrança PIX imediata com chave e botão no WhatsApp.',
    icon: QrCode,
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border border-emerald-500/30',
    defaultData: {
      pixKey: '11999999999',
      pixReceiver: 'maria',
      amount: '97,00'
    }
  },
  {
    type: 'menuNode',
    title: 'Menu',
    category: 'Comunicação',
    desc: 'Menu de botões interativos WhatsApp',
    tooltip: 'Exibe botões clicáveis no WhatsApp; cada botão tem uma saída própria no fluxo.',
    icon: ListFilter,
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/15 border border-purple-500/30',
    defaultData: {
      menuButtons: ['Quero saber mais', 'Falar com atendente', 'Garantir desconto']
    }
  },
  {
    type: 'carouselNode',
    title: 'Carrossel',
    category: 'Comunicação',
    desc: 'Carrossel de produtos ou catálogo',
    tooltip: 'Exibe carrossel com imagens, títulos e botões para o lead navegar.',
    icon: LayoutGrid,
    color: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15 border border-cyan-500/30',
    defaultData: {
      carouselCards: [
        { title: 'Plano Básico', desc: 'Acesso às aulas gravadas' },
        { title: 'Plano VIP', desc: 'Aulas + Suporte individual 1 a 1' }
      ]
    }
  },
  {
    type: 'waitReplyNode',
    title: 'Aguarda Resposta',
    category: 'Fluxo',
    desc: 'Aguarda resposta ou executa timeout',
    tooltip: 'Pausa o fluxo até o cliente responder, ou desvia caso não responda no tempo limite.',
    icon: Clock,
    color: 'text-orange-400',
    iconBg: 'bg-orange-500/15 border border-orange-500/30',
    defaultData: {
      timeoutDuration: 'Após 35 minutos'
    }
  },
  {
    type: 'chatControllerNode',
    title: 'Controlador de Chat',
    category: 'Atendimento',
    desc: 'Pausa ou retoma o atendimento da IA',
    tooltip: 'Ativa ou desativa a IA no atendimento do lead, ou passa para atendente humano.',
    icon: Settings2,
    color: 'text-slate-300',
    iconBg: 'bg-slate-500/15 border border-slate-500/30',
    defaultData: {
      action: 'Atendimento (IA Ativa)'
    }
  },
  {
    type: 'notificationNode',
    title: 'Notificação',
    category: 'Atendimento',
    desc: 'Alerta para a equipe ou vendedor interno',
    tooltip: 'Envia notificação via WhatsApp/Telegram avisando sobre lead pronto para fechar.',
    icon: Bell,
    color: 'text-teal-400',
    iconBg: 'bg-teal-500/15 border border-teal-500/30',
    defaultData: {
      notificationMessage: 'Lead quente pronto para fechar! Assuma o chat.'
    }
  },
  {
    type: 'conditionNode',
    title: 'Condicional',
    category: 'Fluxo',
    desc: 'Desvios por tag, respostas ou regras',
    tooltip: 'Analisa variáveis ou palavras-chave e direciona para Sim ou Não.',
    icon: GitFork,
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/15 border border-sky-500/30',
    defaultData: {
      conditionText: 'Etiqueta igual PARTE 1'
    }
  },
  {
    type: 'distributorNode',
    title: 'Distribuidor',
    category: 'Fluxo',
    desc: 'Divide leads por probabilidade ou rodízio',
    tooltip: 'Distribui leads de forma ponderada entre múltiplos atendentes ou caminhos.',
    icon: Users,
    color: 'text-amber-400',
    iconBg: 'bg-amber-500/15 border border-amber-500/30',
    defaultData: {
      outputs: [
        { label: 'Saída 1', count: 10 },
        { label: 'Saída 2', count: 10 }
      ]
    }
  },
  {
    type: 'flowConnectionNode',
    title: 'Conexão de Fluxo',
    category: 'Fluxo',
    desc: 'Conecta e transfere para outro funil',
    tooltip: 'Encaminha o lead para outro funil do sistema de forma fluida.',
    icon: Share2,
    color: 'text-pink-400',
    iconBg: 'bg-pink-500/15 border border-pink-500/30',
    defaultData: {
      targetFunnelName: 'Recuperação de Carrinho'
    }
  },
  {
    type: 'pixelNode',
    title: 'Pixel',
    category: 'Marketing',
    desc: 'Dispara evento Meta CAPI / Pixel',
    tooltip: 'Envia evento de conversão para o Facebook/Meta Conversions API.',
    icon: Target,
    color: 'text-yellow-400',
    iconBg: 'bg-yellow-500/15 border border-yellow-500/30',
    defaultData: {
      pixelEvent: 'Purchase',
      amount: '97,00'
    }
  },
  {
    type: 'smartDelayNode',
    title: 'Intervalo Inteligente',
    category: 'Fluxo',
    desc: 'Espera respeitando horário comercial',
    tooltip: 'Aguarda tempo determinado e só envia nos horários comerciais configurados.',
    icon: Timer,
    color: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15 border border-cyan-500/30',
    defaultData: {
      delay: '2 horas',
      smartDelayMode: 'Apenas em Horário Comercial (08h às 18h)'
    }
  },
  {
    type: 'departmentNode',
    title: 'Departamento',
    category: 'Atendimento',
    desc: 'Transfere para setor específico',
    tooltip: 'Transfere o atendimento para uma fila de setor (Vendas, Suporte, Financeiro).',
    icon: Building2,
    color: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15 border border-indigo-500/30',
    defaultData: {
      departmentName: 'Comercial / Vendas'
    }
  },
  {
    type: 'integrationNode',
    title: 'Integração',
    category: 'Integrações',
    desc: 'Dispara webhook HTTP externo',
    tooltip: 'Envia requisição POST/GET com dados do lead para qualquer sistema via Webhook.',
    icon: Globe,
    color: 'text-blue-400',
    iconBg: 'bg-blue-500/15 border border-blue-500/30',
    defaultData: {
      webhookUrl: 'https://webhook.site/whatspix-api'
    }
  },
  {
    type: 'aiBlockNode',
    title: 'Bloco de IA',
    category: 'Inteligência Artificial',
    desc: 'Executa prompt customizado de IA',
    tooltip: 'Processa a mensagem do lead com instrução de IA e salva resposta em variável.',
    icon: Bot,
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border border-emerald-500/30',
    defaultData: {
      goal: 'Classificar intenção de compra e resumo do lead'
    }
  },
  {
    type: 'aiAgentNode',
    title: 'Agente de IA',
    category: 'Inteligência Artificial',
    desc: 'Copiloto autônomo conversacional',
    tooltip: 'Agente autônomo com RAG e SPIN Selling que conduz o atendimento até o fechamento.',
    icon: Sparkles,
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/15 border border-purple-500/30',
    defaultData: {
      goal: 'Qualificação SPIN Selling & Fechamento'
    }
  },
  {
    type: 'kanbanNode',
    title: 'Kanban',
    category: 'Atendimento',
    desc: 'Move contato de etapa no CRM',
    tooltip: 'Altera a coluna do contato no quadro Kanban de vendas.',
    icon: Columns3,
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/15 border border-purple-500/30',
    defaultData: {
      kanbanStage: 'Em Negociação'
    }
  },
  {
    type: 'manipulatorNode',
    title: 'Manipulador',
    category: 'Fluxo',
    desc: 'Manipula variáveis e campos customizados',
    tooltip: 'Executa operações de cálculo, formatação ou gravação de variáveis no lead.',
    icon: Sliders,
    color: 'text-orange-400',
    iconBg: 'bg-orange-500/15 border border-orange-500/30',
    defaultData: {
      manipulatorExpr: "lead.etapa = 'checkout'"
    }
  },
  {
    type: 'approvedSaleNode',
    title: '$ Venda aprovada',
    category: 'Financeiro',
    desc: 'Registra conversão e métricas de ROI',
    tooltip: 'Marca a venda como concluída, calcula receita e dispara pós-venda.',
    icon: DollarSign,
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border border-emerald-500/30',
    defaultData: {
      amount: '197,00'
    }
  },
  {
    type: 'paymentNode',
    title: 'Pagamento',
    category: 'Financeiro',
    desc: 'Link de checkout multi-moeda',
    tooltip: 'Gera link de checkout para pagamento com Cartão, Boleto ou PIX.',
    icon: CreditCard,
    color: 'text-purple-400',
    iconBg: 'bg-purple-500/15 border border-purple-500/30',
    defaultData: {
      paymentGateway: 'Kiwify / Hotmart'
    }
  },
  {
    type: 'callNode',
    title: 'Ligar',
    category: 'Comunicação',
    desc: 'Faz ligação de WhatsApp pro lead',
    tooltip: 'Faz uma ligação WhatsApp pro lead. Toque 1-15s; com áudio, soma a duração do arquivo',
    icon: PhoneCall,
    color: 'text-teal-400',
    iconBg: 'bg-teal-500/15 border border-teal-500/30',
    defaultData: {
      callDuration: '10s'
    }
  },
  {
    type: 'audioNode',
    title: 'Áudio WhatsApp (IA)',
    category: 'Comunicação',
    desc: 'Voz humana Fish Audio PTT',
    tooltip: 'Envia áudio nativo gravado como PTT gerado por IA com tom humanizado.',
    icon: Mic,
    color: 'text-fuchsia-400',
    iconBg: 'bg-fuchsia-500/15 border border-fuchsia-500/30',
    defaultData: {
      delay: '8s',
      audioDuration: '0:28',
      voiceModel: 'fish-audio/s2.1-pro-free:free',
      audioScript: 'Oi {{nome}}, passando rapidinho para te explicar como funciona na prática...'
    }
  },
  {
    type: 'ocrNode',
    title: 'Validador OCR',
    category: 'Financeiro',
    desc: 'Validação de comprovante bancário',
    tooltip: 'Analisa comprovante de transferência PIX e detecta fraudes de agendamento.',
    icon: FileCheck2,
    color: 'text-teal-400',
    iconBg: 'bg-teal-500/15 border border-teal-500/30',
    defaultData: {}
  }
];

// Initial nodes for Template Low Ticket
const initialLowTicketNodes: Node[] = [
  {
    id: 'node-start',
    type: 'startNode',
    position: { x: 80, y: 340 },
    data: { label: 'Início' }
  },
  {
    id: 'node-ctrl-1',
    type: 'chatControllerNode',
    position: { x: 300, y: 340 },
    data: { action: 'Atendimento (IA Ativa)' }
  },
  {
    id: 'node-cond-1',
    type: 'conditionNode',
    position: { x: 570, y: 340 },
    data: {
      conditionText: 'Etiqueta igual Compra'
    }
  },
  {
    id: 'node-tag-1',
    type: 'tagNode',
    position: { x: 700, y: 560 },
    data: { tag: 'Lead_Interessado' }
  },
  {
    id: 'node-dist-1',
    type: 'distributorNode',
    position: { x: 990, y: 480 },
    data: {
      outputs: [
        { label: 'Saída 1', count: 11 },
        { label: 'Saída 2', count: 12 },
        { label: 'Saída 3', count: 11 },
        { label: 'Saída 4', count: 10 },
        { label: 'Saída 5', count: 10 }
      ]
    }
  },
  {
    id: 'node-cond-2',
    type: 'conditionNode',
    position: { x: 900, y: 170 },
    data: {
      conditionText: 'Etiqueta igual checkout_iniciado ou checkout_promocao'
    }
  },
  {
    id: 'node-msg-1',
    type: 'messageNode',
    position: { x: 1240, y: 200 },
    data: {
      delay: '9s',
      text: 'Oi meu amor, a Vó ainda está segurando suas vagas promocionais...'
    }
  },
  {
    id: 'node-msg-2',
    type: 'messageNode',
    position: { x: 1300, y: 400 },
    data: {
      delay: '5s',
      text: 'Olha só, preparei um super desconto no PIX para você entrar hoje!'
    }
  },
  {
    id: 'node-msg-3',
    type: 'messageNode',
    position: { x: 1300, y: 540 },
    data: {
      delay: '0s',
      text: 'O acesso à plataforma com todos os bônus é vitalício e você tem 7 dias de garantia.'
    }
  },
  {
    id: 'node-msg-4',
    type: 'messageNode',
    position: { x: 1300, y: 680 },
    data: {
      delay: '12s',
      text: 'Me responde aqui: você prefere pagar no PIX à vista ou no cartão?'
    }
  },
  {
    id: 'node-dist-2',
    type: 'distributorNode',
    position: { x: 1640, y: 440 },
    data: {
      outputs: [
        { label: 'Saída 1', count: 18 },
        { label: 'Saída 2', count: 15 },
        { label: 'Saída 3', count: 17 }
      ]
    }
  },
  {
    id: 'node-ai-1',
    type: 'aiAgentNode',
    position: { x: 1960, y: 440 },
    data: {
      goal: 'Qualificar o lead pelo método SPIN e apresentar a oferta de R$ 97'
    }
  },
  {
    id: 'node-pix-1',
    type: 'pixNode',
    position: { x: 2280, y: 440 },
    data: {
      amount: '97,00'
    }
  },
  {
    id: 'node-ocr-1',
    type: 'ocrNode',
    position: { x: 2580, y: 440 },
    data: {}
  }
];

const initialLowTicketEdges: Edge[] = [
  {
    id: 'e-start-ctrl',
    source: 'node-start',
    target: 'node-ctrl-1',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 }
  },
  {
    id: 'e-ctrl-cond1',
    source: 'node-ctrl-1',
    target: 'node-cond-1',
    style: { stroke: '#64748b', strokeWidth: 2 }
  },
  {
    id: 'e-cond1-tag',
    source: 'node-cond-1',
    sourceHandle: 'false',
    target: 'node-tag-1',
    style: { strokeDasharray: '5,5', stroke: '#0284c7', strokeWidth: 2 }
  },
  {
    id: 'e-cond1-cond2',
    source: 'node-cond-1',
    sourceHandle: 'true',
    target: 'node-cond-2',
    style: { stroke: '#0284c7', strokeWidth: 2 }
  },
  {
    id: 'e-tag-dist1',
    source: 'node-tag-1',
    target: 'node-dist-1',
    style: { stroke: '#7c3aed', strokeWidth: 2 }
  },
  {
    id: 'e-cond2-msg1',
    source: 'node-cond-2',
    sourceHandle: 'true',
    target: 'node-msg-1',
    style: { stroke: '#0284c7', strokeWidth: 2 }
  },
  {
    id: 'e-dist1-msg2',
    source: 'node-dist-1',
    sourceHandle: 'out-0',
    target: 'node-msg-2',
    style: { stroke: '#d97706', strokeWidth: 2 }
  },
  {
    id: 'e-dist1-msg3',
    source: 'node-dist-1',
    sourceHandle: 'out-1',
    target: 'node-msg-3',
    style: { stroke: '#d97706', strokeWidth: 2 }
  },
  {
    id: 'e-dist1-msg4',
    source: 'node-dist-1',
    sourceHandle: 'out-2',
    target: 'node-msg-4',
    style: { stroke: '#d97706', strokeWidth: 2 }
  },
  {
    id: 'e-msg2-dist2',
    source: 'node-msg-2',
    target: 'node-dist-2',
    style: { stroke: '#2563eb', strokeWidth: 2 }
  },
  {
    id: 'e-dist2-ai',
    source: 'node-dist-2',
    sourceHandle: 'out-0',
    target: 'node-ai-1',
    animated: true,
    style: { stroke: '#d97706', strokeWidth: 2 }
  },
  {
    id: 'e-ai-pix',
    source: 'node-ai-1',
    target: 'node-pix-1',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 }
  },
  {
    id: 'e-pix-ocr',
    source: 'node-pix-1',
    target: 'node-ocr-1',
    style: { stroke: '#b45309', strokeWidth: 2 }
  }
];

const LOCAL_STORAGE_FUNNELS_KEY = 'whatspix_sales_funnels_v1';
const LOCAL_STORAGE_ACTIVE_ID_KEY = 'whatspix_active_funnel_id_v1';

const sanitizeForLocalStorage = (funnelsList: SalesFunnel[]): any[] => {
  return funnelsList.map((f) => ({
    ...f,
    nodes: (f.nodes || []).map((n) => {
      if (
        n.data?.audioUrl &&
        typeof n.data.audioUrl === 'string' &&
        n.data.audioUrl.startsWith('data:audio') &&
        n.data.audioUrl.length > 500
      ) {
        return {
          ...n,
          data: {
            ...n.data,
            audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'
          }
        };
      }
      return n;
    })
  }));
};

const saveFunnelsLocally = (funnelsList: SalesFunnel[], activeId?: string) => {
  try {
    const sanitized = sanitizeForLocalStorage(funnelsList);
    localStorage.setItem(LOCAL_STORAGE_FUNNELS_KEY, JSON.stringify(sanitized));
    if (activeId) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, activeId);
    }
  } catch (err) {
    console.warn('LocalStorage cota excedida, otimizando cache local para funis recentes:', err);
    try {
      const sanitized = sanitizeForLocalStorage(funnelsList.slice(0, 3));
      localStorage.setItem(LOCAL_STORAGE_FUNNELS_KEY, JSON.stringify(sanitized));
      if (activeId) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, activeId);
      }
    } catch (e2) {
      console.warn('Persistência no navegador ignorada por limite de cota; funis continuam salvos no servidor e nuvem.', e2);
    }
  }
};

const getLocalFunnels = (): { funnels: SalesFunnel[] | null; activeId: string | null } => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FUNNELS_KEY);
    const activeId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { funnels: parsed, activeId };
      }
    }
  } catch (err) {
    console.warn('Erro ao ler funis do localStorage:', err);
  }
  return { funnels: null, activeId: null };
};

export const FlowBuilder: React.FC = () => {
  const localInitial = getLocalFunnels();

  // Navigation between List view and Builder Canvas view
  const [viewMode, setViewMode] = useState<'list' | 'builder'>('builder');

  // Funnels List state
  const [funnels, setFunnels] = useState<SalesFunnel[]>(
    localInitial.funnels && localInitial.funnels.length > 0 ? localInitial.funnels : defaultFunnels
  );
  const [activeFunnelId, setActiveFunnelId] = useState<string>(
    localInitial.activeId ||
      (localInitial.funnels && localInitial.funnels[0]?.id) ||
      'funnel-low-ticket'
  );

  const initialActiveFunnel =
    (localInitial.funnels &&
      localInitial.funnels.find(
        (f) => f.id === (localInitial.activeId || localInitial.funnels![0]?.id)
      )) ||
    null;

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialActiveFunnel && initialActiveFunnel.nodes && initialActiveFunnel.nodes.length > 0
      ? (initialActiveFunnel.nodes as any)
      : initialLowTicketNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialActiveFunnel && initialActiveFunnel.edges
      ? (initialActiveFunnel.edges as any)
      : initialLowTicketEdges
  );

  // Selected Node for Interactive Configuration Drawer
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  // Drawers & Modals
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [toolsSearchTerm, setToolsSearchTerm] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProductName, setAiProductName] = useState('');
  const [aiPrice, setAiPrice] = useState('97,00');
  const [aiDownsell, setAiDownsell] = useState('47,00');
  const [aiIncludeVoice, setAiIncludeVoice] = useState(true);
  const [aiVoiceModel, setAiVoiceModel] = useState('fish-audio/s2.1-pro-free:free');
  const [aiStrategy, setAiStrategy] = useState('low_ticket');
  const [aiComplexity, setAiComplexity] = useState<'basic' | 'advanced' | 'enterprise'>('enterprise');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null);

  // AI Maintenance state
  const [aiModalTab, setAiModalTab] = useState<'create' | 'maintain'>('create');
  const [aiMaintainInstruction, setAiMaintainInstruction] = useState('');
  const [isMaintaining, setIsMaintaining] = useState(false);
  const [aiMaintainSuccess, setAiMaintainSuccess] = useState<string | null>(null);

  // Copilot Chat Drawer state (Estilo Fio de Conversa WhatsPix / NVIDIA NIM GLM 5.3)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<AiCopilotMessage[]>([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [copilotThinkingStep, setCopilotThinkingStep] = useState(0);
  const [expandedReasoningMap, setExpandedReasoningMap] = useState<Record<string, boolean>>({});
  const [expandedActionsMap, setExpandedActionsMap] = useState<Record<string, boolean>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const reactFlowInstance = useRef<any>(null);
  const copilotEndRef = useRef<HTMLDivElement | null>(null);

  // Simulator chat
  const [simulatorChat, setSimulatorChat] = useState<Array<{
    sender: 'lead' | 'bot';
    text: string;
    isAudio?: boolean;
    audioUrl?: string;
    audioDuration?: string;
    isPix?: boolean;
    pixCode?: string;
    pixAmount?: string;
    isOcr?: boolean;
  }>>([]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [isSimulatorThinking, setIsSimulatorThinking] = useState(false);
  const [copiedPixCode, setCopiedPixCode] = useState(false);
  const [simPlayingAudioUrl, setSimPlayingAudioUrl] = useState<string | null>(null);
  const simAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio drawer synthesis & player state
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [drawerAudio, setDrawerAudio] = useState<HTMLAudioElement | null>(null);
  const [isDrawerAudioPlaying, setIsDrawerAudioPlaying] = useState(false);

  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) || funnels[0] || {
    id: 'funnel-01',
    name: 'Funil Perpétuo X1',
    description: 'Funil principal de conversão',
    active: true,
    triggerType: 'meta_ads_keyword',
    stats: { started: 0, conversions: 0, conversionRate: 0 },
    nodes: [],
    edges: []
  };

  useEffect(() => {
    loadFunnels();
  }, []);

  const loadFunnels = async () => {
    // 1. Carrega imediatamente do localStorage para inicialização instantânea
    const local = getLocalFunnels();
    if (local.funnels && local.funnels.length > 0) {
      setFunnels(local.funnels);
      const targetId = local.activeId || activeFunnelId;
      const target = local.funnels.find((f) => f.id === targetId) || local.funnels[0];
      if (target && target.nodes && target.nodes.length > 0) {
        setActiveFunnelId(target.id);
        setNodes(target.nodes as any);
        setEdges((target.edges || []) as any);
      }
    }

    // 2. Sincroniza com a API do servidor (com persistência em data/funnels.json no disco)
    try {
      const serverFunnels = await api.getFunnels();
      if (serverFunnels && serverFunnels.length > 0) {
        const serverIds = new Set(serverFunnels.map((f) => f.id));
        const merged = [...serverFunnels];

        if (local.funnels) {
          for (const lf of local.funnels) {
            if (!serverIds.has(lf.id)) {
              merged.push(lf);
              api.createFunnel(lf).catch(() => {});
            }
          }
        }

        setFunnels(merged);
        saveFunnelsLocally(merged);

        const currentActiveId = local.activeId || activeFunnelId;
        const current = merged.find((f) => f.id === currentActiveId) || merged[0];
        if (current && current.nodes && current.nodes.length > 0) {
          setActiveFunnelId(current.id);
          setNodes(current.nodes as any);
          setEdges((current.edges || []) as any);
        }
      } else if (local.funnels && local.funnels.length > 0) {
        for (const lf of local.funnels) {
          api.createFunnel(lf).catch(() => {});
        }
      } else {
        const initial = defaultFunnels.map((f) =>
          f.id === 'funnel-low-ticket' && (!f.nodes || f.nodes.length === 0)
            ? { ...f, nodes: initialLowTicketNodes as any, edges: initialLowTicketEdges as any }
            : f
        );
        setFunnels(initial);
        saveFunnelsLocally(initial, 'funnel-low-ticket');
      }
    } catch (err) {
      console.error('Erro ao carregar funis da API:', err);
    }
  };

  const handleSelectPreset = (strat: string) => {
    setAiStrategy(strat);
    if (strat === 'low_ticket') {
      setAiProductName('Curso de Canva & Criativos Pro');
      setAiPrice('97,00');
      setAiDownsell('47,00');
      setAiPrompt('Funil Low Ticket para infoproduto de R$ 97 com abordagem empática de boas-vindas, áudio explicativo de 25s, quebra de objeção e oferta de downsell de R$ 47 no PIX caso o lead ache caro.');
      setAiIncludeVoice(true);
    } else if (strat === 'recovery') {
      setAiProductName('Recuperação de Carrinho Abandonado');
      setAiPrice('197,00');
      setAiDownsell('97,00');
      setAiPrompt('Disparado automaticamente via webhook de checkout abandonado na Kiwify/Hotmart com áudio de oportunidade secreta, 50% de desconto relâmpago e link PIX com urgência.');
      setAiIncludeVoice(true);
    } else if (strat === 'high_ticket') {
      setAiProductName('Mentoria VIP Individual');
      setAiPrice('997,00');
      setAiDownsell('497,00');
      setAiPrompt('Funil de qualificação profunda com triagem de faturamento e nicho, áudio de autoridade do mentor e agendamento ou PIX.');
      setAiIncludeVoice(true);
    } else if (strat === 'launch') {
      setAiProductName('Lançamento Meteórico WhatsApp');
      setAiPrice('147,00');
      setAiDownsell('67,00');
      setAiPrompt('Sequência de antecipação com aviso de abertura de turma, áudio nos últimos 30 minutos de oferta e fechamento com PIX.');
      setAiIncludeVoice(true);
    }
  };

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed }
          },
          eds
        )
      ),
    [setEdges]
  );

  // Abre drawer de configuração ao clicar com botão esquerdo ou direito em qualquer nó
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setEditingNode(node);
  };

  const handleNodeContextMenu = (e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    setEditingNode(node);
  };

  const handleSaveNodeConfig = (updatedData: Record<string, any>) => {
    if (!editingNode) return;
    const newNodes = nodes.map((n) =>
      n.id === editingNode.id ? { ...n, data: { ...n.data, ...updatedData } } : n
    );
    setNodes(newNodes);
    setEditingNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...updatedData } } : null));

    const updatedFunnels = funnels.map((f) =>
      f.id === activeFunnelId ? { ...f, nodes: newNodes as any, edges: edges as any } : f
    );
    setFunnels(updatedFunnels);
    saveFunnelsLocally(updatedFunnels, activeFunnelId);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteNode = (nodeId: string) => {
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    setNodes(newNodes);
    setEdges(newEdges);
    setEditingNode(null);

    const updatedFunnels = funnels.map((f) =>
      f.id === activeFunnelId ? { ...f, nodes: newNodes as any, edges: newEdges as any } : f
    );
    setFunnels(updatedFunnels);
    saveFunnelsLocally(updatedFunnels, activeFunnelId);
  };

  const handleDuplicateNode = (node: Node) => {
    const newId = `node-${Date.now()}`;
    const duplicatedNode: Node = {
      ...node,
      id: newId,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: { ...node.data }
    };
    const newNodes = [...nodes, duplicatedNode];
    setNodes(newNodes);
    setEditingNode(duplicatedNode);

    const updatedFunnels = funnels.map((f) =>
      f.id === activeFunnelId ? { ...f, nodes: newNodes as any, edges: edges as any } : f
    );
    setFunnels(updatedFunnels);
    saveFunnelsLocally(updatedFunnels, activeFunnelId);
  };

  const handleAddNode = (type: string, defaultData: any) => {
    const id = `node-${Date.now()}`;
    const offset = (nodes.length % 6) * 35;
    const newNode: Node = {
      id,
      type,
      position: { x: 480 + offset, y: 320 + offset },
      data: defaultData
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setIsToolsOpen(false);
    setEditingNode(newNode);

    const updatedFunnels = funnels.map((f) =>
      f.id === activeFunnelId ? { ...f, nodes: newNodes as any, edges: edges as any } : f
    );
    setFunnels(updatedFunnels);
    saveFunnelsLocally(updatedFunnels, activeFunnelId);
  };

  const handleToggleActiveFunnel = () => {
    const updatedFunnels = funnels.map((f) =>
      f.id === activeFunnelId ? { ...f, active: !f.active } : f
    );
    setFunnels(updatedFunnels);
    saveFunnelsLocally(updatedFunnels, activeFunnelId);
    const current = updatedFunnels.find((f) => f.id === activeFunnelId);
    if (current) {
      api.updateFunnel(current.id, { active: current.active }).catch(() => {});
    }
  };

  const handleOpenFunnel = (funnel: SalesFunnel) => {
    setActiveFunnelId(funnel.id);
    if (funnel.nodes && funnel.nodes.length > 0) {
      setNodes(funnel.nodes as any);
      setEdges((funnel.edges || []) as any);
    }
    saveFunnelsLocally(funnels, funnel.id);
    setViewMode('builder');
  };

  const handleSaveFlow = async () => {
    try {
      const current = funnels.find((f) => f.id === activeFunnelId) || activeFunnel;
      const updatedFunnel: SalesFunnel = {
        ...current,
        id: activeFunnelId,
        nodes: nodes as any,
        edges: edges as any
      };

      const updatedFunnels = funnels.map((f) =>
        f.id === activeFunnelId ? updatedFunnel : f
      );
      if (!updatedFunnels.some((f) => f.id === activeFunnelId)) {
        updatedFunnels.unshift(updatedFunnel);
      }

      setFunnels(updatedFunnels);
      saveFunnelsLocally(updatedFunnels, activeFunnelId);

      // Persiste no servidor (grava em data/funnels.json no disco)
      await api.updateFunnel(activeFunnelId, updatedFunnel);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.warn('Erro ao salvar no servidor:', err);
      const current = funnels.find((f) => f.id === activeFunnelId) || activeFunnel;
      const updatedFunnel: SalesFunnel = {
        ...current,
        id: activeFunnelId,
        nodes: nodes as any,
        edges: edges as any
      };
      const updatedFunnels = funnels.map((f) =>
        f.id === activeFunnelId ? updatedFunnel : f
      );
      setFunnels(updatedFunnels);
      saveFunnelsLocally(updatedFunnels, activeFunnelId);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPixCode(true);
    setTimeout(() => setCopiedPixCode(false), 2000);
  };

  const handlePlayDrawerAudio = (audioUrl: string) => {
    if (isDrawerAudioPlaying) {
      drawerAudio?.pause();
      setIsDrawerAudioPlaying(false);
      return;
    }
    const safeUrl = ensurePlayableAudioUrl(audioUrl);
    if (drawerAudio) {
      drawerAudio.pause();
    }
    const audio = new Audio(safeUrl);
    setDrawerAudio(audio);
    audio
      .play()
      .then(() => setIsDrawerAudioPlaying(true))
      .catch((err) => {
        console.warn('Erro ao tocar áudio no drawer:', err);
        setIsDrawerAudioPlaying(false);
      });
    audio.onended = () => setIsDrawerAudioPlaying(false);
    audio.onerror = (err) => {
      console.warn('Erro no elemento de áudio do drawer:', err);
      setIsDrawerAudioPlaying(false);
    };
  };

  const handleSynthesizeNodeAudio = async (nodeId: string, text: string, voiceModel?: string) => {
    if (!text.trim()) return;
    setIsSynthesizingVoice(true);
    try {
      const res = await api.synthesizeVoice(text, voiceModel || 'fish-audio/s2.1-pro-free:free');
      if (res && res.audioUrl) {
        const mins = Math.floor((res.durationSeconds || 15) / 60);
        const secs = (res.durationSeconds || 15) % 60;
        const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        handleSaveNodeConfig({
          audioUrl: res.audioUrl,
          audioDuration: formatted
        });

        handlePlayDrawerAudio(res.audioUrl);
      }
    } catch (err) {
      console.error('Erro ao sintetizar áudio:', err);
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  const handleToggleSimAudio = (audioUrl: string) => {
    if (simPlayingAudioUrl === audioUrl) {
      simAudioRef.current?.pause();
      setSimPlayingAudioUrl(null);
      return;
    }

    if (simAudioRef.current) {
      simAudioRef.current.pause();
    }

    const safeUrl = ensurePlayableAudioUrl(audioUrl);
    const audio = new Audio(safeUrl);
    simAudioRef.current = audio;
    audio
      .play()
      .then(() => setSimPlayingAudioUrl(audioUrl))
      .catch((err) => {
        console.warn('Erro ao tocar áudio no simulador:', err);
        setSimPlayingAudioUrl(null);
      });
    audio.onended = () => setSimPlayingAudioUrl(null);
    audio.onerror = (err) => {
      console.warn('Erro no elemento de áudio do simulador:', err);
      setSimPlayingAudioUrl(null);
    };
  };

  const initializeSimulator = () => {
    const funnel = activeFunnel;
    const currentNodes = nodes.length > 0 ? nodes : (funnel.nodes || []);

    const msgNode = currentNodes.find((n) => n.type === 'messageNode');
    const audioNode = currentNodes.find((n) => n.type === 'audioNode');
    const pixNode = currentNodes.find((n) => n.type === 'pixNode');

    const prodName = funnel.name.replace(/^(Funil\s+)?(Perpétuo\s+)?/i, '').trim() || 'Infoproduto Exclusivo';
    const mainPrice = (pixNode?.data?.amount as string) || '97,00';

    let initialWelcome = (msgNode?.data?.text as string) || `Olá {{nome}}! Vi que você se interessou pelo ${prodName}. Você já tem experiência com o tema ou está começando agora?`;
    initialWelcome = initialWelcome
      .replace(/\{\{nome\}\}/g, 'Alexandre')
      .replace(/\{\{produto\}\}/g, prodName)
      .replace(/\{\{valor\}\}/g, mainPrice)
      .replace(/\{Oi\|Olá\|Opa\}/g, 'Olá');

    const initialMessages: Array<{
      sender: 'lead' | 'bot';
      text: string;
      isAudio?: boolean;
      audioUrl?: string;
      audioDuration?: string;
      isPix?: boolean;
      pixCode?: string;
      pixAmount?: string;
      isOcr?: boolean;
    }> = [
      {
        sender: 'bot',
        text: initialWelcome
      }
    ];

    if (audioNode) {
      const script = ((audioNode.data?.audioScript || audioNode.data?.text || `Oi Alexandre! Passando em áudio rapidinho para te explicar como funciona o ${prodName}...`) as string)
        .replace(/\{\{nome\}\}/g, 'Alexandre')
        .replace(/\{\{produto\}\}/g, prodName);

      initialMessages.push({
        sender: 'bot',
        text: `🎙️ Mensagem de Áudio WhatsApp PTT (${audioNode.data?.audioDuration || '0:28'})\n"${script}"`,
        isAudio: true,
        audioUrl: (audioNode.data?.audioUrl as string) || 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg',
        audioDuration: (audioNode.data?.audioDuration as string) || '0:28'
      });
    }

    setSimulatorChat(initialMessages);
  };

  const handleToggleSimulator = () => {
    if (!isSimulatorOpen) {
      initializeSimulator();
    } else {
      if (simAudioRef.current) simAudioRef.current.pause();
      setSimPlayingAudioUrl(null);
    }
    setIsSimulatorOpen(!isSimulatorOpen);
  };

  const handleSimulatorSend = (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const userText = directText || simulatorInput;
    if (!userText.trim()) return;

    setSimulatorInput('');
    setSimulatorChat((prev) => [...prev, { sender: 'lead', text: userText }]);

    const lower = userText.toLowerCase();
    const funnel = activeFunnel;
    const currentNodes = nodes.length > 0 ? nodes : (funnel.nodes || []);

    const prodName = funnel.name.replace(/^(Funil\s+)?(Perpétuo\s+)?/i, '').trim() || 'Infoproduto Exclusivo';
    const pixNodes = currentNodes.filter((n) => n.type === 'pixNode');
    const msgNodes = currentNodes.filter((n) => n.type === 'messageNode');
    const mainPrice = (pixNodes[0]?.data?.amount as string) || '97,00';
    const downsellPrice = (pixNodes[1]?.data?.amount as string) || '47,00';

    setIsSimulatorThinking(true);

    setTimeout(async () => {
      setIsSimulatorThinking(false);

      // CASO 1: Objeção de Preço / Downsell
      if (
        lower.includes('caro') ||
        lower.includes('dinheiro') ||
        lower.includes('desconto') ||
        lower.includes('não posso') ||
        lower.includes('menos') ||
        lower.includes('parcelar')
      ) {
        let downsellReply =
          (msgNodes[1]?.data?.text as string) ||
          `Entendo perfeitamente, Alexandre! Para você não ficar de fora da turma do ${prodName}, consegui liberar uma condição especial de downsell: de R$ ${mainPrice} por apenas R$ ${downsellPrice} no PIX à vista!`;
        downsellReply = downsellReply
          .replace(/\{\{nome\}\}/g, 'Alexandre')
          .replace(/\{\{produto\}\}/g, prodName)
          .replace(/\{\{valor\}\}/g, downsellPrice)
          .replace(/\{Oi\|Olá\|Opa\}/g, 'Olá');

        const downsellPixCode = `00020126580014br.gov.bcb.pix0136whatspix-downsell@whatspix.ia5204000053039865406${downsellPrice.replace(',', '.')}.005802BR5925WHATSTEC`;

        setSimulatorChat((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `${downsellReply}\n\n👇 *Chave PIX Oferta Especial Downsell:*\n\`${downsellPixCode}\`\n\n💰 *Valor Exclusivo:* R$ ${downsellPrice}`,
            isPix: true,
            pixCode: downsellPixCode,
            pixAmount: downsellPrice
          }
        ]);
        return;
      }

      // CASO 2: Intenção de Compra / Pedido de PIX
      if (
        lower.includes('quero') ||
        lower.includes('sim') ||
        lower.includes('comprar') ||
        lower.includes('pix') ||
        lower.includes('pagar') ||
        lower.includes('link') ||
        lower.includes('manda') ||
        lower.includes('fechar') ||
        lower.includes('vaga')
      ) {
        const pixCode = `00020126580014br.gov.bcb.pix0136whatspix-pay@whatspix.ia5204000053039865406${mainPrice.replace(',', '.')}.005802BR5925WHATSTEC`;

        setSimulatorChat((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Perfeito, Alexandre! Segue seu código PIX Copia e Cola para liberação imediata do **${prodName}**:\n\n\`${pixCode}\`\n\n💰 *Valor:* R$ ${mainPrice}\n\n📌 *Instruções:* Copie o código, efetue o pagamento no aplicativo do seu banco e me envie o comprovante por aqui para liberação automática das aulas e materiais!`,
            isPix: true,
            pixCode,
            pixAmount: mainPrice
          }
        ]);
        return;
      }

      // CASO 3: Envio de Comprovante (Validação OCR)
      if (
        lower.includes('paguei') ||
        lower.includes('comprovante') ||
        lower.includes('transferi') ||
        lower.includes('já paguei') ||
        lower.includes('feito') ||
        lower.includes('print')
      ) {
        setSimulatorChat((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `🔍 *Analisando comprovante bancário com Leitor Inteligente OCR...*\n\n✅ **Comprovante Validado com Sucesso!**\n- Autenticação: 9E4A.7721.CD81.028B (Banco Central)\n- Valor: R$ ${mainPrice}\n- Status: Transferência PIX Concluída (Sem agendamento fraudulento)\n\n🚀 Parabéns, Alexandre! Seu acesso ao **${prodName}** foi ativado imediatamente e enviado no seu e-mail e WhatsApp!`,
            isOcr: true
          }
        ]);
        return;
      }

      // CASO 4: Dúvidas / Copiloto IA (Consulta ao modelo NVIDIA ativo com o contexto do funil)
      try {
        const res = await api.simulateAiMessage(
          userText,
          'Alexandre',
          parseFloat(mainPrice.replace(',', '.')) || 97.0
        );

        if (res && res.response && res.response.replyText) {
          setSimulatorChat((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: res.response.replyText
            }
          ]);
        } else {
          setSimulatorChat((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: `Com certeza, Alexandre! O ${prodName} conta com garantia total de 7 dias e suporte direto no WhatsApp para tirar todas as suas dúvidas. Se quiser garantir sua vaga com desconto de R$ ${mainPrice}, só me avisar que gero o código PIX agora!`
            }
          ]);
        }
      } catch (err) {
        setSimulatorChat((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: `Com certeza, Alexandre! O ${prodName} conta com garantia incondicional de 7 dias e suporte exclusivo. Quer que eu gere a chave PIX promocional de R$ ${mainPrice} para você?`
          }
        ]);
      }
    }, 600);
  };

  const handleGenerateFunnelAi = async () => {
    if (!aiPrompt.trim() && !aiProductName.trim()) return;
    setIsGenerating(true);
    setAiGenerateError(null);
    try {
      const generated = await api.generateFunnelWithAi({
        prompt: aiPrompt.trim() || (aiProductName.trim() ? `Funil de vendas para ${aiProductName.trim()}` : ''),
        productName: aiProductName.trim() || undefined,
        price: aiPrice,
        downsellPrice: aiDownsell,
        includeVoice: aiIncludeVoice,
        voiceModel: aiVoiceModel,
        strategy: aiStrategy,
        complexity: aiComplexity
      });

      if (!generated || !generated.id) {
        throw new Error('Servidor retornou resposta inválida ao gerar funil.');
      }

      const updatedList = [generated, ...funnels.filter((f) => f.id !== generated.id)];
      setFunnels(updatedList);
      setActiveFunnelId(generated.id);
      if (generated.nodes && generated.nodes.length > 0) {
        setNodes(generated.nodes as any);
        setEdges((generated.edges || []) as any);
      }
      saveFunnelsLocally(updatedList, generated.id);
      setIsAiModalOpen(false);
      setViewMode('builder');
    } catch (err: any) {
      console.error('Erro ao gerar funil com IA:', err);
      setAiGenerateError(err?.message || 'Falha na conexão com a API de IA. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMaintainFunnelAi = async () => {
    if (!aiMaintainInstruction.trim() || !activeFunnel.id) return;
    setIsMaintaining(true);
    setAiGenerateError(null);
    setAiMaintainSuccess(null);
    try {
      const updated = await api.maintainFunnelWithAi(
        activeFunnel.id,
        aiMaintainInstruction,
        aiVoiceModel
      );

      if (!updated || !updated.id) {
        throw new Error('Servidor retornou resposta inválida ao realizar manutenção do funil.');
      }

      const updatedList = funnels.map((f) => (f.id === updated.id ? updated : f));
      setFunnels(updatedList);
      if (updated.nodes && updated.nodes.length > 0) {
        setNodes(updated.nodes as any);
        setEdges((updated.edges || []) as any);
      }
      saveFunnelsLocally(updatedList, updated.id);

      const aiMeta = updated.aiMeta;
      const userMsg: AiCopilotMessage = {
        id: 'user-' + Date.now(),
        sender: 'user',
        text: aiMaintainInstruction,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      const assistantMsg: AiCopilotMessage = {
        id: 'assistant-' + Date.now(),
        sender: 'assistant',
        text: aiMeta?.explanation || 'Funil e variáveis atualizados com sucesso pela IA!',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        reasoning: aiMeta?.reasoning,
        changelog: aiMeta?.changelog || [],
        explanation: aiMeta?.explanation,
        model: aiMeta?.model || 'NVIDIA NIM • Z.ai GLM 5.3 (753B MoE)',
        modifiedNodeIds: aiMeta?.modifiedNodeIds || [],
        addedNodeIds: aiMeta?.addedNodeIds || []
      };
      setCopilotMessages((prev) => [...prev, userMsg, assistantMsg]);
      setExpandedReasoningMap((prev) => ({ ...prev, [assistantMsg.id]: true }));
      setExpandedActionsMap((prev) => ({ ...prev, [assistantMsg.id]: true }));

      setAiMaintainSuccess('Funil e variáveis atualizados com sucesso pela IA!');
      setTimeout(() => {
        setIsAiModalOpen(false);
        setAiMaintainSuccess(null);
        setAiMaintainInstruction('');
      }, 1400);
    } catch (err: any) {
      console.error('Erro na manutenção com IA:', err);
      setAiGenerateError(err?.message || 'Falha ao aplicar manutenção com IA. Tente novamente.');
    } finally {
      setIsMaintaining(false);
    }
  };

  // =========================================================================
  // COPILOTO IA CHAT DRAWER (NVIDIA NIM • Z.ai GLM 5.3 753B MoE)
  // =========================================================================
  const copilotThinkingSteps = [
    '1. Analisando estrutura do grafo e blocos existentes...',
    '2. Raciocinando lógica de conversão com Z.ai GLM 5.3 (753B MoE)...',
    '3. Planejando novas conexões, handles e mensagens...',
    '4. Aplicando alterações em tempo real no canvas...'
  ];

  const quickCopilotSuggestions = [
    '👑 Transformar em Funil Enterprise Completo (Padrão Leona 26 nós com Distribuidor, OCR e Esperas)',
    '🚦 Adicionar Distribuidor A/B de Tráfego com 4 Saídas',
    '🧾 Conectar Validador OCR de Comprovante Bancário após o PIX',
    '⏱️ Criar Régua de Espera em 3 Camadas (30 min, 1 dia, 3 dias)',
    '🔔 Adicionar Notificação ao Atendente e Agente de IA para Fechamento',
    'Montar boas-vindas com menu de opções',
    'Adicionar cobrança PIX depois da escolha do plano',
    'Reorganizar o canvas e ligar os caminhos que faltam',
    'Adicionar áudio humanizado (Fish Audio) antes da oferta',
    'Mudar o valor da oferta principal para R$ 147 e downsell para R$ 67',
    'Inserir 3 bônus exclusivos na mensagem de quebra de objeções',
    'Criar recuperação automática de carrinho com timeout de 30 minutos'
  ];

  // Ciclo das etapas de pensamento da IA enquanto processa no NVIDIA NIM
  useEffect(() => {
    let interval: any = null;
    if (isCopilotThinking) {
      interval = setInterval(() => {
        setCopilotThinkingStep((prev) => (prev + 1) % copilotThinkingSteps.length);
      }, 3000);
    } else {
      setCopilotThinkingStep(0);
    }
    return () => clearInterval(interval);
  }, [isCopilotThinking]);

  // Se o funil ativo já possui metadados de manutenção com IA e o chat está vazio, exibe o resumo
  useEffect(() => {
    if (activeFunnel?.aiMeta && copilotMessages.length === 0) {
      const initialAssistantMsg: AiCopilotMessage = {
        id: 'initial-meta-' + activeFunnel.id,
        sender: 'assistant',
        text: activeFunnel.aiMeta.explanation || 'Última modificação inteligente sincronizada com o canvas.',
        timestamp: activeFunnel.aiMeta.timestamp
          ? new Date(activeFunnel.aiMeta.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        reasoning: activeFunnel.aiMeta.reasoning,
        changelog: activeFunnel.aiMeta.changelog || [],
        explanation: activeFunnel.aiMeta.explanation,
        model: activeFunnel.aiMeta.model || 'NVIDIA NIM • Z.ai GLM 5.3 (753B MoE)',
        modifiedNodeIds: activeFunnel.aiMeta.modifiedNodeIds || [],
        addedNodeIds: activeFunnel.aiMeta.addedNodeIds || []
      };
      setCopilotMessages([initialAssistantMsg]);
      setExpandedReasoningMap({ [initialAssistantMsg.id]: true });
      setExpandedActionsMap({ [initialAssistantMsg.id]: true });
    }
  }, [activeFunnel?.id]);

  const handleFocusModifiedNodes = (nodeIds: string[]) => {
    if (!nodeIds || nodeIds.length === 0) return;

    // Marca nós alterados como selecionados no canvas
    setNodes((current) =>
      current.map((n) => ({
        ...n,
        selected: nodeIds.includes(n.id)
      }))
    );

    // Centraliza a visão da câmera do ReactFlow suavemente
    if (reactFlowInstance.current) {
      const targetNodes = nodes.filter((n) => nodeIds.includes(n.id));
      if (targetNodes.length > 0) {
        reactFlowInstance.current.fitView({
          nodes: targetNodes.map((n) => ({ id: n.id })),
          duration: 900,
          padding: 0.3
        });
      }
    }
  };

  const handleResetCopilotThread = () => {
    setCopilotMessages([]);
    setExpandedReasoningMap({});
    setExpandedActionsMap({});
  };

  const handleSendCopilotMessage = async (customInstruction?: string) => {
    const instructionToSend = (customInstruction || copilotInput).trim();
    if (!instructionToSend || isCopilotThinking || !activeFunnel.id) return;

    const userMsgId = 'user-' + Date.now();
    const userMsg: AiCopilotMessage = {
      id: userMsgId,
      sender: 'user',
      text: instructionToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput('');
    setIsCopilotThinking(true);

    setTimeout(() => {
      copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);

    try {
      const updated = await api.maintainFunnelWithAi(
        activeFunnel.id,
        instructionToSend,
        aiVoiceModel
      );

      if (!updated || !updated.id) {
        throw new Error('Servidor retornou resposta inválida ao aplicar alterações.');
      }

      const updatedList = funnels.map((f) => (f.id === updated.id ? updated : f));
      setFunnels(updatedList);
      if (updated.nodes && updated.nodes.length > 0) {
        setNodes(updated.nodes as any);
        setEdges((updated.edges || []) as any);
      }
      saveFunnelsLocally(updatedList, updated.id);

      const aiMeta = updated.aiMeta;
      const assistantMsgId = 'assistant-' + Date.now();
      const assistantMsg: AiCopilotMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: aiMeta?.explanation || 'Manutenção e conexões aplicadas no canvas com sucesso!',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        reasoning: aiMeta?.reasoning,
        changelog: aiMeta?.changelog || [
          `Atualizado grafo com ${updated.nodes?.length || 0} nós e ${updated.edges?.length || 0} conexões.`
        ],
        explanation: aiMeta?.explanation,
        model: aiMeta?.model || 'NVIDIA NIM • Z.ai GLM 5.3 (753B MoE)',
        modifiedNodeIds: aiMeta?.modifiedNodeIds || [],
        addedNodeIds: aiMeta?.addedNodeIds || []
      };

      setCopilotMessages((prev) => [...prev, assistantMsg]);
      setExpandedReasoningMap((prev) => ({ ...prev, [assistantMsgId]: true }));
      setExpandedActionsMap((prev) => ({ ...prev, [assistantMsgId]: true }));

      // Foca automaticamente nós modificados no canvas
      if (assistantMsg.modifiedNodeIds && assistantMsg.modifiedNodeIds.length > 0) {
        setTimeout(() => {
          handleFocusModifiedNodes(assistantMsg.modifiedNodeIds!);
        }, 500);
      }
    } catch (err: any) {
      console.error('Erro no copiloto IA:', err);
      const errId = 'err-' + Date.now();
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: errId,
          sender: 'assistant',
          text: `❌ Falha ao aplicar manutenção: ${err?.message || 'Erro ao comunicar com a IA NVIDIA NIM.'}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsCopilotThinking(false);
      setTimeout(() => {
        copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const renderCopilotDrawer = () => {
    if (!isCopilotOpen) return null;

    return (
      <div className="absolute top-0 right-0 z-40 w-full sm:w-[460px] md:w-[480px] lg:w-[500px] h-full bg-[#0a0d1c]/98 backdrop-blur-2xl border-l border-purple-500/25 shadow-2xl flex flex-col transition-all duration-300 select-text">
        {/* Top Header estilo referência Leona / Fio */}
        <div className="h-[68px] px-4 py-3 border-b border-purple-500/20 bg-[#0e1226]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-purple-500/30 shrink-0">
              <div className="w-full h-full bg-[#0a0d1c] rounded-2xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-300" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Novo fio neste fluxo</span>
              </h3>
              <p className="text-[11px] text-purple-300/80 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>NVIDIA NIM • Z.ai GLM 5.3</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-400/40 text-purple-200 text-xs font-mono font-bold">
              ⚡ 753B
            </span>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              title="Histórico de alterações deste funil"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetCopilotThread}
              title="Novo fio / Limpar conversa"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsCopilotOpen(false)}
              title="Fechar copiloto"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Feed / Suggestions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Tela Inicial de Sugestões quando a conversa está limpa */}
          {copilotMessages.length === 0 ? (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div>
                <h4 className="text-base font-bold text-white">
                  O que você quer construir neste fluxo?
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conta o resultado que busca. A gente monta no canvas em tempo real.
                </p>
              </div>

              {/* Botões de Ações Rápidas (Estilo Pílulas do Mockup) */}
              <div className="space-y-2">
                {quickCopilotSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendCopilotMessage(sug)}
                    className="w-full text-left p-3 rounded-xl bg-[#141830]/80 hover:bg-[#1d2348] border border-slate-800 hover:border-purple-500/50 text-xs text-slate-200 transition-all cursor-pointer font-medium shadow-sm hover:shadow-purple-500/10 active:scale-[0.99] flex items-center justify-between group"
                  >
                    <span>{sug}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* Card de Status do Motor (Estilo Banner Informativo Leona) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12162e] to-[#181d3d] border border-purple-500/30 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Copiloto Autônomo WhatsPix</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conectado ao modelo <strong>Z.ai GLM 5.3 (753B MoE)</strong> via NVIDIA NIM. O modelo analisa cada nó, reconecta handles, ajusta valores e sintetiza mensagens de áudio com voz humanizada.
                </p>
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {nodes.length} nós • {edges.length} arestas no canvas
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAiModalOpen(true);
                      setAiModalTab('create');
                    }}
                    className="text-[11px] font-bold text-purple-300 hover:text-white underline cursor-pointer"
                  >
                    Criar novo funil do zero →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Histórico de Mensagens do Fio */
            <div className="space-y-4">
              {copilotMessages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.sender === 'user' ? (
                    /* Balão do Usuário */
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-lg shadow-purple-900/30 text-xs leading-relaxed">
                        <p>{msg.text}</p>
                        <span className="text-[10px] text-purple-200/60 block mt-1 text-right font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Resposta do Copiloto IA */
                    <div className="space-y-2.5">
                      {/* Explicação Geral */}
                      <div className="p-3.5 rounded-2xl bg-[#11152c] border border-purple-500/25 text-xs text-slate-200 leading-relaxed shadow-lg">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] font-bold text-white">Copiloto IA WhatsPix</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>

                      {/* CARD 1: 💭 O que a IA pensou (Raciocínio Z.ai GLM 5.3) */}
                      {msg.reasoning && (
                        <div className="rounded-2xl border border-purple-500/30 bg-[#0c0f20] overflow-hidden shadow-md">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedReasoningMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                            }
                            className="w-full px-3.5 py-2.5 bg-purple-950/40 hover:bg-purple-950/60 flex items-center justify-between text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                              <span className="text-xs font-bold text-purple-200">O que a IA pensou</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-semibold">
                                Raciocínio 753B
                              </span>
                            </div>
                            {expandedReasoningMap[msg.id] ? (
                              <ChevronUp className="w-4 h-4 text-purple-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-purple-400" />
                            )}
                          </button>

                          {expandedReasoningMap[msg.id] && (
                            <div className="p-3.5 text-xs text-purple-200/90 font-mono leading-relaxed bg-[#070914] border-t border-purple-500/20 whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar">
                              {msg.reasoning}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CARD 2: ⚡ O que a IA fez no canvas (Ações Executadas) */}
                      {msg.changelog && msg.changelog.length > 0 && (
                        <div className="rounded-2xl border border-indigo-500/30 bg-[#0c0f20] overflow-hidden shadow-md">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedActionsMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                            }
                            className="w-full px-3.5 py-2.5 bg-indigo-950/40 hover:bg-indigo-950/60 flex items-center justify-between text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-xs font-bold text-indigo-200">O que a IA fez no canvas</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-semibold">
                                {msg.changelog.length} ações
                              </span>
                            </div>
                            {expandedActionsMap[msg.id] ? (
                              <ChevronUp className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-indigo-400" />
                            )}
                          </button>

                          {expandedActionsMap[msg.id] && (
                            <div className="p-3.5 space-y-2.5 bg-[#070914] border-t border-indigo-500/20">
                              <ul className="space-y-1.5">
                                {msg.changelog.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>

                              {msg.modifiedNodeIds && msg.modifiedNodeIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleFocusModifiedNodes(msg.modifiedNodeIds!)}
                                  className="mt-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                                >
                                  <Target className="w-3.5 h-3.5" />
                                  <span>Focar nós alterados no canvas ({msg.modifiedNodeIds.length})</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Card Animado de Pensamento enquanto a IA gera */}
          {isCopilotThinking && (
            <div className="p-4 rounded-2xl bg-[#11152e] border border-purple-500/40 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Raciocinando com Z.ai GLM 5.3 (753B MoE)...
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono">
                    NVIDIA NIM • Processamento profundo de arquitetura
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090b18] border border-purple-500/20 text-[11px] text-slate-300 space-y-2">
                <p className="text-purple-300 font-semibold">
                  {copilotThinkingSteps[copilotThinkingStep % copilotThinkingSteps.length]}
                </p>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 h-1.5 rounded-full w-2/3 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={copilotEndRef} />
        </div>

        {/* Input Box Inferior Estilo Mockup */}
        <div className="p-3 border-t border-purple-500/20 bg-[#0a0d1d]/90">
          <div className="bg-[#12162d] border border-slate-700/70 focus-within:border-purple-500/70 rounded-2xl p-2.5 shadow-xl transition-all">
            <textarea
              rows={2}
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendCopilotMessage();
                }
              }}
              placeholder="O que você quer construir ou ajustar neste fluxo?..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed font-sans"
            />
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCopilotInput(
                      'Adicionar bloco de áudio humanizado (Fish Audio) antes da oferta de PIX'
                    )
                  }
                  title="Inserir modelo de áudio"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAiIncludeVoice(!aiIncludeVoice)}
                  title={aiIncludeVoice ? 'Áudio Fish Audio ativado' : 'Áudio desativado'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    aiIncludeVoice ? 'text-fuchsia-400 bg-fuchsia-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-slate-500 font-mono ml-1">GLM 5.3</span>
              </div>

              <button
                type="button"
                onClick={() => handleSendCopilotMessage()}
                disabled={isCopilotThinking || !copilotInput.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-md shadow-purple-500/30 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAiModal = () => {
    if (!isAiModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#0f1224] border border-indigo-500/40 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl my-8">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/50 flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Arquiteto & Copiloto IA (NVIDIA NIM • Z.ai GLM 5.3)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                    PRODUÇÃO
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Criação e manutenção autônoma de funis, interligação perfeita de blocos, variáveis e áudio WhatsApp.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector: Criar vs Manutenção */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAiModalTab('create');
                setAiGenerateError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                aiModalTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Criar Novo Funil com IA</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiModalTab('maintain');
                setAiGenerateError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                aiModalTab === 'maintain'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Manutenção & Ajustes no Funil Atual</span>
            </button>
          </div>

          {/* Erro de Geração */}
          {aiGenerateError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{aiGenerateError}</span>
            </div>
          )}

          {/* Sucesso na Manutenção */}
          {aiMaintainSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{aiMaintainSuccess}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: CRIAR NOVO FUNIL COM IA                                */}
          {/* ============================================================== */}
          {aiModalTab === 'create' ? (
            <>
              {/* Nível de Complexidade da Arquitetura do Funil (Estilo Leona AI) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950 border border-purple-500/30">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Nível de Arquitetura & Profissionalismo do Funil:</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40 font-mono">
                    {aiComplexity === 'enterprise' ? '26+ Nós Profissionais' : aiComplexity === 'advanced' ? '14 Nós' : '8 Nós'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiComplexity('enterprise')}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      aiComplexity === 'enterprise'
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-600/25 ring-1 ring-purple-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <span>👑 Enterprise (Leona)</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        7 DÍGITOS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      26 nós: Distribuidor A/B 4 saídas, Esperas (30m, 1d, 3d), PDFs anexos, Botão PIX, OCR Comprovante, Alerta Atendente e IA Closer.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiComplexity('advanced')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aiComplexity === 'advanced'
                        ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">⚡ Alta Conversão</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        14 NÓS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Sequência com áudio Fish Audio, quebra de objeções, oferta de PIX, espera de 30 min e downsell automático.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiComplexity('basic')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aiComplexity === 'basic'
                        ? 'bg-slate-800 border-slate-400 text-white shadow-md'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">🚀 Rápido / Básico</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        8 NÓS
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Fluxo direto e enxuto para validação rápida de novas campanhas ou testes de tráfego.
                    </p>
                  </button>
                </div>
              </div>

              {/* Presets Rápidos */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Estratégias Prontas de Alta Conversão:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'low_ticket', label: '🚀 Low Ticket + Downsell', desc: 'R$ 97 / R$ 47' },
                    { id: 'recovery', label: '🛒 Recuperação Carrinho', desc: 'Kiwify / Hotmart' },
                    { id: 'high_ticket', label: '💎 Mentoria High Ticket', desc: 'R$ 997+' },
                    { id: 'launch', label: '🔥 Lançamento WhatsApp', desc: 'Abertura Relâmpago' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        aiStrategy === preset.id
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold block">{preset.label}</span>
                      <span className="text-[10px] opacity-75">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product & Price fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome do Produto / Oferta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={aiProductName}
                    onChange={(e) => setAiProductName(e.target.value)}
                    placeholder="Ex: Creatina 100% Pura, Mentoria..."
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Preço Oferta Principal (R$)
                  </label>
                  <input
                    type="text"
                    value={aiPrice}
                    onChange={(e) => setAiPrice(e.target.value)}
                    placeholder="97,00"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Preço Oferta Downsell (R$)
                  </label>
                  <input
                    type="text"
                    value={aiDownsell}
                    onChange={(e) => setAiDownsell(e.target.value)}
                    placeholder="47,00"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* Prompt Detalhado */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Instruções Estratégicas & Nicho para a IA (Prompt Livre):
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Exemplo: Crie um funil onde a IA atende o lead o tempo todo tirando dúvidas sobre nossa creatina, entendendo os objetivos do lead, enviando áudio e bônus exclusivo, e fechando a venda no PIX."
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 leading-relaxed font-sans"
                />
              </div>

              {/* Configuração de Áudio / Voz (Fish Audio) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Incluir Mensagens de Áudio com IA (Fish Audio)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Gera roteiro e bloco de áudio humanizado como se fosse o produtor falando
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiIncludeVoice}
                      onChange={(e) => setAiIncludeVoice(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500"></div>
                  </label>
                </div>

                {aiIncludeVoice && (
                  <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">Modelo de Voz:</span>
                    <select
                      value={aiVoiceModel}
                      onChange={(e) => setAiVoiceModel(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-fuchsia-500/50"
                    >
                      <option value="fish-audio/s2.1-pro-free:free">Fish Audio S2.1 Pro Free (Natural PT-BR)</option>
                      <option value="pt-br-female-natural">Voz Feminina Empática (Vendedora)</option>
                      <option value="pt-br-male-closer">Voz Masculina Firme (Autoridade)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Variáveis Suportadas */}
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-indigo-300 font-semibold">
                  Variáveis que a IA programará nas mensagens:
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">{"{{nome}}"}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">{"{{produto}}"}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">{"{{valor}}"}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">{"{{link_pix}}"}</span>
                </div>
              </div>

              {/* Actions Criar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleGenerateFunnelAi}
                  disabled={isGenerating || (!aiPrompt.trim() && !aiProductName.trim())}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-50 text-white flex items-center gap-2 shadow-xl shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
                      <span>Construindo Grafo no Canvas com NVIDIA NIM...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Gerar Funil Completo no Canvas</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* ============================================================== */
            /* TAB 2: MANUTENÇÃO & AJUSTES NO FUNIL ATUAL                     */
            /* ============================================================== */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold block">
                    Funil Atual Selecionado:
                  </span>
                  <span className="font-bold text-white text-sm">{activeFunnel.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {nodes.length} nós • {edges.length} arestas
                  </span>
                </div>
              </div>

              {/* Destaque para o Copiloto em Tempo Real */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-fuchsia-900/30 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Novo Copiloto WhatsPix em Tempo Real
                    </span>
                    <span className="text-[11px] text-purple-200">
                      Visualize o raciocínio da IA (GLM 5.3 753B) e as alterações aplicadas nó por nó ao lado do canvas.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAiModalOpen(false);
                    setIsCopilotOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/30 cursor-pointer"
                >
                  <span>Abrir Chat Copiloto</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sugestões Rápidas de Manutenção */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Ações Rápidas de Manutenção (Clique para Inserir):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '➕ Adicionar bloco de áudio humanizado antes da oferta de PIX',
                    '💰 Mudar o valor da oferta principal para R$ 147 e o downsell para R$ 67',
                    '⏱️ Adicionar bloco de "Aguarda Resposta" com timeout de 20 minutos',
                    '🔄 Criar recuperação automática caso o cliente não responda em 30 min',
                    '🏷️ Adicionar etiqueta "Cliente_Interessado" e mover para estágio Negociando',
                    '🎁 Inserir 3 bônus exclusivos na mensagem de quebra de objeções'
                  ].map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiMaintainInstruction(sug)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 text-left text-xs text-slate-300 transition-all cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea de Instrução de Manutenção */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Descreva exatamente o que a IA deve alterar, adicionar ou interligar:
                </label>
                <textarea
                  rows={4}
                  value={aiMaintainInstruction}
                  onChange={(e) => setAiMaintainInstruction(e.target.value)}
                  placeholder="Ex: Altere o preço do PIX para R$ 127. Adicione um bloco de áudio explicativo logo após a primeira mensagem. Conecte a saída de timeout para uma mensagem de recuperação oferecendo mentoria grátis..."
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 leading-relaxed font-sans"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Como a IA faz a manutenção:</span>
                <p>• Mantém a integridade do seu funil e adiciona ou reconfigura os blocos solicitados.</p>
                <p>• Reconecta as saídas (Respondeu, Timeout, True, False) e ajusta as posições no canvas.</p>
                <p>• Se você pedir um novo áudio, a IA escreve o roteiro e gera o áudio real via Fish Audio.</p>
              </div>

              {/* Actions Manutenção */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleMaintainFunnelAi}
                  disabled={isMaintaining || !aiMaintainInstruction.trim()}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-xl shadow-purple-500/30 transition-all cursor-pointer"
                >
                  {isMaintaining ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
                      <span>Aplicando Alterações e Reorganizando Conexões...</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-4 h-4 text-white" />
                      <span>Aplicar Alterações no Funil com IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW 1: LISTA DE FLUXOS (Multi-flow catalog view)
  // =========================================================================
  if (viewMode === 'list') {
    return (
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto bg-[#080c14]">
        {/* Top Header */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/50 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Gerenciador de Fluxos & Funis de Venda</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono">
                  {funnels.filter((f) => f.active).length} Ativos
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Crie múltiplos funis segmentados por produto, esteira de downsell ou recuperação de carrinho.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Criar com IA</span>
            </button>
          </div>
        </div>

        {/* Funnels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <GitFork className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{funnel.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {funnel.id}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      funnel.active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {funnel.active ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{funnel.description}</p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Iniciados:</span>
                  <span className="text-white font-bold font-mono">{funnel.stats.started}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Conversões:</span>
                  <span className="text-emerald-400 font-bold font-mono">{funnel.stats.conversions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Taxa:</span>
                  <span className="text-indigo-400 font-bold font-mono">{funnel.stats.conversionRate}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Gatilho: <strong className="text-slate-300">{funnel.triggerType}</strong>
                </span>

                <button
                  onClick={() => handleOpenFunnel(funnel)}
                  className="px-3.5 py-1.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Editar Canvas</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL: WhatsPix AI Funnel Studio (Disponível na Lista de Fluxos) */}
        {renderAiModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CANVAS BUILDER COM DRAWERS DE CONFIGURAÇÃO INTERATIVA
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0c0e1a]">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-slate-800/80 bg-[#0f1224] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('list')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Voltar para a lista de fluxos"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Todos os Fluxos</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">{activeFunnel.name}</span>
            <Edit2 className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>

          <div className="h-4 w-px bg-slate-800 mx-2"></div>

          {/* Botão Ferramentas (Purple pill) */}
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ferramentas</span>
          </button>

          {/* Botão Simular (Dark pill) */}
          <button
            onClick={handleToggleSimulator}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isSimulatorOpen
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
            <span>Simular Funil</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCopilotOpen
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50'
                : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-indigo-500/25'
            }`}
            title="Abrir Copiloto IA WhatsPix (NVIDIA NIM • Z.ai GLM 5.3)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>WhatsPix AI</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200 border border-purple-400/30 font-mono">
              753B
            </span>
          </button>

          {/* Toggle Ativar / Pausado (Leona AI style) */}
          <button
            onClick={handleToggleActiveFunnel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeFunnel.active
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
            title="Alternar status do funil (Ativo / Pausado)"
          >
            {activeFunnel.active ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ativo</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Pausado</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
          >
            {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? 'Salvo no Banco!' : 'Salvar Fluxo'}</span>
          </button>
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          nodeTypes={customNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0c0e1a]"
        >
          <Background
            color="#272d4d"
            gap={20}
            size={1.5}
            variant={BackgroundVariant.Dots}
            className="opacity-70"
          />
          <Controls className="!bg-[#0f1224] !border !border-slate-800 !rounded-xl !p-1 !shadow-xl [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-300" />
          <MiniMap
            nodeStrokeColor="#3b82f6"
            nodeColor={(n) => {
              const t = n.type || '';
              if (t === 'startNode' || t === 'trigger') return '#10b981';
              if (t === 'waitReplyNode' || t === 'wait_reply') return '#ea580c';
              if (t === 'conditionNode' || t === 'condition') return '#0284c7';
              if (t === 'distributorNode') return '#d97706';
              if (t === 'tagNode' || t === 'tag') return '#7c3aed';
              if (t === 'pixNode' || t === 'pixButtonNode' || t === 'pix_generator') return '#059669';
              if (t === 'callNode' || t === 'call') return '#0d9488';
              if (t === 'menuNode' || t === 'menu') return '#9333ea';
              if (t === 'carouselNode' || t === 'carousel') return '#0891b2';
              if (t === 'pixelNode' || t === 'pixel') return '#d97706';
              if (t === 'smartDelayNode' || t === 'delay') return '#0284c7';
              if (t === 'departmentNode' || t === 'department') return '#6366f1';
              if (t === 'integrationNode' || t === 'integration') return '#2563eb';
              if (t === 'approvedSaleNode' || t === 'approved_sale') return '#16a34a';
              if (t === 'manipulatorNode' || t === 'manipulator') return '#ea580c';
              if (t === 'flowConnectionNode' || t === 'flow_connection') return '#db2777';
              if (t === 'templateNode' || t === 'template') return '#0284c7';
              if (t === 'notificationNode' || t === 'notification') return '#0f766e';
              if (t === 'aiBlockNode') return '#10b981';
              if (t === 'kanbanNode' || t === 'kanban') return '#7c3aed';
              if (t === 'paymentNode' || t === 'payment') return '#8b5cf6';
              if (t === 'aiAgentNode' || t === 'ai_agent') return '#8b5cf6';
              if (t === 'ocrNode' || t === 'ocr_checker') return '#0f766e';
              if (t === 'audioNode' || t === 'audio') return '#e11d48';
              return '#2563eb';
            }}
            nodeBorderRadius={6}
            className="!bg-[#0f1224] !border !border-slate-800/80 !rounded-2xl !shadow-2xl overflow-hidden"
          />
        </ReactFlow>

        {/* DRAWER LATERAL: CONFIGURADOR DO NÓ CLICADO (Condicionais, Mensagens, Distribuidores, PIX, etc) */}
        {editingNode && (() => {
          const nodeData = (editingNode.data || {}) as Record<string, any>;
          return (
          <div className="absolute top-4 right-6 z-30 w-80 md:w-96 bg-[#0f1224]/98 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto space-y-4 ring-1 ring-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Configurar Bloco</h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                  {editingNode.type}
                </span>
              </div>
              <button onClick={() => setEditingNode(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. SE CONDICIONAL */}
            {editingNode.type === 'conditionNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Regra da Condição (Se verdadeiro)
                  </label>
                  <input
                    type="text"
                    value={nodeData.conditionText || ''}
                    onChange={(e) => handleSaveNodeConfig({ conditionText: e.target.value })}
                    placeholder="Ex: Etiqueta igual Compra ou checkout_iniciado"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Define qual critério direciona para a saída principal.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                  <span className="font-semibold text-cyan-300 block">Saídas da Condicional:</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>1. Saída Verdadeiro (Direita Cima):</span>
                    <span className="font-semibold text-cyan-400">Atendeu a regra</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>2. Saída Falso (Direita Baixo):</span>
                    <span className="text-slate-400">Linha tracejada (Não atendeu)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SE MENSAGEM */}
            {editingNode.type === 'messageNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Delay de Digitação Humanizada
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {nodeData.delay || '5s - 10s'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={nodeData.delay || '5s - 10s'}
                    onChange={(e) => handleSaveNodeConfig({ delay: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/50 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Emula o status "digitando..." no WhatsApp por esse tempo.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Texto da Mensagem (Suporta Spintax)
                  </label>
                  <textarea
                    rows={4}
                    value={nodeData.text || ''}
                    onChange={(e) => handleSaveNodeConfig({ text: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/50 leading-relaxed font-sans"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveNodeConfig({ text: (nodeData.text || '') + ' {{nome}}' })
                      }
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      + {"{{nome}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveNodeConfig({
                          text: (nodeData.text || '') + ' {Oi|Olá|Opa}'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      + Spintax {"{Oi|Olá}"}
                    </button>
                  </div>
                </div>

                {/* Arquivo de Áudio associado */}
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Áudio Anexado (.ogg / .wav)
                  </label>
                  <input
                    type="text"
                    value={nodeData.audioFileName || ''}
                    onChange={(e) => handleSaveNodeConfig({ audioFileName: e.target.value })}
                    placeholder="Ex: 1.ogg ou explicacao_produto.ogg"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                {/* Documentos / PDFs anexados */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    Documentos / PDFs Anexados
                  </label>
                  {((nodeData.files as any[]) || []).map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[11px] text-slate-300 font-mono truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = ((nodeData.files as any[]) || []).filter((_, idx) => idx !== i);
                          handleSaveNodeConfig({ files: updated });
                        }}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input
                      id="newPdfInput"
                      type="text"
                      placeholder="Nome do PDF (Ex: COBERTURAS.pdf)"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            const updated = [...((nodeData.files as any[]) || []), { name: val }];
                            handleSaveNodeConfig({ files: updated });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newPdfInput') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const updated = [...((nodeData.files as any[]) || []), { name: input.value.trim() }];
                          handleSaveNodeConfig({ files: updated });
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      + Anexar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SE AGUARDA RESPOSTA (Leona AI) */}
            {editingNode.type === 'waitReplyNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Tempo Limite de Espera (Timeout)
                  </label>
                  <input
                    type="text"
                    value={nodeData.timeoutDuration || 'Após 35 minutos'}
                    onChange={(e) => handleSaveNodeConfig({ timeoutDuration: e.target.value })}
                    placeholder="Ex: Após 35 minutos ou Após 1 dia"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-orange-500/50 font-mono"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Após 15 minutos', 'Após 35 minutos', 'Após 2 horas', 'Após 1 dia'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleSaveNodeConfig({ timeoutDuration: time })}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-orange-300 hover:border-orange-500/50 cursor-pointer"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-2">
                  <span className="font-semibold text-orange-300 block">Duas Saídas Conectáveis:</span>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-0.5">
                    <span className="font-bold text-emerald-400 block">1. Saída Superior (Respondeu):</span>
                    <span className="text-slate-300 text-[10px]">O lead enviou qualquer mensagem no WhatsApp.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-0.5">
                    <span className="font-bold text-amber-400 block">2. Saída Inferior (Caso não responda):</span>
                    <span className="text-slate-300 text-[10px]">Disparado após o tempo limite para reengajar.</span>
                  </div>
                </div>
              </div>
            )}

            {/* SE LIGAR WHATSAPP */}
            {editingNode.type === 'callNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Tempo de Toque da Chamada
                  </label>
                  <input
                    type="text"
                    value={nodeData.callDuration || '15s'}
                    onChange={(e) => handleSaveNodeConfig({ callDuration: e.target.value })}
                    placeholder="Ex: 10s ou 15s"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Faz uma ligação WhatsApp pro lead. Toque 1-15s; com áudio, soma a duração do arquivo.
                  </span>
                </div>
              </div>
            )}

            {/* SE MENU INTERATIVO */}
            {editingNode.type === 'menuNode' && (
              <div className="space-y-4 text-xs">
                <label className="text-xs font-semibold text-slate-200 block">
                  Botões Interativos WhatsApp
                </label>
                <div className="space-y-2">
                  {((nodeData.menuButtons as string[]) || ['Opção 1', 'Opção 2']).map((btn, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={btn}
                        onChange={(e) => {
                          const updated = [...((nodeData.menuButtons as string[]) || [])];
                          updated[i] = e.target.value;
                          handleSaveNodeConfig({ menuButtons: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = ((nodeData.menuButtons as string[]) || []).filter((_, idx) => idx !== i);
                          handleSaveNodeConfig({ menuButtons: updated });
                        }}
                        className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = (nodeData.menuButtons as string[]) || [];
                    handleSaveNodeConfig({ menuButtons: [...current, `Nova Opção ${current.length + 1}`] });
                  }}
                  className="w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Botão</span>
                </button>
              </div>
            )}

            {/* SE CARROSSEL */}
            {editingNode.type === 'carouselNode' && (
              <div className="space-y-4 text-xs">
                <label className="text-xs font-semibold text-slate-200 block">
                  Cards do Carrossel
                </label>
                <div className="space-y-2">
                  {((nodeData.carouselCards as any[]) || [{ title: 'Card 1', desc: 'Detalhes' }]).map((card, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cyan-300 text-[11px]">Card #{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = ((nodeData.carouselCards as any[]) || []).filter((_, idx) => idx !== i);
                            handleSaveNodeConfig({ carouselCards: updated });
                          }}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Título do card"
                        value={card.title}
                        onChange={(e) => {
                          const updated = [...((nodeData.carouselCards as any[]) || [])];
                          updated[i].title = e.target.value;
                          handleSaveNodeConfig({ carouselCards: updated });
                        }}
                        className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Descrição curta"
                        value={card.desc}
                        onChange={(e) => {
                          const updated = [...((nodeData.carouselCards as any[]) || [])];
                          updated[i].desc = e.target.value;
                          handleSaveNodeConfig({ carouselCards: updated });
                        }}
                        className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = (nodeData.carouselCards as any[]) || [];
                    handleSaveNodeConfig({
                      carouselCards: [...current, { title: `Produto ${current.length + 1}`, desc: 'Descrição' }]
                    });
                  }}
                  className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Card</span>
                </button>
              </div>
            )}

            {/* SE PIXEL META */}
            {editingNode.type === 'pixelNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Evento do Meta Pixel / CAPI
                  </label>
                  <select
                    value={nodeData.pixelEvent || 'Purchase'}
                    onChange={(e) => handleSaveNodeConfig({ pixelEvent: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="Purchase">Purchase (Compra Aprovada)</option>
                    <option value="InitiateCheckout">InitiateCheckout (Iniciou Checkout)</option>
                    <option value="Lead">Lead (Contato Qualificado)</option>
                    <option value="AddToCart">AddToCart (Adicionou ao Carrinho)</option>
                    <option value="ViewContent">ViewContent (Visualizou Oferta)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Valor Atribuído ao Evento (R$)
                  </label>
                  <input
                    type="text"
                    value={nodeData.amount || '97,00'}
                    onChange={(e) => handleSaveNodeConfig({ amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* SE INTERVALO INTELIGENTE */}
            {editingNode.type === 'smartDelayNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Tempo de Espera
                  </label>
                  <input
                    type="text"
                    value={nodeData.delay || '2 horas'}
                    onChange={(e) => handleSaveNodeConfig({ delay: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Regra de Horário Comercial
                  </label>
                  <select
                    value={nodeData.smartDelayMode || 'Apenas em Horário Comercial (08h às 18h)'}
                    onChange={(e) => handleSaveNodeConfig({ smartDelayMode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="Apenas em Horário Comercial (08h às 18h)">
                      Apenas em Horário Comercial (08h às 18h)
                    </option>
                    <option value="24/7 Imediato (Qualquer horário)">
                      24/7 Imediato (Qualquer horário)
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* SE DEPARTAMENTO */}
            {editingNode.type === 'departmentNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Nome do Setor / Fila
                  </label>
                  <input
                    type="text"
                    value={nodeData.departmentName || 'Comercial / Vendas'}
                    onChange={(e) => handleSaveNodeConfig({ departmentName: e.target.value })}
                    placeholder="Ex: Comercial / Vendas, Suporte VIP, Financeiro"
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* SE INTEGRAÇÃO */}
            {editingNode.type === 'integrationNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    URL do Webhook (POST)
                  </label>
                  <input
                    type="text"
                    value={nodeData.webhookUrl || 'https://webhook.site/whatspix-api'}
                    onChange={(e) => handleSaveNodeConfig({ webhookUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}

            {/* SE VENDA APROVADA */}
            {editingNode.type === 'approvedSaleNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Valor da Conversão (R$)
                  </label>
                  <input
                    type="text"
                    value={nodeData.amount || '197,00'}
                    onChange={(e) => handleSaveNodeConfig({ amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* SE MANIPULADOR */}
            {editingNode.type === 'manipulatorNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Expressão / Atribuição de Variável
                  </label>
                  <input
                    type="text"
                    value={nodeData.manipulatorExpr || "lead.etapa = 'checkout'"}
                    onChange={(e) => handleSaveNodeConfig({ manipulatorExpr: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-orange-300 font-mono"
                  />
                </div>
              </div>
            )}

            {/* SE CONEXÃO DE FLUXO */}
            {editingNode.type === 'flowConnectionNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Direcionar para Funil
                  </label>
                  <select
                    value={nodeData.targetFunnelName || ''}
                    onChange={(e) => handleSaveNodeConfig({ targetFunnelName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  >
                    {funnels.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* SE TEMPLATE WHATSAPP */}
            {editingNode.type === 'templateNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Nome do Modelo HSM (Meta)
                  </label>
                  <input
                    type="text"
                    value={nodeData.templateName || 'aviso_oferta_exclusiva'}
                    onChange={(e) => handleSaveNodeConfig({ templateName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-sky-300 font-mono"
                  />
                </div>
              </div>
            )}

            {/* SE NOTIFICAÇÃO */}
            {editingNode.type === 'notificationNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Mensagem de Alerta para Vendedor
                  </label>
                  <textarea
                    rows={3}
                    value={nodeData.notificationMessage || ''}
                    onChange={(e) => handleSaveNodeConfig({ notificationMessage: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* SE BLOCO DE IA */}
            {editingNode.type === 'aiBlockNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Instrução / Prompt do Bloco
                  </label>
                  <textarea
                    rows={4}
                    value={nodeData.goal || ''}
                    onChange={(e) => handleSaveNodeConfig({ goal: e.target.value })}
                    placeholder="Ex: Classifique se o lead tem perfil de comprador..."
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* SE KANBAN CRM */}
            {editingNode.type === 'kanbanNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Coluna do Kanban CRM
                  </label>
                  <select
                    value={nodeData.kanbanStage || 'Em Negociação'}
                    onChange={(e) => handleSaveNodeConfig({ kanbanStage: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  >
                    <option value="Lead Novo">Lead Novo</option>
                    <option value="Qualificado">Qualificado</option>
                    <option value="Em Negociação">Em Negociação</option>
                    <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                    <option value="Venda Concluída">Venda Concluída</option>
                  </select>
                </div>
              </div>
            )}

            {/* SE PAGAMENTO */}
            {editingNode.type === 'paymentNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Plataforma / Gateway
                  </label>
                  <input
                    type="text"
                    value={nodeData.paymentGateway || 'Kiwify / Hotmart'}
                    onChange={(e) => handleSaveNodeConfig({ paymentGateway: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* SE BOTÃO PIX */}
            {editingNode.type === 'pixButtonNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={nodeData.pixKey || '11999999999'}
                    onChange={(e) => handleSaveNodeConfig({ pixKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Nome do Titular
                  </label>
                  <input
                    type="text"
                    value={nodeData.pixReceiver || 'maria'}
                    onChange={(e) => handleSaveNodeConfig({ pixReceiver: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Valor Cobrado no PIX (R$)
                  </label>
                  <input
                    type="text"
                    value={nodeData.amount || '97,00'}
                    onChange={(e) => handleSaveNodeConfig({ amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* 3. SE DISTRIBUIDOR */}
            {editingNode.type === 'distributorNode' && (
              <div className="space-y-4 text-xs">
                <label className="text-xs font-semibold text-slate-200 block">
                  Caminhos de Distribuição
                </label>
                <div className="space-y-2">
                  {((nodeData.outputs as any[]) || []).map((out: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={out.label}
                        onChange={(e) => {
                          const updated = [...((nodeData.outputs as any[]) || [])];
                          updated[i].label = e.target.value;
                          handleSaveNodeConfig({ outputs: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      />
                      <input
                        type="number"
                        value={out.count}
                        onChange={(e) => {
                          const updated = [...((nodeData.outputs as any[]) || [])];
                          updated[i].count = parseInt(e.target.value) || 0;
                          handleSaveNodeConfig({ outputs: updated });
                        }}
                        className="w-16 px-2 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-center"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = (nodeData.outputs as any[]) || [];
                    const updated = [
                      ...current,
                      { label: `Saída ${current.length + 1}`, count: 10 }
                    ];
                    handleSaveNodeConfig({ outputs: updated });
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Mais uma Saída</span>
                </button>
              </div>
            )}

            {/* 4. SE ETIQUETAS */}
            {editingNode.type === 'tagNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Nome da Etiqueta
                  </label>
                  <input
                    type="text"
                    value={nodeData.tag || ''}
                    onChange={(e) => handleSaveNodeConfig({ tag: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            )}

            {/* 5. SE PIX */}
            {editingNode.type === 'pixNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Valor Cobrado no PIX (R$)
                  </label>
                  <input
                    type="text"
                    value={nodeData.amount || '97,00'}
                    onChange={(e) => handleSaveNodeConfig({ amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            )}

            {/* 6. SE COPILOTO IA */}
            {editingNode.type === 'aiAgentNode' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Objetivo da Negociação Autônoma
                  </label>
                  <textarea
                    rows={4}
                    value={nodeData.goal || ''}
                    onChange={(e) => handleSaveNodeConfig({ goal: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500/50 leading-relaxed font-sans"
                  />
                </div>
              </div>
            )}

            {/* 7. SE ÁUDIO WHATSAPP (FISH AUDIO) */}
            {editingNode.type === 'audioNode' && (
              <div className="space-y-4 text-xs">
                {/* Audio Status & Player */}
                <div className="p-3.5 rounded-xl bg-[#140f21] border border-fuchsia-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5 text-fuchsia-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Áudio Fish Audio WhatsApp</span>
                        <span className="text-[10px] text-fuchsia-300/80">Mensagem de Voz PTT</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        nodeData.audioUrl
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {nodeData.audioUrl ? 'SALVO NO FUNIL ✓' : 'NÃO GERADO'}
                    </span>
                  </div>

                  {/* Play audio preview if audioUrl exists */}
                  {nodeData.audioUrl && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handlePlayDrawerAudio(nodeData.audioUrl!)}
                        className="w-8 h-8 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-fuchsia-500/40 transition-all cursor-pointer"
                        title={isDrawerAudioPlaying ? 'Pausar' : 'Reproduzir áudio gravado'}
                      >
                        {isDrawerAudioPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 h-3 mb-1">
                          {[40, 80, 50, 100, 60, 90, 45, 75, 60, 95, 30, 80, 50, 70].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full ${
                                isDrawerAudioPlaying ? 'bg-fuchsia-400 animate-pulse' : 'bg-fuchsia-500/50'
                              }`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Duração: {nodeData.audioDuration || '0:28'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botão de Sintetizar / Regerar com Fish Audio */}
                  <button
                    type="button"
                    disabled={isSynthesizingVoice || !(nodeData.audioScript || nodeData.text)}
                    onClick={() =>
                      handleSynthesizeNodeAudio(
                        editingNode.id,
                        nodeData.audioScript || nodeData.text || '',
                        nodeData.voiceModel
                      )
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20 transition-all cursor-pointer"
                  >
                    {isSynthesizingVoice ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sintetizando voz com Fish Audio...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>
                          {nodeData.audioUrl ? 'Regerar e Salvar Áudio no Funil' : 'Sintetizar com Fish Audio e Salvar'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Delay de Gravação ("gravando áudio...")
                    </label>
                    <span className="text-xs font-mono font-bold text-fuchsia-400">
                      {nodeData.delay || '8s'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={nodeData.delay || '8s'}
                    onChange={(e) => handleSaveNodeConfig({ delay: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-fuchsia-500/50 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Emula o status "gravando áudio..." no WhatsApp por esse tempo.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Duração Estimada do Áudio
                  </label>
                  <input
                    type="text"
                    value={nodeData.audioDuration || '0:28'}
                    onChange={(e) => handleSaveNodeConfig({ audioDuration: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-fuchsia-500/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      ID ou Modelo de Voz (Fish Audio / OpenAI)
                    </label>
                    <a
                      href="https://fish.audio/discovery"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 underline"
                      title="Explorar e escolher vozes no Fish Audio"
                    >
                      Buscar vozes no Fish.audio ↗
                    </a>
                  </div>
                  <input
                    type="text"
                    value={nodeData.voiceId || nodeData.voiceModel || ''}
                    onChange={(e) =>
                      handleSaveNodeConfig({
                        voiceId: e.target.value,
                        voiceModel: e.target.value
                      })
                    }
                    placeholder="Cole o ID da voz do Fish.audio (ou 'nova', 'shimmer', 'onyx')..."
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-fuchsia-500/50 font-mono"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSaveNodeConfig({ voiceId: '', voiceModel: 'fish-audio/s2.1-pro-free:free' })}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Padrão Fish Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNodeConfig({ voiceId: 'nova', voiceModel: 'openai/tts-1' })}
                      className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 transition-colors"
                    >
                      👩 Sofia Feminina (Nova)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNodeConfig({ voiceId: 'onyx', voiceModel: 'openai/tts-1' })}
                      className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                    >
                      👨 Masculino Firme (Onyx)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                    Roteiro Falado no Áudio
                  </label>
                  <textarea
                    rows={4}
                    value={nodeData.audioScript || nodeData.text || ''}
                    onChange={(e) =>
                      handleSaveNodeConfig({
                        audioScript: e.target.value,
                        text: e.target.value
                      })
                    }
                    className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-fuchsia-500/50 leading-relaxed font-sans"
                    placeholder="Oi {{nome}}, passando rapidinho para te explicar..."
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveNodeConfig({
                          audioScript: (nodeData.audioScript || '') + ' {{nome}}'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      + {"{{nome}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveNodeConfig({
                          audioScript: (nodeData.audioScript || '') + ' {{produto}}'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      + {"{{produto}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveNodeConfig({
                          audioScript: (nodeData.audioScript || '') + ' R$ {{valor}}'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white"
                    >
                      + {"{{valor}}"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Card Actions: Duplicate & Delete */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDuplicateNode(editingNode)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteNode(editingNode.id)}
                className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-500/30 transition-colors"
                title="Excluir este bloco"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
          );
        })()}

        {/* DRAWER: FERRAMENTAS / CATÁLOGO DE BLOCOS COM BUSCA (Estilo Leona AI) */}
        {isToolsOpen && (
          <div className="absolute top-4 left-6 z-30 w-80 md:w-88 bg-[#0f1224]/98 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto ring-1 ring-slate-800">
            {/* Header com botão de fechar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-[#a855f7]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Ferramentas</h3>
              </div>
              <button
                onClick={() => setIsToolsOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input de Busca em Tempo Real (Leona AI: Q Buscar blocos...) */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={toolsSearchTerm}
                onChange={(e) => setToolsSearchTerm(e.target.value)}
                placeholder="Buscar blocos..."
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors"
                autoFocus
              />
              {toolsSearchTerm && (
                <button
                  type="button"
                  onClick={() => setToolsSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista Filtrada de Blocos */}
            <div className="space-y-1.5 pt-1">
              {TOOL_BLOCKS.filter((b) => {
                if (!toolsSearchTerm.trim()) return true;
                const term = toolsSearchTerm.toLowerCase();
                return (
                  b.title.toLowerCase().includes(term) ||
                  b.desc.toLowerCase().includes(term) ||
                  b.category.toLowerCase().includes(term)
                );
              }).map((block, idx) => {
                const IconComponent = block.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddNode(block.type, block.defaultData)}
                    title={block.tooltip}
                    className="w-full p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/50 hover:bg-slate-800/80 text-left text-slate-200 flex items-center gap-3 transition-all group cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${block.iconBg}`}>
                      <IconComponent className={`w-4 h-4 ${block.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-white truncate">
                          {block.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-500 font-mono">
                          {block.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        {block.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DRAWER: SIMULADOR DE FLUXO */}
        {isSimulatorOpen && (
          <div className="absolute top-4 right-6 z-30 w-84 md:w-[410px] bg-[#0c101d]/98 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-950/60 flex flex-col h-[82vh] overflow-hidden">
            {/* Header com Nome do Funil e Botão de Reiniciar */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-[#0f1426]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current ml-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Simulador WhatsApp</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-indigo-300/80 font-medium block truncate max-w-[200px]" title={activeFunnel.name}>
                    {activeFunnel.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={initializeSimulator}
                  title="Reiniciar Simulação do Funil"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleSimulator}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mensagens do Simulador */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3.5">
              {simulatorChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'lead' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-semibold text-slate-500 mb-1 px-1">
                    {msg.sender === 'lead' ? 'Você (Lead)' : 'Bot WhatsApp'}
                  </span>

                  {/* Se for áudio WhatsApp PTT */}
                  {msg.isAudio ? (
                    <div className="w-full max-w-[310px] p-3 rounded-2xl bg-[#0f2420] border border-emerald-500/30 text-slate-100 shadow-md">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSimAudio(msg.audioUrl || '')}
                          className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 transition-all cursor-pointer"
                        >
                          {simPlayingAudioUrl === msg.audioUrl ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-0.5 h-4 mb-1">
                            {[40, 75, 30, 95, 60, 100, 45, 80, 55, 90, 35, 70, 50, 85, 65, 40].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full transition-all ${
                                  simPlayingAudioUrl === msg.audioUrl
                                    ? 'bg-emerald-400 animate-pulse'
                                    : 'bg-emerald-600/70'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300">
                            <span>{msg.audioDuration || '0:28'}</span>
                            <span className="text-[9px] text-emerald-400/80 font-sans italic">PTT Áudio</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-100/90 leading-relaxed font-sans italic">
                        {msg.text.replace(/^🎙️[^\n]+\n/, '')}
                      </div>
                    </div>
                  ) : msg.isPix ? (
                    /* Se for PIX Copia e Cola */
                    <div className="w-full max-w-[320px] p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-slate-100 space-y-2.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5" />
                          PIX Copia e Cola
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          R$ {msg.pixAmount}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {msg.text.split('👇')[0]}
                      </p>

                      {msg.pixCode && (
                        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                          <div className="text-[10px] font-mono text-amber-200 break-all line-clamp-2 select-all">
                            {msg.pixCode}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyPix(msg.pixCode!)}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedPixCode ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Código Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Código PIX</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : msg.isOcr ? (
                    /* Se for Validação OCR */
                    <div className="w-full max-w-[320px] p-3.5 rounded-2xl bg-teal-950/70 border border-teal-500/40 text-slate-100 space-y-2 shadow-md">
                      <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                        <FileCheck2 className="w-4 h-4 text-teal-400" />
                        <span>Leitor OCR Anti-Golpe</span>
                      </div>
                      <p className="text-xs text-teal-100 whitespace-pre-wrap leading-relaxed font-sans">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    /* Mensagem de Texto Normal */
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        msg.sender === 'lead'
                          ? 'bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700/60'
                          : 'bg-indigo-950/70 text-slate-100 rounded-tl-none border border-indigo-500/30'
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de Digitação */}
              {isSimulatorThinking && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-3 py-2 rounded-xl w-fit">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span className="text-[10px] font-sans">Bot digitando resposta...</span>
                </div>
              )}
            </div>

            {/* Chips de Ação Rápida */}
            <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/60">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
                Simular Objeção ou Ação do Cliente:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSimulatorSend(undefined, 'Quero comprar, como pago no PIX?')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  🛒 Quero Comprar
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatorSend(undefined, 'Achei o valor muito caro, não tem desconto?')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  💸 Achei Caro (Downsell)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatorSend(undefined, 'Já paguei, segue o comprovante')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  🧾 Já Paguei (OCR)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatorSend(undefined, 'O curso tem garantia de devolução?')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  ❓ Tem Garantia?
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSimulatorSend} className="p-3 border-t border-slate-800 bg-[#0f1426] flex items-center gap-2">
              <input
                type="text"
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                placeholder="Responda como um cliente..."
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                type="submit"
                disabled={!simulatorInput.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Botão Flutuante do Copiloto IA (quando fechado) */}
        {!isCopilotOpen && (
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="absolute bottom-6 right-6 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-purple-600/40 font-bold text-xs border border-purple-400/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Copiloto IA WhatsPix</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-black/40 font-mono text-purple-200 border border-purple-400/30">
              GLM 5.3
            </span>
          </button>
        )}

        {/* COPILOTO IA CHAT DRAWER (NVIDIA NIM • Z.ai GLM 5.3 753B) */}
        {renderCopilotDrawer()}
      </div>

      {/* MODAL HISTÓRICO DE ALTERAÇÕES DA IA */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f1224] border border-purple-500/40 w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Histórico de Alterações do Funil</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {activeFunnel.aiMeta ? (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{activeFunnel.aiMeta.model}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(activeFunnel.aiMeta.timestamp || Date.now()).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeFunnel.aiMeta.explanation}</p>
                  {activeFunnel.aiMeta.changelog && activeFunnel.aiMeta.changelog.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-purple-500/20 text-[11px] text-purple-200">
                      {activeFunnel.aiMeta.changelog.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeFunnel.aiMeta.reasoning && (
                    <div className="pt-2 border-t border-purple-500/20">
                      <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block mb-1">
                        💭 Raciocínio Registrado:
                      </span>
                      <div className="p-2 rounded bg-black/40 text-[10px] text-purple-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {activeFunnel.aiMeta.reasoning}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhuma alteração registrada pela IA neste fluxo ainda.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WhatsPix AI Funnel Studio (Disponível no Canvas) */}
      {renderAiModal()}
    </div>
  );
};
