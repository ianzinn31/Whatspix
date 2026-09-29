import {
  DashboardMetrics,
  WhatsAppInstance,
  Lead,
  ChatMessage,
  SalesFunnel,
  AiAgentConfig,
  MetaAdsMetric,
  ReceiptAnalysisResult
} from '../types';

const API_BASE = '/api';

/**
 * Utilitário seguro para fetch de JSON que lida graciosamente com timeouts do Nginx (504),
 * erros de proxy (502) e respostas HTML, evitando o erro de sintaxe "Unexpected token < in JSON".
 */
async function safeFetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    if (res.status === 504) {
      throw new Error('O servidor demorou para responder (504 Gateway Timeout). O modelo de IA excedeu o tempo limite.');
    }
    if (res.status === 502) {
      throw new Error('Servidor temporariamente indisponível (502 Bad Gateway). Verifique se o backend está ativo.');
    }
    if (contentType.includes('application/json')) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `Erro na requisição (${res.status})`);
    } else {
      const text = await res.text().catch(() => '');
      throw new Error(`Erro do servidor (${res.status}): ${text.slice(0, 100) || res.statusText}`);
    }
  }

  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do servidor: ${text.slice(0, 100)}`);
  }
}

export const api = {
  // Dashboard
  async getDashboard(): Promise<{
    metrics: DashboardMetrics;
    campaigns: MetaAdsMetric[];
    instances: WhatsAppInstance[];
  }> {
    return safeFetchJson(`${API_BASE}/dashboard`);
  },

  // WhatsApp / WAHA
  async getInstances(): Promise<WhatsAppInstance[]> {
    return safeFetchJson(`${API_BASE}/instances`);
  },

  async startInstanceSession(id: string): Promise<{ instance: WhatsAppInstance; result: any }> {
    return safeFetchJson(`${API_BASE}/instances/${id}/start`, { method: 'POST' });
  },

  async getInstanceStatus(id: string): Promise<{ status: string; instance: WhatsAppInstance; qrCode?: string }> {
    return safeFetchJson(`${API_BASE}/instances/${id}/status`);
  },

  async logoutInstance(id: string): Promise<{ success: boolean; instance: WhatsAppInstance }> {
    return safeFetchJson(`${API_BASE}/instances/${id}/logout`, { method: 'POST' });
  },

  async restartInstance(id: string): Promise<{ instance: WhatsAppInstance; result: any }> {
    return safeFetchJson(`${API_BASE}/instances/${id}/restart`, { method: 'POST' });
  },

  async updateInstance(id: string, data: Partial<WhatsAppInstance>): Promise<WhatsAppInstance> {
    return safeFetchJson(`${API_BASE}/instances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateAntiBanConfig(id: string, config: any): Promise<WhatsAppInstance> {
    return safeFetchJson(`${API_BASE}/instances/${id}/antiban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  async createInstance(data: any): Promise<WhatsAppInstance> {
    return safeFetchJson(`${API_BASE}/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteInstance(id: string): Promise<{ success: boolean }> {
    return safeFetchJson(`${API_BASE}/instances/${id}`, { method: 'DELETE' });
  },

  // Leads & Live Chat
  async getLeads(): Promise<Lead[]> {
    return safeFetchJson(`${API_BASE}/leads`);
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    return safeFetchJson(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
  },

  async deleteLead(id: string): Promise<{ success: boolean }> {
    return safeFetchJson(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
  },

  async getMessages(leadId: string): Promise<ChatMessage[]> {
    return safeFetchJson(`${API_BASE}/leads/${leadId}/messages`);
  },

  async sendMessage(leadId: string, content: string, sender: 'human' | 'lead' = 'human', type: string = 'text'): Promise<ChatMessage> {
    return safeFetchJson(`${API_BASE}/leads/${leadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sender, type })
    });
  },

  async toggleAi(leadId: string): Promise<{ leadId: string; aiActive: boolean }> {
    return safeFetchJson(`${API_BASE}/leads/${leadId}/toggle-ai`, { method: 'POST' });
  },

  async generatePix(leadId: string, amount?: number): Promise<any> {
    return safeFetchJson(`${API_BASE}/leads/${leadId}/generate-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
  },

  // AI Agent & Treinamento
  async getAiConfig(): Promise<AiAgentConfig> {
    return safeFetchJson(`${API_BASE}/ai/config`);
  },

  async updateAiConfig(config: Partial<AiAgentConfig>): Promise<AiAgentConfig> {
    return safeFetchJson(`${API_BASE}/ai/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  async simulateAiMessage(message: string, leadName?: string, offerValue?: number): Promise<any> {
    return safeFetchJson(`${API_BASE}/ai/simulate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, leadName, offerValue })
    });
  },

  async addKnowledgeDoc(doc: { title: string; category: string; content: string }): Promise<any> {
    return safeFetchJson(`${API_BASE}/ai/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
  },

  async deleteKnowledgeDoc(id: string): Promise<any> {
    return safeFetchJson(`${API_BASE}/ai/knowledge/${id}`, { method: 'DELETE' });
  },

  async getAiProviders(): Promise<{ providers: any[] }> {
    return safeFetchJson(`${API_BASE}/ai/providers`);
  },

  async getNvidiaModels(apiKey?: string): Promise<{
    source: 'live_api' | 'catalog';
    models: any[];
    activeModel: string;
    message?: string;
  }> {
    const url = apiKey ? `${API_BASE}/ai/models?apiKey=${encodeURIComponent(apiKey)}` : `${API_BASE}/ai/models`;
    return safeFetchJson(url);
  },

  async selectNvidiaModel(modelId: string): Promise<{ success: boolean; activeModel: string }> {
    return safeFetchJson(`${API_BASE}/ai/models/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId })
    });
  },

  async testAiCascade(customKeys?: Record<string, string>): Promise<{ results: any[] }> {
    return safeFetchJson(`${API_BASE}/ai/test-cascade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customKeys })
    });
  },

  // Voice & Audio (Fish Audio via OpenRouter ou API direta)
  async testVoice(apiKey?: string): Promise<any> {
    return safeFetchJson(`${API_BASE}/voice/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
  },

  async synthesizeVoice(text: string, voiceModel?: string, voiceId?: string): Promise<any> {
    return safeFetchJson(`${API_BASE}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceModel, voiceId })
    });
  },

  // Funnels
  async getFunnels(): Promise<SalesFunnel[]> {
    return safeFetchJson(`${API_BASE}/funnels`);
  },

  async generateFunnelWithAi(params: {
    prompt: string;
    productName?: string;
    price?: number | string;
    downsellPrice?: number | string;
    includeVoice?: boolean;
    voiceModel?: string;
    strategy?: string;
    complexity?: 'basic' | 'advanced' | 'enterprise';
  } | string): Promise<SalesFunnel> {
    const payload = typeof params === 'string' ? { prompt: params } : params;
    return safeFetchJson(`${API_BASE}/funnels/generate-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async maintainFunnelWithAi(id: string, instruction: string, voiceModel?: string): Promise<SalesFunnel> {
    return safeFetchJson(`${API_BASE}/funnels/${id}/ai-maintain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, voiceModel })
    });
  },

  async updateFunnel(id: string, funnel: Partial<SalesFunnel>): Promise<SalesFunnel> {
    return safeFetchJson(`${API_BASE}/funnels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    });
  },

  async createFunnel(funnel: Partial<SalesFunnel>): Promise<SalesFunnel> {
    return safeFetchJson(`${API_BASE}/funnels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    });
  },

  async deleteFunnel(id: string): Promise<{ success: boolean }> {
    return safeFetchJson(`${API_BASE}/funnels/${id}`, {
      method: 'DELETE'
    });
  },

  // OCR & Comprovantes
  async getProofSamples(): Promise<any[]> {
    return safeFetchJson(`${API_BASE}/proof/samples`);
  },

  async analyzeProof(sampleName?: string, file?: File, expectedAmount?: number): Promise<ReceiptAnalysisResult> {
    if (file) {
      const formData = new FormData();
      formData.append('receiptFile', file);
      if (expectedAmount) formData.append('expectedAmount', expectedAmount.toString());
      return safeFetchJson(`${API_BASE}/proof/analyze`, {
        method: 'POST',
        body: formData
      });
    } else {
      return safeFetchJson(`${API_BASE}/proof/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleName, expectedAmount })
      });
    }
  },

  // Meta Ads
  async getMetaCampaigns(): Promise<MetaAdsMetric[]> {
    return safeFetchJson(`${API_BASE}/meta/campaigns`);
  },

  async triggerMetaConversion(eventName: string, phone: string, value: number): Promise<any> {
    return safeFetchJson(`${API_BASE}/meta/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, phone, value })
    });
  }
};
