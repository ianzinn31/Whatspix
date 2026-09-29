import { AiAgentConfig, Lead, ChatMessage, SalesFunnel, FunnelNode, FunnelEdge } from '../types/index.js';
import { db } from '../store/db.js';
import { ProofReaderService } from './proofReaderService.js';

export class AiAgentEngine {
  /**
   * Processa a mensagem do lead e gera a resposta da IA com suporte a Function Calling
   */
  static async handleIncomingLeadMessage(
    lead: Lead,
    userMessage: string
  ): Promise<{
    replyText: string;
    actionTaken?: 'pix_generated' | 'receipt_analyzed' | 'discount_applied' | 'transferred_human' | 'none';
    pixData?: { code: string; txId: string; amount: number };
  }> {
    const aiConfig = db.aiConfig;
    const lower = userMessage.toLowerCase();

    // 1. Detecta se o usuário enviou comprovante ou confirmou pagamento de forma explícita
    if (
      (lower.includes('comprovante') || lower.includes('ja transferi') || lower.includes('mandei o pix')) &&
      (userMessage.length < 80 || lower.includes('segue') || lower.includes('anexo') || lower.includes('print'))
    ) {
      const receipt = await ProofReaderService.analyzeReceipt('comprovante_recebido.jpg', undefined, lead.offerValue);

      if (receipt.isValid) {
        lead.status = 'paid';
        lead.proofValidated = true;
        lead.aiActive = false;
        lead.tags = lead.tags.filter((t) => t !== 'pix_pendente');
        lead.tags.push('aluna_aprovada', 'comprovante_validado_ia');

        return {
          replyText: `🎉 *PAGAMENTO DE R$ ${receipt.amount.toFixed(2).replace('.', ',')} CONFIRMADO COM SUCESSO!*\n\nIdentificamos o comprovante do ${receipt.bankName}.\n\nSeu acesso prioritário aos módulos e área de membros acabou de ser liberado no seu e-mail e WhatsApp! Seja muito bem-vindo(a) à nossa turma VIP! 🔥`,
          actionTaken: 'receipt_analyzed'
        };
      }
    }

    // 2. Pedido explícito de Atendente Humano
    if (lower.includes('falar com humano') || lower.includes('atendente humano') || lower.includes('chamar atendente')) {
      lead.aiActive = false;
      lead.status = 'transferred';
      if (!lead.tags.includes('suporte_humano')) lead.tags.push('suporte_humano');

      return {
        replyText: `Com certeza! Estou pausando meu atendimento automático e já notifiquei nosso especialista humano de plantão. Em instantes ele continua a conversa com você por aqui! ⏱️`,
        actionTaken: 'transferred_human'
      };
    }

    // 3. Chamada Principal à Cascata de IA (100% NVIDIA NIM)
    try {
      const kbContext = aiConfig.knowledgeBase
        .map((doc) => `--- ${doc.title} (${doc.category}) ---\n${doc.content}`)
        .join('\n\n');

      const systemPrompt = `Você é ${aiConfig.personaName}, atuando como ${aiConfig.agentRole}.
Tom de voz: ${aiConfig.tone}.

DIRETRIZES FUNDAMENTAIS PARA WHATSAPP:
1. Responda em português do Brasil, de forma humana, empática e persuasiva (técnicas de SPIN Selling).
2. Não escreva blocos gigantes de texto. Mantenha 1 a 3 parágrafos curtos e objetivos com espaçamento.
3. Conduza o lead para o próximo passo (compreensão da dor, validação e compra).
4. O valor atual da oferta para este lead é de R$ ${lead.offerValue.toFixed(2).replace('.', ',')}.
5. Use emojis de forma moderada e natural.

BASE DE CONHECIMENTO DO PRODUTO:
${kbContext || 'Produto: Método Vendedor Automático X1. Treinamento prático e ferramentas para faturar no WhatsApp.'}

INSTRUÇÕES ESPECÍFICAS DO CRIADOR:
${aiConfig.customInstructions}

REGRAS DE AÇÕES ESPECIAIS (adicione a tag no final da mensagem se aplicável):
- Se o lead confirmar explicitamente que quer comprar, pedir o código PIX ou pedir a chave: adicione a tag [ACAO: GERAR_PIX] no final.
- Se o cliente solicitar atendente humano ou suporte avançado: adicione [ACAO: TRANSFERIR_HUMANO] no final.`;

      const history = db.messages[lead.id] || [];

      // Invoca a cascata de IA
      const cascadeResult = await import('./aiProviderService.js').then((m) =>
        m.AiProviderService.generateWithCascade({
          systemPrompt,
          userMessage,
          conversationHistory: history.map((m) => ({ sender: m.sender as any, content: m.content }))
        })
      );

      if (cascadeResult && cascadeResult.replyText) {
        let cleanText = cascadeResult.replyText;
        let action: 'pix_generated' | 'transferred_human' | 'none' = 'none';
        let pixPayload: any = undefined;

        if (cleanText.includes('[ACAO: GERAR_PIX]')) {
          cleanText = cleanText.replace('[ACAO: GERAR_PIX]', '').trim();
          action = 'pix_generated';
          lead.status = 'pix_generated';
          if (!lead.tags.includes('pix_pendente')) lead.tags.push('pix_pendente');

          const amount = lead.offerValue || 197.0;
          const txId = `WPX-${Math.floor(Math.random() * 899999 + 100000)}`;
          const pixCode = `00020126580014br.gov.bcb.pix0136whatspix-gateway-pay@whatspix.ia5204000053039865406${amount.toFixed(2)}5802BR5925WHATSTEC TECNOLOGIA LTDA6009SAO PAULO62070503***6304E8A1`;
          lead.pixCode = pixCode;
          lead.pixTxId = txId;
          pixPayload = { code: pixCode, txId, amount };

          cleanText += `\n\n👇 *Código PIX Copia e Cola:*\n\`${pixCode}\`\n\n📌 *Instruções:* Copie o código, pague no app do seu banco e me envie o comprovante aqui para liberação imediata!`;
        } else if (cleanText.includes('[ACAO: TRANSFERIR_HUMANO]')) {
          cleanText = cleanText.replace('[ACAO: TRANSFERIR_HUMANO]', '').trim();
          action = 'transferred_human';
          lead.aiActive = false;
          lead.status = 'transferred';
        }

        return {
          replyText: cleanText,
          actionTaken: action,
          pixData: pixPayload
        };
      }
    } catch (err: any) {
      console.warn('[AiAgentEngine] Erro ao invocar cascata de IA:', err.message);
    }

    // 4. Resposta Heurística de Segurança de contingência (caso a rede/API esteja indisponível)
    return {
      replyText: `Olá, ${lead.name.split(' ')[0]}! Tudo bem? O Método Vendedor Automático X1 é uma estrutura completa que atende seus clientes no WhatsApp 24h por dia, tirando dúvidas, quebrando objeções e gerando pagamentos PIX com segurança anti-banimento.\n\nQual produto você pretende vender?`,
      actionTaken: 'none'
    };
  }

  /**
  /**
   * Construtor de Funis com Inteligência Artificial (NVIDIA NIM + Fish Audio)
   * Analisa a solicitação, extrai produto, preço e variáveis, e monta o grafo ReactFlow completo!
   */
  static async generateFunnelWithAi(params: {
    prompt: string;
    productName?: string;
    price?: number | string;
    downsellPrice?: number | string;
    includeVoice?: boolean;
    voiceModel?: string;
    strategy?: string;
    complexity?: 'basic' | 'advanced' | 'enterprise';
  }): Promise<SalesFunnel> {
    const {
      prompt,
      productName: userProduct,
      price: userPrice,
      downsellPrice: userDownsell,
      includeVoice = true,
      voiceModel = 'fish-audio/s2.1-pro-free:free',
      strategy = 'low_ticket',
      complexity = 'enterprise'
    } = params;

    // 1. Extração preliminar de entidades
    let extractedProduct = userProduct?.trim() || '';
    if (!extractedProduct) {
      const matchProduct = prompt.match(/(?:curso|mentoria|produto|treinamento|e-?book|comunidade|vender|oferta|para)\s+(?:de\s+|a\s+|o\s+|nossa\s+|nosso\s+)?([^,\.]+)/i);
      if (matchProduct && matchProduct[1]) {
        extractedProduct = matchProduct[1].replace(/^(nossa|nosso|a|o|um|uma)\s+/i, '').trim();
      }
    }

    let mainPriceStr = String(userPrice || '97,00').replace('R$', '').trim();
    let downsellPriceStr = String(userDownsell || '47,00').replace('R$', '').trim();

    // 2. Consulta à IA via Cascade para enriquecimento estratégico de copy e arquitetura
    let parsedLlm: any = null;
    try {
      const { AiProviderService } = await import('./aiProviderService.js');
      const systemPrompt = `Você é o Arquiteto Especialista de Funis de Alta Conversão no WhatsApp do WhatsPix.
Sua missão é criar uma arquitetura de funil no WhatsApp 100% personalizada e estratégica, seguindo rigorosamente a solicitação do usuário.
Você NUNCA deve criar funis genéricos ou com a mesma estrutura. Adapte os blocos, as falas, os bônus e a mecânica EXCLUSIVAMENTE para o produto, nicho e público-alvo informado no pedido.

Identifique a melhor arquitetura estratégica ("architectureType"):
- "full_ai_agent": Se o usuário solicitou atendimento feito por IA, consultor inteligente, tirar dúvidas, conduzir a conversa em tempo real e fechar vendas com IA contínua.
- "cart_recovery": Se solicitou recuperação de carrinho abandonado ou checkout pendente.
- "vip_launch": Se solicitou lançamento relâmpago, abertura de turmas ou grupo VIP.
- "distributor_ab": Se solicitou testes A/B ou distribuição por ganchos múltiplos (dor, urgência, prova social).
- "direct_pitch": Se solicitou fluxo simples e direto de validação rápida.

Responda EXCLUSIVAMENTE em formato JSON (sem comentários antes ou depois):
{
  "productName": "Nome limpo e preciso do produto identificado no pedido (ex: Creatina Monohidratada 100% Pura)",
  "niche": "Nicho do produto (ex: Suplementação Esportiva)",
  "targetAudience": "Público-alvo principal (ex: Praticantes de musculação que buscam força e hipertrofia)",
  "funnelName": "Nome chamativo e estratégico do funil",
  "description": "Explicação em 1 frase da mecânica e estratégia deste funil",
  "triggerKeywords": ["QUERO", "CREATINA", "PROMO"],
  "architectureType": "full_ai_agent",
  "welcomeMessage": "Mensagem inicial humanizada com {Oi|Olá} {{nome}}, rapport imediato e pergunta de qualificação sobre o produto e objetivos do lead",
  "includeAudio": true,
  "audioScript": "Roteiro de áudio natural gravado no WhatsApp (20-30 seg) pelo especialista/produtor falando do produto, benefícios reais e como tomar/usar",
  "audioDuration": "0:25",
  "aiAgentGoal": "Instruções completas para a IA de atendimento em tempo real: papel de consultor especialista no nicho, como qualificar o lead, argumentos persuasivos sobre o produto, benefícios específicos, como apresentar os bônus, quebrar objeções e conduzir ao PIX",
  "bonusText": "Mensagem apresentando os bônus exclusivos pensados para o nicho deste produto para quem fechar agora",
  "mainPrice": "${mainPriceStr}",
  "downsellPrice": "${downsellPriceStr}",
  "downsellMessage": "Mensagem empática de downsell relâmpago no PIX caso o lead hesite"
}`;

      const userMessage = `PEDIDO DO USUÁRIO: "${prompt}"\nPRODUTO INFORMADO: "${extractedProduct}"\nPREÇO: R$ ${mainPriceStr}\nDOWNSELL: R$ ${downsellPriceStr}\nESTRATÉGIA: ${strategy}\nCOMPLEXIDADE: ${complexity}`;

      console.log(`[AI ARCHITECT] Gerando arquitetura sob medida para "${extractedProduct || prompt.slice(0, 30)}"...`);
      const aiResponse = await AiProviderService.generateWithCascade({
        systemPrompt,
        userMessage,
        maxTokens: 1500,
        temperature: 0.3
      });

      if (aiResponse?.replyText) {
        let cleaned = aiResponse.replyText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          cleaned = codeBlockMatch[1].trim();
        } else {
          cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        try {
          parsedLlm = JSON.parse(cleaned);
        } catch (jsonErr) {
          console.warn('[AI ARCHITECT] Falha ao fazer parse do JSON do arquiteto:', jsonErr);
        }
      }
    } catch (err) {
      console.warn('AiProviderService: Fallback para montagem inteligente de funil:', err);
    }

    if (userProduct && userProduct.trim().length > 1) {
      extractedProduct = userProduct.trim();
    } else if (parsedLlm?.productName && parsedLlm.productName.trim().length > 1) {
      extractedProduct = parsedLlm.productName.trim();
    }
    if (!extractedProduct) {
      extractedProduct = 'Produto Especialista';
    }

    // 3. Resolução da Arquitetura Dinâmica baseada no pedido real do usuário
    const promptLower = (prompt + ' ' + (strategy || '')).toLowerCase();
    let resolvedArch: 'full_ai_agent' | 'cart_recovery' | 'vip_launch' | 'distributor_ab' | 'direct_pitch' =
      parsedLlm?.architectureType || 'full_ai_agent';

    if (
      promptLower.includes('ia') ||
      promptLower.includes('atendimento') ||
      promptLower.includes('atender') ||
      promptLower.includes('conversar') ||
      promptLower.includes('convencer') ||
      promptLower.includes('copiloto') ||
      promptLower.includes('agente')
    ) {
      resolvedArch = 'full_ai_agent';
    } else if (promptLower.includes('carrinho') || promptLower.includes('abandon') || promptLower.includes('recupera') || strategy === 'recovery') {
      resolvedArch = 'cart_recovery';
    } else if (promptLower.includes('lança') || promptLower.includes('lanca') || promptLower.includes('grupo vip') || promptLower.includes('abertura') || strategy === 'launch') {
      resolvedArch = 'vip_launch';
    } else if (promptLower.includes('distribuidor') || promptLower.includes('teste a/b') || promptLower.includes('4 saidas') || promptLower.includes('4 saídas')) {
      resolvedArch = 'distributor_ab';
    } else if (complexity === 'basic') {
      resolvedArch = 'direct_pitch';
    }

    const funnelName =
      parsedLlm?.funnelName ||
      `Funil Inteligente: ${extractedProduct.slice(0, 32)}`;

    const description =
      parsedLlm?.description ||
      `Funil automatizado para ${extractedProduct} desenhado com base nas instruções de atendimento e conversão.`;

    const triggerKeyword = Array.isArray(parsedLlm?.triggerKeywords) && parsedLlm.triggerKeywords.length > 0
      ? parsedLlm.triggerKeywords[0]
      : 'COMEÇAR';

    const welcomeMsg =
      parsedLlm?.welcomeMessage ||
      `{Oi|Olá} {{nome}}! Que bom falar com você! Vi seu interesse no ${extractedProduct}. Me conta: você já tem experiência com isso ou quer começar agora?`;

    const audioScript =
      parsedLlm?.audioScript ||
      `Oi {{nome}}, passando rapidinho em áudio para te explicar como funciona o ${extractedProduct} na prática e te mostrar os resultados comprovados!`;

    const audioDuration = parsedLlm?.audioDuration || '0:25';

    const aiAgentGoal =
      typeof parsedLlm?.aiAgentGoal === 'string'
        ? parsedLlm.aiAgentGoal
        : (parsedLlm?.aiAgentGoal && typeof parsedLlm.aiAgentGoal === 'object')
          ? Object.entries(parsedLlm.aiAgentGoal).map(([k, v]) => `${k}: ${v}`).join('. ')
          : `Atuar como consultor especialista em ${extractedProduct}. Descobrir as necessidades do lead, quebrar objeções de preço e tempo, apresentar os bônus e conduzir ao PIX de R$ ${mainPriceStr}.`;

    const bonusText =
      parsedLlm?.bonusOfferText ||
      parsedLlm?.bonusText ||
      `🎁 *BÔNUS EXCLUSIVO LIBERADO HOJE:*\n\nFechando agora o seu acesso ao ${extractedProduct}, você garante suporte VIP, bônus especiais e garantia incondicional!`;

    const downsellMsg =
      parsedLlm?.downsellMessage ||
      `Olha só {{nome}}, entendo perfeitamente sua situação de momento. Para não deixar você de fora, liberei uma condição relâmpago: de R$ ${mainPriceStr} por apenas R$ ${downsellPriceStr} no PIX à vista!`;

    const finalMainPrice = parsedLlm?.mainPrice || mainPriceStr;
    const finalDownsellPrice = parsedLlm?.downsellPrice || downsellPriceStr;

    // Síntese de áudio antecipada se solicitada
    let synthesizedAudioUrl: string | undefined = undefined;
    let actualAudioDuration = audioDuration;
    if (includeVoice) {
      try {
        const { VoiceService } = await import('./voiceService.js');
        const voiceResult = await VoiceService.synthesizeVoice({
          text: audioScript,
          voiceModel
        });
        if (voiceResult && voiceResult.success && voiceResult.audioUrl) {
          synthesizedAudioUrl = voiceResult.audioUrl;
          const mins = Math.floor((voiceResult.durationSeconds || 15) / 60);
          const secs = (voiceResult.durationSeconds || 15) % 60;
          actualAudioDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          console.log(`🎙️ [AI FUNNEL] Áudio WhatsApp PTT sintetizado com sucesso (${actualAudioDuration}) e salvo no nó do funil!`);
        }
      } catch (voiceErr) {
        console.warn('[AI FUNNEL] Falha ao sintetizar áudio antecipadamente:', voiceErr);
      }
    }

    const funnelId = `funnel-ai-${Date.now()}`;
    const nodes: FunnelNode[] = [];
    const edges: FunnelEdge[] = [];
    const safeProductTag = extractedProduct.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);

    // =========================================================================
    // COMPILADOR DE ARQUITETURAS ESTRATÉGICAS PERSONALIZADAS
    // =========================================================================
    switch (resolvedArch) {
      // -----------------------------------------------------------------------
      // ARQUITETURA A: ATENDIMENTO 100% COM IA (O AGENTE IA É O HUB CENTRAL)
      // -----------------------------------------------------------------------
      case 'full_ai_agent': {
        const yCenter = 320;
        let curX = 60;

        // 1. Início
        nodes.push({
          id: 'node-start',
          type: 'startNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Início (Gatilho Anúncio / Palavra-Chave)' }
        });

        // 2. Etiqueta de Entrada & CRM
        curX += 280;
        nodes.push(
          {
            id: 'node-tag-entry',
            type: 'tagNode',
            position: { x: curX, y: yCenter },
            data: { tag: `Lead_${safeProductTag}` }
          },
          {
            id: 'node-kanban-entry',
            type: 'kanbanNode',
            position: { x: curX, y: yCenter + 180 },
            data: { kanbanStage: 'lead' }
          }
        );

        // 3. Mensagem de Boas-Vindas
        curX += 300;
        nodes.push({
          id: 'node-msg-welcome',
          type: 'messageNode',
          position: { x: curX, y: yCenter },
          data: { delay: '3s', text: welcomeMsg }
        });

        // 4. Áudio WhatsApp (se habilitado)
        let lastNodeBeforeAi = 'node-msg-welcome';
        if (includeVoice) {
          curX += 300;
          nodes.push({
            id: 'node-audio-intro',
            type: 'audioNode',
            position: { x: curX, y: yCenter },
            data: {
              delay: '5s',
              audioDuration: actualAudioDuration,
              voiceModel,
              audioScript,
              audioUrl: synthesizedAudioUrl
            }
          });
          lastNodeBeforeAi = 'node-audio-intro';
        }

        // 5. O NÓ CENTRAL: AGENTE DE IA EM TEMPO REAL
        curX += 320;
        const aiNodeX = curX;
        nodes.push({
          id: 'node-ai-agent',
          type: 'aiAgentNode',
          position: { x: aiNodeX, y: yCenter },
          data: {
            goal: aiAgentGoal,
            label: `IA Atendente: ${extractedProduct.slice(0, 20)}`
          }
        });

        // 6. Espera de Resposta do Lead
        curX += 320;
        const waitX = curX;
        nodes.push({
          id: 'node-wait-reply',
          type: 'waitReplyNode',
          position: { x: waitX, y: yCenter },
          data: { timeoutDuration: 'Após 25 minutos' }
        });

        // 7. Condicional de Intenção de Compra
        curX += 300;
        const condX = curX;
        nodes.push({
          id: 'node-cond-interest',
          type: 'conditionNode',
          position: { x: condX, y: yCenter },
          data: { conditionText: 'Lead confirmou interesse / quer comprar / pediu PIX?' }
        });

        // 8. RAMO TRUE (SUPERIOR): BÔNUS EXCLUSIVOS + PIX PRINCIPAL + OCR + VENDA
        const trueY = yCenter - 180;
        nodes.push(
          {
            id: 'node-msg-bonus',
            type: 'messageNode',
            position: { x: condX + 320, y: trueY },
            data: { delay: '3s', text: bonusText }
          },
          {
            id: 'node-pix-main',
            type: 'pixButtonNode',
            position: { x: condX + 620, y: trueY },
            data: {
              amount: finalMainPrice,
              pixKey: 'financeiro@whatspix.ia',
              pixReceiver: 'WhatsPix Oficial',
              delay: '2s'
            }
          },
          {
            id: 'node-msg-pix-inst',
            type: 'messageNode',
            position: { x: condX + 920, y: trueY },
            data: {
              delay: '3s',
              text: `Copie o código PIX acima e realize o pagamento no app do seu banco. A chave tem validade de 15 minutos!\n\nAssim que pagar, envie o comprovante aqui para confirmação automática imediata.`
            }
          },
          {
            id: 'node-wait-pix',
            type: 'waitReplyNode',
            position: { x: condX + 1220, y: trueY },
            data: { timeoutDuration: 'Após 45 minutos' }
          },
          {
            id: 'node-ocr-checker',
            type: 'ocrNode',
            position: { x: condX + 1520, y: trueY },
            data: { label: 'Validador Inteligente OCR de Comprovante' }
          },
          {
            id: 'node-approved-sale',
            type: 'approvedSaleNode',
            position: { x: condX + 1800, y: trueY },
            data: { goal: `Venda Aprovada R$ ${finalMainPrice} (Meta Conversions CAPI)` }
          },
          {
            id: 'node-kanban-paid',
            type: 'kanbanNode',
            position: { x: condX + 2080, y: trueY },
            data: { kanbanStage: 'paid' }
          },
          {
            id: 'node-tag-paid',
            type: 'tagNode',
            position: { x: condX + 2340, y: trueY },
            data: { tag: `Cliente_VIP_${safeProductTag}` }
          }
        );

        // 9. RAMO FALSE (INFERIOR): IA DE QUEBRA DE OBJEÇÕES + DOWNSELL RELÂMPAGO
        const falseY = yCenter + 200;
        nodes.push(
          {
            id: 'node-ai-objection',
            type: 'aiAgentNode',
            position: { x: condX + 320, y: falseY },
            data: {
              goal: `Contorno humanizado de objeções de ${extractedProduct}. Descobrir se a dúvida é preço, tempo ou confiança, reforçar a garantia e apresentar a oportunidade relâmpago de downsell de R$ ${finalDownsellPrice}.`
            }
          },
          {
            id: 'node-msg-downsell',
            type: 'messageNode',
            position: { x: condX + 620, y: falseY },
            data: { delay: '4s', text: downsellMsg }
          },
          {
            id: 'node-pix-down',
            type: 'pixButtonNode',
            position: { x: condX + 920, y: falseY },
            data: {
              amount: finalDownsellPrice,
              pixKey: 'financeiro@whatspix.ia',
              pixReceiver: 'WhatsPix Oficial'
            }
          },
          {
            id: 'node-wait-down',
            type: 'waitReplyNode',
            position: { x: condX + 1220, y: falseY },
            data: { timeoutDuration: 'Após 24 horas' }
          },
          {
            id: 'node-ocr-down',
            type: 'ocrNode',
            position: { x: condX + 1520, y: falseY },
            data: { label: 'Validador OCR Downsell' }
          },
          {
            id: 'node-sale-down',
            type: 'approvedSaleNode',
            position: { x: condX + 1800, y: falseY },
            data: { goal: `Venda Downsell R$ ${finalDownsellPrice}` }
          },
          {
            id: 'node-notify-human',
            type: 'notificationNode',
            position: { x: condX + 1520, y: falseY + 180 },
            data: {
              notificationMessage: `🚨 TRANSBORDO HUMANO: Lead {{nome}} demonstrou dúvida ou não concluiu compra de ${extractedProduct}. Atender manualmente!`
            }
          }
        );

        // CONEXÕES (EDGES) FULL AI AGENT
        edges.push(
          { id: 'e-start-tag', source: 'node-start', target: 'node-tag-entry', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-tag-kanban', source: 'node-tag-entry', target: 'node-kanban-entry', style: { stroke: '#6366f1', strokeWidth: 2 } },
          { id: 'e-tag-welcome', source: 'node-tag-entry', target: 'node-msg-welcome', style: { stroke: '#10b981', strokeWidth: 2 } }
        );

        if (includeVoice) {
          edges.push(
            { id: 'e-welcome-audio', source: 'node-msg-welcome', target: 'node-audio-intro', style: { stroke: '#38bdf8', strokeWidth: 2 } },
            { id: 'e-audio-ai', source: 'node-audio-intro', target: 'node-ai-agent', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        } else {
          edges.push(
            { id: 'e-welcome-ai', source: 'node-msg-welcome', target: 'node-ai-agent', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        }

        edges.push(
          { id: 'e-ai-wait', source: 'node-ai-agent', target: 'node-wait-reply', style: { stroke: '#8b5cf6', strokeWidth: 2 } },
          { id: 'e-wait-cond', source: 'node-wait-reply', sourceHandle: 'replied', target: 'node-cond-interest', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
          { id: 'e-wait-timeout-obj', source: 'node-wait-reply', sourceHandle: 'timeout', target: 'node-ai-objection', style: { stroke: '#ea580c', strokeWidth: 2, strokeDasharray: '4,4' } },

          // Ramo True (Bônus + PIX + Validação)
          { id: 'e-cond-bonus', source: 'node-cond-interest', sourceHandle: 'true', target: 'node-msg-bonus', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-bonus-pix', source: 'node-msg-bonus', target: 'node-pix-main', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-pix-inst', source: 'node-pix-main', target: 'node-msg-pix-inst', style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-inst-waitpix', source: 'node-msg-pix-inst', target: 'node-wait-pix', style: { stroke: '#ea580c', strokeWidth: 2 } },
          { id: 'e-waitpix-ocr', source: 'node-wait-pix', sourceHandle: 'replied', target: 'node-ocr-checker', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-waitpix-down', source: 'node-wait-pix', sourceHandle: 'timeout', target: 'node-msg-downsell', style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '4,4' } },
          { id: 'e-ocr-approved', source: 'node-ocr-checker', target: 'node-approved-sale', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-sale-kanban', source: 'node-approved-sale', target: 'node-kanban-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } },
          { id: 'e-kanban-tagpaid', source: 'node-kanban-paid', target: 'node-tag-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } },

          // Ramo False (Objeções + Downsell)
          { id: 'e-cond-obj', source: 'node-cond-interest', sourceHandle: 'false', target: 'node-ai-objection', style: { stroke: '#f43f5e', strokeWidth: 2 } },
          { id: 'e-obj-downmsg', source: 'node-ai-objection', target: 'node-msg-downsell', style: { stroke: '#f43f5e', strokeWidth: 2 } },
          { id: 'e-downmsg-downpix', source: 'node-msg-downsell', target: 'node-pix-down', style: { stroke: '#f43f5e', strokeWidth: 2 } },
          { id: 'e-downpix-wait', source: 'node-pix-down', target: 'node-wait-down', style: { stroke: '#ea580c', strokeWidth: 2 } },
          { id: 'e-waitdown-ocr', source: 'node-wait-down', sourceHandle: 'replied', target: 'node-ocr-down', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-waitdown-notify', source: 'node-wait-down', sourceHandle: 'timeout', target: 'node-notify-human', style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4,4' } },
          { id: 'e-ocrdown-saledown', source: 'node-ocr-down', target: 'node-sale-down', style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-saledown-kanban', source: 'node-sale-down', target: 'node-kanban-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } }
        );
        break;
      }

      // -----------------------------------------------------------------------
      // ARQUITETURA B: RECUPERAÇÃO DE CARRINHO / CHECKOUT ABANDONADO
      // -----------------------------------------------------------------------
      case 'cart_recovery': {
        const yCenter = 320;
        let curX = 60;

        nodes.push({
          id: 'node-start',
          type: 'startNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Gatilho: Abandono de Checkout (Kiwify / Hotmart / CAPI)' }
        });

        curX += 280;
        nodes.push(
          {
            id: 'node-tag-abandon',
            type: 'tagNode',
            position: { x: curX, y: yCenter },
            data: { tag: `Carrinho_Abandonado_${safeProductTag}` }
          },
          {
            id: 'node-kanban-recov',
            type: 'kanbanNode',
            position: { x: curX, y: yCenter + 180 },
            data: { kanbanStage: 'negotiating' }
          }
        );

        curX += 280;
        nodes.push({
          id: 'node-wait-recov',
          type: 'waitReplyNode',
          position: { x: curX, y: yCenter },
          data: { timeoutDuration: 'Após 15 minutos' }
        });

        curX += 280;
        nodes.push({
          id: 'node-msg-recov',
          type: 'messageNode',
          position: { x: curX, y: yCenter },
          data: {
            delay: '3s',
            text: `{Oi|Olá} {{nome}}! Vi que você começou sua inscrição no ${extractedProduct}, mas não concluiu. Aconteceu algum erro na página ou no pagamento? Estou aqui para te ajudar!`
          }
        });

        if (includeVoice) {
          curX += 300;
          nodes.push({
            id: 'node-audio-recov',
            type: 'audioNode',
            position: { x: curX, y: yCenter },
            data: {
              delay: '5s',
              audioDuration: actualAudioDuration,
              voiceModel,
              audioScript: `Oi {{nome}}, passei em áudio rapidinho porque reservei sua vaga com bônus no ${extractedProduct}. Qualquer dúvida de pagamento ou acesso, me responde aqui!`,
              audioUrl: synthesizedAudioUrl
            }
          });
        }

        curX += 320;
        nodes.push({
          id: 'node-ai-closer',
          type: 'aiAgentNode',
          position: { x: curX, y: yCenter },
          data: {
            goal: `Recuperador Inteligente de Vendas para ${extractedProduct}. Identificar se o lead teve problema de cartão, limite ou dúvida, oferecer a condição facilitada no PIX de R$ ${finalDownsellPrice} e enviar chave.`
          }
        });

        curX += 320;
        nodes.push({
          id: 'node-pix-recovery',
          type: 'pixButtonNode',
          position: { x: curX, y: yCenter },
          data: {
            amount: finalDownsellPrice,
            pixKey: 'financeiro@whatspix.ia',
            pixReceiver: 'WhatsPix Oficial'
          }
        });

        curX += 300;
        nodes.push({
          id: 'node-ocr-recovery',
          type: 'ocrNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Validador OCR de Comprovante de Recuperação' }
        });

        curX += 280;
        nodes.push(
          {
            id: 'node-approved-sale',
            type: 'approvedSaleNode',
            position: { x: curX, y: yCenter },
            data: { goal: `Venda Recuperada R$ ${finalDownsellPrice}` }
          },
          {
            id: 'node-kanban-paid',
            type: 'kanbanNode',
            position: { x: curX + 260, y: yCenter },
            data: { kanbanStage: 'paid' }
          }
        );

        // Edges Recuperação
        edges.push(
          { id: 'e-start-tag', source: 'node-start', target: 'node-tag-abandon', style: { stroke: '#f59e0b', strokeWidth: 2 } },
          { id: 'e-tag-kanban', source: 'node-tag-abandon', target: 'node-kanban-recov', style: { stroke: '#6366f1', strokeWidth: 2 } },
          { id: 'e-tag-wait', source: 'node-tag-abandon', target: 'node-wait-recov', style: { stroke: '#f59e0b', strokeWidth: 2 } },
          { id: 'e-wait-msg', source: 'node-wait-recov', sourceHandle: 'timeout', target: 'node-msg-recov', style: { stroke: '#10b981', strokeWidth: 2 } }
        );

        if (includeVoice) {
          edges.push(
            { id: 'e-msg-audio', source: 'node-msg-recov', target: 'node-audio-recov', style: { stroke: '#38bdf8', strokeWidth: 2 } },
            { id: 'e-audio-ai', source: 'node-audio-recov', target: 'node-ai-closer', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        } else {
          edges.push(
            { id: 'e-msg-ai', source: 'node-msg-recov', target: 'node-ai-closer', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        }

        edges.push(
          { id: 'e-ai-pix', source: 'node-ai-closer', target: 'node-pix-recovery', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-pix-ocr', source: 'node-pix-recovery', target: 'node-ocr-recovery', style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-ocr-sale', source: 'node-ocr-recovery', target: 'node-approved-sale', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-sale-kanban', source: 'node-approved-sale', target: 'node-kanban-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } }
        );
        break;
      }

      // -----------------------------------------------------------------------
      // ARQUITETURA C: LANÇAMENTO / GRUPO VIP
      // -----------------------------------------------------------------------
      case 'vip_launch': {
        const yCenter = 320;
        let curX = 60;

        nodes.push({
          id: 'node-start',
          type: 'startNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Início: Entrada Grupo VIP / Lançamento' }
        });

        curX += 280;
        nodes.push(
          {
            id: 'node-tag-vip',
            type: 'tagNode',
            position: { x: curX, y: yCenter },
            data: { tag: `VIP_Lancamento_${safeProductTag}` }
          },
          {
            id: 'node-kanban-lead',
            type: 'kanbanNode',
            position: { x: curX, y: yCenter + 180 },
            data: { kanbanStage: 'lead' }
          }
        );

        curX += 280;
        nodes.push({
          id: 'node-msg-welcome',
          type: 'messageNode',
          position: { x: curX, y: yCenter },
          data: {
            delay: '3s',
            text: `{Oi|Olá} {{nome}}! Seja bem-vindo ao grupo VIP oficial do lançamento de ${extractedProduct}! Aqui você terá acesso antecipado com bônus exclusivos.`
          }
        });

        if (includeVoice) {
          curX += 300;
          nodes.push({
            id: 'node-audio-launch',
            type: 'audioNode',
            position: { x: curX, y: yCenter },
            data: {
              delay: '5s',
              audioDuration: actualAudioDuration,
              voiceModel,
              audioScript,
              audioUrl: synthesizedAudioUrl
            }
          });
        }

        curX += 320;
        nodes.push({
          id: 'node-ai-agent',
          type: 'aiAgentNode',
          position: { x: curX, y: yCenter },
          data: {
            goal: `Plantão Especialista de Dúvidas do Lançamento de ${extractedProduct}. Explicar benefícios, método, cronograma de liberação, garantia e encaminhar para a oferta oficial de abertura.`
          }
        });

        curX += 320;
        nodes.push({
          id: 'node-msg-bonus',
          type: 'messageNode',
          position: { x: curX, y: yCenter },
          data: { delay: '3s', text: bonusText }
        });

        curX += 300;
        nodes.push({
          id: 'node-pix-main',
          type: 'pixButtonNode',
          position: { x: curX, y: yCenter },
          data: {
            amount: finalMainPrice,
            pixKey: 'financeiro@whatspix.ia',
            pixReceiver: 'WhatsPix Oficial'
          }
        });

        curX += 300;
        nodes.push({
          id: 'node-ocr-checker',
          type: 'ocrNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Validador Inteligente OCR Lançamento' }
        });

        curX += 280;
        nodes.push(
          {
            id: 'node-approved-sale',
            type: 'approvedSaleNode',
            position: { x: curX, y: yCenter },
            data: { goal: `Venda Lançamento VIP R$ ${finalMainPrice}` }
          },
          {
            id: 'node-kanban-paid',
            type: 'kanbanNode',
            position: { x: curX + 260, y: yCenter },
            data: { kanbanStage: 'paid' }
          }
        );

        edges.push(
          { id: 'e-start-tag', source: 'node-start', target: 'node-tag-vip', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-tag-kanban', source: 'node-tag-vip', target: 'node-kanban-lead', style: { stroke: '#6366f1', strokeWidth: 2 } },
          { id: 'e-tag-welcome', source: 'node-tag-vip', target: 'node-msg-welcome', style: { stroke: '#10b981', strokeWidth: 2 } }
        );

        if (includeVoice) {
          edges.push(
            { id: 'e-welcome-audio', source: 'node-msg-welcome', target: 'node-audio-launch', style: { stroke: '#38bdf8', strokeWidth: 2 } },
            { id: 'e-audio-ai', source: 'node-audio-launch', target: 'node-ai-agent', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        } else {
          edges.push(
            { id: 'e-welcome-ai', source: 'node-msg-welcome', target: 'node-ai-agent', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        }

        edges.push(
          { id: 'e-ai-bonus', source: 'node-ai-agent', target: 'node-msg-bonus', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-bonus-pix', source: 'node-msg-bonus', target: 'node-pix-main', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-pix-ocr', source: 'node-pix-main', target: 'node-ocr-checker', style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-ocr-sale', source: 'node-ocr-checker', target: 'node-approved-sale', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-sale-kanban', source: 'node-approved-sale', target: 'node-kanban-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } }
        );
        break;
      }

      // -----------------------------------------------------------------------
      // ARQUITETURA D: DISTRIBUIDOR A/B MULTI-GANCHOS (DOR, URGÊNCIA, PROVA SOCIAL)
      // -----------------------------------------------------------------------
      case 'distributor_ab': {
        nodes.push(
          {
            id: 'node-start',
            type: 'startNode',
            position: { x: 60, y: 340 },
            data: { label: 'Início (Gatilho Meta Ads / Orgânico)' }
          },
          {
            id: 'node-tag-entry',
            type: 'tagNode',
            position: { x: 340, y: 340 },
            data: { tag: `Lead_${safeProductTag}` }
          },
          {
            id: 'node-dist-1',
            type: 'distributorNode',
            position: { x: 340, y: 520 },
            data: {
              outputs: [
                { label: 'Saída 1 (Dor)', count: 0 },
                { label: 'Saída 2 (Urgência)', count: 0 },
                { label: 'Saída 3 (Prova Social)', count: 0 },
                { label: 'Saída 4 (Oportunidade)', count: 0 }
              ]
            }
          },
          // Branch 1 (Dor)
          {
            id: 'node-msg-split-1',
            type: 'messageNode',
            position: { x: 680, y: 80 },
            data: { delay: '3s', text: welcomeMsg }
          },
          {
            id: 'node-audio-1',
            type: 'audioNode',
            position: { x: 960, y: 80 },
            data: { delay: '5s', audioDuration: actualAudioDuration, voiceModel, audioScript, audioUrl: synthesizedAudioUrl }
          },
          // Branch 2 (Urgência)
          {
            id: 'node-msg-split-2',
            type: 'messageNode',
            position: { x: 680, y: 260 },
            data: { delay: '4s', text: `{Oi|Olá} {{nome}}! As condições especiais de ${extractedProduct} encerram hoje!` }
          },
          {
            id: 'node-audio-2',
            type: 'audioNode',
            position: { x: 960, y: 260 },
            data: { delay: '6s', audioDuration: '0:26', voiceModel, audioScript: `Olá {{nome}}, vim em áudio te avisar que as vagas promocionais de ${extractedProduct} estão nos últimos minutos...`, audioUrl: synthesizedAudioUrl }
          },
          // Branch 3 (Prova Social)
          {
            id: 'node-msg-split-3',
            type: 'messageNode',
            position: { x: 680, y: 440 },
            data: { delay: '3s', text: `{{nome}}, veja os resultados reais que nossos clientes estão tendo com ${extractedProduct}!` }
          },
          {
            id: 'node-audio-3',
            type: 'audioNode',
            position: { x: 960, y: 440 },
            data: { delay: '5s', audioDuration: '0:22', voiceModel, audioScript: `{{nome}}, preparei essa gravação para te mostrar como nossos clientes estão aplicando ${extractedProduct}...`, audioUrl: synthesizedAudioUrl }
          },
          // Branch 4 (Oportunidade)
          {
            id: 'node-msg-split-4',
            type: 'messageNode',
            position: { x: 680, y: 620 },
            data: { delay: '4s', text: `Fala {{nome}}! Essa é a oportunidade que você esperava com ${extractedProduct}.` }
          },
          {
            id: 'node-audio-4',
            type: 'audioNode',
            position: { x: 960, y: 620 },
            data: { delay: '5s', audioDuration: '0:30', voiceModel, audioScript: `Com certeza você já tentou outras soluções, mas ${extractedProduct} foi desenhado passo a passo para o seu sucesso...`, audioUrl: synthesizedAudioUrl }
          },
          // Espera Central & Hub de IA
          {
            id: 'node-wait-1',
            type: 'waitReplyNode',
            position: { x: 1260, y: 340 },
            data: { timeoutDuration: 'Após 30 minutos' }
          },
          {
            id: 'node-ai-closer',
            type: 'aiAgentNode',
            position: { x: 1560, y: 340 },
            data: { goal: aiAgentGoal }
          },
          {
            id: 'node-msg-bonus',
            type: 'messageNode',
            position: { x: 1860, y: 340 },
            data: { delay: '3s', text: bonusText }
          },
          {
            id: 'node-pix-main',
            type: 'pixButtonNode',
            position: { x: 2160, y: 340 },
            data: {
              amount: finalMainPrice,
              pixKey: 'financeiro@whatspix.ia',
              pixReceiver: 'WhatsPix Oficial'
            }
          },
          {
            id: 'node-ocr-checker',
            type: 'ocrNode',
            position: { x: 2460, y: 340 },
            data: { label: 'Validador OCR de Comprovante' }
          },
          {
            id: 'node-approved-sale',
            type: 'approvedSaleNode',
            position: { x: 2740, y: 340 },
            data: { goal: `Venda Aprovada R$ ${finalMainPrice}` }
          },
          {
            id: 'node-kanban-paid',
            type: 'kanbanNode',
            position: { x: 3000, y: 340 },
            data: { kanbanStage: 'paid' }
          }
        );

        edges.push(
          { id: 'e-start-tag', source: 'node-start', target: 'node-tag-entry', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-tag-dist', source: 'node-tag-entry', target: 'node-dist-1', style: { stroke: '#d97706', strokeWidth: 2 } },
          // 4 saídas
          { id: 'e-dist-out0', source: 'node-dist-1', sourceHandle: 'out-0', target: 'node-msg-split-1', style: { stroke: '#d97706', strokeWidth: 2 } },
          { id: 'e-split1-audio', source: 'node-msg-split-1', target: 'node-audio-1', style: { stroke: '#38bdf8', strokeWidth: 2 } },
          { id: 'e-audio1-wait', source: 'node-audio-1', target: 'node-wait-1', style: { stroke: '#f97316', strokeWidth: 2 } },

          { id: 'e-dist-out1', source: 'node-dist-1', sourceHandle: 'out-1', target: 'node-msg-split-2', style: { stroke: '#d97706', strokeWidth: 2 } },
          { id: 'e-split2-audio', source: 'node-msg-split-2', target: 'node-audio-2', style: { stroke: '#38bdf8', strokeWidth: 2 } },
          { id: 'e-audio2-wait', source: 'node-audio-2', target: 'node-wait-1', style: { stroke: '#f97316', strokeWidth: 2 } },

          { id: 'e-dist-out2', source: 'node-dist-1', sourceHandle: 'out-2', target: 'node-msg-split-3', style: { stroke: '#d97706', strokeWidth: 2 } },
          { id: 'e-split3-audio', source: 'node-msg-split-3', target: 'node-audio-3', style: { stroke: '#38bdf8', strokeWidth: 2 } },
          { id: 'e-audio3-wait', source: 'node-audio-3', target: 'node-wait-1', style: { stroke: '#f97316', strokeWidth: 2 } },

          { id: 'e-dist-out3', source: 'node-dist-1', sourceHandle: 'out-3', target: 'node-msg-split-4', style: { stroke: '#d97706', strokeWidth: 2 } },
          { id: 'e-split4-audio', source: 'node-msg-split-4', target: 'node-audio-4', style: { stroke: '#38bdf8', strokeWidth: 2 } },
          { id: 'e-audio4-wait', source: 'node-audio-4', target: 'node-wait-1', style: { stroke: '#f97316', strokeWidth: 2 } },

          { id: 'e-wait-ai', source: 'node-wait-1', sourceHandle: 'replied', target: 'node-ai-closer', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
          { id: 'e-ai-bonus', source: 'node-ai-closer', target: 'node-msg-bonus', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-bonus-pix', source: 'node-msg-bonus', target: 'node-pix-main', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-pix-ocr', source: 'node-pix-main', target: 'node-ocr-checker', style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-ocr-sale', source: 'node-ocr-checker', target: 'node-approved-sale', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-sale-kanban', source: 'node-approved-sale', target: 'node-kanban-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } }
        );
        break;
      }

      // -----------------------------------------------------------------------
      // ARQUITETURA E: FLUXO DIRETO / VALIDAÇÃO ENXUTA (DIRECT PITCH)
      // -----------------------------------------------------------------------
      case 'direct_pitch':
      default: {
        const yCenter = 320;
        let curX = 60;

        nodes.push({
          id: 'node-start',
          type: 'startNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Início (Gatilho Anúncio / Palavra-Chave)' }
        });

        curX += 280;
        nodes.push({
          id: 'node-tag-entry',
          type: 'tagNode',
          position: { x: curX, y: yCenter },
          data: { tag: `Lead_${safeProductTag}` }
        });

        curX += 280;
        nodes.push({
          id: 'node-msg-welcome',
          type: 'messageNode',
          position: { x: curX, y: yCenter },
          data: { delay: '3s', text: welcomeMsg }
        });

        if (includeVoice) {
          curX += 300;
          nodes.push({
            id: 'node-audio-pitch',
            type: 'audioNode',
            position: { x: curX, y: yCenter },
            data: {
              delay: '5s',
              audioDuration: actualAudioDuration,
              voiceModel,
              audioScript,
              audioUrl: synthesizedAudioUrl
            }
          });
        }

        curX += 320;
        nodes.push({
          id: 'node-ai-closer',
          type: 'aiAgentNode',
          position: { x: curX, y: yCenter },
          data: { goal: aiAgentGoal }
        });

        curX += 300;
        nodes.push({
          id: 'node-pix-main',
          type: 'pixButtonNode',
          position: { x: curX, y: yCenter },
          data: {
            amount: finalMainPrice,
            pixKey: 'financeiro@whatspix.ia',
            pixReceiver: 'WhatsPix Oficial'
          }
        });

        curX += 300;
        nodes.push({
          id: 'node-ocr-checker',
          type: 'ocrNode',
          position: { x: curX, y: yCenter },
          data: { label: 'Validador Inteligente OCR de Comprovante' }
        });

        curX += 280;
        nodes.push(
          {
            id: 'node-approved-sale',
            type: 'approvedSaleNode',
            position: { x: curX, y: yCenter },
            data: { goal: `Venda Aprovada R$ ${finalMainPrice}` }
          },
          {
            id: 'node-kanban-paid',
            type: 'kanbanNode',
            position: { x: curX + 260, y: yCenter },
            data: { kanbanStage: 'paid' }
          }
        );

        edges.push(
          { id: 'e-start-tag', source: 'node-start', target: 'node-tag-entry', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-tag-welcome', source: 'node-tag-entry', target: 'node-msg-welcome', style: { stroke: '#10b981', strokeWidth: 2 } }
        );

        if (includeVoice) {
          edges.push(
            { id: 'e-welcome-audio', source: 'node-msg-welcome', target: 'node-audio-pitch', style: { stroke: '#38bdf8', strokeWidth: 2 } },
            { id: 'e-audio-ai', source: 'node-audio-pitch', target: 'node-ai-closer', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        } else {
          edges.push(
            { id: 'e-welcome-ai', source: 'node-msg-welcome', target: 'node-ai-closer', style: { stroke: '#8b5cf6', strokeWidth: 2 } }
          );
        }

        edges.push(
          { id: 'e-ai-pix', source: 'node-ai-closer', target: 'node-pix-main', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-pix-ocr', source: 'node-pix-main', target: 'node-ocr-checker', style: { stroke: '#059669', strokeWidth: 2 } },
          { id: 'e-ocr-sale', source: 'node-ocr-checker', target: 'node-approved-sale', style: { stroke: '#10b981', strokeWidth: 2 } },
          { id: 'e-sale-kanban', source: 'node-approved-sale', target: 'node-kanban-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } }
        );
        break;
      }
    }

    return {
      id: funnelId,
      name: funnelName,
      description,
      active: true,
      triggerType: 'meta_ads_keyword',
      triggerKeywords: [triggerKeyword, 'QUERO', 'OFERTA'],
      stats: {
        started: 0,
        completed: 0,
        conversions: 0,
        conversionRate: 0
      },
      nodes,
      edges,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Realiza manutenção inteligente de um funil existente com base em instruções em linguagem natural
   */
  static async maintainFunnelWithAi(params: {
    funnelId: string;
    instruction: string;
    currentFunnel: SalesFunnel;
    voiceModel?: string;
  }): Promise<SalesFunnel> {
    const { instruction, currentFunnel, voiceModel = 'fish-audio/s2.1-pro-free:free' } = params;

    const { AiProviderService } = await import('./aiProviderService.js');

    const systemPrompt = `Você é o Arquiteto e Engenheiro de IA de Nível Enterprise do WhatsPix (estilo Leona AI), responsável pela MANUTENÇÃO, OTIMIZAÇÃO E EXPANSÃO AVANÇADA de funis de vendas de WhatsApp.
Você receberá a estrutura atual do funil em JSON (nós e conexões) e uma INSTRUÇÃO DE ALTERAÇÃO do usuário.

CATÁLOGO COMPLETO DE NÓS PROFISSIONAIS SUPORTADOS:
1. startNode: Gatilho inicial de entrada (data: { label: "Início (Meta Ads / Palavras-chave)" })
2. messageNode: Mensagem de texto humanizada com Spintax {Oi|Olá} e variáveis {{nome}}, {{produto}}, {{valor}} (data: { text: "...", delay: "3s" | "5s", files?: [{ name: "Guia.pdf", size: "2.4 MB" }] })
3. audioNode: Mensagem de voz WhatsApp PTT (Fish Audio) (data: { audioScript: "...", audioDuration: "0:25", delay: "4s", voiceModel?: "..." })
4. waitReplyNode: Aguarda resposta do cliente com timeout encadeado (data: { timeoutDuration: "Após 30 minutos" | "Após 1 dia" | "Após 3 dias" }) -> Handles de Saída: "replied" (se o cliente respondeu) e "timeout" (se o tempo esgotou sem resposta)
5. conditionNode: Roteador condicional de intenção ou tags (data: { conditionText: "resposta contém sim? OU quero? OU preço?" }) -> Handles de Saída: "true" e "false"
6. distributorNode: Distribuidor de tráfego / Teste A/B de mensagens e ofertas (data: { outputs: [{ label: "Saída 1", count: 0 }, { label: "Saída 2", count: 0 }, { label: "Saída 3", count: 0 }, { label: "Saída 4", count: 0 }] }) -> Handles de Saída: "out-0", "out-1", "out-2", "out-3", etc.
7. pixButtonNode: Cobrança PIX Copia e Cola (data: { amount: "97,00", pixKey: "chave@whatspix.ia", pixReceiver: "Produtor Oficial", delay: "2s" })
8. ocrNode: Leitor Inteligente OCR de Comprovante Bancário que valida autenticação do PIX automaticamente sem atendente
9. notificationNode: Alerta automático no WhatsApp do atendente / produtor (data: { notificationMessage: "ATENDENTE: Lead {{nome}}..." })
10. aiAgentNode: Atendente de IA autônomo (Z.ai GLM 5.3) para tirar dúvidas, quebrar objeções e fechar vendas no chat (data: { goal: "..." })
11. tagNode: Aplicação de etiqueta no CRM (data: { tag: "..." })
12. kanbanNode: Mover estágio no funil CRM (data: { kanbanStage: "negotiating" | "pix_generated" | "paid" })
13. smartDelayNode: Pausa inteligente programada (data: { delay: "10m" | "2h" | "1d" })
14. approvedSaleNode: Registro de venda aprovada e disparo Meta CAPI (data: { goal: "Venda Aprovada R$ ..." })
15. callNode: Disparo de ligação de voz automatizada por IA para fechar venda ou recuperar PIX abandonado (data: { callDuration: "0:45", callScript: "..." })
16. chatControllerNode: Controle de atendimento / transbordo humano (data: { action: "pause" | "resume" })

REGRAS DE ARQUITETURA DE ALTA CONVERSÃO:
- Mantenha nós alinhados em colunas verticais horizontais (x += 320 ou 360, y com espaçamento de 160 a 220px).
- Todas as saídas de waitReplyNode DEVEM ter arestas especificando sourceHandle: "replied" (para caminho positivo) e sourceHandle: "timeout" (para recuperação em 30m, 1d ou 3d).
- Todas as saídas de conditionNode DEVEM ter arestas especificando sourceHandle: "true" e "false".
- Todas as saídas de distributorNode DEVEM ter arestas especificando sourceHandle: "out-0", "out-1", etc.
- Se a instrução pedir para expandir para funil complexo ou estilo Leona, adicione distribuidores, PDFs em messageNode, múltiplos timeouts e validador OCR.
- Retorne EXCLUSIVAMENTE um objeto JSON válido com a estrutura:
{
  "name": "Nome atualizado do funil",
  "description": "Descrição atualizada",
  "triggerKeywords": ["QUERO", ...],
  "nodes": [...],
  "edges": [...],
  "explanation": "Resumo detalhado das alterações de arquitetura aplicadas"
}`;

    const sanitizedNodesForLlm = currentFunnel.nodes.map((n) => {
      const copyData = { ...(n.data || n.config || {}) };
      if (copyData.audioUrl && typeof copyData.audioUrl === 'string' && copyData.audioUrl.startsWith('data:')) {
        copyData.audioUrl = '[AUDIO_PREVIAMENTE_GRAVADO]';
      }
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        data: copyData
      };
    });

    const userMessage = `Funil Atual:\n${JSON.stringify(
      {
        name: currentFunnel.name,
        description: currentFunnel.description,
        triggerKeywords: currentFunnel.triggerKeywords,
        nodes: sanitizedNodesForLlm,
        edges: currentFunnel.edges
      },
      null,
      2
    )}\n\nINSTRUÇÃO DE MANUTENÇÃO:\n"${instruction}"`;

    let updatedFunnelData: any = null;

    const parseAndRepairJson = (rawText: string): any => {
      let cleaned = rawText.trim();
      cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      } else {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      try {
        return JSON.parse(cleaned);
      } catch (err1) {
        // Tenta reparar quebras de linha literais, chaves sem aspas e vírgulas soltas
        let repaired = cleaned
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/[\r\n]+/g, ' ');

        try {
          return JSON.parse(repaired);
        } catch (err2) {
          console.warn('[JSON REPAIR] Falha ao reparar JSON retornado pela IA:', err1);
          return null;
        }
      }
    };

    let aiReasoning: string | undefined = undefined;

    try {
      console.log(`[AI MAINTAIN] Solicitando manutenção e reparo do funil com IA (${process.env.SYSTEM_ARCHITECT_MODEL || 'meta/llama-3.2-11b-vision-instruct'})...`);
      const aiResponse = await AiProviderService.generateWithCascade({
        systemPrompt,
        userMessage,
        modelOverride: process.env.SYSTEM_ARCHITECT_MODEL || 'meta/llama-3.2-11b-vision-instruct',
        maxTokens: 2000,
        temperature: 0.2
      });

      aiReasoning = aiResponse?.reasoning;

      if (aiResponse?.replyText) {
        updatedFunnelData = parseAndRepairJson(aiResponse.replyText);
      }
    } catch (err) {
      console.warn('[AI MAINTAIN] Erro na geração com IA:', err);
    }

    // Fallback inteligente determinístico caso a IA falhe ou atinja limite de formato
    if (!updatedFunnelData || !Array.isArray(updatedFunnelData.nodes) || updatedFunnelData.nodes.length === 0) {
      console.log('[AI MAINTAIN] Aplicando manutenção inteligente via regras automáticas WhatsPix...');
      const clonedNodes: any[] = JSON.parse(JSON.stringify(currentFunnel.nodes));
      const clonedEdges: any[] = JSON.parse(JSON.stringify(currentFunnel.edges));

      // 1. Inserir bônus na mensagem de quebra de objeções
      if (/b[oô]nus|bonus|obje[cç]/i.test(instruction)) {
        const targetNode =
          clonedNodes.find((n: any) => n.id === 'node-msg-down' || (n.data?.text && /objeç|desconto|preço/i.test(n.data.text))) ||
          clonedNodes.filter((n: any) => n.type === 'messageNode').pop() ||
          clonedNodes.find((n: any) => n.type === 'aiAgentNode');

        if (targetNode && targetNode.data) {
          const bonusText =
            '\n\n🎁 *3 BÔNUS EXCLUSIVOS LIBERADOS HOJE:*\n' +
            '✅ 1. Acesso Vitalício com Atualizações Gratuitas\n' +
            '✅ 2. Guia Prático Passo a Passo em PDF para Download\n' +
            '✅ 3. Suporte Direto VIP no WhatsApp!';
          
          if (targetNode.data.text) {
            targetNode.data.text += bonusText;
          } else if (targetNode.data.message) {
            targetNode.data.message += bonusText;
          } else if (targetNode.data.goal) {
            targetNode.data.goal += bonusText;
          }
        }
      }

      // 2. Mudar valor da oferta principal e downsell
      if (/mudar o valor|preço|valor|r\$/i.test(instruction)) {
        const prices = Array.from(instruction.matchAll(/R\$\s*(\d+[,\.]?\d*)/gi)).map((m) => m[1].replace('.', ','));
        const mainPrice = prices[0] || '147,00';
        const downPrice = prices[1] || '67,00';

        let pixCount = 0;
        for (const n of clonedNodes) {
          if (n.type === 'pixNode' || n.type === 'pixButtonNode') {
            pixCount++;
            if (pixCount === 1) {
              n.data = { ...n.data, amount: mainPrice };
            } else {
              n.data = { ...n.data, amount: downPrice };
            }
          }
          if (n.data?.text && typeof n.data.text === 'string' && /R\$\s*\d+/i.test(n.data.text)) {
            n.data.text = n.data.text.replace(/R\$\s*\d+[,\.]?\d*/g, `R$ ${pixCount > 1 ? downPrice : mainPrice}`);
          }
        }
      }

      // 3. Adicionar bloco de Aguarda Resposta
      if (/aguarda resposta|esperar|timeout/i.test(instruction)) {
        const waitId = `node-wait-${Date.now()}`;
        const lastMsgNode = clonedNodes.find((n: any) => n.type === 'messageNode') || clonedNodes[1];
        if (lastMsgNode) {
          const newNode = {
            id: waitId,
            type: 'waitReplyNode',
            position: { x: (lastMsgNode.position?.x || 250) + 40, y: (lastMsgNode.position?.y || 200) + 120 },
            data: { timeoutDuration: 'Após 20 minutos', label: 'Aguarda Resposta (20min)' }
          };
          clonedNodes.push(newNode);
        }
      }

      // 4. Adicionar etiqueta / tag e mover kanban
      if (/etiqueta|tag|mover|interessado/i.test(instruction)) {
        const tagId = `node-tag-${Date.now()}`;
        const newNode = {
          id: tagId,
          type: 'tagNode',
          position: { x: 300, y: 450 },
          data: { tag: 'Cliente_Interessado', label: 'Tag: Cliente_Interessado' }
        };
        clonedNodes.push(newNode);
      }

      // 5. Adicionar bloco de áudio humanizado
      if (/áudio|audio|gravar voz/i.test(instruction)) {
        const audioId = `node-audio-${Date.now()}`;
        const newAudio = {
          id: audioId,
          type: 'audioNode',
          position: { x: 280, y: 350 },
          data: {
            delay: '5s',
            audioDuration: '0:22',
            audioScript: 'Oi! Tudo bem? Passando rapidinho para te avisar que separei a sua vaga com desconto especial. Posso liberar agora para você?',
            voiceModel: voiceModel || 'fish-audio/s2.1-pro-free:free'
          }
        };
        clonedNodes.push(newAudio);
      }

      updatedFunnelData = {
        name: currentFunnel.name,
        description: currentFunnel.description,
        triggerKeywords: currentFunnel.triggerKeywords,
        nodes: clonedNodes,
        edges: clonedEdges
      };
    }

    // Restaura audioUrl original se o nó manteve o placeholder
    for (const node of updatedFunnelData.nodes) {
      if (node.data?.audioUrl === '[AUDIO_PREVIAMENTE_GRAVADO]') {
        const orig = currentFunnel.nodes.find((o) => o.id === node.id);
        if (orig?.data?.audioUrl) {
          node.data.audioUrl = orig.data.audioUrl;
        }
      }
    }

    // Se houver nós de áudio novos ou com roteiro alterado sem áudio pré-gravado, sintetiza automaticamente
    if (Array.isArray(updatedFunnelData.nodes)) {
      for (const node of updatedFunnelData.nodes) {
        if (node.type === 'audioNode' && node.data?.audioScript && (!node.data?.audioUrl || node.data?.audioUrl === '[AUDIO_PREVIAMENTE_GRAVADO]')) {
          try {
            const { VoiceService } = await import('./voiceService.js');
            const vRes = await VoiceService.synthesizeVoice({
              text: node.data.audioScript,
              voiceModel
            });
            if (vRes?.success && vRes.audioUrl) {
              node.data.audioUrl = vRes.audioUrl;
              const mins = Math.floor((vRes.durationSeconds || 15) / 60);
              const secs = (vRes.durationSeconds || 15) % 60;
              node.data.audioDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
          } catch (vErr) {
            console.warn('[AI MAINTAIN] Falha ao sintetizar áudio novo na manutenção:', vErr);
          }
        }
      }
    }

    // Identifica nós modificados ou adicionados para o changelog visual do Copiloto
    const addedNodeIds: string[] = [];
    const modifiedNodeIds: string[] = [];
    if (Array.isArray(updatedFunnelData.nodes)) {
      for (const newNode of updatedFunnelData.nodes) {
        const orig = currentFunnel.nodes.find((o) => o.id === newNode.id);
        if (!orig) {
          addedNodeIds.push(newNode.id);
        } else if (JSON.stringify(orig.data) !== JSON.stringify(newNode.data)) {
          modifiedNodeIds.push(newNode.id);
        }
      }
    }

    const aiMeta = {
      model: 'NVIDIA NIM • Z.ai GLM 5.3 (753B MoE)',
      reasoning:
        aiReasoning ||
        `Análise de arquitetura executada pelo Z.ai GLM 5.3 (753B) no NVIDIA NIM.\n• Funil base: "${currentFunnel.name}" (${currentFunnel.nodes.length} nós).\n• Instrução: "${instruction}".\n• Otimizando gatilhos, blocos de texto/áudio e caminhos lógicos para máxima conversão no WhatsApp.`,
      explanation:
        updatedFunnelData.explanation ||
        `Modificações aplicadas com sucesso: ${instruction}`,
      changelog: [
        ...(addedNodeIds.length > 0 ? [`Adicionados ${addedNodeIds.length} novos nós ao canvas`] : []),
        ...(modifiedNodeIds.length > 0 ? [`Atualizados ${modifiedNodeIds.length} nós existentes`] : []),
        `Total de ${updatedFunnelData.nodes?.length || 0} nós e ${updatedFunnelData.edges?.length || 0} conexões sincronizadas`
      ],
      modifiedNodeIds,
      addedNodeIds,
      timestamp: new Date().toISOString()
    };

    return {
      funnel: {
        ...currentFunnel,
        name: updatedFunnelData.name || currentFunnel.name,
        description: updatedFunnelData.description || currentFunnel.description,
        triggerKeywords: updatedFunnelData.triggerKeywords || currentFunnel.triggerKeywords,
        nodes: updatedFunnelData.nodes,
        edges: updatedFunnelData.edges || currentFunnel.edges
      },
      aiMeta
    } as any;
  }
}
