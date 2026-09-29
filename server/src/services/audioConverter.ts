import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface ProcessedAudioResult {
  base64?: string;
  fullUrl?: string;
  mimetype: string;
  filename: string;
  isOggOpus: boolean;
}

export class AudioConverter {
  /**
   * Verifica se o buffer inicia com o cabeçalho 'OggS' característico do container Ogg
   */
  public static isOggContainer(buf: Buffer): boolean {
    if (!buf || buf.length < 4) return false;
    return buf.slice(0, 4).toString('ascii') === 'OggS';
  }

  /**
   * Converte qualquer áudio (WAV, MP3, AAC, PCM) para OGG OPUS via ffmpeg em memória.
   * OGG Opus é o formato obrigatório do WhatsApp para mensagens de voz (PTT / Voice Notes)
   * com waveform e reprodução garantida em todos os smartphones (Android/iOS).
   */
  public static async convertToOggOpus(inputBuffer: Buffer): Promise<Buffer> {
    if (this.isOggContainer(inputBuffer)) {
      return inputBuffer;
    }

    return new Promise((resolve) => {
      try {
        const ffmpeg = spawn('ffmpeg', [
          '-hide_banner',
          '-loglevel', 'error',
          '-i', 'pipe:0',
          '-c:a', 'libopus',
          '-b:a', '64k',
          '-vbr', 'on',
          '-application', 'voip',
          '-f', 'ogg',
          'pipe:1'
        ]);

        const chunks: Buffer[] = [];
        let errorOutput = '';

        ffmpeg.stdout.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        ffmpeg.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        ffmpeg.on('error', (err) => {
          console.warn('[AudioConverter] FFmpeg não disponível ou erro ao executar:', err.message);
          resolve(inputBuffer);
        });

        ffmpeg.on('close', (code) => {
          if (code === 0 && chunks.length > 0) {
            const outBuf = Buffer.concat(chunks);
            if (AudioConverter.isOggContainer(outBuf)) {
              console.log(`[AudioConverter] ✅ Áudio convertido com sucesso para OGG Opus (${outBuf.length} bytes)`);
              resolve(outBuf);
              return;
            }
          }
          if (errorOutput) {
            console.warn('[AudioConverter] Aviso de conversão FFmpeg:', errorOutput);
          }
          resolve(inputBuffer);
        });

        ffmpeg.stdin.on('error', (err) => {
          console.warn('[AudioConverter] Erro no pipe stdin do FFmpeg:', err.message);
          resolve(inputBuffer);
        });

        ffmpeg.stdin.write(inputBuffer);
        ffmpeg.stdin.end();
      } catch (err: any) {
        console.warn('[AudioConverter] Exceção ao invocar FFmpeg:', err.message);
        resolve(inputBuffer);
      }
    });
  }

  /**
   * Resolve e processa uma fonte de áudio (data URI, URL relativa ou externa)
   * garantindo que o WAHA e o WhatsApp recebam o áudio em formato compatível com Voice Note (PTT).
   */
  public static async processAudioForWhatsApp(audioSource: string): Promise<ProcessedAudioResult> {
    const defaultMime = 'audio/ogg; codecs=opus';
    const filename = 'voice.ogg';

    if (!audioSource) {
      return { mimetype: defaultMime, filename, isOggOpus: false };
    }

    // 1. DATA URI (ex: data:audio/wav;base64,... ou data:audio/ogg;base64,...)
    if (audioSource.startsWith('data:')) {
      const parts = audioSource.split(',');
      if (parts.length >= 2) {
        try {
          const rawBuf = Buffer.from(parts[1], 'base64');
          const opusBuf = await this.convertToOggOpus(rawBuf);
          const isOpus = this.isOggContainer(opusBuf);
          return {
            base64: opusBuf.toString('base64'),
            mimetype: defaultMime,
            filename,
            isOggOpus: isOpus
          };
        } catch (e: any) {
          console.warn('[AudioConverter] Erro ao decodificar base64 data URI:', e.message);
          return {
            base64: parts[1],
            mimetype: defaultMime,
            filename,
            isOggOpus: false
          };
        }
      }
    }

    // 2. CAMINHO RELATIVO LOCAL (ex: /audios/1.ogg ou audios/exemplo.mp3)
    if (audioSource.startsWith('/') || audioSource.startsWith('audios/')) {
      const cleanPath = audioSource.replace(/^\/+/, '');
      const candidates = [
        path.resolve(process.cwd(), cleanPath),
        path.resolve(process.cwd(), 'data', cleanPath),
        path.resolve(process.cwd(), 'server', 'data', cleanPath),
        path.resolve(process.cwd(), '..', cleanPath),
        path.resolve(process.cwd(), '..', 'data', cleanPath)
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          try {
            console.log(`[AudioConverter] Lendo arquivo de áudio do disco: ${cand}`);
            const fileBuf = fs.readFileSync(cand);
            const opusBuf = await this.convertToOggOpus(fileBuf);
            return {
              base64: opusBuf.toString('base64'),
              mimetype: defaultMime,
              filename,
              isOggOpus: this.isOggContainer(opusBuf)
            };
          } catch (e: any) {
            console.warn(`[AudioConverter] Falha ao ler arquivo local ${cand}:`, e.message);
          }
        }
      }

      // Se não encontrou o arquivo localmente, constrói URL pública absoluta
      const baseUrl = process.env.API_BASE_URL || 'https://deskcom.kingstart.online';
      const fullUrl = `${baseUrl.replace(/\/+$/, '')}/${cleanPath}`;
      return {
        fullUrl,
        mimetype: defaultMime,
        filename,
        isOggOpus: false
      };
    }

    // 3. URL ABSOLUTA HTTP / HTTPS
    if (audioSource.startsWith('http://') || audioSource.startsWith('https://')) {
      return {
        fullUrl: audioSource,
        mimetype: defaultMime,
        filename,
        isOggOpus: false
      };
    }

    // 4. STRING BASE64 PURA (sem data URI prefix)
    if (audioSource.length > 200 && /^[A-Za-z0-9+/=]+$/.test(audioSource.trim().substring(0, 100))) {
      try {
        const rawBuf = Buffer.from(audioSource.trim(), 'base64');
        const opusBuf = await this.convertToOggOpus(rawBuf);
        return {
          base64: opusBuf.toString('base64'),
          mimetype: defaultMime,
          filename,
          isOggOpus: this.isOggContainer(opusBuf)
        };
      } catch {}
    }

    return {
      fullUrl: audioSource,
      mimetype: defaultMime,
      filename,
      isOggOpus: false
    };
  }
}
