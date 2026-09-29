import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  DollarSign,
  Building,
  Hash,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ReceiptAnalysisResult } from '../types';
import { api } from '../services/api';

export const ProofReader: React.FC = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ReceiptAnalysisResult | null>(null);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      const data = await api.getProofSamples();
      setSamples(data);
    } catch (err) {
      console.error('Erro ao carregar amostras:', err);
    }
  };

  const handleAnalyzeSample = async (sampleName: string) => {
    try {
      setAnalyzing(true);
      const res = await api.analyzeProof(sampleName, undefined, 197.0);
      setResult(res);
    } catch (err) {
      console.error('Erro ao analisar amostra:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    try {
      setAnalyzing(true);
      const res = await api.analyzeProof(undefined, file, 197.0);
      setResult(res);
    } catch (err) {
      console.error('Erro ao analisar comprovante enviado:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/40 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Reconhecimento Inteligente de Comprovantes OCR</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono">
                Multimodal Vision • Imagens & PDFs
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Validação automática de PIX, extração de valor, código E2E e detecção de golpe do falso comprovante/agendamento.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Sample Selector */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Upload Box */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              Enviar Comprovante (JPG, PNG ou PDF)
            </h3>

            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 group">
              <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                Clique para selecionar ou arraste o arquivo
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                Suporta prints de celular (Nubank, Inter, Itaú, etc.) ou PDFs bancários
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate max-w-xs font-mono">{selectedFile.name}</span>
                <span className="text-emerald-400 font-semibold">Carregado ✓</span>
              </div>
            )}
          </div>

          {/* Quick Preset Samples */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Testar com Amostras Reais
            </h3>
            <p className="text-xs text-slate-400">
              Clique em uma das amostras para ver a IA analisando em tempo real:
            </p>

            <div className="space-y-2 pt-1">
              {samples.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnalyzeSample(sample.name)}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    sample.type === 'scheduled'
                      ? 'bg-red-950/20 border-red-500/30 hover:bg-red-950/40 text-red-200'
                      : 'bg-slate-950 border-slate-800 hover:border-emerald-500/40 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 ${sample.type === 'scheduled' ? 'text-red-400' : 'text-emerald-400'}`} />
                    <span>{sample.description}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deep OCR Inspection Result */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                Resultado da Análise Multimodal
              </h3>

              {result && (
                <span className="text-xs font-mono text-slate-400">
                  Confiabilidade: <strong className="text-emerald-400">{result.confidenceScore}%</strong>
                </span>
              )}
            </div>

            {analyzing ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3">
                <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
                <span>Processando imagem/PDF com visão computacional OCR...</span>
              </div>
            ) : result ? (
              <div className="space-y-5">
                {/* Status Hero Card */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    result.isValid
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.isValid ? (
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold">
                        {result.isValid ? 'COMPROVANTE VÁLIDO E LIQUIDADO' : 'SUSPEITA DE FRAUDE / AGENDAMENTO'}
                      </h4>
                      <p className="text-xs opacity-90">{result.verificationNotes}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${
                      result.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {result.isValid ? 'APROVADO ✓' : 'BLOQUEADO ✕'}
                  </span>
                </div>

                {/* Fraud Alerts Warning if any */}
                {result.suspicionAlerts.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" /> Alertas Críticos Antifraude:
                    </span>
                    {result.suspicionAlerts.map((alt, i) => (
                      <p key={i} className="pl-5 text-red-200">
                        • {alt}
                      </p>
                    ))}
                  </div>
                )}

                {/* Extracted Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Building className="w-3.5 h-3.5 text-emerald-400" /> Instituição Bancária
                    </div>
                    <div className="text-slate-200 font-semibold">{result.bankName}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor Transferido
                    </div>
                    <div className="text-emerald-400 font-black font-mono text-base">
                      R$ {result.amount.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Hash className="w-3.5 h-3.5 text-indigo-400" /> Código E2E / Autenticação
                    </div>
                    <div className="text-slate-300 font-mono text-[10px] break-all">
                      {result.transactionId}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Data e Hora de Efetivação
                    </div>
                    <div className="text-slate-200 font-mono">{result.date}</div>
                  </div>
                </div>

                {/* Receiver / Destinatário */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <span className="text-[11px] text-slate-500 block">Favorecido (Destinatário):</span>
                  <span className="text-slate-200 font-medium">{result.receiverName}</span>
                  <span className="text-slate-400 text-[11px] block font-mono">
                    Chave PIX: {result.pixKeyOrDoc}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">Nenhum Comprovante em Análise</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Faça upload de um comprovante em PNG/JPG ou selecione um caso de teste ao lado para validar valor, autenticidade e detecção antifraude.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
