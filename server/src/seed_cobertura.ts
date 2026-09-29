import { db } from './store/db.js';
import { SalesFunnel } from './types/index.js';

export function createCoberturaPorcelanaFunnel(): SalesFunnel {
  const col1X = 280;
  const col2X = 640;
  const col3X = 1000;

  const funnel: SalesFunnel = {
    id: 'funnel-cobertura-porcelana-2',
    name: 'COBERTURA DE PORCELANA (2)',
    description: 'Funil oficial em 3 etapas com qualificação de tags (PARTE 1, 2 e 3), áudios 1.ogg, 2.ogg, 3.ogg, 4 arquivos PDFs, esperas de 35min/1dia e cobrança PIX.',
    active: true,
    triggerType: 'meta_ads_keyword',
    triggerKeywords: ['RECEITA', 'COBERTURA', 'PORCELANA', 'QUERO', 'CURSO'],
    stats: {
      started: 124,
      completed: 89,
      conversions: 42,
      conversionRate: 33.8
    },
    createdAt: new Date().toISOString(),
    nodes: [
      // Início
      {
        id: 'node-start',
        type: 'startNode',
        position: { x: 50, y: 150 },
        data: { label: 'Início (Gatilho Anúncio Meta Ads)' }
      },

      // ==========================================
      // COLUNA 1: PARTE 1
      // ==========================================
      {
        id: 'c1-cond-parte1',
        type: 'conditionNode',
        position: { x: col1X, y: 80 },
        data: {
          conditionText: 'Etiqueta igual PARTE 1'
        }
      },
      {
        id: 'c1-tag-parte1',
        type: 'tagNode',
        position: { x: col1X, y: 220 },
        data: {
          tag: 'PARTE 1',
          tags: ['PARTE 1']
        }
      },
      {
        id: 'c1-msg-receitas',
        type: 'messageNode',
        position: { x: col1X, y: 320 },
        data: {
          delay: '8s - 15s',
          text: '🍰 Receitas Exclusivas de Recheios de Porcelana! Essa técnica vai transformar a estrutura dos seus bolos.',
          audioFileName: '1.ogg',
          audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'
        }
      },
      {
        id: 'c1-wait-35m',
        type: 'waitReplyNode',
        position: { x: col1X, y: 460 },
        data: {
          timeoutDuration: 'Após 35 minutos'
        }
      },
      {
        id: 'c1-wait-1d',
        type: 'waitReplyNode',
        position: { x: col1X, y: 640 },
        data: {
          timeoutDuration: 'Após 1 dia'
        }
      },
      {
        id: 'c1-cond-recusa',
        type: 'conditionNode',
        position: { x: col1X, y: 820 },
        data: {
          conditionText: 'resposta contém nao OU resposta contém não OU resposta contém Nao'
        }
      },
      {
        id: 'c1-msg-recusa',
        type: 'messageNode',
        position: { x: col1X + 280, y: 840 },
        data: {
          text: 'Sem problema 😊 Fica com Deus! 🙏'
        }
      },

      // ==========================================
      // COLUNA 2: PARTE 2
      // ==========================================
      {
        id: 'c2-cond-parte2',
        type: 'conditionNode',
        position: { x: col2X, y: 80 },
        data: {
          conditionText: 'Etiqueta igual PARTE 2'
        }
      },
      {
        id: 'c2-tag-parte2',
        type: 'tagNode',
        position: { x: col2X, y: 220 },
        data: {
          tag: 'PARTE 2',
          tags: ['PARTE 2']
        }
      },
      {
        id: 'c2-msg-envio',
        type: 'messageNode',
        position: { x: col2X, y: 320 },
        data: {
          delay: '7s - 9s',
          text: 'Vou te enviar agora e você paga depois que receber e ver todo o conteúdo...',
          audioFileName: '2.ogg',
          audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'
        }
      },
      {
        id: 'c2-wait-35m',
        type: 'waitReplyNode',
        position: { x: col2X, y: 460 },
        data: {
          timeoutDuration: 'Após 35 minutos'
        }
      },
      {
        id: 'c2-wait-1d',
        type: 'waitReplyNode',
        position: { x: col2X, y: 640 },
        data: {
          timeoutDuration: 'Após 1 dia'
        }
      },
      {
        id: 'c2-cond-recusa',
        type: 'conditionNode',
        position: { x: col2X, y: 820 },
        data: {
          conditionText: 'resposta contém nao OU resposta contém não OU resposta contém Nao'
        }
      },
      {
        id: 'c2-msg-recusa',
        type: 'messageNode',
        position: { x: col2X + 280, y: 840 },
        data: {
          text: 'Sem problema 😊 Fica com Deus! 🙏'
        }
      },

      // ==========================================
      // COLUNA 3: PARTE 3 (MATERIAL COMPLETO + PIX)
      // ==========================================
      {
        id: 'c3-cond-parte3',
        type: 'conditionNode',
        position: { x: col3X, y: 80 },
        data: {
          conditionText: 'Etiqueta igual PARTE 3'
        }
      },
      {
        id: 'c3-tag-parte3',
        type: 'tagNode',
        position: { x: col3X, y: 220 },
        data: {
          tag: 'PARTE 3',
          tags: ['PARTE 3']
        }
      },
      {
        id: 'c3-msg-material',
        type: 'messageNode',
        position: { x: col3X, y: 320 },
        data: {
          delay: '3s',
          text: 'PRONTINHO, ANJO! SEGUE ABAIXO O SEU MATERIAL COMPLETO. Agora conto com a sua honestidade e confiança ❤️',
          audioFileName: '3.ogg',
          audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg',
          files: [
            { name: 'COBERTURAS PORCELANA.pdf', size: '2.4 MB' },
            { name: 'BRIGADEIRO SEM FOGO.pdf', size: '1.8 MB' },
            { name: 'RECHEIO SEM FOGO.pdf', size: '1.5 MB' },
            { name: 'COMO VENDER.pdf', size: '3.1 MB' }
          ]
        }
      },
      {
        id: 'c3-pix-maria',
        type: 'pixButtonNode',
        position: { x: col3X, y: 640 },
        data: {
          pixKey: '11999999999',
          pixReceiver: 'maria',
          amount: '97,00'
        }
      },
      {
        id: 'c3-msg-dados',
        type: 'messageNode',
        position: { x: col3X, y: 760 },
        data: {
          text: 'Nome: Maria Silva\nBanco: Nubank\nValor: R$ 97,00\nChave PIX: 11999999999\n\nAssim que fizer o PIX, me mande o comprovante por aqui!'
        }
      }
    ],
    edges: [
      // Start ➔ Condicional 1
      {
        id: 'e-start-c1cond',
        source: 'node-start',
        target: 'c1-cond-parte1',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      },

      // COLUNA 1: Conexões
      // Condicional 1 (true -> Tag 1, false -> Condicional 2)
      {
        id: 'e-c1cond-true',
        source: 'c1-cond-parte1',
        sourceHandle: 'true',
        target: 'c1-tag-parte1',
        style: { stroke: '#0284c7', strokeWidth: 2 }
      },
      {
        id: 'e-c1cond-false',
        source: 'c1-cond-parte1',
        sourceHandle: 'false',
        target: 'c2-cond-parte2',
        style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '4,4' }
      },
      // Tag 1 -> Mensagem Receitas
      {
        id: 'e-c1tag-msg',
        source: 'c1-tag-parte1',
        target: 'c1-msg-receitas',
        style: { stroke: '#7c3aed', strokeWidth: 2 }
      },
      // Mensagem Receitas -> Aguarda Resposta 35m
      {
        id: 'e-c1msg-wait35',
        source: 'c1-msg-receitas',
        target: 'c1-wait-35m',
        style: { stroke: '#38bdf8', strokeWidth: 2 }
      },
      // Aguarda 35m (timeout -> Aguarda 1d)
      {
        id: 'e-c1wait35-wait1d',
        source: 'c1-wait-35m',
        sourceHandle: 'timeout',
        target: 'c1-wait-1d',
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      },
      // Aguarda 1d (replied -> Condicional Recusa)
      {
        id: 'e-c1wait1d-condrecusa',
        source: 'c1-wait-1d',
        sourceHandle: 'replied',
        target: 'c1-cond-recusa',
        style: { stroke: '#ea580c', strokeWidth: 2 }
      },
      // Condicional Recusa -> Mensagem Fica com Deus
      {
        id: 'e-c1condrecusa-msg',
        source: 'c1-cond-recusa',
        sourceHandle: 'true',
        target: 'c1-msg-recusa',
        style: { stroke: '#0284c7', strokeWidth: 2 }
      },

      // COLUNA 2: Conexões
      // Condicional 2 (true -> Tag 2, false -> Condicional 3)
      {
        id: 'e-c2cond-true',
        source: 'c2-cond-parte2',
        sourceHandle: 'true',
        target: 'c2-tag-parte2',
        style: { stroke: '#0284c7', strokeWidth: 2 }
      },
      {
        id: 'e-c2cond-false',
        source: 'c2-cond-parte2',
        sourceHandle: 'false',
        target: 'c3-cond-parte3',
        style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '4,4' }
      },
      // Tag 2 -> Mensagem Envio
      {
        id: 'e-c2tag-msg',
        source: 'c2-tag-parte2',
        target: 'c2-msg-envio',
        style: { stroke: '#7c3aed', strokeWidth: 2 }
      },
      // Mensagem Envio -> Aguarda Resposta 35m
      {
        id: 'e-c2msg-wait35',
        source: 'c2-msg-envio',
        target: 'c2-wait-35m',
        style: { stroke: '#38bdf8', strokeWidth: 2 }
      },
      // Aguarda 35m (timeout -> Aguarda 1d)
      {
        id: 'e-c2wait35-wait1d',
        source: 'c2-wait-35m',
        sourceHandle: 'timeout',
        target: 'c2-wait-1d',
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      },
      // Aguarda 1d (replied -> Condicional Recusa)
      {
        id: 'e-c2wait1d-condrecusa',
        source: 'c2-wait-1d',
        sourceHandle: 'replied',
        target: 'c2-cond-recusa',
        style: { stroke: '#ea580c', strokeWidth: 2 }
      },
      // Condicional Recusa -> Mensagem Fica com Deus
      {
        id: 'e-c2condrecusa-msg',
        source: 'c2-cond-recusa',
        sourceHandle: 'true',
        target: 'c2-msg-recusa',
        style: { stroke: '#0284c7', strokeWidth: 2 }
      },

      // COLUNA 3: Conexões
      // Condicional 3 (true -> Tag 3)
      {
        id: 'e-c3cond-true',
        source: 'c3-cond-parte3',
        sourceHandle: 'true',
        target: 'c3-tag-parte3',
        style: { stroke: '#0284c7', strokeWidth: 2 }
      },
      // Tag 3 -> Mensagem Material Completo
      {
        id: 'e-c3tag-msg',
        source: 'c3-tag-parte3',
        target: 'c3-msg-material',
        style: { stroke: '#7c3aed', strokeWidth: 2 }
      },
      // Mensagem Material -> Botão PIX Maria
      {
        id: 'e-c3msg-pix',
        source: 'c3-msg-material',
        target: 'c3-pix-maria',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      },
      // Botão PIX -> Mensagem Dados Bancários
      {
        id: 'e-c3pix-msgdados',
        source: 'c3-pix-maria',
        target: 'c3-msg-dados',
        style: { stroke: '#10b981', strokeWidth: 2 }
      }
    ]
  };

  return db.upsertFunnel(funnel);
}
