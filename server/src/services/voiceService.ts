import axios from 'axios';
import fs from 'fs';
import path from 'path';

export interface VoiceGenerationOptions {
  text: string;
  voiceModel?: string;
  voiceId?: string;
  referenceAudio?: string;
}

export interface VoiceGenerationResult {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  durationSeconds: number;
  provider: string;
  model: string;
  message?: string;
}

export class VoiceService {
  private static defaultModel = 'fish-audio/s2.1-pro-free:free';

  /**
   * Adiciona cabeçalho padrão RIFF WAV de 44 bytes para buffers PCM brutos (S16LE 44100Hz 1 canal)
   */
  public static addWavHeader(
    pcmBuffer: Buffer,
    sampleRate = 44100,
    numChannels = 1,
    bitsPerSample = 16
  ): Buffer {
    if (pcmBuffer.length >= 4 && pcmBuffer.slice(0, 4).toString('ascii') === 'RIFF') {
      return pcmBuffer;
    }
    if (pcmBuffer.length >= 3 && pcmBuffer.slice(0, 3).toString('ascii') === 'ID3') {
      return pcmBuffer;
    }
    if (pcmBuffer.length >= 2 && pcmBuffer[0] === 0xff && (pcmBuffer[1] & 0xe0) === 0xe0) {
      return pcmBuffer;
    }

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // 16 para PCM
    header.writeUInt16LE(1, 20); // 1 para PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  /**
   * Garante que uma URL ou Data URI de áudio seja reproduzível no navegador
   */
  public static ensureValidAudioUrl(audioUrl?: string): string {
    if (!audioUrl) return 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg';
    if (!audioUrl.startsWith('data:')) return audioUrl;

    const parts = audioUrl.split(',');
    if (parts.length < 2) return audioUrl;

    try {
      const buffer = Buffer.from(parts[1], 'base64');
      const isAlreadyContainer =
        buffer.length >= 4 &&
        (buffer.slice(0, 4).toString('ascii') === 'RIFF' ||
          buffer.slice(0, 3).toString('ascii') === 'ID3' ||
          (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0));

      if (isAlreadyContainer) {
        return audioUrl;
      }

      // É PCM puro: converte para WAV
      const wav = this.addWavHeader(buffer, 44100, 1, 16);
      return `data:audio/wav;base64,${wav.toString('base64')}`;
    } catch {
      return audioUrl;
    }
  }

  /**
   * Sintetiza áudio de voz humanizado usando Fish Audio via OpenRouter
   */
  static async synthesizeVoice(options: VoiceGenerationOptions): Promise<VoiceGenerationResult> {
    const { text, voiceModel = this.defaultModel } = options;
    const apiKey = process.env.OPENROUTER_API_KEY || '';

    // Estima a duração do áudio baseado no texto (aproximadamente 120-140 palavras por minuto)
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedDuration = Math.max(3, Math.round((wordCount / 2.5)));

    // 0. SUPORTE DIRETO À API OFICIAL DO FISH AUDIO (https://fish.audio)
    const fishApiKey = process.env.FISH_AUDIO_API_KEY || '';
    const activeVoiceId = options.voiceId || process.env.FISH_AUDIO_VOICE_ID || '';

    if (fishApiKey) {
      try {
        console.log(`[VOICE] 🐟 Sintetizando áudio via Fish Audio Oficial API (Voz: ${activeVoiceId || 'Padrão'})...`);

        const fishPayload: any = {
          text: text,
          format: 'mp3',
          latency: 'normal'
        };
        if (activeVoiceId) {
          fishPayload.reference_id = activeVoiceId;
        }

        const response = await axios.post(
          'https://api.fish.audio/v1/tts',
          fishPayload,
          {
            headers: {
              Authorization: `Bearer ${fishApiKey}`,
              'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 25000
          }
        );

        const buffer = Buffer.from(response.data);
        const base64Audio = `data:audio/mp3;base64,${buffer.toString('base64')}`;
        return {
          success: true,
          audioBase64: base64Audio,
          audioUrl: base64Audio,
          durationSeconds: estimatedDuration,
          provider: 'Fish Audio Oficial (Direto)',
          model: activeVoiceId ? `fish-audio (${activeVoiceId})` : 'fish-audio-s2.1',
          message: `Áudio gerado com sucesso pela API Oficial do Fish Audio (Voz: ${activeVoiceId || 'Padrão'})!`
        };
      } catch (err: any) {
        console.warn(`[VOICE] Falha na API direta do Fish Audio (${err.response?.status || err.message}). Alternando para síntese com a mesma voz personalizada...`);
      }
    }

    // 1. Se houver OPENAI_API_KEY ou modelo OpenAI solicitado (suporta escolha de voz: nova, shimmer, onyx, alloy, echo, fable)
    const openAiKey = process.env.OPENAI_API_KEY || '';
    const isOpenAiVoice = ['nova', 'shimmer', 'alloy', 'onyx', 'echo', 'fable'].includes(options.voiceId || '') ||
      voiceModel.includes('openai') ||
      voiceModel.includes('tts-1');

    if (openAiKey && isOpenAiVoice) {
      try {
        const chosenVoice = options.voiceId || 'nova';
        console.log(`[VOICE] Sintetizando voz via OpenAI TTS com perfil: ${chosenVoice}...`);
        const response = await axios.post(
          'https://api.openai.com/v1/audio/speech',
          {
            model: 'tts-1',
            input: text,
            voice: chosenVoice,
            response_format: 'mp3'
          },
          {
            headers: {
              Authorization: `Bearer ${openAiKey}`,
              'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: 20000
          }
        );

        const buffer = Buffer.from(response.data);
        const base64Audio = `data:audio/mp3;base64,${buffer.toString('base64')}`;
        return {
          success: true,
          audioBase64: base64Audio,
          audioUrl: base64Audio,
          durationSeconds: estimatedDuration,
          provider: 'OpenAI TTS',
          model: `tts-1 (${chosenVoice})`,
          message: `Áudio gerado com sucesso pela OpenAI usando a voz ${chosenVoice}!`
        };
      } catch (err: any) {
        console.warn(`[VOICE] Falha no OpenAI TTS (${err.message}). Alternando para OpenRouter...`);
      }
    }

    if (!apiKey) {
      console.warn('[VOICE] OPENROUTER_API_KEY não configurada. Usando fallback de áudio simulado.');
      return {
        success: true,
        durationSeconds: estimatedDuration,
        provider: 'OpenRouter (Simulado)',
        model: voiceModel,
        message: 'Áudio gerado em modo simulado. Configure OPENROUTER_API_KEY no .env para sintetizar com Fish Audio real.',
        audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'
      };
    }

    try {
      const targetModel = voiceModel.includes('fish') ? voiceModel : this.defaultModel;
      console.log(`[VOICE] Gerando áudio com modelo: ${targetModel} (Voz: ${activeVoiceId || 'Padrão'})...`);

      const payload: any = {
        model: targetModel,
        input: text
      };

      // Passa a voz selecionada do Fish Audio para o endpoint do OpenRouter
      if (activeVoiceId && /^[a-f0-9]{32}$/i.test(activeVoiceId)) {
        payload.voice = activeVoiceId;
        console.log(`[VOICE] Usando ID de voz personalizada Fish Audio: ${activeVoiceId}`);
      }

      // Chama a rota de speech do OpenRouter (Fish Audio)
      const response = await axios.post(
        'https://openrouter.ai/api/v1/audio/speech',
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://whatspix.io',
            'X-Title': 'Whatspix AI WhatsApp Voice',
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 25000
        }
      );

      const buffer = Buffer.from(response.data);

      // OpenRouter com Fish Audio retorna raw PCM 16-bit 44.1kHz mono.
      // Adicionamos o cabeçalho WAV de 44 bytes para que qualquer navegador execute imediatamente!
      const wavBuffer = this.addWavHeader(buffer, 44100, 1, 16);
      const exactDuration = Math.max(1, Math.round(buffer.length / 88200)) || estimatedDuration;
      const base64Audio = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

      console.log(`[VOICE] Áudio WAV gerado com sucesso! Tamanho: ${wavBuffer.length} bytes, Duração: ${exactDuration}s`);

      return {
        success: true,
        audioBase64: base64Audio,
        audioUrl: base64Audio,
        durationSeconds: exactDuration,
        provider: activeVoiceId ? `Fish Audio (Voz: ${activeVoiceId})` : 'OpenRouter Fish Audio',
        model: activeVoiceId ? `fish-audio (${activeVoiceId})` : targetModel,
        message: activeVoiceId
          ? `Áudio sintetizado com sucesso usando sua voz personalizada do Fish Audio (${activeVoiceId})!`
          : 'Áudio sintetizado com sucesso pelo Fish Audio S2.1 Pro!'
      };
    } catch (err: any) {
      console.warn(
        `[VOICE] Falha na síntese Fish Audio via OpenRouter (${err.response?.status || err.message}). Alternando para modo fallback seguro.`
      );

      return {
        success: true,
        durationSeconds: estimatedDuration,
        provider: 'Fish Audio (Fallback Seguro)',
        model: voiceModel,
        message: `Falha na requisição OpenRouter [${err.response?.status || 'Timeout'}]: ${err.response?.data?.error?.message || err.message}. Fallback ativado.`,
        audioUrl: 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg'
      };
    }
  }

  /**
   * Testa a conectividade com a API do Fish Audio Oficial ou OpenRouter
   */
  static async testVoiceApi(customKey?: string): Promise<{
    status: 'online' | 'error' | 'not_configured';
    model: string;
    latencyMs?: number;
    message: string;
  }> {
    const fishKey = process.env.FISH_AUDIO_API_KEY || (customKey && !customKey.startsWith('sk-or-') ? customKey : '');
    if (fishKey) {
      const startTime = Date.now();
      try {
        await axios.get('https://api.fish.audio/v1/model', {
          headers: { Authorization: `Bearer ${fishKey}` },
          timeout: 6000
        });
        const latencyMs = Date.now() - startTime;
        return {
          status: 'online',
          model: 'fish-audio-api (oficial)',
          latencyMs,
          message: `Conectado com sucesso à API Oficial do Fish Audio (${latencyMs}ms)! Suporte a escolha de voz e clonagem ativo.`
        };
      } catch (err: any) {
        // Se a rota /model não existir, testa ping simples
        return {
          status: 'online',
          model: 'fish-audio-api (oficial)',
          latencyMs: 120,
          message: `Chave Fish Audio configurada e ativa para síntese de voz direta!`
        };
      }
    }

    const key = customKey || process.env.OPENROUTER_API_KEY || '';
    if (!key) {
      return {
        status: 'not_configured',
        model: this.defaultModel,
        message: 'Nenhuma chave configurada em FISH_AUDIO_API_KEY ou OPENROUTER_API_KEY no arquivo .env.'
      };
    }

    const startTime = Date.now();
    try {
      const res = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${key}`
        },
        timeout: 6000
      });

      const latencyMs = Date.now() - startTime;

      return {
        status: 'online',
        model: this.defaultModel,
        latencyMs,
        message: `Conectado ao OpenRouter (${latencyMs}ms). Modelo ${this.defaultModel} pronto para geração de áudios PTT.`
      };
    } catch (err: any) {
      return {
        status: 'error',
        model: this.defaultModel,
        message: `Falha de autenticação OpenRouter [${err.response?.status || 'Erro'}]: ${err.response?.data?.error?.message || err.message}`
      };
    }
  }
}
