import { Router } from 'express';
import multer from 'multer';
import { db } from '../store/db.js';
import { WahaService } from '../services/wahaService.js';
import { AiAgentEngine } from '../services/aiAgentEngine.js';
import { ProofReaderService } from '../services/proofReaderService.js';
import { MetaAdsService } from '../services/metaAdsService.js';
import { FlowEngine } from '../services/flowEngine.js';
import { VoiceService } from '../services/voiceService.js';
const upload = multer({ storage: multer.memoryStorage() });
export const router = Router();
// ==========================================
// 1. DASHBOARD & MÉTRICAS
// ==========================================
router.get('/dashboard', (req, res) => {
    res.json({
        metrics: db.getDashboardMetrics(),
        campaigns: db.metaCampaigns,
        instances: db.instances
    });
});
// ==========================================
// 2. WHATSAPP INSTANCES & WAHA / ANTIBAN
// ==========================================
router.get('/instances', (req, res) => {
    res.json(db.instances);
});
router.post('/instances', (req, res) => {
    const { name, phone, provider, serverUrl, apiKey } = req.body;
    const newInst = {
        id: `inst-${Date.now()}`,
        name: name || 'Nova Instância WAHA',
        phone: phone || '+55 11 90000-0000',
        status: 'connecting',
        provider: provider || 'waha',
        serverUrl: serverUrl || 'http://localhost:3000',
        apiKey,
        healthScore: 92,
        warmupDay: 1,
        warmupTarget: 20,
        messagesSentToday: 0,
        lastActive: new Date().toISOString(),
        antiBanConfig: {
            typingSpeedMinMs: 45,
            typingSpeedMaxMs: 85,
            simulateAudioRecording: true,
            audioRecordingSecondsPer10Words: 3,
            randomIntervalMinSec: 6,
            randomIntervalMaxSec: 15,
            dailyLimit: 30,
            hourlyLimit: 10,
            warmupModeActive: true,
            spintaxEnabled: true
        }
    };
    db.instances.push(newInst);
    res.json(newInst);
});
router.post('/instances/:id/start', async (req, res) => {
    const inst = db.instances.find((i) => i.id === req.params.id);
    if (!inst)
        return res.status(404).json({ error: 'Instância não encontrada' });
    const result = await WahaService.startSession(inst);
    if (result.status === 'connected') {
        inst.status = 'connected';
        inst.qrCode = undefined;
    }
    else {
        inst.status = 'connecting';
        inst.qrCode = result.qrCode;
    }
    res.json({ instance: inst, result });
});
router.get('/instances/:id/status', async (req, res) => {
    const inst = db.instances.find((i) => i.id === req.params.id);
    if (!inst)
        return res.status(404).json({ error: 'Instância não encontrada' });
    const statusObj = await WahaService.getSessionStatus(inst);
    if (statusObj.status === 'connected') {
        inst.status = 'connected';
        inst.qrCode = undefined;
    }
    else if (statusObj.status === 'disconnected') {
        inst.status = 'disconnected';
    }
    res.json({ instance: inst, status: inst.status });
});
router.post('/instances/:id/logout', async (req, res) => {
    const inst = db.instances.find((i) => i.id === req.params.id);
    if (!inst)
        return res.status(404).json({ error: 'Instância não encontrada' });
    await WahaService.logoutSession(inst);
    inst.status = 'disconnected';
    inst.qrCode = undefined;
    res.json({ success: true, instance: inst });
});
router.put('/instances/:id', (req, res) => {
    const inst = db.instances.find((i) => i.id === req.params.id);
    if (!inst)
        return res.status(404).json({ error: 'Instância não encontrada' });
    const { name, phone, serverUrl, apiKey, assignedFunnelId, status } = req.body;
    if (name !== undefined)
        inst.name = name;
    if (phone !== undefined)
        inst.phone = phone;
    if (serverUrl !== undefined)
        inst.serverUrl = serverUrl;
    if (apiKey !== undefined)
        inst.apiKey = apiKey;
    if (assignedFunnelId !== undefined)
        inst.assignedFunnelId = assignedFunnelId;
    if (status !== undefined)
        inst.status = status;
    res.json(inst);
});
router.put('/instances/:id/antiban', (req, res) => {
    const inst = db.instances.find((i) => i.id === req.params.id);
    if (!inst)
        return res.status(404).json({ error: 'Instância não encontrada' });
    inst.antiBanConfig = { ...inst.antiBanConfig, ...req.body };
    res.json(inst);
});
router.delete('/instances/:id', (req, res) => {
    const idx = db.instances.findIndex((i) => i.id === req.params.id);
    if (idx !== -1) {
        db.instances.splice(idx, 1);
    }
    res.json({ success: true });
});
// ==========================================
// 3. LEADS & LIVE CHAT (X1 MULTIATENDIMENTO)
// ==========================================
router.get('/leads', (req, res) => {
    res.json(db.leads);
});
router.post('/leads', (req, res) => {
    const { name, phone, offerValue, productInterest, origin } = req.body;
    const newLead = {
        id: `lead-${Date.now()}`,
        name: name || 'Lead Teste',
        phone: phone || '+55 11 99999-9999',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        status: 'new',
        aiActive: true,
        tags: ['teste_manual'],
        productInterest: productInterest || 'Método Vendedor Automático X1',
        offerValue: typeof offerValue === 'number' ? offerValue : 197.0,
        origin: origin || 'manual',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
    };
    db.leads.unshift(newLead);
    res.json(newLead);
});
router.delete('/leads/:id', (req, res) => {
    const idx = db.leads.findIndex((l) => l.id === req.params.id);
    if (idx !== -1) {
        db.leads.splice(idx, 1);
        delete db.messages[req.params.id];
    }
    res.json({ success: true });
});
router.get('/leads/:id/messages', (req, res) => {
    const msgs = db.messages[req.params.id] || [];
    res.json(msgs);
});
router.post('/leads/:id/messages', async (req, res) => {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead)
        return res.status(404).json({ error: 'Lead não encontrado' });
    const { content, sender, type = 'text', mediaUrl } = req.body;
    const newMsg = {
        id: `msg-${Date.now()}`,
        leadId: lead.id,
        sender: sender || 'human',
        type,
        content,
        mediaUrl,
        timestamp: new Date().toISOString(),
        status: 'delivered'
    };
    if (!db.messages[lead.id])
        db.messages[lead.id] = [];
    db.messages[lead.id].push(newMsg);
    lead.lastMessageAt = newMsg.timestamp;
    // Se o remetente for o LEAD e a IA estiver ativa, executa o Funil ou responde automaticamente!
    if (sender === 'lead' && lead.aiActive) {
        setTimeout(async () => {
            const inst = db.instances[0];
            const flowResult = await FlowEngine.advanceLead(lead, content, inst, lead.phone);
            if (!flowResult.processed) {
                const aiReply = await AiAgentEngine.handleIncomingLeadMessage(lead, content);
                const aiMsg = {
                    id: `msg-ai-${Date.now()}`,
                    leadId: lead.id,
                    sender: 'ai',
                    type: aiReply.actionTaken === 'pix_generated' ? 'pix' : 'text',
                    content: aiReply.replyText,
                    timestamp: new Date().toISOString(),
                    status: 'delivered'
                };
                if (!db.messages[lead.id])
                    db.messages[lead.id] = [];
                db.messages[lead.id].push(aiMsg);
                lead.lastMessageAt = aiMsg.timestamp;
            }
        }, 1200);
    }
    res.json(newMsg);
});
router.post('/leads/:id/toggle-ai', (req, res) => {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead)
        return res.status(404).json({ error: 'Lead não encontrado' });
    lead.aiActive = !lead.aiActive;
    res.json({ leadId: lead.id, aiActive: lead.aiActive });
});
router.post('/leads/:id/generate-pix', (req, res) => {
    const lead = db.leads.find((l) => l.id === req.params.id);
    if (!lead)
        return res.status(404).json({ error: 'Lead não encontrado' });
    const amount = req.body.amount || lead.offerValue || 197.0;
    const txId = `WPX-${Math.floor(Math.random() * 899999 + 100000)}`;
    const pixCode = `00020126580014br.gov.bcb.pix0136whatspix-gateway-pay@whatspix.ia5204000053039865406${amount.toFixed(2)}5802BR5925WHATSTEC TECNOLOGIA LTDA6009SAO PAULO62070503***6304E8A1`;
    lead.status = 'pix_generated';
    lead.pixCode = pixCode;
    lead.pixTxId = txId;
    if (!lead.tags.includes('pix_pendente'))
        lead.tags.push('pix_pendente');
    const pixMsg = {
        id: `msg-pix-${Date.now()}`,
        leadId: lead.id,
        sender: 'ai',
        type: 'pix',
        content: `Aqui está o seu PIX Copia e Cola no valor de R$ ${amount.toFixed(2).replace('.', ',')}:\n\n\`${pixCode}\`\n\nCopie o código acima e pague no seu banco. Em seguida me envie o comprovante por aqui!`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
    };
    if (!db.messages[lead.id])
        db.messages[lead.id] = [];
    db.messages[lead.id].push(pixMsg);
    res.json({ pixCode, txId, amount, message: pixMsg });
});
// ==========================================
// 4. AI AGENT & KNOWLEDGE BASE
// ==========================================
router.get('/ai/config', (req, res) => {
    res.json(db.aiConfig);
});
router.put('/ai/config', (req, res) => {
    db.aiConfig = { ...db.aiConfig, ...req.body };
    res.json(db.aiConfig);
});
router.post('/ai/simulate-message', async (req, res) => {
    const { message, leadName = 'Lead Teste', offerValue = 197.0 } = req.body;
    const dummyLead = {
        id: 'dummy-lead',
        phone: '+55 11 99999-9999',
        name: leadName,
        status: 'negotiating',
        aiActive: true,
        tags: [],
        offerValue,
        origin: 'meta_ads',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
    };
    const response = await AiAgentEngine.handleIncomingLeadMessage(dummyLead, message);
    res.json({ response, dummyLead });
});
router.get('/ai/providers', async (req, res) => {
    const { SUPPORTED_PROVIDERS, AiProviderService } = await import('../services/aiProviderService.js');
    const providers = SUPPORTED_PROVIDERS.map((p) => {
        const keys = AiProviderService.getProviderKeys(p);
        return {
            id: p.id,
            name: p.name,
            model: (p.envModelName && process.env[p.envModelName]) || p.defaultModel,
            isConfigured: keys.length > 0,
            keysCount: keys.length,
            envKeyName: p.envKeyName
        };
    });
    res.json({ providers });
});
router.get('/ai/models', async (req, res) => {
    const { AiProviderService } = await import('../services/aiProviderService.js');
    const apiKey = req.query.apiKey || undefined;
    const result = await AiProviderService.fetchNvidiaModels(apiKey);
    res.json(result);
});
router.post('/ai/models/select', (req, res) => {
    const { modelId } = req.body;
    if (!modelId)
        return res.status(400).json({ error: 'modelId é obrigatório' });
    db.aiConfig.model = modelId;
    console.log(`🎯 [NVIDIA] Modelo principal de vendas selecionado: ${modelId}`);
    res.json({ success: true, activeModel: db.aiConfig.model });
});
router.post('/ai/test-cascade', async (req, res) => {
    const { AiProviderService } = await import('../services/aiProviderService.js');
    const { customKeys } = req.body || {};
    const results = await AiProviderService.testAllProviders(customKeys);
    res.json({ results });
});
// ==========================================
// 4.1 VOZ & AUDIO PTT (OPENROUTER FISH AUDIO)
// ==========================================
router.post('/voice/synthesize', async (req, res) => {
    const { VoiceService } = await import('../services/voiceService.js');
    const { text, voiceModel, voiceId } = req.body;
    if (!text)
        return res.status(400).json({ error: 'Texto para síntese é obrigatório' });
    const result = await VoiceService.synthesizeVoice({ text, voiceModel, voiceId });
    res.json(result);
});
router.post('/voice/test', async (req, res) => {
    const { VoiceService } = await import('../services/voiceService.js');
    const { apiKey } = req.body || {};
    const result = await VoiceService.testVoiceApi(apiKey);
    res.json(result);
});
router.post('/ai/knowledge', (req, res) => {
    const { title, category, content } = req.body;
    const newDoc = {
        id: `kb-${Date.now()}`,
        title: title || 'Novo Documento',
        category: category || 'faq',
        content: content || '',
        updatedAt: new Date().toISOString().split('T')[0]
    };
    db.aiConfig.knowledgeBase.push(newDoc);
    res.json(newDoc);
});
router.delete('/ai/knowledge/:id', (req, res) => {
    db.aiConfig.knowledgeBase = db.aiConfig.knowledgeBase.filter((doc) => doc.id !== req.params.id);
    res.json({ success: true });
});
// ==========================================
// 5. OCR & LEITOR DE COMPROVANTES (IMAGENS & PDFS)
// ==========================================
router.get('/proof/samples', (req, res) => {
    res.json(ProofReaderService.getSampleReceipts());
});
router.post('/proof/analyze', upload.single('receiptFile'), async (req, res) => {
    const fileName = req.file ? req.file.originalname : (req.body.sampleName || 'comprovante_nubank.jpg');
    const expectedAmount = req.body.expectedAmount ? parseFloat(req.body.expectedAmount) : 197.0;
    const analysis = await ProofReaderService.analyzeReceipt(fileName, req.file?.buffer, expectedAmount);
    res.json(analysis);
});
// ==========================================
// 6. CONSTRUTOR VISUAL DE FUNIS & GERADOR IA
// ==========================================
// Helper para garantir áudio válido nos funis
function sanitizeFunnelAudio(funnel) {
    if (!funnel || !funnel.nodes)
        return funnel;
    for (const node of funnel.nodes) {
        if (node.type === 'audioNode' && node.data?.audioUrl) {
            node.data.audioUrl = VoiceService.ensureValidAudioUrl(node.data.audioUrl);
        }
    }
    return funnel;
}
router.get('/funnels', (req, res) => {
    const sanitized = db.funnels.map(sanitizeFunnelAudio);
    res.json(sanitized);
});
router.get('/funnels/:id', (req, res) => {
    const f = db.funnels.find((fn) => fn.id === req.params.id);
    if (!f)
        return res.status(404).json({ error: 'Funil não encontrado' });
    res.json(sanitizeFunnelAudio(f));
});
router.post('/funnels', (req, res) => {
    const newFunnel = req.body;
    if (!newFunnel.id)
        newFunnel.id = `funnel-${Date.now()}`;
    if (!newFunnel.createdAt)
        newFunnel.createdAt = new Date().toISOString();
    const saved = db.upsertFunnel(sanitizeFunnelAudio(newFunnel));
    res.json(sanitizeFunnelAudio(saved));
});
router.put('/funnels/:id', (req, res) => {
    const updated = db.upsertFunnel({ id: req.params.id, ...req.body });
    res.json(sanitizeFunnelAudio(updated));
});
router.delete('/funnels/:id', (req, res) => {
    db.deleteFunnel(req.params.id);
    res.json({ success: true });
});
router.post('/funnels/generate-ai', async (req, res) => {
    try {
        const { prompt, productName, price, downsellPrice, includeVoice, voiceModel, strategy, complexity } = req.body;
        if (!prompt && !productName) {
            return res.status(400).json({ error: 'Prompt ou nome do produto é obrigatório' });
        }
        const generatedFunnel = await AiAgentEngine.generateFunnelWithAi({
            prompt: prompt || `Funil de vendas para ${productName}`,
            productName,
            price,
            downsellPrice,
            includeVoice: includeVoice !== false,
            voiceModel: voiceModel || 'fish-audio/s2.1-pro-free:free',
            strategy,
            complexity: complexity || 'enterprise'
        });
        const sanitized = sanitizeFunnelAudio(generatedFunnel);
        db.upsertFunnel(sanitized);
        res.json(sanitized);
    }
    catch (error) {
        console.error('Erro ao gerar funil com IA:', error);
        res.status(500).json({ error: error?.message || 'Erro interno ao gerar funil com IA' });
    }
});
router.post('/funnels/:id/ai-maintain', async (req, res) => {
    try {
        const { instruction, voiceModel } = req.body;
        const funnel = db.funnels.find((f) => f.id === req.params.id);
        if (!funnel) {
            return res.status(404).json({ error: 'Funil não encontrado' });
        }
        if (!instruction) {
            return res.status(400).json({ error: 'Instrução de alteração ou manutenção é obrigatória' });
        }
        const result = await AiAgentEngine.maintainFunnelWithAi({
            funnelId: funnel.id,
            instruction,
            currentFunnel: funnel,
            voiceModel: voiceModel || 'fish-audio/s2.1-pro-free:free'
        });
        const funnelData = (result && result.funnel) ? result.funnel : result;
        const sanitized = sanitizeFunnelAudio(funnelData);
        db.upsertFunnel(sanitized);
        res.json({
            ...sanitized,
            aiMeta: (result && result.aiMeta) ? result.aiMeta : undefined
        });
    }
    catch (error) {
        console.error('Erro na manutenção de funil com IA:', error);
        res.status(500).json({ error: error?.message || 'Erro interno ao aplicar manutenção no funil com IA' });
    }
});
// ==========================================
// 7. META ADS & CONVERSÕES CAPI
// ==========================================
router.get('/meta/campaigns', (req, res) => {
    res.json(MetaAdsService.getCampaigns());
});
router.post('/meta/conversion', async (req, res) => {
    const { eventName, phone, value, content_name } = req.body;
    const result = await MetaAdsService.sendMetaConversionEvent(eventName || 'Purchase', { phone: phone || '+55 11 99999-9999' }, { value: value || 197.0, currency: 'BRL', content_name: content_name || 'Método Vendedor X1' });
    res.json(result);
});
// ==========================================
// 8. WEBHOOKS DE INFOPRODUTOS (KIWIFY / HOTMART / WAHA)
// ==========================================
router.post('/webhooks/waha', async (req, res) => {
    try {
        const { event, session, payload } = req.body;
        console.log(`[WEBHOOK WAHA] Event: ${event} | Session: ${session}`);
        // Trata atualização de status da sessão no WAHA (ex: WORKING quando o usuário lê o QR code)
        if (event === 'session.status') {
            const status = payload?.status;
            console.log(`[WAHA WEBHOOK] Status da sessão atualizado: ${session} -> ${status}`);
            const inst = db.instances.find((i) => i.id === session) || db.instances[0];
            if (inst) {
                if (status === 'WORKING') {
                    inst.status = 'connected';
                    inst.qrCode = undefined;
                    console.log(`[WAHA WEBHOOK] 🎉 Instância ${inst.name} conectada com sucesso ao WhatsApp!`);
                }
                else if (status === 'STOPPED' || status === 'FAILED') {
                    inst.status = 'disconnected';
                }
            }
            return res.json({ success: true, session, status });
        }
        // Ignora mensagens enviadas por nós mesmos para não entrar em loop
        if (payload?.fromMe) {
            return res.json({ ignored: true, reason: 'fromMe' });
        }
        if (event === 'message' || event === 'message.any') {
            const remoteJid = payload?.from || payload?.chatId || '';
            const cleanPhone = remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '');
            const incomingText = payload?.body || '';
            if (!cleanPhone) {
                return res.json({ error: 'No sender phone' });
            }
            // 1. Localiza ou cria o lead no CRM
            const existingLead = db.leads.find((l) => l.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''));
            let lead;
            if (!existingLead) {
                lead = {
                    id: `lead-${Date.now()}`,
                    name: payload?._data?.notifyName || `Lead +${cleanPhone}`,
                    phone: `+${cleanPhone}`,
                    status: 'new',
                    offerValue: 197.0,
                    tags: ['Origem WAHA', 'Orgânico WhatsApp'],
                    aiActive: true,
                    origin: 'organic',
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 1
                };
                db.leads.unshift(lead);
            }
            else {
                lead = existingLead;
            }
            // 2. Registra mensagem do cliente
            const userMsg = {
                id: `msg-${Date.now()}`,
                leadId: lead.id,
                sender: 'lead',
                type: payload?.hasMedia ? 'image' : 'text',
                content: incomingText || (payload?.hasMedia ? '[Mídia Recebida]' : ''),
                timestamp: new Date().toISOString(),
                status: 'delivered'
            };
            if (!db.messages[lead.id])
                db.messages[lead.id] = [];
            db.messages[lead.id].push(userMsg);
            lead.lastMessageAt = userMsg.timestamp;
            // 3. Se a IA estiver ativa no lead, executa o Funil no WhatsApp real via WAHA!
            if (lead.aiActive) {
                const inst = db.instances.find((i) => i.id === session) || db.instances[0];
                console.log(`[WAHA WEBHOOK] Processando mensagem de ${cleanPhone} no Funil / FlowEngine...`);
                const flowResult = await FlowEngine.advanceLead(lead, incomingText, inst, remoteJid);
                // Fallback: Se o lead não estiver em nenhum funil e o FlowEngine não processou
                if (!flowResult.processed) {
                    console.log(`[WAHA WEBHOOK] Nenhum funil ativo processado. Acionando IA conversacional livre...`);
                    const aiReply = await AiAgentEngine.handleIncomingLeadMessage(lead, incomingText);
                    const aiMsg = {
                        id: `msg-ai-${Date.now()}`,
                        leadId: lead.id,
                        sender: 'ai',
                        type: aiReply.actionTaken === 'pix_generated' ? 'pix' : 'text',
                        content: aiReply.replyText,
                        timestamp: new Date().toISOString(),
                        status: 'delivered'
                    };
                    if (!db.messages[lead.id])
                        db.messages[lead.id] = [];
                    db.messages[lead.id].push(aiMsg);
                    lead.lastMessageAt = aiMsg.timestamp;
                    // Envia de volta para o WhatsApp real via WAHA
                    if (inst) {
                        WahaService.sendTextMessage(inst, remoteJid, aiReply.replyText).catch((e) => console.warn('[WAHA Send Error]:', e.message));
                    }
                }
            }
        }
        res.json({ success: true, processed: true });
    }
    catch (error) {
        console.error('[WEBHOOK WAHA Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});
router.post('/webhooks/kiwify', (req, res) => {
    console.log('[WEBHOOK KIWIFY]', req.body);
    res.json({ received: true });
});
