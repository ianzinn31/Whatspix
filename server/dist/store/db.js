import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SupabaseService } from '../services/supabaseService.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const FUNNELS_FILE = path.join(DATA_DIR, 'funnels.json');
class InMemoryDB {
    instances = [];
    constructor() {
        this.ensureDataDir();
        this.loadFunnelsFromDisk();
    }
    ensureDataDir() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
        }
        catch (err) {
            console.warn('Erro ao criar diretório data:', err);
        }
    }
    loadFunnelsFromDisk() {
        try {
            if (fs.existsSync(FUNNELS_FILE)) {
                const raw = fs.readFileSync(FUNNELS_FILE, 'utf-8');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.funnels = parsed;
                    console.log(`💾 [DB] ${parsed.length} funis carregados com sucesso do disco (${FUNNELS_FILE})!`);
                    return;
                }
            }
        }
        catch (err) {
            console.warn('Erro ao ler funis do disco:', err);
        }
        if (SupabaseService.isConfigured()) {
            SupabaseService.getFunnels().then((cloudFunnels) => {
                if (cloudFunnels && cloudFunnels.length > 0) {
                    this.funnels = cloudFunnels;
                    this.saveFunnelsToDisk();
                    console.log(`☁️ [DB] ${cloudFunnels.length} funis sincronizados do Supabase com sucesso!`);
                }
            }).catch((err) => console.warn('Erro ao sincronizar com Supabase:', err));
        }
        this.saveFunnelsToDisk();
    }
    saveFunnelsToDisk() {
        try {
            this.ensureDataDir();
            fs.writeFileSync(FUNNELS_FILE, JSON.stringify(this.funnels, null, 2), 'utf-8');
            console.log(`💾 [DB] ${this.funnels.length} funis persistidos com sucesso no disco!`);
        }
        catch (err) {
            console.error('Erro ao persistir funis no disco:', err);
        }
    }
    upsertFunnel(funnel) {
        const index = this.funnels.findIndex((f) => f.id === funnel.id);
        let result;
        if (index >= 0) {
            this.funnels[index] = {
                ...this.funnels[index],
                ...funnel,
                nodes: funnel.nodes !== undefined ? funnel.nodes : this.funnels[index].nodes,
                edges: funnel.edges !== undefined ? funnel.edges : this.funnels[index].edges
            };
            result = this.funnels[index];
        }
        else {
            const newFunnel = {
                id: funnel.id,
                name: funnel.name || 'Novo Funil',
                description: funnel.description || '',
                active: funnel.active ?? true,
                triggerType: funnel.triggerType || 'meta_ads_keyword',
                triggerKeywords: funnel.triggerKeywords || ['QUERO'],
                stats: funnel.stats || { started: 0, completed: 0, conversions: 0, conversionRate: 0 },
                createdAt: funnel.createdAt || new Date().toISOString(),
                nodes: funnel.nodes || [],
                edges: funnel.edges || []
            };
            this.funnels.unshift(newFunnel);
            result = newFunnel;
        }
        this.saveFunnelsToDisk();
        if (SupabaseService.isConfigured()) {
            SupabaseService.upsertFunnel(result).catch((err) => console.warn('Erro ao sincronizar upsert no Supabase:', err));
        }
        return result;
    }
    deleteFunnel(id) {
        this.funnels = this.funnels.filter((f) => f.id !== id);
        this.saveFunnelsToDisk();
        if (SupabaseService.isConfigured()) {
            SupabaseService.deleteFunnel(id).catch((err) => console.warn('Erro ao sincronizar delete no Supabase:', err));
        }
    }
    leads = [];
    messages = {};
    funnels = [
        {
            id: 'funnel-01',
            name: 'Funil Perpétuo X1 - Meta Ads (Infoproduto R$ 197)',
            description: 'Funil principal com qualificação em 3 etapas, ancoragem de preço, quebra de objeção, gerador de PIX e leitor OCR automático.',
            active: true,
            triggerType: 'meta_ads_keyword',
            triggerKeywords: ['QUERO', 'METODO', 'VENDEDOR', 'SABER MAIS'],
            stats: {
                started: 0,
                completed: 0,
                conversions: 0,
                conversionRate: 0
            },
            createdAt: '2026-09-01',
            nodes: [
                {
                    id: 'n1',
                    type: 'trigger',
                    title: 'Gatilho: Anúncio Meta Ads',
                    config: { keyword: 'QUERO' },
                    position: { x: 50, y: 150 }
                },
                {
                    id: 'n2',
                    type: 'message',
                    title: 'Boas-Vindas Humanizada',
                    config: {
                        text: '{Oi|Olá|Opa} {{nome}}! Que bom que você viu nosso anúncio. Me conta uma coisa: você já tem um infoproduto rodando ou tá começando do zero?'
                    },
                    position: { x: 300, y: 150 }
                },
                {
                    id: 'n3',
                    type: 'ai_agent',
                    title: 'Copiloto IA: Qualificação & SPIN Selling',
                    config: {
                        goal: 'Identificar a dor do lead, explicar a solução com provas e fazer a oferta de R$ 197 com urgência.',
                        maxMessages: 4
                    },
                    position: { x: 550, y: 150 }
                },
                {
                    id: 'n4',
                    type: 'pix_generator',
                    title: 'Gerador Automático de PIX',
                    config: {
                        amount: 197.0,
                        expirationMinutes: 30,
                        instructions: 'Envie a chave copia e cola e peça o comprovante.'
                    },
                    position: { x: 800, y: 150 }
                },
                {
                    id: 'n5',
                    type: 'ocr_checker',
                    title: 'Leitor de Comprovante OCR',
                    config: {
                        autoApprove: true,
                        alertOnScheduled: true,
                        minConfidence: 95
                    },
                    position: { x: 1050, y: 150 }
                },
                {
                    id: 'n6',
                    type: 'delay',
                    title: 'Atraso Inteligente (Follow-up 20min)',
                    config: {
                        minutes: 20,
                        condition: 'pix_nao_pago'
                    },
                    position: { x: 800, y: 320 }
                },
                {
                    id: 'n7',
                    type: 'audio',
                    title: 'Áudio Humanizado de Escassez',
                    config: {
                        text: 'Oi {{nome}}, passei aqui só para te avisar que estou segurando a sua vaga no valor com desconto até as 19h. Conseguiu emitir o PIX?',
                        durationSeconds: 11
                    },
                    position: { x: 1050, y: 320 }
                }
            ],
            edges: [
                { id: 'e1-2', source: 'n1', target: 'n2' },
                { id: 'e2-3', source: 'n2', target: 'n3' },
                { id: 'e3-4', source: 'n3', target: 'n4' },
                { id: 'e4-5', source: 'n4', target: 'n5' },
                { id: 'e4-6', source: 'n4', target: 'n6', label: 'Se pendente' },
                { id: 'e6-7', source: 'n6', target: 'n7' }
            ]
        },
        {
            id: 'funnel-02',
            name: 'Recuperação de Carrinho Abandonado Kiwify/Hotmart',
            description: 'Acionado por webhook ao abandonar checkout. Faz 3 tentativas com downsell progressivo.',
            active: true,
            triggerType: 'cart_abandoned',
            triggerKeywords: ['CART_ABANDONED'],
            stats: {
                started: 0,
                completed: 0,
                conversions: 0,
                conversionRate: 0
            },
            createdAt: '2026-09-10',
            nodes: [
                {
                    id: 'rn1',
                    type: 'trigger',
                    title: 'Webhook: Carrinho Abandonado',
                    config: { platform: 'Kiwify / Hotmart' },
                    position: { x: 50, y: 150 }
                },
                {
                    id: 'rn2',
                    type: 'message',
                    title: 'Mensagem Empática (Sem Pressão)',
                    config: {
                        text: 'Olá {{nome}}! Vi que você tentou concluir sua inscrição agora há pouco. Ocorreu alguma falha com a operadora de cartão ou com o PIX?'
                    },
                    position: { x: 300, y: 150 }
                },
                {
                    id: 'rn3',
                    type: 'ai_agent',
                    title: 'IA Negociadora com Cupom Especial',
                    config: {
                        goal: 'Oferecer parcelamento em 2 cartões ou cupom relâmpago de 20% no PIX se a objeção for grana.',
                        maxMessages: 3
                    },
                    position: { x: 550, y: 150 }
                }
            ],
            edges: [
                { id: 're1-2', source: 'rn1', target: 'rn2' },
                { id: 're2-3', source: 'rn2', target: 'rn3' }
            ]
        }
    ];
    aiConfig = {
        provider: 'nvidia',
        apiKey: '',
        model: 'meta/llama-3.2-11b-vision-instruct',
        personaName: 'Leo',
        agentRole: 'Especialista em Vendas X1 & Fechamento',
        tone: 'persuasive',
        temperature: 0.7,
        customInstructions: `Você é Sofia, especialista de vendas no WhatsApp do produto "Método Vendedor Automático X1".
Seu objetivo principal é guiar leads interessados até o fechamento da compra via PIX de R$ 197,00.
DIRETRIZES DE COMUNICAÇÃO:
1. Seja calorosa, natural e humana (português do Brasil coloquial e profissional).
2. Não envie respostas excessivamente longas. No WhatsApp, mensagens de 2 a 4 parágrafos curtos funcionam melhor.
3. Use emojis com moderação para manter empatia.
4. Faça perguntas abertas para entender a realidade do lead antes de empurrar o preço.
5. Quando o lead estiver convencido ou perguntar como pagar, chame a ferramenta generate_pix_charge.
6. Se o lead mandar foto de comprovante, use a ferramenta check_receipt.
7. Alerta de segurança: Nunca prometa enriquecimento fácil; reforce que é uma ferramenta e método validado com suporte.`,
        toolsEnabled: {
            generatePix: true,
            checkReceipt: true,
            applyDiscount: true,
            handoffHuman: true
        },
        knowledgeBase: [
            {
                id: 'kb-01',
                title: 'O que é o Método Vendedor Automático X1?',
                category: 'product',
                content: 'É uma plataforma completa que automatiza o atendimento no WhatsApp usando IA avançada, anti-banimento nativo, leitura inteligente de comprovantes PIX e construtor visual de funis de alta conversão.',
                updatedAt: '2026-09-20'
            },
            {
                id: 'kb-02',
                title: 'Preço e Formas de Pagamento',
                category: 'product',
                content: 'O valor regular é R$ 497,00, mas na condição promocional do anúncio sai por R$ 197,00 à vista no PIX ou 12x de R$ 19,70 no cartão de crédito.',
                updatedAt: '2026-09-20'
            },
            {
                id: 'kb-03',
                title: 'Como funciona o Anti-banimento?',
                category: 'objections',
                content: 'A plataforma emula digitação humana realista, gravação de áudio progressiva, pausas naturais com jitter randômico de 6 a 18 segundos e possui esteira de aquecimento automático para chips novos.',
                updatedAt: '2026-09-20'
            },
            {
                id: 'kb-04',
                title: 'Garantia Incondicional de 7 Dias',
                category: 'guarantee',
                content: 'O cliente tem 7 dias de garantia total. Se por qualquer motivo achar que não é para ele, basta enviar um único WhatsApp ou e-mail que devolvemos 100% do dinheiro na hora, sem letras miúdas.',
                updatedAt: '2026-09-20'
            }
        ]
    };
    metaCampaigns = [];
    getDashboardMetrics() {
        const totalSpend = this.metaCampaigns.reduce((acc, c) => acc + c.spend, 0);
        const totalRev = this.metaCampaigns.reduce((acc, c) => acc + c.revenue, 0);
        const blendedRoas = totalSpend > 0 ? parseFloat((totalRev / totalSpend).toFixed(2)) : 0;
        const paidLeads = this.leads.filter((l) => l.status === 'paid');
        const revenueToday = paidLeads.reduce((acc, l) => acc + (l.offerValue || 0), 0);
        const activeConvs = this.leads.filter((l) => l.status !== 'paid' && l.status !== 'lost').length;
        const convRate = this.leads.length > 0 ? parseFloat(((paidLeads.length / this.leads.length) * 100).toFixed(1)) : 0;
        return {
            totalRevenue: totalRev + revenueToday,
            revenueToday: revenueToday,
            salesCountToday: paidLeads.length,
            totalLeads: this.leads.length,
            activeConversations: activeConvs,
            metaAdsSpend: totalSpend,
            blendedRoas: blendedRoas,
            conversionRate: convRate,
            recoveredCartsCount: 0,
            recoveredCartsRevenue: 0,
            recentSales: paidLeads.map((l) => ({
                id: `sale-${l.id}`,
                leadName: l.name,
                product: l.productInterest || 'Infoproduto X1',
                amount: l.offerValue || 0,
                method: 'PIX',
                gateway: 'WhatsApp Direct',
                time: 'Hoje'
            }))
        };
    }
}
export const db = new InMemoryDB();
