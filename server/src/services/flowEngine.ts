import { SalesFunnel, Lead, FunnelNode, ChatMessage, WhatsAppInstance } from '../types/index.js';
import { db } from '../store/db.js';
import { WahaService } from './wahaService.js';
import { AiAgentEngine } from './aiAgentEngine.js';

export interface FlowExecutionResult {
  processed: boolean;
  funnelId?: string;
  funnelName?: string;
  executedNodes: string[];
  waitingForReply?: boolean;
  leadStatus?: string;
  error?: string;
}

export class FlowEngine {
  /**
   * Avalia gatilhos de funil para um lead baseado em palavras-chave ou funil já em andamento
   */
  static matchFunnel(lead: Lead, messageText: string, instance?: WhatsAppInstance): SalesFunnel | undefined {
    const textUpper = (messageText || '').toUpperCase();

    // 0. Se a Instância/Número de WhatsApp possui um Funil específico vinculado
    if (instance?.assignedFunnelId) {
      const instanceFunnel = db.funnels.find((f) => f.id === instance.assignedFunnelId && f.active);
      if (instanceFunnel) {
        // Se o lead ainda não tem funil ou se já está neste funil
        if (!lead.assignedFunnelId || lead.assignedFunnelId === instanceFunnel.id) {
          return instanceFunnel;
        }
      }
    }

    // 1. Se o lead já está com um funil ativo em andamento (com nó atual ou atribuído)
    if (lead.assignedFunnelId) {
      const currentFunnel = db.funnels.find((f) => f.id === lead.assignedFunnelId && f.active);
      if (currentFunnel) {
        // Se ainda está em um passo ativo do funil, prioriza a continuidade do funil
        if (lead.currentStepId) {
          return currentFunnel;
        }
        // Se não houver palavra-chave explícita para trocar de funil, mantém o funil atual
        const keywordMatchDifferentFunnel = db.funnels.find(
          (f) => f.id !== lead.assignedFunnelId && f.active && f.triggerKeywords?.some((kw) => textUpper.includes(kw.toUpperCase()))
        );
        if (!keywordMatchDifferentFunnel) {
          return currentFunnel;
        }
        return keywordMatchDifferentFunnel;
      }
    }

    // 2. Busca funil por correspondência de palavra-chave
    for (const funnel of db.funnels) {
      if (!funnel.active) continue;
      if (funnel.triggerKeywords && funnel.triggerKeywords.some((kw) => textUpper.includes(kw.toUpperCase()))) {
        return funnel;
      }
    }

    // 3. Fallback: Retorna o funil vinculado à instância ou o primeiro funil ativo configurado
    if (instance?.assignedFunnelId) {
      const instanceFunnel = db.funnels.find((f) => f.id === instance.assignedFunnelId && f.active);
      if (instanceFunnel) return instanceFunnel;
    }

    return db.funnels.find((f) => f.active);
  }

  /**
   * Avalia a condição de um ConditionNode contra o texto recebido ou tags do lead
   */
  static evaluateCondition(node: FunnelNode, incomingText: string, lead: Lead): boolean {
    const data = node.data || node.config || {};
    const condText = ((data.conditionText || data.condition || '') as string).toLowerCase().trim();
    const textLower = (incomingText || '').toLowerCase().trim();

    // 1. Checagem de Etiqueta (ex: "Etiqueta igual PARTE 1" ou "tag VIP")
    if (condText.includes('etiqueta') || condText.includes('tag')) {
      const hasMatchingTag = lead.tags.some((tag) => condText.includes(tag.toLowerCase()));
      if (hasMatchingTag) return true;
    }

    // 2. Detecção de negação explícita do cliente
    const negativeKeywords = ['não', 'nao', 'agora não', 'caro', 'sem dinheiro', 'depois', 'desisto', 'sai fora', 'nunca'];
    if (negativeKeywords.some((w) => textLower.includes(w))) {
      return false;
    }

    // 3. Detecção de aceitação ou interesse
    const positiveKeywords = ['sim', 'quero', 'tenho interesse', 'comprar', 'pix', 'manda', 'bora', 'pode ser', 'claro', 'qual o valor', 'como funciona', 'ok'];
    if (positiveKeywords.some((w) => textLower.includes(w))) {
      return true;
    }

    // 4. Correspondência com palavra-chave descrita na condição
    if (condText) {
      const cleanCond = condText.replace(/etiqueta|tag|igual|contem|valor/gi, '').trim();
      if (cleanCond && textLower.includes(cleanCond)) {
        return true;
      }
    }

    return true;
  }

  /**
   * Converte strings de delay de funil ("5s - 10s", "8s", "3s-7s", "15 segundos", "1m", etc.)
   * em milissegundos estritos para serem rigorosamente respeitados.
   */
  static parseDelayMs(delayVal: any, defaultMinMs = 3000, defaultMaxMs = 7000): number {
    if (!delayVal) {
      return Math.floor(Math.random() * (defaultMaxMs - defaultMinMs + 1)) + defaultMinMs;
    }
    const str = String(delayVal).trim().toLowerCase();

    // 1. Faixa com hífen ou "a": ex: "5s - 10s", "3s - 5s", "5 a 10s", "3-5"
    const rangeMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:s|seg|min|m)?\s*(?:-|a|à|to)\s*(\d+(?:\.\d+)?)\s*(s|seg|min|m)?/i);
    if (rangeMatch) {
      let min = parseFloat(rangeMatch[1]);
      let max = parseFloat(rangeMatch[2]);
      const unit = (rangeMatch[3] || '').toLowerCase();
      const isMinutes = unit.startsWith('m') || str.includes('min') || str.includes('minuto');

      if (isMinutes) {
        min *= 60000;
        max *= 60000;
      } else {
        min *= 1000;
        max *= 1000;
      }
      if (max < min) [min, max] = [max, min];
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 2. Horas (para smartDelay)
    if (str.includes('h') || str.includes('hora')) {
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 1;
      return Math.min(Math.round(num * 3600 * 1000), 600000);
    }

    // 3. Minutos
    if (str.includes('m') || str.includes('min')) {
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 1;
      return Math.min(Math.round(num * 60 * 1000), 600000);
    }

    // 4. Segundos
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      return Math.round(num * 1000);
    }

    return Math.floor(Math.random() * (defaultMaxMs - defaultMinMs + 1)) + defaultMinMs;
  }

  /**
   * Converte strings de duração de áudio ("0:10", "0:28", "1:15", "8", "15s") em segundos inteiros
   */
  static parseDurationSec(durationVal: any, defaultSec = 8): number {
    if (!durationVal) return defaultSec;
    const str = String(durationVal).trim();
    if (str.includes(':')) {
      const parts = str.split(':');
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return Math.max(1, min * 60 + sec);
    }
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return !isNaN(num) && num > 0 ? num : defaultSec;
  }

  /**
   * Executa os blocos do funil para o lead passo a passo até encontrar uma pausa ou o fim do fluxo
   */
  static async advanceLead(
    lead: Lead,
    incomingText: string,
    instance?: WhatsAppInstance,
    remoteJid?: string
  ): Promise<FlowExecutionResult> {
    const funnel = this.matchFunnel(lead, incomingText, instance);
    if (!funnel) {
      return { processed: false, executedNodes: [] };
    }

    lead.assignedFunnelId = funnel.id;
    const jid = remoteJid || WahaService.formatChatId(lead.phone);
    const executedNodes: string[] = [];
    let currentNode: FunnelNode | undefined;

    console.log(`[FLOW ENGINE] Avançando lead ${lead.name} (${lead.phone}) no funil "${funnel.name}" (Passo atual: ${lead.currentStepId || 'INÍCIO'})`);

    // =========================================================================
    // 1. LOCALIZAÇÃO DO PONTO DE PARTIDA OU CONTINUIDADE
    // =========================================================================
    if (!lead.currentStepId) {
      // Início do funil
      funnel.stats.started = (funnel.stats.started || 0) + 1;

      // Procura o nó de partida (startNode, trigger ou nó sem arestas de entrada)
      const startNode =
        funnel.nodes.find((n) => n.type === 'startNode' || n.type === 'trigger') ||
        funnel.nodes.find((n) => !funnel.edges.some((e) => e.target === n.id)) ||
        funnel.nodes[0];

      if (!startNode) {
        return { processed: false, executedNodes: [] };
      }

      executedNodes.push(startNode.id);

      // Avança a partir do nó de início para o primeiro nó de ação conectado
      const firstEdge = funnel.edges.find((e) => e.source === startNode.id);
      if (firstEdge) {
        currentNode = funnel.nodes.find((n) => n.id === firstEdge.target);
      } else {
        return { processed: true, funnelId: funnel.id, funnelName: funnel.name, executedNodes };
      }
    } else {
      // O lead já estava em um bloco do funil (por exemplo: Aguarda Resposta)
      const pausedNode = funnel.nodes.find((n) => n.id === lead.currentStepId);
      if (!pausedNode) {
        // Se o nó foi excluído ou não existe mais no fluxo, reinicia
        lead.currentStepId = undefined;
        return { processed: false, executedNodes };
      }

      executedNodes.push(pausedNode.id);

      if (pausedNode.type === 'waitReplyNode') {
        // O cliente acabou de responder! Segue pela saída 'replied' ou primeira saída disponível
        const replyEdge =
          funnel.edges.find((e) => e.source === pausedNode.id && e.sourceHandle === 'replied') ||
          funnel.edges.find((e) => e.source === pausedNode.id);

        if (replyEdge) {
          currentNode = funnel.nodes.find((n) => n.id === replyEdge.target);
        } else {
          lead.currentStepId = undefined;
          funnel.stats.completed = (funnel.stats.completed || 0) + 1;
          return { processed: true, funnelId: funnel.id, funnelName: funnel.name, executedNodes };
        }
      } else if (pausedNode.type === 'conditionNode') {
        // Avalia condição baseada na resposta recebida
        const isMet = this.evaluateCondition(pausedNode, incomingText, lead);
        const targetHandle = isMet ? 'true' : 'false';
        const condEdge =
          funnel.edges.find((e) => e.source === pausedNode.id && e.sourceHandle === targetHandle) ||
          funnel.edges.find((e) => e.source === pausedNode.id);

        if (condEdge) {
          currentNode = funnel.nodes.find((n) => n.id === condEdge.target);
        } else {
          lead.currentStepId = undefined;
          return { processed: true, funnelId: funnel.id, funnelName: funnel.name, executedNodes };
        }
      } else {
        // Avança para o próximo bloco conectado
        const nextEdge = funnel.edges.find((e) => e.source === pausedNode.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          funnel.stats.completed = (funnel.stats.completed || 0) + 1;
          return { processed: true, funnelId: funnel.id, funnelName: funnel.name, executedNodes };
        }
      }
    }

    // =========================================================================
    // 2. LOOP DE EXECUÇÃO AUTÔNOMA DE NÓS (Atravessa arestas sequenciais)
    // =========================================================================
    let stepCount = 0;
    const MAX_STEPS = 25;

    while (currentNode && stepCount < MAX_STEPS) {
      stepCount++;
      executedNodes.push(currentNode.id);
      lead.currentStepId = currentNode.id;

      const nodeType = currentNode.type;
      const nodeData = (currentNode.data || currentNode.config || {}) as Record<string, any>;
      console.log(`[FLOW ENGINE] Executando nó ${currentNode.id} (${nodeType})`);

      // -------------------------------------------------------------
      // BLOCO 1: MENSAGEM DE TEXTO (Com Spintax, Variáveis e Delay)
      // -------------------------------------------------------------
      if (nodeType === 'messageNode' || nodeType === 'message' || nodeType === 'templateNode') {
        let textContent = (nodeData.text || '') as string;
        const firstName = lead.name ? lead.name.split(' ')[0] : 'amigo(a)';

        textContent = textContent
          .replace(/{{nome}}/gi, firstName)
          .replace(/{{telefone}}/gi, lead.phone || '')
          .replace(/{{valor}}/gi, `R$ ${lead.offerValue.toFixed(2).replace('.', ',')}`);

        if (textContent.trim()) {
          // Delay estrito e digitação humanizada do bloco
          const messageDelayMs = FlowEngine.parseDelayMs(nodeData.delay, 4000, 8000);
          console.log(`[FLOW ENGINE] ⏳ Bloco Mensagem ${currentNode.id}: aguardando delay configurado de ${messageDelayMs}ms com status digitando...`);

          if (instance && jid) {
            await WahaService.sendPresence(instance, jid, 'composing');
          }
          await new Promise((resolve) => setTimeout(resolve, messageDelayMs));

          if (instance && jid) {
            await WahaService.sendPresence(instance, jid, 'paused');
            await WahaService.sendDirectTextMessage(instance, jid, textContent);
          }

          // Registra no histórico do chat do CRM
          const textMsg: ChatMessage = {
            id: `msg-fn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            leadId: lead.id,
            sender: 'ai',
            type: 'text',
            content: textContent,
            timestamp: new Date().toISOString(),
            status: 'delivered'
          };
          if (!db.messages[lead.id]) db.messages[lead.id] = [];
          db.messages[lead.id].push(textMsg);
          lead.lastMessageAt = textMsg.timestamp;
        }

        // Se houver áudio embutido neste bloco de mensagem
        const audioUrl = nodeData.audioUrl || (nodeData.audioFileName ? `/audios/${nodeData.audioFileName}` : '');
        if (audioUrl) {
          // Pausa natural entre o texto e o início da gravação do áudio
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const durationSec = FlowEngine.parseDurationSec(nodeData.audioDuration, 8);
          const audioDelayMs = FlowEngine.parseDelayMs(nodeData.audioDelay || nodeData.delay, Math.max(durationSec * 1000, 4000), Math.max(durationSec * 1000, 8000));
          console.log(`[FLOW ENGINE] 🎙️ Áudio anexo: aguardando gravação de ${audioDelayMs}ms (duração: ${durationSec}s)...`);

          if (instance && jid) {
            await WahaService.sendVoiceNote(instance, jid, audioUrl, durationSec, audioDelayMs);
          }
          const audioMsg: ChatMessage = {
            id: `msg-fn-aud-${Date.now()}`,
            leadId: lead.id,
            sender: 'ai',
            type: 'audio',
            content: nodeData.audioScript || '[Mensagem de Voz]',
            mediaUrl: audioUrl,
            timestamp: new Date().toISOString(),
            status: 'delivered'
          };
          if (!db.messages[lead.id]) db.messages[lead.id] = [];
          db.messages[lead.id].push(audioMsg);
          lead.lastMessageAt = audioMsg.timestamp;
        }

        // Se houver arquivos / PDFs anexados a este bloco de mensagem
        const rawFiles = nodeData.files || nodeData.attachments || [];
        const filesList: Array<{ name: string; url?: string; size?: string }> = Array.isArray(rawFiles)
          ? rawFiles.map((f: any) => (typeof f === 'string' ? { name: f } : f))
          : typeof rawFiles === 'object' && rawFiles?.name
          ? [rawFiles]
          : [];

        if (filesList.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const backendBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
          for (const file of filesList) {
            const fileName = file.name || 'documento.pdf';
            const fileUrl = file.url || `${backendBaseUrl}/files/${encodeURIComponent(fileName)}`;

            console.log(`[FLOW ENGINE] Enviando documento oficial "${fileName}" via WAHA para lead ${lead.phone}... URL: ${fileUrl}`);

            if (instance && jid) {
              await WahaService.sendFile(instance, jid, fileUrl, fileName, `Segue o material: ${fileName}`);
            }

            const docMsg: ChatMessage = {
              id: `msg-doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              leadId: lead.id,
              sender: 'ai',
              type: 'document',
              content: `📄 Arquivo: ${fileName}`,
              mediaUrl: fileUrl,
              timestamp: new Date().toISOString(),
              status: 'delivered'
            };
            if (!db.messages[lead.id]) db.messages[lead.id] = [];
            db.messages[lead.id].push(docMsg);
            lead.lastMessageAt = docMsg.timestamp;
          }
        }

        // Pausa de respiro após o bloco para humanização realista antes do próximo nó
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Avança para o próximo nó
        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          funnel.stats.completed = (funnel.stats.completed || 0) + 1;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 1.5: ENVIO DEDICADO DE ARQUIVO OU DOCUMENTO PDF
      // -------------------------------------------------------------
      if (nodeType === 'fileNode' || nodeType === 'documentNode' || nodeType === 'mediaNode') {
        const fileDelayMs = FlowEngine.parseDelayMs(nodeData.delay, 3000, 5000);
        console.log(`[FLOW ENGINE] 📁 Bloco de Arquivo: aguardando delay de ${fileDelayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, fileDelayMs));

        const rawFiles = nodeData.files || (nodeData.fileName ? [{ name: nodeData.fileName, url: nodeData.fileUrl }] : []);
        const filesList: Array<{ name: string; url?: string }> = Array.isArray(rawFiles)
          ? rawFiles.map((f: any) => (typeof f === 'string' ? { name: f } : f))
          : [];

        const backendBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        for (const file of filesList) {
          const fileName = file.name || 'documento.pdf';
          const fileUrl = file.url || `${backendBaseUrl}/files/${encodeURIComponent(fileName)}`;

          console.log(`[FLOW ENGINE] Nó dedicado de documento: enviando "${fileName}" via WAHA para lead ${lead.phone}...`);

          if (instance && jid) {
            await WahaService.sendFile(instance, jid, fileUrl, fileName, nodeData.caption || `Segue o material: ${fileName}`);
          }

          const docMsg: ChatMessage = {
            id: `msg-doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            leadId: lead.id,
            sender: 'ai',
            type: 'document',
            content: `📄 Arquivo: ${fileName}`,
            mediaUrl: fileUrl,
            timestamp: new Date().toISOString(),
            status: 'delivered'
          };
          if (!db.messages[lead.id]) db.messages[lead.id] = [];
          db.messages[lead.id].push(docMsg);
          lead.lastMessageAt = docMsg.timestamp;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          funnel.stats.completed = (funnel.stats.completed || 0) + 1;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 2: ÁUDIO DE VOZ ISOLADO (PTT / Voice Note)
      // -------------------------------------------------------------
      if (nodeType === 'audioNode' || nodeType === 'audio') {
        const audioUrl = nodeData.audioUrl || (nodeData.audioFileName ? `/audios/${nodeData.audioFileName}` : '');
        const durationSec = FlowEngine.parseDurationSec(nodeData.audioDuration, 8);
        const delayMs = FlowEngine.parseDelayMs(nodeData.delay, Math.max(durationSec * 1000, 4000), Math.max(durationSec * 1000, 8000));

        console.log(`[FLOW ENGINE] 🎙️ Bloco de Áudio ${currentNode.id}: aguardando delay de gravação de ${delayMs}ms (duração: ${durationSec}s)...`);

        if (audioUrl && instance && jid) {
          await WahaService.sendVoiceNote(instance, jid, audioUrl, durationSec, delayMs);
        }

        const audioMsg: ChatMessage = {
          id: `msg-fn-aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          leadId: lead.id,
          sender: 'ai',
          type: 'audio',
          content: nodeData.audioScript || '[Mensagem de Voz]',
          mediaUrl: audioUrl,
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };
        if (!db.messages[lead.id]) db.messages[lead.id] = [];
        db.messages[lead.id].push(audioMsg);
        lead.lastMessageAt = audioMsg.timestamp;

        // Pausa de respiro após áudio antes de ir para o próximo bloco
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Avança para o próximo nó
        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          funnel.stats.completed = (funnel.stats.completed || 0) + 1;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 3: AGUARDA RESPOSTA (Ponto de parada crucial do Funil!)
      // -------------------------------------------------------------
      if (nodeType === 'waitReplyNode') {
        // Pausa a execução no bloco atual e aguarda o cliente responder no WhatsApp!
        lead.currentStepId = currentNode.id;
        console.log(`[FLOW ENGINE] Funil pausado no nó ${currentNode.id} (Aguarda Resposta). Aguardando resposta do lead.`);
        return {
          processed: true,
          funnelId: funnel.id,
          funnelName: funnel.name,
          executedNodes,
          waitingForReply: true
        };
      }

      // -------------------------------------------------------------
      // BLOCO 4: CONDICIONAL (Ramificação por Regras ou Intenção)
      // -------------------------------------------------------------
      if (nodeType === 'conditionNode') {
        const isMet = this.evaluateCondition(currentNode, incomingText, lead);
        const targetHandle = isMet ? 'true' : 'false';
        const condEdge =
          funnel.edges.find((e) => e.source === currentNode!.id && e.sourceHandle === targetHandle) ||
          funnel.edges.find((e) => e.source === currentNode!.id);

        if (condEdge) {
          currentNode = funnel.nodes.find((n) => n.id === condEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 5: BOTÃO PIX / GERADOR DE COBRANÇA
      // -------------------------------------------------------------
      if (nodeType === 'pixButtonNode' || nodeType === 'pix_generator' || nodeType === 'paymentNode') {
        const pixDelayMs = FlowEngine.parseDelayMs(nodeData.delay, 3000, 6000);
        console.log(`[FLOW ENGINE] ⚡ Bloco PIX ${currentNode.id}: aguardando delay de ${pixDelayMs}ms com status digitando...`);

        if (instance && jid) {
          await WahaService.sendPresence(instance, jid, 'composing');
        }
        await new Promise((resolve) => setTimeout(resolve, pixDelayMs));

        if (instance && jid) {
          await WahaService.sendPresence(instance, jid, 'paused');
        }

        const rawAmount = String(nodeData.amount || lead.offerValue || '197').replace(',', '.');
        const amount = parseFloat(rawAmount) || 197.0;
        const txId = `WPX-${Math.floor(Math.random() * 899999 + 100000)}`;
        const pixCode = `00020126580014br.gov.bcb.pix0136whatspix-gateway-pay@whatspix.ia5204000053039865406${amount.toFixed(2)}5802BR5925WHATSTEC TECNOLOGIA LTDA6009SAO PAULO62070503***6304E8A1`;

        lead.status = 'pix_generated';
        lead.pixCode = pixCode;
        lead.pixTxId = txId;
        lead.offerValue = amount;
        if (!lead.tags.includes('pix_pendente')) lead.tags.push('pix_pendente');

        const pixText = `Aqui está o seu PIX Copia e Cola no valor de *R$ ${amount.toFixed(2).replace('.', ',')}*:\n\n\`\`\`${pixCode}\`\`\`\n\nCopie o código acima e pague no app do seu banco. Assim que pagar, me envie o comprovante por aqui para liberarmos imediatamente seu acesso! ⚡`;

        if (instance && jid) {
          await WahaService.sendDirectTextMessage(instance, jid, pixText);
        }

        const pixMsg: ChatMessage = {
          id: `msg-pix-${Date.now()}`,
          leadId: lead.id,
          sender: 'ai',
          type: 'pix',
          content: pixText,
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };
        if (!db.messages[lead.id]) db.messages[lead.id] = [];
        db.messages[lead.id].push(pixMsg);
        lead.lastMessageAt = pixMsg.timestamp;

        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Avança para o próximo nó
        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 6: ETIQUETAS (TAGS)
      // -------------------------------------------------------------
      if (nodeType === 'tagNode') {
        const tagsToAdd = (nodeData.tags || (nodeData.tag ? [nodeData.tag] : [])) as string[];
        for (const t of tagsToAdd) {
          if (!lead.tags.includes(t)) lead.tags.push(t);
        }

        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 7: KANBAN CRM
      // -------------------------------------------------------------
      if (nodeType === 'kanbanNode') {
        if (nodeData.kanbanStage) {
          lead.status = nodeData.kanbanStage as any;
        }
        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 8: DELAY INTELIGENTE (Smart Delay)
      // -------------------------------------------------------------
      if (nodeType === 'smartDelayNode' || nodeType === 'delay') {
        const smartDelayMs = FlowEngine.parseDelayMs(nodeData.delay, 10000, 20000);
        console.log(`[FLOW ENGINE] ⏱️ Intervalo Inteligente ${currentNode.id}: aguardando delay estrito de ${smartDelayMs}ms (${nodeData.delay || 'padrão'})...`);
        await new Promise((resolve) => setTimeout(resolve, smartDelayMs));

        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 9: AGENTE IA (Copiloto / LLM Livre)
      // -------------------------------------------------------------
      if (nodeType === 'aiBlockNode' || nodeType === 'ai_agent') {
        const aiReply = await AiAgentEngine.handleIncomingLeadMessage(lead, incomingText);
        if (aiReply && aiReply.replyText) {
          if (instance && jid) {
            await WahaService.sendTextMessage(instance, jid, aiReply.replyText);
          }
          const aiMsg: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            leadId: lead.id,
            sender: 'ai',
            type: aiReply.actionTaken === 'pix_generated' ? 'pix' : 'text',
            content: aiReply.replyText,
            timestamp: new Date().toISOString(),
            status: 'delivered'
          };
          if (!db.messages[lead.id]) db.messages[lead.id] = [];
          db.messages[lead.id].push(aiMsg);
          lead.lastMessageAt = aiMsg.timestamp;
        }

        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 10: CONTROLE DE CHAT / TRANSBORDO HUMANO
      // -------------------------------------------------------------
      if (nodeType === 'chatControllerNode') {
        lead.aiActive = false;
        lead.status = 'transferred';
        if (!lead.tags.includes('atendimento_humano')) lead.tags.push('atendimento_humano');
        break;
      }

      // -------------------------------------------------------------
      // BLOCO 11: VENDA APROVADA
      // -------------------------------------------------------------
      if (nodeType === 'approvedSaleNode' || nodeType === 'ocr_checker') {
        lead.status = 'paid';
        lead.proofValidated = true;
        funnel.stats.conversions = (funnel.stats.conversions || 0) + 1;
        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // BLOCO 12: LIGAÇÃO WHATSAPP (Call Node - Toque de Atenção)
      // -------------------------------------------------------------
      if (nodeType === 'callNode' || nodeType === 'call') {
        const rawDur = String(nodeData.callDuration || '15s').replace(/[^0-9]/g, '');
        const durationSec = parseInt(rawDur, 10) || 15;

        console.log(`[FLOW ENGINE] 📞 Executando chamada WhatsApp para lead ${lead.phone} (${durationSec}s de toque)...`);

        if (instance && jid) {
          await WahaService.makeWhatsAppCall(instance, jid, durationSec);
        }

        const callMsg: ChatMessage = {
          id: `msg-call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          leadId: lead.id,
          sender: 'ai',
          type: 'text',
          content: `📞 [Chamada de Voz WhatsApp Realizada] Toque de ${durationSec}s disparado para despertar o lead no celular.`,
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };
        if (!db.messages[lead.id]) db.messages[lead.id] = [];
        db.messages[lead.id].push(callMsg);
        lead.lastMessageAt = callMsg.timestamp;

        const nextEdge = funnel.edges.find((e) => e.source === currentNode!.id);
        if (nextEdge) {
          currentNode = funnel.nodes.find((n) => n.id === nextEdge.target);
        } else {
          lead.currentStepId = undefined;
          funnel.stats.completed = (funnel.stats.completed || 0) + 1;
          break;
        }
        continue;
      }

      // -------------------------------------------------------------
      // QUALQUER OUTRO BLOCO (Menu, Carrossel, Notificação, etc.)
      // -------------------------------------------------------------
      const genericEdge = funnel.edges.find((e) => e.source === currentNode!.id);
      if (genericEdge) {
        currentNode = funnel.nodes.find((n) => n.id === genericEdge.target);
      } else {
        lead.currentStepId = undefined;
        funnel.stats.completed = (funnel.stats.completed || 0) + 1;
        break;
      }
    }

    return {
      processed: true,
      funnelId: funnel.id,
      funnelName: funnel.name,
      executedNodes,
      waitingForReply: false
    };
  }

  /**
   * Mantido para compatibilidade retroativa
   */
  static startFunnelForLead(funnel: SalesFunnel, lead: Lead): { initialNode?: FunnelNode; welcomeText?: string } {
    lead.assignedFunnelId = funnel.id;
    funnel.stats.started += 1;

    const triggerNode = funnel.nodes.find((n) => n.type === 'trigger' || n.type === 'startNode');
    if (!triggerNode) return {};

    const edge = funnel.edges.find((e) => e.source === triggerNode.id);
    if (!edge) return {};

    const nextNode = funnel.nodes.find((n) => n.id === edge.target);
    if (!nextNode) return {};

    lead.currentStepId = nextNode.id;

    const messageText = (nextNode.data?.text || nextNode.config?.text) as string | undefined;
    if ((nextNode.type === 'message' || nextNode.type === 'messageNode') && messageText) {
      const rawText = messageText.replace('{{nome}}', lead.name.split(' ')[0]);
      return { initialNode: nextNode, welcomeText: rawText };
    }

    return { initialNode: nextNode };
  }
}
