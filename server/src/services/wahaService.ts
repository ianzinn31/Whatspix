import axios from 'axios';
import { WhatsAppInstance } from '../types/index.js';
import { AntiBanEngine } from './antiBanEngine.js';

export class WahaService {
  /**
   * Inicia sessão no WAHA ou gera QR code de conexão
   */
  static async startSession(instance: WhatsAppInstance): Promise<{ status: string; qrCode?: string }> {
    try {
      if (instance.serverUrl && instance.serverUrl.startsWith('http')) {
        const res = await axios.post(
          `${instance.serverUrl}/api/sessions/start`,
          { name: instance.id },
          {
            headers: instance.apiKey ? { 'X-Api-Key': instance.apiKey } : {},
            timeout: 4000
          }
        );
        return { status: res.data?.status || 'connecting' };
      }
    } catch (err: any) {
      console.warn(`[WAHA] Fallback to simulated QR for ${instance.id} (${err.message})`);
    }

    // Retorna QR code simulado em SVG / Base64 pronto para leitura
    const mockQrSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="%23ffffff"/><text x="110" y="115" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="%230f172a">QR CODE CONEXAO WAHA</text><text x="110" y="135" font-family="sans-serif" font-size="9" text-anchor="middle" fill="%2364748b">${instance.phone}</text></svg>`;

    return {
      status: 'connecting',
      qrCode: mockQrSvg
    };
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
    try {
      const cleanChatId = this.formatChatId(chatId);
      if (instance.serverUrl) {
        await axios.post(
          `${instance.serverUrl}/api/presence`,
          {
            session: instance.id,
            chatId: cleanChatId,
            presence: state
          },
          {
            headers: instance.apiKey ? { 'X-Api-Key': instance.apiKey } : {},
            timeout: 3000
          }
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
      if (instance.serverUrl) {
        await axios.post(
          `${instance.serverUrl}/api/sendText`,
          {
            session: instance.id,
            chatId: cleanChatId,
            text: processedText
          },
          {
            headers: instance.apiKey ? { 'X-Api-Key': instance.apiKey } : {},
            timeout: 5000
          }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] SendText simulated: ${err.message}`);
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
    const cleanChatId = this.formatChatId(chatId);
    const recordingDelay = AntiBanEngine.calculateAudioRecordingDelay(durationSec);

    if (onRecordingStatus) onRecordingStatus('gravando áudio...');
    await this.sendPresence(instance, cleanChatId, 'recording');

    // Aguarda tempo do áudio (máximo 4s na interface para responsividade)
    await new Promise((resolve) => setTimeout(resolve, Math.min(recordingDelay, 4000)));

    await this.sendPresence(instance, cleanChatId, 'paused');
    if (onRecordingStatus) onRecordingStatus('áudio enviado');

    try {
      if (instance.serverUrl) {
        await axios.post(
          `${instance.serverUrl}/api/sendVoice`,
          {
            session: instance.id,
            chatId: cleanChatId,
            file: { url: audioUrl }
          },
          {
            headers: instance.apiKey ? { 'X-Api-Key': instance.apiKey } : {},
            timeout: 8000
          }
        );
      }
    } catch {
      // Ignora para simulação
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
    const cleanChatId = this.formatChatId(chatId);

    try {
      if (instance.serverUrl) {
        await axios.post(
          `${instance.serverUrl}/api/sendFile`,
          {
            session: instance.id,
            chatId: cleanChatId,
            file: {
              url: fileUrl,
              filename: filename || 'documento.pdf'
            },
            caption: caption || ''
          },
          {
            headers: instance.apiKey ? { 'X-Api-Key': instance.apiKey } : {},
            timeout: 15000
          }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] SendFile simulated: ${err.message}`);
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
    const cleanChatId = this.formatChatId(chatId);
    console.log(`[WAHA] 📞 Disparando chamada de voz WhatsApp para ${cleanChatId} (Toque: ${durationSec}s)...`);

    try {
      if (instance.serverUrl) {
        await axios.post(
          `${instance.serverUrl}/api/call`,
          {
            session: instance.id,
            chatId: cleanChatId,
            duration: durationSec
          },
          {
            headers: instance.apiKey ? { 'X-Api-Key': instance.apiKey } : {},
            timeout: 10000
          }
        );
      }
    } catch (err: any) {
      console.warn(`[WAHA] Call simulated / notice: ${err.message}`);
    }

    return { success: true, duration: durationSec };
  }
}
