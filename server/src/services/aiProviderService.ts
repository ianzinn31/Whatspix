import axios from 'axios';
import { db } from '../store/db.js';

export interface ProviderDefinition {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  envKeyName: string;
  multipleKeysEnvName?: string;
  envModelName?: string;
}

export interface NvidiaModelItem {
  id: string;
  name: string;
  creator: string;
  description: string;
  contextLength?: number;
  recommendedRole: string;
  isDefault?: boolean;
}

export const POPULAR_NVIDIA_MODELS: NvidiaModelItem[] = [
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision Instruct',
    creator: 'Meta / NVIDIA',
    description: 'Ultra-rápido (latência sub-segundo ~700ms), visão multimodal OCR e excelente português brasileiro.',
    contextLength: 128000,
    recommendedRole: 'Vendas X1, Fechamento & Multimodal (Ativo)',
    isDefault: true
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    creator: 'Meta / NVIDIA',
    description: 'Estado da arte em persuasão, português brasileiro natural e fechamento de vendas.',
    contextLength: 128000,
    recommendedRole: 'Vendas X1 & Fechamento Avançado'
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1',
    creator: 'DeepSeek / NVIDIA',
    description: 'Raciocínio profundo, resolução de objeções complexas e argumentação lógica.',
    contextLength: 64000,
    recommendedRole: 'Raciocínio Lógico & Quebra de Objeções'
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Llama 3.1 Nemotron 70B',
    creator: 'NVIDIA',
    description: 'Modelo otimizado pela própria NVIDIA com alinhamento refinado para conversação humana.',
    contextLength: 128000,
    recommendedRole: 'Conversação Humana & Pós-Venda'
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    creator: 'Meta / NVIDIA',
    description: 'O maior modelo de pesos abertos do mundo. Máxima capacidade de entendimento.',
    contextLength: 128000,
    recommendedRole: 'Super Inteligência & Casos Complexos'
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    creator: 'Meta / NVIDIA',
    description: 'Ultra-rápido com latência mínima para respostas instantâneas no WhatsApp.',
    contextLength: 128000,
    recommendedRole: 'Velocidade Máxima & Respostas Curtas'
  },
  {
    id: 'mistralai/mixtral-8x22b-instruct-v0.1',
    name: 'Mixtral 8x22B Instruct',
    creator: 'Mistral AI / NVIDIA',
    description: 'Arquitetura Mixture-of-Experts para alta precisão em regras e instruções.',
    contextLength: 64000,
    recommendedRole: 'Precisão em Regras de Negócio'
  },
  {
    id: 'qwen/qwen2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    creator: 'Alibaba / NVIDIA',
    description: 'Excelente para tarefas multilíngues e instruções estruturadas.',
    contextLength: 128000,
    recommendedRole: 'Instruções Detalhadas'
  }
];

export const SUPPORTED_PROVIDERS: ProviderDefinition[] = [
  {
    id: 'openrouter_glm',
    name: 'OpenRouter: Z.ai GLM 5.3 (Arquiteto & Engenheiro de Funis)',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'z-ai/glm-5.3',
    envKeyName: 'OPENROUTER_API_KEY',
    envModelName: 'SYSTEM_ARCHITECT_MODEL'
  },
  {
    id: 'nvidia_vision',
    name: 'NVIDIA NIM: Llama 3.2 11B Vision Instruct (Principal)',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.2-11b-vision-instruct',
    envKeyName: 'NVIDIA_API_KEY',
    multipleKeysEnvName: 'NVIDIA_API_KEYS',
    envModelName: 'NVIDIA_MODEL_TIER1'
  },
  {
    id: 'nvidia_llama70b',
    name: 'NVIDIA NIM: Llama 3.3 70B Instruct (Vendas X1)',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    envKeyName: 'NVIDIA_API_KEY',
    multipleKeysEnvName: 'NVIDIA_API_KEYS',
    envModelName: 'NVIDIA_MODEL_TIER1'
  },
  {
    id: 'nvidia_llama8b',
    name: 'NVIDIA NIM: Llama 3.1 8B Instruct (Ultra-Rápido)',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.1-8b-instruct',
    envKeyName: 'NVIDIA_API_KEY',
    multipleKeysEnvName: 'NVIDIA_API_KEYS',
    envModelName: 'NVIDIA_MODEL_TIER5'
  },
  {
    id: 'nvidia_deepseek_r1',
    name: 'NVIDIA NIM: DeepSeek R1 (Raciocínio & Objeções)',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'deepseek-ai/deepseek-r1',
    envKeyName: 'NVIDIA_API_KEY',
    multipleKeysEnvName: 'NVIDIA_API_KEYS',
    envModelName: 'NVIDIA_MODEL_TIER2'
  },
  {
    id: 'nvidia_nemotron',
    name: 'NVIDIA NIM: Nemotron 70B (Otimizado NVIDIA)',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct',
    envKeyName: 'NVIDIA_API_KEY',
    multipleKeysEnvName: 'NVIDIA_API_KEYS',
    envModelName: 'NVIDIA_MODEL_TIER3'
  },
  {
    id: 'nvidia_llama405b',
    name: 'NVIDIA NIM: Llama 3.1 405B (Super Modelo)',
    baseUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.1-405b-instruct',
    envKeyName: 'NVIDIA_API_KEY',
    multipleKeysEnvName: 'NVIDIA_API_KEYS',
    envModelName: 'NVIDIA_MODEL_TIER4'
  }
];

export interface AiGenerationResult {
  replyText: string;
  providerUsed: string;
  modelUsed: string;
  latencyMs: number;
  cascadedFrom?: string[];
  reasoning?: string;
}

export class AiProviderService {
  private static keyIndices: Record<string, number> = {};

  /**
   * Obtém as chaves disponíveis de um provedor (suporta chave única ou lista separada por vírgula)
   */
  static getProviderKeys(provider: ProviderDefinition, customKeys?: string): string[] {
    const keys: string[] = [];
    if (customKeys) {
      keys.push(...customKeys.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean));
    }
    const fromEnv = process.env[provider.envKeyName] || '';
    if (fromEnv) {
      keys.push(...fromEnv.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean));
    }
    const fromMultiEnv = provider.multipleKeysEnvName ? process.env[provider.multipleKeysEnvName] || '' : '';
    if (fromMultiEnv) {
      keys.push(...fromMultiEnv.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean));
    }

    return Array.from(new Set(keys)).filter((k) => k.length > 5);
  }

  /**
   * Executa a chamada em cascata (Cascading Fallback):
   * 1. OpenRouter (Z.ai GLM 5.3 para arquitetura de funis)
   * 2. NVIDIA NIM Llama 3.2 11B Vision / Llama 3.3 70B / 8B
   * 3. DeepSeek R1 / Nemotron
   * 4. Se todos falharem -> Fallback para regras locais de fechamento
   */
  static async generateWithCascade(params: {
    systemPrompt: string;
    userMessage: string;
    conversationHistory?: Array<{ sender: 'lead' | 'ai' | 'human'; content: string }>;
    customKeysMap?: Record<string, string>;
    maxTokens?: number;
    modelOverride?: string;
    temperature?: number;
  }): Promise<AiGenerationResult | null> {
    const { systemPrompt, userMessage, conversationHistory = [], customKeysMap = {}, maxTokens = 1200, modelOverride, temperature = 0.7 } = params;
    const attemptedProviders: string[] = [];

    // Prepara mensagens no formato OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Adiciona histórico recente (últimas 6 mensagens para manter contexto e economizar tokens)
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === 'lead' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Garante que a mensagem atual do usuário esteja no final
    messages.push({ role: 'user', content: userMessage });

    // Itera pelos provedores em cascata
    let providersToTry = [...SUPPORTED_PROVIDERS];
    const isGlmRequested = !!(modelOverride && (modelOverride.startsWith('z-ai/') || modelOverride.includes('glm')));
    const isNvidiaModel = !!(
      modelOverride &&
      (modelOverride.startsWith('meta/') ||
        modelOverride.startsWith('nvidia/') ||
        modelOverride.startsWith('deepseek-ai/') ||
        modelOverride.startsWith('mistralai/') ||
        modelOverride.startsWith('qwen/'))
    );

    if (isGlmRequested) {
      // Prioriza OpenRouter GLM se disponível, seguido por nvidia_vision e os outros
      providersToTry.sort((a, b) => {
        if (a.id === 'openrouter_glm') return -1;
        if (b.id === 'openrouter_glm') return 1;
        if (a.id === 'nvidia_vision') return -1;
        if (b.id === 'nvidia_vision') return 1;
        return 0;
      });
    } else if (isNvidiaModel) {
      // Quando um modelo NVIDIA for expressamente solicitado, consulta apenas provedores NVIDIA
      providersToTry = providersToTry.filter((p) => p.baseUrl.includes('nvidia.com'));
    } else if (!modelOverride) {
      // Para chamadas gerais de vendas X1 sem override, prioriza nvidia_vision ou nvidia_llama70b
      providersToTry.sort((a, b) => (a.id === 'nvidia_vision' ? -1 : 1));
    }

    for (const provider of providersToTry) {
      const keys = this.getProviderKeys(provider, customKeysMap[provider.id]);
      if (keys.length === 0) {
        continue; // Provedor não configurado, segue para o próximo
      }

      // Determina o modelo correto para este provedor específico:
      // Se modelOverride for um modelo de outro ecossistema (ex: 'z-ai/glm-5.3' no NVIDIA NIM),
      // o NVIDIA NIM não suporta z-ai/glm-5.3, então usamos provider.defaultModel (ex: meta/llama-3.2-11b-vision-instruct).
      const isNvidia = provider.baseUrl.includes('nvidia.com');
      let model = provider.defaultModel;

      if (modelOverride) {
        if (isNvidia) {
          // Se for provedor NVIDIA, só usa modelOverride se NÃO for do OpenRouter/GLM
          if (!modelOverride.startsWith('z-ai/') && !modelOverride.includes('glm')) {
            model = modelOverride;
          } else {
            model = provider.defaultModel;
          }
        } else {
          // Se for OpenRouter, OpenAI, etc.
          model = modelOverride;
        }
      } else {
        if (provider.id === 'nvidia_llama70b' && db.aiConfig.model) {
          model = db.aiConfig.model;
        } else if (provider.envModelName && process.env[provider.envModelName]) {
          model = process.env[provider.envModelName]!;
        }
      }

      // Tenta as chaves do provedor (rotação automática)
      for (let attempt = 0; attempt < keys.length; attempt++) {
        // Seleciona a chave atual usando round-robin
        const currentIndex = (this.keyIndices[provider.id] || 0) % keys.length;
        const activeKey = keys[currentIndex];
        this.keyIndices[provider.id] = currentIndex + 1;

        const startTime = Date.now();
        try {
          const isGlm = model && model.includes('glm');
          const effectiveMaxTokens = isGlm ? Math.min(maxTokens || 2048, 2500) : Math.min(maxTokens || 4000, 4096);
          console.log(`[AI Cascade] Tentando ${provider.name} (Modelo: ${model}, Chave: ${activeKey.slice(0, 8)}... MaxTokens: ${effectiveMaxTokens})...`);

          const res = await axios.post(
            provider.baseUrl,
            {
              model,
              messages,
              temperature,
              max_tokens: effectiveMaxTokens,
              top_p: 0.95
            },
            {
              headers: {
                Authorization: `Bearer ${activeKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 25000 // Máximo 25s por chamada para nunca estourar o timeout de 60s do Nginx
            }
          );

          const choice = res.data?.choices?.[0];
          const text = (choice?.message?.content || choice?.message?.reasoning_content || choice?.message?.reasoning || '').trim();
          const reasoning = (choice?.message?.reasoning_content || choice?.message?.reasoning || '').trim();

          if (text) {
            const latencyMs = Date.now() - startTime;
            console.log(`✅ [AI Cascade] Sucesso via ${provider.name} (${latencyMs}ms)!`);
            return {
              replyText: text,
              providerUsed: provider.name,
              modelUsed: model,
              latencyMs,
              cascadedFrom: attemptedProviders.length > 0 ? attemptedProviders : undefined,
              reasoning: reasoning || undefined
            };
          }
        } catch (error: any) {
          const status = error.response?.status;
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.warn(
            `⚠️ [AI Cascade Fallback] ${provider.name} falhou [Status ${status}]: ${errorMsg}. Acionando próximo na cascata...`
          );
          attemptedProviders.push(`${provider.name} (${status || 'timeout'})`);
        }
      }
    }

    console.warn('[AI Cascade] Todos os provedores externos de IA esgotados ou sem chave. Usando motor local de segurança.');
    return null;
  }

  /**
   * Testa a conectividade de todos os provedores para exibir o status no painel
   */
  static async testAllProviders(customKeysMap: Record<string, string> = {}): Promise<
    Array<{
      id: string;
      name: string;
      model: string;
      status: 'online' | 'error' | 'not_configured';
      latencyMs?: number;
      message: string;
    }>
  > {
    const results = [];

    for (const provider of SUPPORTED_PROVIDERS) {
      const keys = this.getProviderKeys(provider, customKeysMap[provider.id]);
      const model =
        (provider.envModelName && process.env[provider.envModelName]) ||
        provider.defaultModel;

      if (keys.length === 0) {
        results.push({
          id: provider.id,
          name: provider.name,
          model,
          status: 'not_configured' as const,
          message: `Nenhuma chave configurada em ${provider.envKeyName} no .env ou no painel.`
        });
        continue;
      }

      const activeKey = keys[0];
      const startTime = Date.now();

      try {
        const res = await axios.post(
          provider.baseUrl,
          {
            model,
            messages: [{ role: 'user', content: 'responda apenas com a palavra OK' }],
            max_tokens: 10
          },
          {
            headers: {
              Authorization: `Bearer ${activeKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 6000
          }
        );

        const latencyMs = Date.now() - startTime;
        results.push({
          id: provider.id,
          name: provider.name,
          model,
          status: 'online' as const,
          latencyMs,
          message: `Conectado com sucesso (${latencyMs}ms). Resposta: ${res.data?.choices?.[0]?.message?.content?.trim() || 'OK'}`
        });
      } catch (err: any) {
        results.push({
          id: provider.id,
          name: provider.name,
          model,
          status: 'error' as const,
          message: `Falha na requisição [${err.response?.status || 'Timeout'}]: ${err.response?.data?.error?.message || err.message}`
        });
      }
    }

    return results;
  }

  /**
   * Puxa dinamicamente a lista de modelos da API da NVIDIA NIM
   */
  static async fetchNvidiaModels(customKey?: string): Promise<{
    source: 'live_api' | 'catalog';
    models: NvidiaModelItem[];
    activeModel: string;
    message?: string;
  }> {
    const key =
      customKey ||
      process.env.NVIDIA_API_KEY ||
      (process.env.NVIDIA_API_KEYS ? process.env.NVIDIA_API_KEYS.split(',')[0].trim() : '');
    const activeModel = db.aiConfig.model || 'meta/llama-3.3-70b-instruct';

    if (!key) {
      return {
        source: 'catalog',
        models: POPULAR_NVIDIA_MODELS,
        activeModel,
        message: 'Chave da NVIDIA não configurada. Exibindo modelos recomendados do catálogo.'
      };
    }

    try {
      console.log('[NVIDIA] Puxando lista de modelos dinamicamente de https://integrate.api.nvidia.com/v1/models...');
      const res = await axios.get('https://integrate.api.nvidia.com/v1/models', {
        headers: {
          Authorization: `Bearer ${key}`
        },
        timeout: 7000
      });

      const apiData = res.data?.data || [];
      if (Array.isArray(apiData) && apiData.length > 0) {
        // Filtra os modelos relevantes para chat / instrução / raciocínio
        const fetchedModels: NvidiaModelItem[] = apiData
          .filter(
            (m: any) =>
              typeof m.id === 'string' &&
              (m.id.includes('instruct') ||
                m.id.includes('chat') ||
                m.id.includes('r1') ||
                m.id.includes('llama') ||
                m.id.includes('deepseek') ||
                m.id.includes('mistral') ||
                m.id.includes('nemotron') ||
                m.id.includes('qwen') ||
                m.id.includes('gemma'))
          )
          .map((m: any) => {
            const known = POPULAR_NVIDIA_MODELS.find((p) => p.id === m.id);
            const parts = m.id.split('/');
            const creator = parts.length > 1 ? parts[0] : 'NVIDIA';
            const name = parts.length > 1 ? parts[1].replace(/-/g, ' ') : m.id;

            return {
              id: m.id,
              name: known ? known.name : name,
              creator: known ? known.creator : creator.toUpperCase(),
              description: known ? known.description : `Modelo oficial NVIDIA NIM: ${m.id}`,
              contextLength: known ? known.contextLength : 128000,
              recommendedRole: known ? known.recommendedRole : 'Geral / Conversação',
              isDefault: m.id === 'meta/llama-3.3-70b-instruct'
            };
          });

        // Ordena colocando os recomendados no topo
        fetchedModels.sort((a, b) => {
          const aPopular = POPULAR_NVIDIA_MODELS.findIndex((p) => p.id === a.id);
          const bPopular = POPULAR_NVIDIA_MODELS.findIndex((p) => p.id === b.id);
          if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
          if (aPopular !== -1) return -1;
          if (bPopular !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        console.log(`✅ [NVIDIA] ${fetchedModels.length} modelos carregados dinamicamente da API!`);
        return {
          source: 'live_api',
          models: fetchedModels,
          activeModel,
          message: `Sincronizado com sucesso direto da API NVIDIA (${fetchedModels.length} modelos disponíveis)!`
        };
      }
    } catch (err: any) {
      console.warn(`[NVIDIA] Erro ao buscar modelos da API (${err.message}). Usando catálogo pré-configurado.`);
    }

    return {
      source: 'catalog',
      models: POPULAR_NVIDIA_MODELS,
      activeModel,
      message: 'Exibindo catálogo otimizado para vendas no WhatsApp.'
    };
  }
}
