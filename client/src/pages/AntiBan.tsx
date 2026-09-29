import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Clock,
  Mic,
  Sliders,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Server
} from 'lucide-react';
import { WhatsAppInstance, AntiBanConfig } from '../types';
import { api } from '../services/api';

interface AntiBanProps {
  onNavigateTab?: (tab: any) => void;
}

export const AntiBan: React.FC<AntiBanProps> = ({ onNavigateTab }) => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [spintaxInput, setSpintaxInput] = useState('{Oi|Olá|Opa} {{nome}}, {tudo bem|como você está}?');
  const [spintaxOutputs, setSpintaxOutputs] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      const data = await api.getInstances();
      setInstances(data);
      if (data.length > 0 && !selectedInstance) {
        setSelectedInstance(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar instâncias:', err);
    }
  };

  const handleSaveAntiBan = async () => {
    if (!selectedInstance) return;
    try {
      const updated = await api.updateAntiBanConfig(selectedInstance.id, selectedInstance.antiBanConfig);
      setSelectedInstance(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Erro ao salvar antiban:', err);
    }
  };

  const testSpintax = () => {
    const results: string[] = [];
    for (let i = 0; i < 4; i++) {
      const spintaxRegex = /\{([^{}]+)\}/g;
      let text = spintaxInput.replace('{{nome}}', 'Cliente');
      while (spintaxRegex.test(text)) {
        text = text.replace(spintaxRegex, (_, choices) => {
          const options = choices.split('|');
          return options[Math.floor(Math.random() * options.length)];
        });
      }
      results.push(text);
    }
    setSpintaxOutputs(results);
  };

  if (instances.length === 0) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">Nenhum WhatsApp Conectado</h2>
          <p className="text-xs text-slate-400 max-w-md">
            As diretrizes anti-banimento (digitação humana, gravação de áudio, esteira de aquecimento progressivo e limites diários de disparo) são configuradas por chip ativo. Conecte sua instância para começar.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab && onNavigateTab('integrations')}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <span>Conectar WhatsApp em Conexões</span>
        </button>
      </div>
    );
  }

  if (!selectedInstance) {
    return <div className="p-8 text-slate-400 text-xs">Carregando sistema de proteção anti-banimento...</div>;
  }

  const { antiBanConfig } = selectedInstance;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/50 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Escudo de Proteção Anti-Banimento Blindado</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono">
                {selectedInstance.healthScore}% SEGURO
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Emulação de digitação humana, presença de gravação de áudio, esteira de aquecimento e jitter randômico.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAntiBan}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span>{saveSuccess ? 'Proteção Atualizada!' : 'Salvar Regras de Segurança'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Typing & Presence Emulation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Digitação Humanizada */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Emulação de Comportamento Humano no WhatsApp
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Velocidade Mínima de Digitação (ms/caractere)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={antiBanConfig.typingSpeedMinMs}
                    onChange={(e) =>
                      setSelectedInstance({
                        ...selectedInstance,
                        antiBanConfig: { ...antiBanConfig, typingSpeedMinMs: parseInt(e.target.value) }
                      })
                    }
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-400 w-12 text-right">
                    {antiBanConfig.typingSpeedMinMs}ms
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">Média humana: 40-50ms</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Velocidade Máxima de Digitação (ms/caractere)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={antiBanConfig.typingSpeedMaxMs}
                    onChange={(e) =>
                      setSelectedInstance({
                        ...selectedInstance,
                        antiBanConfig: { ...antiBanConfig, typingSpeedMaxMs: parseInt(e.target.value) }
                      })
                    }
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-mono font-bold text-emerald-400 w-12 text-right">
                    {antiBanConfig.typingSpeedMaxMs}ms
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">Gera variação natural com jitter</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Intervalo Randômico Mínimo entre Mensagens (Segundos)
                </label>
                <input
                  type="number"
                  value={antiBanConfig.randomIntervalMinSec}
                  onChange={(e) =>
                    setSelectedInstance({
                      ...selectedInstance,
                      antiBanConfig: { ...antiBanConfig, randomIntervalMinSec: parseInt(e.target.value) }
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Intervalo Randômico Máximo entre Mensagens (Segundos)
                </label>
                <input
                  type="number"
                  value={antiBanConfig.randomIntervalMaxSec}
                  onChange={(e) =>
                    setSelectedInstance({
                      ...selectedInstance,
                      antiBanConfig: { ...antiBanConfig, randomIntervalMaxSec: parseInt(e.target.value) }
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Presença de Áudio */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Simulação Real de "Gravando áudio..."
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Envia presença de gravação proporcional à duração do áudio antes do disparo PTT
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={antiBanConfig.simulateAudioRecording}
                  onChange={(e) =>
                    setSelectedInstance({
                      ...selectedInstance,
                      antiBanConfig: { ...antiBanConfig, simulateAudioRecording: e.target.checked }
                    })
                  }
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Spintax Engine Tester */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Motor de Spintax Anti-Padrão
              </h3>
              <button
                onClick={testSpintax}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Testar Variações</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mensagem com tags Spintax</label>
              <input
                type="text"
                value={spintaxInput}
                onChange={(e) => setSpintaxInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {spintaxOutputs.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Variações Únicas Geradas para Cada Lead:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spintaxOutputs.map((out, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
                    >
                      {idx + 1}. "{out}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Warmup Calendar & Safety Score */}
        <div className="space-y-6">
          {/* Health Score Gauge */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Medidor de Risco de Banimento
            </h3>

            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-emerald-500/30 bg-emerald-500/5 relative">
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {selectedInstance.healthScore}%
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-400 mt-2">Nível de Risco: Seguro</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero denúncias nas últimas 24h. Taxa de resposta de leads acima de 48%.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Disparos Hoje:</span>
                <span className="text-white font-mono font-bold">
                  {selectedInstance.messagesSentToday} / {selectedInstance.warmupTarget}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      (selectedInstance.messagesSentToday / selectedInstance.warmupTarget) * 100,
                      100
                    )}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Esteira de Aquecimento de Chips */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Aquecimento Progressivo (Warmup)
              </h3>
              <span className="text-xs font-mono font-bold text-amber-300">
                Dia {selectedInstance.warmupDay}/21
              </span>
            </div>

            <p className="text-xs text-slate-400">
              A esteira aumenta a cota diária de forma gradual para amadurecer o chip no algoritmo do WhatsApp.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center text-emerald-300">
                <span>Dias 1 a 3 (Início seguro)</span>
                <span className="font-mono font-bold">15 msgs/dia ✓</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center text-emerald-300">
                <span>Dias 4 a 7 (Grupos & Respostas)</span>
                <span className="font-mono font-bold">45 msgs/dia ✓</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex justify-between items-center text-emerald-300">
                <span>Dias 8 a 14 (Conversas X1)</span>
                <span className="font-mono font-bold">120 msgs/dia ✓</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 flex justify-between items-center text-amber-300">
                <span>Dias 15 a 21 (Fase Atual)</span>
                <span className="font-mono font-bold">300 msgs/dia ⏳</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-slate-500">
                <span>Dia 22+ (Escala Máxima)</span>
                <span className="font-mono font-bold">600+ msgs/dia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
