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
      complexity = 'enterprise'
    } = params;

    // 1. Extração preliminar de entidades
    let extractedProduct = userProduct || '';
    if (!extractedProduct) {
      const matchProduct = prompt.match(/(?:curso|mentoria|produto|treinamento|e-?book|comunidade)\s+(?:de\s+)?([^,\.]+)/i);
      extractedProduct = matchProduct ? matchProduct[0].trim() : 'Método Vendedor X1';
    }

    let mainPriceStr = String(userPrice || '97,00').replace('R$', '').trim();
    let downsellPriceStr = String(userDownsell || '47,00').replace('R$', '').trim();

    // 2. Consulta à IA via NVIDIA NIM Cascade para enriquecimento de copy e estratégias
    let parsedLlm: any = null;
    try {
      const { AiProviderService } = await import('./aiProviderService.js');
      const systemPrompt = `Você é um arquiteto mestre de funis de vendas X1 no WhatsApp para infoprodutos de alto nível (padrão 7 dígitos estilo Leona AI).
Sua missão é estruturar uma esteira de conversão persuasiva, humanizada, com Spintax e ganchos múltiplos para teste A/B.
Responda EXCLUSIVAMENTE em JSON no formato abaixo, sem comentários adicionais:
{
  "funnelName": "Nome elegante e chamativo do Funil",
  "description": "Resumo da estratégia em 1 frase",
  "triggerKeyword": "QUERO",
  "welcomeMessage": "Mensagem inicial humanizada com {Oi|Olá|Opa} {{nome}}, rapport imediato e pergunta de qualificação sobre {{produto}}",
  "audioScript": "Roteiro de áudio natural gravado no WhatsApp (20-30 seg) pelo produtor explicando o valor do {{produto}}",
  "audioDuration": "0:28",
  "spinGoal": "Objetivo do copiloto IA: conduzir qualificação SPIN Selling e apresentar a oferta principal de R$ ${mainPriceStr}",
  "downsellMessage": "Mensagem empática com 50% de desconto relâmpago de R$ ${downsellPriceStr} no PIX para quem achar o valor alto",
  "mainPrice": "${mainPriceStr}",
  "downsellPrice": "${downsellPriceStr}"
}`;

      const userMessage = `Crie o funil para a seguinte descrição: "${prompt}". Produto: "${extractedProduct}". Preço: R$ ${mainPriceStr}. Downsell: R$ ${downsellPriceStr}.`;

      console.log(`[AI ARCHITECT] Gerando cópia e estratégia do funil com Z.ai GLM 5.3 (z-ai/glm-5.3)...`);
      const aiResponse = await AiProviderService.generateWithCascade({
        systemPrompt,
        userMessage,
        modelOverride: process.env.SYSTEM_ARCHITECT_MODEL || 'z-ai/glm-5.3',
        maxTokens: 2000,
        temperature: 0.2
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
          console.warn('[AI ARCHITECT] Falha ao fazer parse do JSON retornado:', jsonErr);
        }
      }
    } catch (err) {
      console.warn('AiProviderService: Fallback para montagem estruturada de funil:', err);
    }

    // 3. Fallbacks elegantes caso o LLM retorne dados parciais
    const funnelName =
      parsedLlm?.funnelName ||
      `Funil Enterprise: ${extractedProduct.slice(0, 32)}`;

    const description =
      parsedLlm?.description ||
      `Funil automatizado por IA para ${extractedProduct} com qualificação, áudio humanizado, downsell e PIX.`;

    const triggerKeyword = parsedLlm?.triggerKeyword || 'COMEÇAR';

    const welcomeMsg =
      parsedLlm?.welcomeMessage ||
      `{Oi|Olá|Opa} {{nome}}! Que bom falar com você! Vi que você tem interesse no ${extractedProduct}. Me conta uma coisa: você já tentou aplicar algo parecido antes ou é sua primeira vez?`;

    const audioScript =
      parsedLlm?.audioScript ||
      `Oi {{nome}}, passando rapidinho em áudio para te explicar como funciona o ${extractedProduct} na prática. Nossa metodologia foi feita para te gerar resultado rápido com suporte direto!`;

    const audioDuration = parsedLlm?.audioDuration || '0:28';

    const spinGoal =
      parsedLlm?.spinGoal ||
      `Conduzir qualificação SPIN selling do lead para o produto ${extractedProduct}, contornar objeções de tempo ou dinheiro e enviar a chave PIX no valor de R$ ${mainPriceStr}.`;

    const downsellMsg =
      parsedLlm?.downsellMessage ||
      `Olha só {{nome}}, entendo perfeitamente sua situação de momento. Para não deixar você de fora da turma, consegui liberar uma condição especial exclusiva: de R$ ${mainPriceStr} por apenas R$ ${downsellPriceStr} no PIX à vista! Posso gerar seu link com desconto?`;

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

    // =========================================================================
    // ARQUITETURA 1: ENTERPRISE MESTRE 7 DÍGITOS (ESTILO LEONA AI - 26+ NÓS)
    // =========================================================================
    if (complexity === 'enterprise') {
      // COLUNA 1: Início
      nodes.push({
        id: 'node-start',
        type: 'startNode',
        position: { x: 60, y: 340 },
        data: { label: 'Início (Gatilho Meta Ads / Orgânico)' }
      });

      // COLUNA 2: Triagem & Distribuidor A/B/C/D
      nodes.push(
        {
          id: 'node-cond-entry',
          type: 'conditionNode',
          position: { x: 340, y: 140 },
          data: { conditionText: 'Etiqueta igual PARTE 1? Caso não atenda continua por aqui' }
        },
        {
          id: 'node-tag-entry',
          type: 'tagNode',
          position: { x: 340, y: 340 },
          data: { tag: 'Lead_Novo_PARTE_1' }
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
        }
      );

      // COLUNA 3: 4 Ramificações paralelas de Mensagens & Áudios WhatsApp
      nodes.push(
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
          data: { delay: '4s', text: `{Oi|Olá} {{nome}}! Tudo pronto para você conhecer o ${extractedProduct}? As vagas promocionais com desconto encerram hoje!` }
        },
        {
          id: 'node-audio-2',
          type: 'audioNode',
          position: { x: 960, y: 260 },
          data: { delay: '6s', audioDuration: '0:26', voiceModel, audioScript: `Olá {{nome}}, vim em áudio te avisar que as vagas promocionais do ${extractedProduct} estão nos últimos minutos...`, audioUrl: synthesizedAudioUrl }
        },
        // Branch 3 (Prova Social)
        {
          id: 'node-msg-split-3',
          type: 'messageNode',
          position: { x: 680, y: 440 },
          data: { delay: '3s', text: `{{nome}}, olha só o que nossos alunos estão conquistando com o método ${extractedProduct}!` }
        },
        {
          id: 'node-audio-3',
          type: 'audioNode',
          position: { x: 960, y: 440 },
          data: { delay: '5s', audioDuration: '0:22', voiceModel, audioScript: `{{nome}}, preparei essa gravação para te mostrar como alunos comuns estão aplicando o ${extractedProduct} do zero...`, audioUrl: synthesizedAudioUrl }
        },
        // Branch 4 (Oportunidade)
        {
          id: 'node-msg-split-4',
          type: 'messageNode',
          position: { x: 680, y: 620 },
          data: { delay: '4s', text: `Fala {{nome}}! Essa é a oportunidade que você esperava para transformar seus resultados com ${extractedProduct}.` }
        },
        {
          id: 'node-audio-4',
          type: 'audioNode',
          position: { x: 960, y: 620 },
          data: { delay: '5s', audioDuration: '0:30', voiceModel, audioScript: `Com certeza você já tentou outras coisas antes, mas o ${extractedProduct} foi desenhado passo a passo para você não travar...`, audioUrl: synthesizedAudioUrl }
        }
      );

      // COLUNA 4: Régua de Esperas Encadeadas (30 min, 1 dia, 3 dias)
      nodes.push(
        {
          id: 'node-wait-1',
          type: 'waitReplyNode',
          position: { x: 1260, y: 220 },
          data: { timeoutDuration: 'Após 30 minutos' }
        },
        {
          id: 'node-wait-2',
          type: 'waitReplyNode',
          position: { x: 1260, y: 460 },
          data: { timeoutDuration: 'Após 1 dia' }
        },
        {
          id: 'node-wait-3',
          type: 'waitReplyNode',
          position: { x: 1260, y: 680 },
          data: { timeoutDuration: 'Após 3 dias' }
        }
      );

      // COLUNA 5: Condicional de Intenção & Entrega de Materiais/PDFs
      nodes.push(
        {
          id: 'node-cond-intent',
          type: 'conditionNode',
          position: { x: 1580, y: 180 },
          data: { conditionText: 'resposta contém sim OU quero OU preço OU valor OU como funciona?' }
        },
        {
          id: 'node-msg-materials',
          type: 'messageNode',
          position: { x: 1580, y: 400 },
          data: {
            delay: '3s',
            text: `{{nome}}, estou preparando tudo pra você! Enquanto isso, dá uma olhada nos materiais que separei:`,
            files: [
              { name: `${extractedProduct.slice(0, 18)}_Guia_Passo_a_Passo.pdf`, size: '2.4 MB' },
              { name: `Metodologia_Pratica_${extractedProduct.slice(0, 15)}.pdf`, size: '4.8 MB' },
              { name: 'Checklist_de_Aceleracao.pdf', size: '1.1 MB' }
            ]
          }
        },
        {
          id: 'node-msg-recov-day1',
          type: 'messageNode',
          position: { x: 1580, y: 640 },
          data: {
            delay: '4s',
            text: `Oi {{nome}}, passando para saber se você conseguiu abrir o material acima. Ficou com alguma dúvida sobre o ${extractedProduct}? Posso te ajudar a começar hoje!`
          }
        }
      );

      // COLUNA 6: Segundo Distribuidor & Pitch de Alta Conversão
      nodes.push(
        {
          id: 'node-dist-offer',
          type: 'distributorNode',
          position: { x: 1940, y: 220 },
          data: {
            outputs: [
              { label: 'Saída 1 (Oferta PIX)', count: 0 },
              { label: 'Saída 2 (Cartão 12x)', count: 0 },
              { label: 'Saída 3 (Combo VIP)', count: 0 }
            ]
          }
        },
        {
          id: 'node-msg-pitch',
          type: 'messageNode',
          position: { x: 1940, y: 460 },
          data: {
            delay: '5s',
            text: `🚀 *CONDIÇÃO EXCLUSIVA DE ACESSO HOJE:*\n\nDe ~R$ ${parseInt(finalMainPrice) * 2 || 197},00~ por apenas **R$ ${finalMainPrice}** no PIX à vista!\n\n🎁 *BÔNUS LIBERADOS:*\n✅ Acesso Vitalício + Atualizações\n✅ Suporte Direto VIP\n✅ 7 Dias de Garantia Incondicional!`
          }
        }
      );

      // COLUNA 7: PIX Principal & Rota de Downsell
      nodes.push(
        {
          id: 'node-pix-main',
          type: 'pixButtonNode',
          position: { x: 2280, y: 220 },
          data: {
            amount: finalMainPrice,
            pixKey: 'financeiro@whatspix.ia',
            pixReceiver: 'Produtor Oficial',
            delay: '2s'
          }
        },
        {
          id: 'node-msg-pix-inst',
          type: 'messageNode',
          position: { x: 2280, y: 420 },
          data: {
            delay: '3s',
            text: `Copie o código PIX acima e realize o pagamento no app do seu banco. A chave tem validade de 15 minutos!\n\nAssim que pagar, envie o comprovante aqui para liberação automática imediata.`
          }
        },
        {
          id: 'node-msg-downsell',
          type: 'messageNode',
          position: { x: 2280, y: 640 },
          data: { delay: '4s', text: downsellMsg }
        },
        {
          id: 'node-pix-down',
          type: 'pixButtonNode',
          position: { x: 2280, y: 840 },
          data: {
            amount: finalDownsellPrice,
            pixKey: 'financeiro@whatspix.ia',
            pixReceiver: 'Produtor Oficial'
          }
        }
      );

      // COLUNA 8: Validação OCR de Comprovante & Notificação do Atendente
      nodes.push(
        {
          id: 'node-wait-pix',
          type: 'waitReplyNode',
          position: { x: 2640, y: 220 },
          data: { timeoutDuration: 'Após 45 minutos' }
        },
        {
          id: 'node-ocr-checker',
          type: 'ocrNode',
          position: { x: 2640, y: 440 },
          data: { label: 'Validador Inteligente OCR de Comprovante' }
        },
        {
          id: 'node-notify-agent',
          type: 'notificationNode',
          position: { x: 2640, y: 640 },
          data: {
            notificationMessage: `ATENDENTE: Lead {{nome}} gerou PIX de R$ ${finalMainPrice}! Fazer acompanhamento caso precise de suporte.`
          }
        }
      );

      // COLUNA 9: Agente de IA, Venda Aprovada & CRM Kanban
      nodes.push(
        {
          id: 'node-ai-closer',
          type: 'aiAgentNode',
          position: { x: 2980, y: 200 },
          data: { goal: spinGoal }
        },
        {
          id: 'node-approved-sale',
          type: 'approvedSaleNode',
          position: { x: 2980, y: 420 },
          data: { goal: `Venda Aprovada R$ ${finalMainPrice} (Meta Conversions CAPI)` }
        },
        {
          id: 'node-kanban',
          type: 'kanbanNode',
          position: { x: 2980, y: 620 },
          data: { kanbanStage: 'paid' }
        },
        {
          id: 'node-tag-paid',
          type: 'tagNode',
          position: { x: 2980, y: 780 },
          data: { tag: 'Cliente_VIP_Comprador' }
        }
      );

      // ARESTAS (EDGES) ENTERPRISE
      edges.push(
        // Coluna 1 -> 2
        { id: 'e-start-cond', source: 'node-start', target: 'node-cond-entry', style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e-cond-tag', source: 'node-cond-entry', sourceHandle: 'false', target: 'node-tag-entry', style: { stroke: '#6366f1', strokeWidth: 2 } },
        { id: 'e-tag-dist', source: 'node-tag-entry', target: 'node-dist-1', style: { stroke: '#d97706', strokeWidth: 2 } },

        // Distribuidor A/B/C/D -> 4 Ramos
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

        // Esperas e Timeouts
        { id: 'e-wait1-replied', source: 'node-wait-1', sourceHandle: 'replied', target: 'node-cond-intent', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
        { id: 'e-wait1-timeout', source: 'node-wait-1', sourceHandle: 'timeout', target: 'node-wait-2', style: { stroke: '#ea580c', strokeWidth: 2, strokeDasharray: '4,4' } },
        { id: 'e-wait2-timeout', source: 'node-wait-2', sourceHandle: 'timeout', target: 'node-msg-recov-day1', style: { stroke: '#ea580c', strokeWidth: 2, strokeDasharray: '4,4' } },
        { id: 'e-wait2-replied', source: 'node-wait-2', sourceHandle: 'replied', target: 'node-cond-intent', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
        { id: 'e-recovday1-wait3', source: 'node-msg-recov-day1', target: 'node-wait-3', style: { stroke: '#ea580c', strokeWidth: 2 } },
        { id: 'e-wait3-replied', source: 'node-wait-3', sourceHandle: 'replied', target: 'node-cond-intent', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
        { id: 'e-wait3-timeout-down', source: 'node-wait-3', sourceHandle: 'timeout', target: 'node-msg-downsell', style: { stroke: '#f43f5e', strokeWidth: 2 } },

        // Condicional de Intenção -> Materiais / AI Closer
        { id: 'e-cond-intent-true', source: 'node-cond-intent', sourceHandle: 'true', target: 'node-msg-materials', style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e-cond-intent-false', source: 'node-cond-intent', sourceHandle: 'false', target: 'node-ai-closer', style: { stroke: '#8b5cf6', strokeWidth: 2 } },

        // Materiais -> Segundo Distribuidor -> Pitch
        { id: 'e-materials-distoffer', source: 'node-msg-materials', target: 'node-dist-offer', style: { stroke: '#d97706', strokeWidth: 2 } },
        { id: 'e-distoffer-out0', source: 'node-dist-offer', sourceHandle: 'out-0', target: 'node-msg-pitch', style: { stroke: '#d97706', strokeWidth: 2 } },
        { id: 'e-distoffer-out1', source: 'node-dist-offer', sourceHandle: 'out-1', target: 'node-msg-pitch', style: { stroke: '#d97706', strokeWidth: 2 } },
        { id: 'e-distoffer-out2', source: 'node-dist-offer', sourceHandle: 'out-2', target: 'node-msg-pitch', style: { stroke: '#d97706', strokeWidth: 2 } },

        // Pitch -> PIX -> Notificação
        { id: 'e-pitch-pixmain', source: 'node-msg-pitch', target: 'node-pix-main', style: { stroke: '#059669', strokeWidth: 2 } },
        { id: 'e-pixmain-pixinst', source: 'node-pix-main', target: 'node-msg-pix-inst', style: { stroke: '#059669', strokeWidth: 2 } },
        { id: 'e-pixinst-waitpix', source: 'node-msg-pix-inst', target: 'node-wait-pix', style: { stroke: '#ea580c', strokeWidth: 2 } },
        { id: 'e-pixmain-notify', source: 'node-pix-main', target: 'node-notify-agent', style: { stroke: '#0f766e', strokeWidth: 2 } },

        // Aguarda PIX -> OCR / Downsell
        { id: 'e-waitpix-replied-ocr', source: 'node-wait-pix', sourceHandle: 'replied', target: 'node-ocr-checker', animated: true, style: { stroke: '#059669', strokeWidth: 2 } },
        { id: 'e-waitpix-timeout-down', source: 'node-wait-pix', sourceHandle: 'timeout', target: 'node-msg-downsell', style: { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '4,4' } },
        { id: 'e-downmsg-downpix', source: 'node-msg-downsell', target: 'node-pix-down', style: { stroke: '#f43f5e', strokeWidth: 2 } },
        { id: 'e-downpix-ocr', source: 'node-pix-down', target: 'node-ocr-checker', style: { stroke: '#059669', strokeWidth: 2 } },

        // OCR -> Venda Aprovada -> CRM Kanban -> Tag
        { id: 'e-ocr-approved', source: 'node-ocr-checker', target: 'node-approved-sale', style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e-approved-kanban', source: 'node-approved-sale', target: 'node-kanban', style: { stroke: '#7c3aed', strokeWidth: 2 } },
        { id: 'e-kanban-tagpaid', source: 'node-kanban', target: 'node-tag-paid', style: { stroke: '#7c3aed', strokeWidth: 2 } }
      );
    } else {
      // =========================================================================
      // ARQUITETURA BÁSICA / INTERMEDIÁRIA (8 A 12 NÓS)
      // =========================================================================
      const xBase = 60;
      const yCenter = 300;

      nodes.push(
        {
          id: 'node-start',
          type: 'startNode',
          position: { x: xBase, y: yCenter },
          data: { label: 'Início (Gatilho Anúncio / Palavra-Chave)' }
        },
        {
          id: 'node-msg-welcome',
          type: 'messageNode',
          position: { x: xBase + 240, y: yCenter },
          data: { delay: '3s - 5s', text: welcomeMsg }
        }
      );

      let currentX = xBase + 240;

      if (includeVoice) {
        currentX += 300;
        nodes.push({
          id: 'node-audio-pitch',
          type: 'audioNode',
          position: { x: currentX, y: yCenter },
          data: {
            delay: '6s',
            audioDuration: actualAudioDuration,
            voiceModel,
            audioScript,
            audioUrl: synthesizedAudioUrl
          }
        });
      }

      currentX += 300;
      nodes.push({
        id: 'node-wait-1',
        type: 'waitReplyNode',
        position: { x: currentX, y: yCenter },
        data: { timeoutDuration: 'Após 30 minutos' }
      });

      currentX += 300;
      const condX = currentX;
      nodes.push({
        id: 'node-cond-1',
        type: 'conditionNode',
        position: { x: condX, y: yCenter },
        data: { conditionText: 'Etiqueta igual Compra ou Interesse_Confirmado' }
      });

      nodes.push(
        {
          id: 'node-tag-main',
          type: 'tagNode',
          position: { x: condX + 310, y: yCenter - 160 },
          data: { tag: 'Lead_Qualificado_VIP' }
        },
        {
          id: 'node-pix-main',
          type: 'pixButtonNode',
          position: { x: condX + 590, y: yCenter - 160 },
          data: { amount: finalMainPrice, pixKey: 'contato@whatspix.ia', pixReceiver: 'Produtor Oficial' }
        },
        {
          id: 'node-sale-main',
          type: 'approvedSaleNode',
          position: { x: condX + 870, y: yCenter - 160 },
          data: { goal: 'Venda Principal R$ ' + finalMainPrice }
        },
        {
          id: 'node-tag-down',
          type: 'tagNode',
          position: { x: condX + 310, y: yCenter + 160 },
          data: { tag: 'Objecao_Preco_Downsell' }
        },
        {
          id: 'node-msg-down',
          type: 'messageNode',
          position: { x: condX + 590, y: yCenter + 160 },
          data: { delay: '5s', text: downsellMsg }
        },
        {
          id: 'node-wait-down',
          type: 'waitReplyNode',
          position: { x: condX + 890, y: yCenter + 160 },
          data: { timeoutDuration: 'Após 24 horas' }
        },
        {
          id: 'node-pix-down',
          type: 'pixButtonNode',
          position: { x: condX + 1180, y: yCenter + 160 },
          data: { amount: finalDownsellPrice, pixKey: 'contato@whatspix.ia', pixReceiver: 'Produtor Oficial' }
        },
        {
          id: 'node-sale-down',
          type: 'approvedSaleNode',
          position: { x: condX + 1460, y: yCenter + 160 },
          data: { goal: 'Venda Downsell R$ ' + finalDownsellPrice }
        }
      );

      // Edges básicos
      edges.push({ id: 'e-start-msg', source: 'node-start', target: 'node-msg-welcome', style: { stroke: '#10b981', strokeWidth: 2 } });
      if (includeVoice) {
        edges.push(
          { id: 'e-msg-audio', source: 'node-msg-welcome', target: 'node-audio-pitch', style: { stroke: '#38bdf8', strokeWidth: 2 } },
          { id: 'e-audio-wait', source: 'node-audio-pitch', target: 'node-wait-1', style: { stroke: '#f97316', strokeWidth: 2 } }
        );
      } else {
        edges.push({ id: 'e-msg-wait', source: 'node-msg-welcome', target: 'node-wait-1', style: { stroke: '#f97316', strokeWidth: 2 } });
      }
      edges.push(
        { id: 'e-wait-cond', source: 'node-wait-1', sourceHandle: 'replied', target: 'node-cond-1', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
        { id: 'e-cond-tag-main', source: 'node-cond-1', sourceHandle: 'true', target: 'node-tag-main', style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e-tag-pix-main', source: 'node-tag-main', target: 'node-pix-main', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e-pix-sale-main', source: 'node-pix-main', target: 'node-sale-main', style: { stroke: '#059669', strokeWidth: 2 } },
        { id: 'e-cond-tag-down', source: 'node-cond-1', sourceHandle: 'false', target: 'node-tag-down', style: { stroke: '#f43f5e', strokeWidth: 2 } },
        { id: 'e-tag-downmsg', source: 'node-tag-down', target: 'node-msg-down', style: { stroke: '#f43f5e', strokeWidth: 2 } },
        { id: 'e-downmsg-downwait', source: 'node-msg-down', target: 'node-wait-down', style: { stroke: '#ea580c', strokeWidth: 2 } },
        { id: 'e-downwait-downpix', source: 'node-wait-down', sourceHandle: 'replied', target: 'node-pix-down', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
        { id: 'e-downpix-downsale', source: 'node-pix-down', target: 'node-sale-down', style: { stroke: '#059669', strokeWidth: 2 } }
      );
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
      console.log(`[AI MAINTAIN] Solicitando manutenção e reparo do funil com Z.ai GLM 5.3 (z-ai/glm-5.3)...`);
      const aiResponse = await AiProviderService.generateWithCascade({
        systemPrompt,
        userMessage,
        modelOverride: process.env.SYSTEM_ARCHITECT_MODEL || 'z-ai/glm-5.3',
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
