export interface WhatsAppInstance {
  id: string;
  name: string;
  phone: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'banned_risk';
  provider: 'waha' | 'evolution' | 'meta_cloud';
  serverUrl: string;
  apiKey?: string;
  qrCode?: string;
  healthScore: number;
  warmupDay: number;
  warmupTarget: number;
  messagesSentToday: number;
  antiBanConfig: AntiBanConfig;
  lastActive: string;
  assignedFunnelId?: string;
}

export interface AntiBanConfig {
  typingSpeedMinMs: number;
  typingSpeedMaxMs: number;
  simulateAudioRecording: boolean;
  audioRecordingSecondsPer10Words: number;
  randomIntervalMinSec: number;
  randomIntervalMaxSec: number;
  dailyLimit: number;
  hourlyLimit: number;
  warmupModeActive: boolean;
  spintaxEnabled: boolean;
  proxyHost?: string;
}

export interface Lead {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  status: 'new' | 'negotiating' | 'pix_generated' | 'paid' | 'transferred' | 'lost';
  aiActive: boolean;
  assignedFunnelId?: string;
  currentStepId?: string;
  tags: string[];
  productInterest?: string;
  offerValue: number;
  origin: 'meta_ads' | 'organic' | 'direct' | 'recovery';
  adId?: string;
  adName?: string;
  lastMessageAt: string;
  unreadCount: number;
  notes?: string;
  pixCode?: string;
  pixTxId?: string;
  proofValidated?: boolean;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: 'lead' | 'ai' | 'human' | 'system';
  type: 'text' | 'audio' | 'image' | 'pix' | 'document';
  content: string;
  mediaUrl?: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  isProofReceipt?: boolean;
  proofData?: ReceiptAnalysisResult;
}

export interface ReceiptAnalysisResult {
  isValid: boolean;
  isScheduled: boolean;
  bankName: string;
  amount: number;
  payerName: string;
  receiverName: string;
  pixKeyOrDoc: string;
  transactionId: string;
  date: string;
  confidenceScore: number;
  verificationNotes: string;
  suspicionAlerts: string[];
}

export interface FunnelNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
  title?: string;
  config?: Record<string, any>;
}

export interface FunnelEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface SalesFunnel {
  id: string;
  name: string;
  description: string;
  active: boolean;
  triggerType: 'meta_ads_keyword' | 'new_lead' | 'cart_abandoned' | 'manual';
  triggerKeywords: string[];
  nodes: FunnelNode[];
  edges: FunnelEdge[];
  stats: {
    started: number;
    completed: number;
    conversions: number;
    conversionRate: number;
  };
  createdAt: string;
  aiMeta?: {
    model: string;
    reasoning: string;
    explanation: string;
    changelog: string[];
    modifiedNodeIds?: string[];
    addedNodeIds?: string[];
    timestamp: string;
  };
}

export interface AiCopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  reasoning?: string;
  changelog?: string[];
  explanation?: string;
  model?: string;
  modifiedNodeIds?: string[];
  addedNodeIds?: string[];
}

export interface AiAgentConfig {
  provider: 'gemini' | 'openai' | 'groq';
  apiKey: string;
  model: string;
  personaName: string;
  agentRole: string;
  tone: 'persuasive' | 'friendly' | 'expert' | 'direct';
  customInstructions: string;
  temperature: number;
  knowledgeBase: KnowledgeDoc[];
  toolsEnabled: {
    generatePix: boolean;
    checkReceipt: boolean;
    applyDiscount: boolean;
    handoffHuman: boolean;
  };
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: 'product' | 'faq' | 'objections' | 'guarantee' | 'bonus';
  content: string;
  updatedAt: string;
}

export interface MetaAdsMetric {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  whatsappConversations: number;
  costPerConversation: number;
  revenue: number;
  roas: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueToday: number;
  salesCountToday: number;
  totalLeads: number;
  activeConversations: number;
  metaAdsSpend: number;
  blendedRoas: number;
  conversionRate: number;
  recoveredCartsCount: number;
  recoveredCartsRevenue: number;
  recentSales: Array<{
    id: string;
    leadName: string;
    product: string;
    amount: number;
    method: 'PIX' | 'Cartão' | string;
    gateway: 'Kiwify' | 'Hotmart' | 'Asaas' | 'PerfectPay' | 'WhatsApp PIX' | string;
    time: string;
  }>;
}
