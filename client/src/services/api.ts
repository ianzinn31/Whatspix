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

export const api = {
  // Dashboard
  async getDashboard(): Promise<{
    metrics: DashboardMetrics;
    campaigns: MetaAdsMetric[];
    instances: WhatsAppInstance[];
  }> {
    const res = await fetch(`${API_BASE}/dashboard`);
    return res.json();
  },

  // WhatsApp / WAHA
  async getInstances(): Promise<WhatsAppInstance[]> {
    const res = await fetch(`${API_BASE}/instances`);
    return res.json();
  },

  async startInstanceSession(id: string): Promise<{ instance: WhatsAppInstance; result: any }> {
    const res = await fetch(`${API_BASE}/instances/${id}/start`, { method: 'POST' });
    return res.json();
  },

  async updateInstance(id: string, data: Partial<WhatsAppInstance>): Promise<WhatsAppInstance> {
    const res = await fetch(`${API_BASE}/instances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateAntiBanConfig(id: string, config: any): Promise<WhatsAppInstance> {
    const res = await fetch(`${API_BASE}/instances/${id}/antiban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async createInstance(data: any): Promise<WhatsAppInstance> {
    const res = await fetch(`${API_BASE}/instances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteInstance(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/instances/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Leads & Live Chat
  async getLeads(): Promise<Lead[]> {
    const res = await fetch(`${API_BASE}/leads`);
    return res.json();
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    return res.json();
  },

  async deleteLead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getMessages(leadId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/messages`);
    return res.json();
  },

  async sendMessage(leadId: string, content: string, sender: 'human' | 'lead' = 'human', type: string = 'text'): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sender, type })
    });
    return res.json();
  },

  async toggleAi(leadId: string): Promise<{ leadId: string; aiActive: boolean }> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/toggle-ai`, { method: 'POST' });
    return res.json();
  },

  async generatePix(leadId: string, amount?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/generate-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  // AI Agent & Treinamento
  async getAiConfig(): Promise<AiAgentConfig> {
    const res = await fetch(`${API_BASE}/ai/config`);
    return res.json();
  },

  async updateAiConfig(config: Partial<AiAgentConfig>): Promise<AiAgentConfig> {
    const res = await fetch(`${API_BASE}/ai/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async simulateAiMessage(message: string, leadName?: string, offerValue?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/simulate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, leadName, offerValue })
    });
    return res.json();
  },

  async addKnowledgeDoc(doc: { title: string; category: string; content: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    return res.json();
  },

  async deleteKnowledgeDoc(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/knowledge/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getAiProviders(): Promise<{ providers: any[] }> {
    const res = await fetch(`${API_BASE}/ai/providers`);
    return res.json();
  },

  async getNvidiaModels(apiKey?: string): Promise<{
    source: 'live_api' | 'catalog';
    models: any[];
    activeModel: string;
    message?: string;
  }> {
    const url = apiKey ? `${API_BASE}/ai/models?apiKey=${encodeURIComponent(apiKey)}` : `${API_BASE}/ai/models`;
    const res = await fetch(url);
    return res.json();
  },

  async selectNvidiaModel(modelId: string): Promise<{ success: boolean; activeModel: string }> {
    const res = await fetch(`${API_BASE}/ai/models/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId })
    });
    return res.json();
  },

  async testAiCascade(customKeys?: Record<string, string>): Promise<{ results: any[] }> {
    const res = await fetch(`${API_BASE}/ai/test-cascade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customKeys })
    });
    return res.json();
  },

  // Voice & Audio (Fish Audio via OpenRouter)
  async testVoice(apiKey?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/voice/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    return res.json();
  },

  async synthesizeVoice(text: string, voiceModel?: string, voiceId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceModel, voiceId })
    });
    return res.json();
  },

  // Funnels
  async getFunnels(): Promise<SalesFunnel[]> {
    const res = await fetch(`${API_BASE}/funnels`);
    return res.json();
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
    const res = await fetch(`${API_BASE}/funnels/generate-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async maintainFunnelWithAi(id: string, instruction: string, voiceModel?: string): Promise<SalesFunnel> {
    const res = await fetch(`${API_BASE}/funnels/${id}/ai-maintain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, voiceModel })
    });
    return res.json();
  },

  async updateFunnel(id: string, funnel: Partial<SalesFunnel>): Promise<SalesFunnel> {
    const res = await fetch(`${API_BASE}/funnels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    });
    return res.json();
  },

  async createFunnel(funnel: Partial<SalesFunnel>): Promise<SalesFunnel> {
    const res = await fetch(`${API_BASE}/funnels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(funnel)
    });
    return res.json();
  },

  async deleteFunnel(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/funnels/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // OCR & Comprovantes
  async getProofSamples(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/proof/samples`);
    return res.json();
  },

  async analyzeProof(sampleName?: string, file?: File, expectedAmount?: number): Promise<ReceiptAnalysisResult> {
    if (file) {
      const formData = new FormData();
      formData.append('receiptFile', file);
      if (expectedAmount) formData.append('expectedAmount', expectedAmount.toString());
      const res = await fetch(`${API_BASE}/proof/analyze`, {
        method: 'POST',
        body: formData
      });
      return res.json();
    } else {
      const res = await fetch(`${API_BASE}/proof/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleName, expectedAmount })
      });
      return res.json();
    }
  },

  // Meta Ads
  async getMetaCampaigns(): Promise<MetaAdsMetric[]> {
    const res = await fetch(`${API_BASE}/meta/campaigns`);
    return res.json();
  },

  async triggerMetaConversion(eventName: string, phone: string, value: number): Promise<any> {
    const res = await fetch(`${API_BASE}/meta/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, phone, value })
    });
    return res.json();
  }
};
