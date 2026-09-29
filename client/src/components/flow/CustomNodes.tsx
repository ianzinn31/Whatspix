import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Play,
  Pause,
  MessageSquare,
  GitFork,
  Tag as TagIcon,
  Users,
  Settings2,
  Sparkles,
  QrCode,
  FileCheck2,
  Copy,
  Trash2,
  Clock,
  CheckCircle2,
  Mic,
  PhoneCall,
  ListFilter,
  LayoutGrid,
  Target,
  Timer,
  Building2,
  Globe,
  DollarSign,
  Sliders,
  Share2,
  LayoutTemplate,
  Bell,
  Bot,
  Columns3,
  CreditCard,
  FileText
} from 'lucide-react';
import { ensurePlayableAudioUrl } from '../../utils/audioUtils';

export interface NodeData {
  label?: string;
  delay?: string;
  text?: string;
  conditionText?: string;
  outputs?: Array<{ label: string; count: number }>;
  tag?: string;
  tags?: string[];
  action?: string;
  goal?: string;
  amount?: string;
  pixKey?: string;
  pixReceiver?: string;
  audioDuration?: string;
  audioScript?: string;
  audioFileName?: string;
  voiceModel?: string;
  audioUrl?: string;
  files?: Array<{ name: string; size?: string }>;
  variables?: string[];
  timeoutDuration?: string;
  callDuration?: string;
  menuButtons?: string[];
  carouselCards?: Array<{ title: string; desc: string }>;
  pixelEvent?: string;
  smartDelayMode?: string;
  departmentName?: string;
  webhookUrl?: string;
  manipulatorExpr?: string;
  targetFunnelId?: string;
  targetFunnelName?: string;
  templateName?: string;
  notificationMessage?: string;
  kanbanStage?: string;
  paymentGateway?: string;
}

// ============================================
// 1. INÍCIO (Start Node - Green)
// ============================================
export const StartNode: React.FC<NodeProps> = ({ selected }) => {
  return (
    <div
      className={`min-w-[170px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-emerald-600/40'
      }`}
    >
      <div className="bg-[#10b981] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-950 font-bold text-xs">
          <div className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center">
            <Play className="w-2.5 h-2.5 fill-current text-slate-950" />
          </div>
          <span>Início</span>
        </div>
      </div>
      <div className="bg-[#0b101d] p-3 text-[11px] text-slate-300">
        <span>Gatilho de entrada do fluxo</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 2. MENSAGEM (Message Node - Royal Blue Leona AI)
// ============================================
export const MessageNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  const files = nodeData.files || [];
  return (
    <div
      className={`w-[270px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-sky-400 ring-2 ring-sky-500/50' : 'border-sky-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#2563eb] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Mensagem</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100">
          <Copy className="w-3 h-3 cursor-pointer" />
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#0f172a] p-3 space-y-2 text-xs">
        {/* Delay badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 w-fit">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>Delay: {nodeData.delay || '5s - 10s'}</span>
        </div>

        {/* Text message */}
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-200 leading-relaxed font-sans">
          <p className="line-clamp-3">
            {nodeData.text || 'Digite a mensagem humanizada aqui...'}
          </p>
        </div>

        {/* Audio badge if present */}
        {(nodeData.audioFileName || nodeData.audioUrl) && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
            <Mic className="w-3 h-3 text-indigo-400" />
            <span className="font-mono truncate">{nodeData.audioFileName || '1.ogg'}</span>
          </div>
        )}

        {/* File / PDF attachments */}
        {files.length > 0 && (
          <div className="space-y-1 pt-1">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                <FileText className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">Arquivo: {file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 3. AGUARDA RESPOSTA (Wait Reply Node - Orange Leona AI)
// ============================================
export const WaitReplyNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[260px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-orange-400 ring-2 ring-orange-500/50' : 'border-orange-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#ea580c] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>Aguarda Resposta</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Copy className="w-3 h-3 cursor-pointer" />
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#141018] p-3 space-y-2.5 text-xs">
        {/* Output 1: Respondeu */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-200 relative flex items-center justify-between">
          <span className="font-semibold text-orange-200">Aguardar pela resposta do cliente.</span>
          <Handle
            id="replied"
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-orange-400 !border-2 !border-[#0b101d] !top-1/2"
          />
        </div>

        {/* Output 2: Timeout / Caso não responda */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-orange-500/20 text-[11px] text-slate-400 relative space-y-1">
          <span className="text-[10px] text-slate-500 block">Ou caso não responda:</span>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-orange-400 font-mono">
              {nodeData.timeoutDuration || 'Após 35 minutos'}
            </span>
          </div>
          <Handle
            id="timeout"
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-[#0b101d] !top-1/2"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// 4. CONDICIONAL (Condition Node - Cyan / Light Blue)
// ============================================
export const ConditionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[270px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-500/50' : 'border-cyan-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0284c7] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <GitFork className="w-3.5 h-3.5" />
          <span>Condicional</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Copy className="w-3 h-3 cursor-pointer" />
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#0b1324] p-3 space-y-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-200 relative">
          <span className="font-semibold block text-cyan-300 mb-0.5">Regra Ativa:</span>
          <span>{nodeData.conditionText || 'Etiqueta igual PARTE 1'}</span>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-[#0b101d] !top-1/2"
          />
        </div>

        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 relative">
          <span>Caso não atenda a condição o fluxo continua por aqui</span>
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-slate-500 !border-2 !border-[#0b101d] !top-1/2"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// 5. ETIQUETAS (Tag Node - Purple)
// ============================================
export const TagNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  const tags = nodeData.tags || (nodeData.tag ? [nodeData.tag] : ['PARTE 1']);
  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-purple-400 ring-2 ring-purple-500/50' : 'border-purple-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#7c3aed] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <TagIcon className="w-3.5 h-3.5" />
          <span>Etiquetas</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Copy className="w-3 h-3 cursor-pointer" />
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#0f1224] p-3 space-y-2 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold text-[11px] inline-flex items-center gap-1 border border-purple-500/30"
            >
              <TagIcon className="w-2.5 h-2.5 text-purple-400" />
              <span>{t}</span>
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-400">Adicionar etiquetas ao cliente</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 6. BOTÃO PIX (Pix Button Node - Green Leona AI)
// ============================================
export const PixButtonNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-emerald-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#059669] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <QrCode className="w-3.5 h-3.5" />
          <span>Botão PIX</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Copy className="w-3 h-3 cursor-pointer" />
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#0e1917] p-3 space-y-1.5 text-xs">
        <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30">
          <span className="text-[10px] text-slate-400 block font-mono">
            PIX: {nodeData.pixKey || '11999999999'} - {nodeData.pixReceiver || 'maria'}
          </span>
          <span className="text-emerald-400 font-bold font-mono text-sm block mt-0.5">
            R$ {nodeData.amount || '97,00'}
          </span>
        </div>
        <span className="text-[10px] text-emerald-300 block">Enviar botão de pagamento PIX</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// Alias para compatibilidade
export const PixNode = PixButtonNode;

// ============================================
// 7. LIGAR WHATSAPP (Call Node - Teal Leona AI)
// ============================================
export const CallNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[260px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-teal-400 ring-2 ring-teal-500/50' : 'border-teal-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0d9488] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Ligar</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">VOZ</span>
      </div>

      <div className="bg-[#0b1818] p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 p-2 rounded-xl border border-teal-500/30">
          <span>Tempo de toque:</span>
          <span className="font-bold text-teal-400 font-mono">{nodeData.callDuration || '15s'}</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Faz uma ligação WhatsApp pro lead. Toque 1-15s; com áudio, soma a duração do arquivo.
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 8. MENU INTERATIVO (Menu Node - Purple)
// ============================================
export const MenuNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  const buttons = nodeData.menuButtons || ['Quero saber mais', 'Falar com especialista', 'Já sou cliente'];
  return (
    <div
      className={`w-[260px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-purple-400 ring-2 ring-purple-500/50' : 'border-purple-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#9333ea] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <ListFilter className="w-3.5 h-3.5" />
          <span>Menu</span>
        </div>
      </div>

      <div className="bg-[#120e20] p-3 space-y-2 text-xs">
        <span className="text-[11px] text-slate-300 block">Botões interativos WhatsApp:</span>
        <div className="space-y-1.5">
          {buttons.map((btn, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-900 border border-purple-500/30 text-[11px] text-purple-200 relative flex items-center justify-between"
            >
              <span className="truncate pr-4">{btn}</span>
              <Handle
                id={`btn-${idx}`}
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d] !top-1/2"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 9. CARROSSEL (Carousel Node - Cyan)
// ============================================
export const CarouselNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  const cards = nodeData.carouselCards || [{ title: 'Item 1', desc: 'Oferta Principal' }, { title: 'Item 2', desc: 'Downsell' }];
  return (
    <div
      className={`w-[260px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-500/50' : 'border-cyan-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0891b2] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Carrossel</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-mono">{cards.length} cards</span>
      </div>

      <div className="bg-[#0b161f] p-3 text-xs space-y-1.5">
        <span className="text-slate-300 text-[11px] block">Carrossel de Produtos / Aulas</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {cards.map((c, i) => (
            <div key={i} className="min-w-[100px] p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
              <span className="font-bold text-cyan-300 block truncate">{c.title}</span>
              <span className="text-slate-400 block truncate">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 10. PIXEL META / CAPI (Pixel Node - Yellow/Amber)
// ============================================
export const PixelNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-amber-400 ring-2 ring-amber-500/50' : 'border-amber-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#d97706] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Target className="w-3.5 h-3.5" />
          <span>Pixel</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">CAPI</span>
      </div>

      <div className="bg-[#181309] p-3 space-y-1.5 text-xs">
        <div className="p-2 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-between">
          <span className="text-slate-300 text-[11px]">Evento:</span>
          <span className="font-bold text-amber-300 font-mono">{nodeData.pixelEvent || 'Purchase'}</span>
        </div>
        <span className="text-[10px] text-slate-400 block">Dispara conversão no Meta Ads / CAPI</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 11. INTERVALO INTELIGENTE (Smart Delay Node - Sky)
// ============================================
export const SmartDelayNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-sky-400 ring-2 ring-sky-500/50' : 'border-sky-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0284c7] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Timer className="w-3.5 h-3.5" />
          <span>Intervalo Inteligente</span>
        </div>
      </div>

      <div className="bg-[#0c141d] p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 p-2 rounded-xl border border-sky-500/30">
          <span>Tempo de espera:</span>
          <span className="font-bold text-sky-400 font-mono">{nodeData.delay || '2 horas'}</span>
        </div>
        <span className="text-[10px] text-slate-400 block">
          {nodeData.smartDelayMode || 'Respeita horário comercial (08h às 18h)'}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 12. DEPARTAMENTO (Department Node - Indigo)
// ============================================
export const DepartmentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-indigo-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#6366f1] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Building2 className="w-3.5 h-3.5" />
          <span>Departamento</span>
        </div>
      </div>

      <div className="bg-[#0f1124] p-3 space-y-1.5 text-xs">
        <div className="p-2 rounded-lg bg-slate-900 border border-indigo-500/30">
          <span className="text-slate-400 text-[10px] block">Transferir para:</span>
          <span className="font-bold text-indigo-300 text-[11px]">
            {nodeData.departmentName || 'Comercial / Vendas'}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 13. INTEGRAÇÃO WEBHOOK (Integration Node - Blue)
// ============================================
export const IntegrationNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-blue-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#2563eb] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Globe className="w-3.5 h-3.5" />
          <span>Integração</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">HTTP</span>
      </div>

      <div className="bg-[#0c1222] p-3 space-y-1.5 text-xs">
        <span className="text-[10px] text-slate-400 block truncate">
          {nodeData.webhookUrl || 'Webhook / Kie.ai / CRM'}
        </span>
        <span className="text-[10px] text-blue-400 font-semibold block">Envio síncrono de dados</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 14. VENDA APROVADA (Approved Sale Node - Green)
// ============================================
export const ApprovedSaleNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-emerald-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#16a34a] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <DollarSign className="w-3.5 h-3.5" />
          <span>$ Venda aprovada</span>
        </div>
      </div>

      <div className="bg-[#0d1c14] p-3 space-y-1.5 text-xs">
        <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Valor:</span>
          <span className="font-bold text-emerald-400 font-mono text-sm">
            R$ {nodeData.amount || '197,00'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block">Registra conversão e métricas de ROI</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 15. MANIPULADOR (Manipulator Node - Orange)
// ============================================
export const ManipulatorNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-orange-400 ring-2 ring-orange-500/50' : 'border-orange-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#ea580c] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Sliders className="w-3.5 h-3.5" />
          <span>Manipulador</span>
        </div>
      </div>

      <div className="bg-[#19110b] p-3 space-y-1.5 text-xs">
        <span className="text-[10px] text-slate-400 block">Variáveis / Campos:</span>
        <div className="p-2 rounded-lg bg-slate-900 border border-orange-500/30 font-mono text-[10px] text-orange-300">
          {nodeData.manipulatorExpr || "lead.etapa = 'checkout'"}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-orange-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 16. CONEXÃO DE FLUXO (Flow Connection Node - Pink)
// ============================================
export const FlowConnectionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-pink-400 ring-2 ring-pink-500/50' : 'border-pink-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-pink-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#db2777] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Share2 className="w-3.5 h-3.5" />
          <span>Conexão de Fluxo</span>
        </div>
      </div>

      <div className="bg-[#1c0c16] p-3 space-y-1.5 text-xs">
        <span className="text-[10px] text-slate-400 block">Transfere lead para:</span>
        <div className="p-2 rounded-lg bg-slate-900 border border-pink-500/30 text-pink-300 font-semibold text-[11px] truncate">
          {nodeData.targetFunnelName || 'Recuperação de Carrinho'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-pink-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 17. TEMPLATE WHATSAPP (Template Node - Sky)
// ============================================
export const TemplateNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-sky-400 ring-2 ring-sky-500/50' : 'border-sky-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0284c7] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Template WhatsApp</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">HSM</span>
      </div>

      <div className="bg-[#0b1420] p-3 space-y-1.5 text-xs">
        <span className="text-sky-300 font-mono text-[11px] block">
          {nodeData.templateName || 'aviso_oferta_exclusiva'}
        </span>
        <span className="text-[10px] text-emerald-400 block">Modelo aprovado pela Meta ✓</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-sky-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 18. NOTIFICAÇÃO (Notification Node - Teal)
// ============================================
export const NotificationNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-teal-400 ring-2 ring-teal-500/50' : 'border-teal-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0f766e] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Bell className="w-3.5 h-3.5" />
          <span>Notificação</span>
        </div>
      </div>

      <div className="bg-[#0a1816] p-3 space-y-1 text-xs">
        <p className="text-[11px] text-slate-200">
          {nodeData.notificationMessage || 'Alerta: Lead quente solicitou contato comercial!'}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 19. BLOCO DE IA (Ai Block Node - Emerald)
// ============================================
export const AiBlockNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-emerald-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#10b981] px-3.5 py-2 flex items-center justify-between text-slate-950">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Bot className="w-3.5 h-3.5" />
          <span>Bloco de IA</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950/20 font-mono font-bold">NVIDIA</span>
      </div>

      <div className="bg-[#0a1814] p-3 space-y-1.5 text-xs">
        <span className="text-[11px] font-semibold text-emerald-300 block">
          {nodeData.goal || 'Análise de Intenção & Resumo'}
        </span>
        <p className="text-[10px] text-slate-400">Processa a conversa com prompt customizado</p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 20. KANBAN CRM (Kanban Node - Purple)
// ============================================
export const KanbanNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-purple-400 ring-2 ring-purple-500/50' : 'border-purple-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#7c3aed] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Columns3 className="w-3.5 h-3.5" />
          <span>Kanban</span>
        </div>
      </div>

      <div className="bg-[#120e20] p-3 space-y-1.5 text-xs">
        <span className="text-[10px] text-slate-400 block">Mover lead para coluna:</span>
        <div className="p-2 rounded-lg bg-slate-900 border border-purple-500/30 text-purple-300 font-semibold text-[11px]">
          {nodeData.kanbanStage || 'Em Negociação (X1)'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 21. PAGAMENTO / CHECKOUT (Payment Node - Violet)
// ============================================
export const PaymentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-violet-400 ring-2 ring-violet-500/50' : 'border-violet-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#7c3aed] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pagamento</span>
        </div>
      </div>

      <div className="bg-[#130d22] p-3 space-y-1.5 text-xs">
        <span className="text-[10px] text-slate-400 block">Checkout Multi-Moeda:</span>
        <div className="p-2 rounded-lg bg-slate-900 border border-violet-500/30 text-violet-300 font-semibold text-[11px]">
          {nodeData.paymentGateway || 'Kiwify / Hotmart / Asaas'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 22. DISTRIBUIDOR (Distributor Node - Amber)
// ============================================
export const DistributorNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  const outputs = nodeData.outputs || [
    { label: 'Saída 1', count: 11 },
    { label: 'Saída 2', count: 12 },
    { label: 'Saída 3', count: 11 },
    { label: 'Saída 4', count: 10 }
  ];

  return (
    <div
      className={`w-[240px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-amber-400 ring-2 ring-amber-500/50' : 'border-amber-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#d97706] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Users className="w-3.5 h-3.5" />
          <span>Distribuidor</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Copy className="w-3 h-3 cursor-pointer" />
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#121624] p-2 space-y-1.5 text-xs">
        {outputs.map((out, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 relative"
          >
            <span className="font-semibold">{out.label}</span>
            <span className="text-[10px] text-slate-500 font-mono">Qtd: {out.count}</span>
            <Handle
              id={`out-${idx}`}
              type="source"
              position={Position.Right}
              className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#0b101d] !top-1/2"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 23. CONTROLADOR DE CHAT (Dark Slate)
// ============================================
export const ChatControllerNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[220px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-slate-400 ring-2 ring-slate-500/50' : 'border-slate-700/60'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-slate-800 px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Settings2 className="w-3.5 h-3.5" />
          <span>Controlador de Chat</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Trash2 className="w-3 h-3 cursor-pointer" />
        </div>
      </div>

      <div className="bg-[#0b0f19] p-3 text-xs">
        <div className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
          {nodeData.action || 'Atendimento (IA Ativa)'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 24. COPILOTO / AGENTE DE IA (Gradient Violet)
// ============================================
export const AiAgentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  return (
    <div
      className={`w-[270px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-purple-400 ring-2 ring-purple-500/50' : 'border-purple-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agente de IA</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">AUTÔNOMO</span>
      </div>

      <div className="bg-[#0f1124] p-3 space-y-1.5 text-xs">
        <span className="text-[11px] font-bold text-slate-200 block">
          {nodeData.goal || 'Qualificação SPIN Selling & Fechamento'}
        </span>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Executa negociação humanizada 1 a 1 com RAG e aciona emissão de PIX.
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 25. LEITOR OCR COMPROVANTE (Ocr Node - Teal)
// ============================================
export const OcrNode: React.FC<NodeProps> = ({ selected }) => {
  return (
    <div
      className={`w-[250px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-teal-400 ring-2 ring-teal-500/50' : 'border-teal-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-[#0f766e] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Leitor OCR Comprovante</span>
        </div>
      </div>

      <div className="bg-[#0d161d] p-3 space-y-1.5 text-xs">
        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Antifraude Ativo
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Bloqueia agendamento e autovalida pagamentos instantâneos.
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// 26. MENSAGEM DE ÁUDIO (Audio Node - Fuchsia / Rose)
// ============================================
export const AudioNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as NodeData;
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    const audioSrc = ensurePlayableAudioUrl(nodeData.audioUrl);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('Erro ao tocar áudio:', err);
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = (err) => {
      console.warn('Erro no elemento de áudio:', err);
      setIsPlaying(false);
    };
  };

  return (
    <div
      className={`w-[280px] rounded-2xl overflow-hidden shadow-2xl transition-all border ${
        selected ? 'border-fuchsia-400 ring-2 ring-fuchsia-500/50' : 'border-fuchsia-600/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-fuchsia-400 !border-2 !border-[#0b101d]"
      />
      <div className="bg-gradient-to-r from-fuchsia-600 to-rose-600 px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Mic className="w-3.5 h-3.5" />
          <span>Áudio WhatsApp (IA)</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono font-semibold">
          FISH AUDIO
        </span>
      </div>

      <div className="bg-[#140f21] p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-fuchsia-300 bg-fuchsia-950/60 px-2 py-0.5 rounded-lg border border-fuchsia-500/30">
            <Clock className="w-3 h-3 text-fuchsia-400" />
            <span>Delay: {nodeData.delay || '8s'}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {nodeData.audioDuration || '0:28'}
          </span>
        </div>

        {/* Audio Waveform Visualization & Play Button */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isPlaying
                ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/50 scale-105'
                : 'bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white'
            }`}
            title={isPlaying ? 'Pausar áudio' : 'Ouvir áudio gravado'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-0.5 h-4 px-1">
            {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85, 60, 40].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isPlaying ? 'bg-fuchsia-400 animate-pulse' : 'bg-fuchsia-400/60'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(25, (h + (i % 3) * 20) % 100)}%` : `${h}%`
                }}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono text-fuchsia-300 font-semibold shrink-0">
            {nodeData.audioDuration || '0:28'}
          </span>
        </div>

        <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed font-sans italic">
          "{nodeData.audioScript || nodeData.text || 'Oi {{nome}}, passando para te avisar da sua vaga especial...'}"
        </p>

        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
          <span
            className={`px-1.5 py-0.5 rounded font-mono font-semibold ${
              nodeData.audioUrl
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {nodeData.audioUrl ? 'ÁUDIO GRAVADO ✓' : 'FISH AUDIO'}
          </span>
          <span className="text-slate-400 italic">WhatsApp PTT</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-fuchsia-400 !border-2 !border-[#0b101d]"
      />
    </div>
  );
};

// ============================================
// MAPA COMPLETO DE NÓS (Com aliases legados)
// ============================================
export const customNodeTypes = {
  startNode: StartNode,
  messageNode: MessageNode,
  waitReplyNode: WaitReplyNode,
  conditionNode: ConditionNode,
  distributorNode: DistributorNode,
  tagNode: TagNode,
  chatControllerNode: ChatControllerNode,
  aiAgentNode: AiAgentNode,
  aiBlockNode: AiBlockNode,
  pixNode: PixNode,
  pixButtonNode: PixButtonNode,
  ocrNode: OcrNode,
  audioNode: AudioNode,
  callNode: CallNode,
  menuNode: MenuNode,
  carouselNode: CarouselNode,
  pixelNode: PixelNode,
  smartDelayNode: SmartDelayNode,
  departmentNode: DepartmentNode,
  integrationNode: IntegrationNode,
  approvedSaleNode: ApprovedSaleNode,
  manipulatorNode: ManipulatorNode,
  flowConnectionNode: FlowConnectionNode,
  templateNode: TemplateNode,
  notificationNode: NotificationNode,
  kanbanNode: KanbanNode,
  paymentNode: PaymentNode,

  // Aliases para compatibilidade total com grafos anteriores
  trigger: StartNode,
  message: MessageNode,
  delay: SmartDelayNode,
  audio: AudioNode,
  ai_agent: AiAgentNode,
  pix_generator: PixButtonNode,
  ocr_checker: OcrNode,
  condition: ConditionNode,
  tag: TagNode,
  wait_reply: WaitReplyNode,
  call: CallNode,
  menu: MenuNode,
  carousel: CarouselNode,
  pixel: PixelNode,
  department: DepartmentNode,
  integration: IntegrationNode,
  approved_sale: ApprovedSaleNode,
  manipulator: ManipulatorNode,
  flow_connection: FlowConnectionNode,
  template: TemplateNode,
  notification: NotificationNode,
  kanban: KanbanNode,
  payment: PaymentNode
};
