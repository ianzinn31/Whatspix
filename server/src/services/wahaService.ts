import axios from 'axios';
import { WhatsAppInstance } from '../types/index.js';
import { AntiBanEngine } from './antiBanEngine.js';

export class WahaService {
  /**
   * Helper para obter headers de autenticação com a chave de API do WAHA
   */
  private static getHeaders(instance?: WhatsAppInstance): Record<string, string> {
    const apiKey = instance?.apiKey || process.env.WAHA_API_KEY;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
    return headers;
  }

  /**
   * Inicia sessão no WAHA e busca o QR code REAL gerado pelo Chromium do WAHA
   */
  static async startSession(instance: WhatsAppInstance): Promise<{ status: string; qrCode?: string }> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);

    try {
      if (serverUrl && serverUrl.startsWith('http')) {
        // 0. Teste rápido de conectividade: se o WAHA estiver fora, retorna em 2s sem travar o Nginx (504)
        try {
          await axios.get(`${serverUrl}/api/version`, { headers, timeout: 2000 });
        } catch (pingErr: any) {
          console.error(`[WAHA] Servidor WAHA não está respondendo em ${serverUrl}: ${pingErr.message}`);
          return {
            status: 'disconnected',
            qrCode: undefined
          };
        }

        // 1. Descobrir se já existe uma sessão cadastrada no WAHA
        let sessionName = 'default';
        try {
          const sessionsRes = await axios.get(`${serverUrl}/api/sessions?all=true`, { headers, timeout: 3000 });
          if (Array.isArray(sessionsRes.data) && sessionsRes.data.length > 0) {
            // No WAHA Core só é permitida 1 sessão. Usamos o nome da sessão existente
            sessionName = sessionsRes.data[0].name;
            instance.id = sessionName;
            console.log(`[WAHA] Usando sessão detectada: "${sessionName}" (Status: ${sessionsRes.data[0].status})`);

            // Se já estiver conectada, retorna imediatamente!
            if (sessionsRes.data[0].status === 'WORKING') {
              return { status: 'connected' };
            }
          } else {
            // Se nenhuma sessão existir no WAHA, cria a sessão padrão com webhooks
            try {
              await axios.post(
                `${serverUrl}/api/sessions`,
                {
                  name: 'default',
                  config: {
                    webhooks: [
                      {
                        url: process.env.WAHA_WEBHOOK_URL || 'http://172.18.0.1:3001/api/webhooks/waha',
                        events: ['message', 'message.any', 'session.status']
                      }
                    ]
                  }
                },
                { headers, timeout: 4000 }
              );
              sessionName = 'default';
              instance.id = 'default';
            } catch (createErr: any) {
              console.warn(`[WAHA] Aviso ao criar sessão default: ${createErr.message}`);
            }
          }
        } catch (e: any) {
          console.warn(`[WAHA] Aviso ao listar sessões: ${e.message}`);
        }

        // 2. Garante que a sessão está iniciada no WAHA
        try {
          await axios.post(
            `${serverUrl}/api/sessions/start`,
            { name: sessionName },
            { headers, timeout: 4000 }
          );
        } catch (startErr: any) {
          // Se já estiver rodando, prossegue
        }

        // 3. Polling rápido aguardando o Chromium carregar o QR Code (max 4 tentativas de 1.5s = 6s total)
        for (let attempt = 1; attempt <= 4; attempt++) {
          await new Promise((r) => setTimeout(r, 1500));

          try {
            // Verifica status da sessão
            const statusRes = await axios.get(`${serverUrl}/api/sessions/${sessionName}`, { headers, timeout: 2000 });
            const currentStatus = statusRes.data?.status;
            console.log(`[WAHA] Tentativa ${attempt}/4 - Status da sessão ${sessionName}: ${currentStatus}`);

            if (currentStatus === 'WORKING') {
              return { status: 'connected' };
            }

            // Tenta obter o QR code em formato RAW primeiro
            try {
              const rawRes = await axios.get(`${serverUrl}/api/${sessionName}/auth/qr?format=raw`, {
                headers,
                timeout: 2500
              });
              if (rawRes.data && (rawRes.data.raw || typeof rawRes.data === 'string')) {
                const rawString = typeof rawRes.data === 'string' ? rawRes.data : rawRes.data.raw;
                if (rawString && rawString.length > 10) {
                  return {
                    status: 'scan_qr',
                    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(rawString)}`
                  };
                }
              }
            } catch {}

            // Tenta obter imagem direta de /auth/qr
            try {
              const qrRes = await axios.get(`${serverUrl}/api/${sessionName}/auth/qr`, {
                headers: { ...headers, Accept: 'image/png, application/json' },
                responseType: 'arraybuffer',
                timeout: 3000
              });

              if (qrRes.data && qrRes.data.byteLength > 100) {
                const contentType = String(qrRes.headers['content-type'] || 'image/png');
                const buf = Buffer.from(qrRes.data);

                if (contentType.includes('json')) {
                  const parsed = JSON.parse(buf.toString('utf-8'));
                  if (parsed.image) return { status: 'scan_qr', qrCode: parsed.image };
                  if (parsed.raw) {
                    return {
                      status: 'scan_qr',
                      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(parsed.raw)}`
                    };
                  }
                }

                return {
                  status: 'scan_qr',
                  qrCode: `data:${contentType};base64,${buf.toString('base64')}`
                };
              }
            } catch {}

            // Tenta obter screenshot do WhatsApp Web
            try {
              const screenRes = await axios.get(`${serverUrl}/api/screenshot?session=${sessionName}`, {
                headers,
                responseType: 'arraybuffer',
                timeout: 3000
              });
              if (screenRes.data && screenRes.data.byteLength > 500) {
                const buf = Buffer.from(screenRes.data);
                return {
                  status: 'scan_qr',
                  qrCode: `data:image/png;base64,${buf.toString('base64')}`
                };
              }
            } catch {}
          } catch (pollErr: any) {
            console.warn(`[WAHA] Tentativa ${attempt} falhou: ${pollErr.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error(`[WAHA] Erro geral ao obter QR code de ${instance.id} (${err.message})`);
    }

    return {
      status: 'connecting',
      qrCode: undefined
    };
  }

  /**
   * Obtém o status em tempo real da sessão no WAHA
   */
  static async getSessionStatus(instance: WhatsAppInstance): Promise<{ status: string }> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);

    try {
      const res = await axios.get(`${serverUrl}/api/sessions/${instance.id}`, { headers, timeout: 4000 });
      const wahaStatus = res.data?.status;
      if (wahaStatus === 'WORKING') return { status: 'connected' };
      if (wahaStatus === 'SCAN_QR_CODE') return { status: 'scan_qr' };
      if (wahaStatus === 'STARTING') return { status: 'connecting' };
      return { status: 'disconnected' };
    } catch {
      return { status: 'disconnected' };
    }
  }

  /**
   * Faz logout da sessão no WAHA para permitir reconexão com novo número
   */
  static async logoutSession(instance: WhatsAppInstance): Promise<boolean> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);

    try {
      await axios.post(`${serverUrl}/api/sessions/logout`, { name: instance.id }, { headers, timeout: 8000 });
      return true;
    } catch {
      try {
        await axios.post(`${serverUrl}/api/sessions/stop`, { name: instance.id }, { headers, timeout: 8000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Garante que o Chat ID esteja no padrão esperado pelo WhatsApp / WAHA (ex: 5511999999999@c.us)
   */
  static formatChatId(phoneOrJid: string): string {
    if (!phoneOrJid) return '';
    if (phoneOrJid.includes('@')) return phoneOrJid;
    const clean = phoneOrJid.replace(/\D/g, '');
    return `${clean}@c.us`;
  }

  /**
   * Envia presença de digitação no WhatsApp (humanizada com tempo calculado)
   */
  static async sendPresence(
    instance: WhatsAppInstance,
    chatId: string,
    state: 'composing' | 'recording' | 'paused'
  ): Promise<void> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);

    try {
      const cleanChatId = this.formatChatId(chatId);
      if (serverUrl) {
        await axios.post(
          `${serverUrl}/api/presence`,
          {
            session: instance.id,
            chatId: cleanChatId,
            presence: state
          },
          { headers, timeout: 3000 }
        );
      }
    } catch {
      // Ignora erro de presença em modo offline/simulado
    }
  }

  /**
   * Envia mensagem de texto aplicando Spintax e delay humanizado anti-ban
   */
  static async sendTextMessage(
    instance: WhatsAppInstance,
    chatId: string,
    rawText: string,
    onTypingStatus?: (status: string) => void
  ): Promise<{ success: boolean; deliveredText: string; delayMs: number }> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);
    const cleanChatId = this.formatChatId(chatId);

    // 1. Processa Spintax
    const processedText = instance.antiBanConfig.spintaxEnabled
      ? AntiBanEngine.processSpintax(rawText)
      : rawText;

    // 2. Calcula tempo de digitação humana
    const typingDelay = AntiBanEngine.calculateTypingDelay(processedText, instance.antiBanConfig);

    // 3. Emula "digitando..."
    if (onTypingStatus) onTypingStatus('digitando...');
    await this.sendPresence(instance, cleanChatId, 'composing');

    // Aguarda o tempo natural de digitação
    await new Promise((resolve) => setTimeout(resolve, Math.min(typingDelay, 3500)));

    // 4. Para o "digitando..."
    await this.sendPresence(instance, cleanChatId, 'paused');
    if (onTypingStatus) onTypingStatus('enviado');

    // 5. Envia texto para o WAHA real se disponível
    try {
      if (serverUrl) {
        await axios.post(
          `${serverUrl}/api/sendText`,
          {
            session: instance.id,
            chatId: cleanChatId,
            text: processedText
          },
          { headers, timeout: 6000 }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] SendText error: ${err.message}`);
    }

    return {
      success: true,
      deliveredText: processedText,
      delayMs: typingDelay
    };
  }

  /**
   * Envia áudio com simulação de "gravando áudio..."
   */
  static async sendVoiceNote(
    instance: WhatsAppInstance,
    chatId: string,
    audioUrl: string,
    durationSec: number = 8,
    onRecordingStatus?: (status: string) => void
  ): Promise<{ success: boolean }> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);
    const cleanChatId = this.formatChatId(chatId);
    const recordingDelay = AntiBanEngine.calculateAudioRecordingDelay(durationSec);

    if (onRecordingStatus) onRecordingStatus('gravando áudio...');
    await this.sendPresence(instance, cleanChatId, 'recording');

    // Aguarda tempo do áudio (máximo 4s na interface para responsividade)
    await new Promise((resolve) => setTimeout(resolve, Math.min(recordingDelay, 4000)));

    await this.sendPresence(instance, cleanChatId, 'paused');
    if (onRecordingStatus) onRecordingStatus('áudio enviado');

    try {
      if (serverUrl) {
        await axios.post(
          `${serverUrl}/api/sendVoice`,
          {
            session: instance.id,
            chatId: cleanChatId,
            file: { url: audioUrl }
          },
          { headers, timeout: 8000 }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] SendVoice error: ${err.message}`);
    }

    return { success: true };
  }

  /**
   * Envia arquivo ou documento (PDF, imagem, etc.) para o WhatsApp via WAHA
   */
  static async sendFile(
    instance: WhatsAppInstance,
    chatId: string,
    fileUrl: string,
    filename: string,
    caption?: string
  ): Promise<{ success: boolean }> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);
    const cleanChatId = this.formatChatId(chatId);

    try {
      if (serverUrl) {
        await axios.post(
          `${serverUrl}/api/sendFile`,
          {
            session: instance.id,
            chatId: cleanChatId,
            file: {
              url: fileUrl,
              filename: filename || 'documento.pdf'
            },
            caption: caption || ''
          },
          { headers, timeout: 15000 }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] SendFile error: ${err.message}`);
    }

    return { success: true };
  }

  /**
   * Dispara uma chamada de voz WhatsApp (toque no celular do lead para despertar)
   */
  static async makeWhatsAppCall(
    instance: WhatsAppInstance,
    chatId: string,
    durationSec: number = 15
  ): Promise<{ success: boolean; duration: number }> {
    const serverUrl = instance.serverUrl || process.env.WAHA_API_URL || 'http://localhost:3000';
    const headers = this.getHeaders(instance);
    const cleanChatId = this.formatChatId(chatId);
    console.log(`[WAHA] 📞 Disparando chamada de voz WhatsApp para ${cleanChatId} (Toque: ${durationSec}s)...`);

    try {
      if (serverUrl) {
        await axios.post(
          `${serverUrl}/api/call`,
          {
            session: instance.id,
            chatId: cleanChatId,
            duration: durationSec
          },
          { headers, timeout: 10000 }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] Call error: ${err.message}`);
    }

    return { success: true, duration: durationSec };
  }
}
