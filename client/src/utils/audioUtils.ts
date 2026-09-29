/**
 * Utilitário de Áudio para o WhatsPix
 * Garante que qualquer áudio gerado pelo Fish Audio (PCM ou WAV) seja 100% reproduzível
 * no navegador sem erros de codec ou MediaError.
 */

// Cache de Blob URLs para não recriar desnecessariamente
const blobUrlCache = new Map<string, string>();

/**
 * Garante que uma URL ou Data URI de áudio possua um container WAV válido.
 * Se for PCM puro retornado pelo OpenRouter, adiciona o cabeçalho RIFF WAV de 44 bytes.
 */
export function ensurePlayableAudioUrl(url: string | undefined | null): string {
  if (!url) {
    return 'https://actions.google.com/sounds/v1/speech/greeting_male.ogg';
  }

  // Se já for URL HTTP normal ou Blob URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }

  if (!url.startsWith('data:')) {
    return url;
  }

  // Verifica cache
  if (blobUrlCache.has(url)) {
    return blobUrlCache.get(url)!;
  }

  const parts = url.split(',');
  if (parts.length < 2) return url;
  const base64 = parts[1];

  try {
    const rawBinary = atob(base64);

    // Se já começar com "RIFF" (WAV) ou "ID3" (MP3 com tags), está pronto!
    if (rawBinary.startsWith('RIFF') || rawBinary.startsWith('ID3')) {
      const bytes = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) {
        bytes[i] = rawBinary.charCodeAt(i);
      }
      const mime = rawBinary.startsWith('RIFF') ? 'audio/wav' : 'audio/mp3';
      const blob = new Blob([bytes], { type: mime });
      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(url, objectUrl);
      return objectUrl;
    }

    // Verifica se é MP3 com frame sync (0xFF 0xFB ou 0xFF 0xF3 etc.)
    if (rawBinary.length >= 2) {
      const b0 = rawBinary.charCodeAt(0);
      const b1 = rawBinary.charCodeAt(1);
      if (b0 === 0xff && (b1 & 0xe0) === 0xe0) {
        const bytes = new Uint8Array(rawBinary.length);
        for (let i = 0; i < rawBinary.length; i++) {
          bytes[i] = rawBinary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const objectUrl = URL.createObjectURL(blob);
        blobUrlCache.set(url, objectUrl);
        return objectUrl;
      }
    }

    // É PCM 16-bit 44.1kHz mono retornado pelo Fish Audio. Constrói cabeçalho WAV de 44 bytes!
    const pcmBytes = new Uint8Array(rawBinary.length);
    for (let i = 0; i < rawBinary.length; i++) {
      pcmBytes[i] = rawBinary.charCodeAt(i);
    }

    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBytes.length;

    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // RIFF chunk descriptor
    view.setUint8(0, 82); view.setUint8(1, 73); view.setUint8(2, 70); view.setUint8(3, 70); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint8(8, 87); view.setUint8(9, 65); view.setUint8(10, 86); view.setUint8(11, 69); // "WAVE"

    // fmt sub-chunk
    view.setUint8(12, 102); view.setUint8(13, 109); view.setUint8(14, 116); view.setUint8(15, 32); // "fmt "
    view.setUint32(16, 16, true); // tamanho do subchunk
    view.setUint16(20, 1, true); // formato 1 = PCM linear
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    view.setUint8(36, 100); view.setUint8(37, 97); view.setUint8(38, 116); view.setUint8(39, 97); // "data"
    view.setUint32(40, dataSize, true);

    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(pcmBytes, 44);

    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    const objectUrl = URL.createObjectURL(blob);
    blobUrlCache.set(url, objectUrl);
    return objectUrl;
  } catch (err) {
    console.warn('[AudioUtils] Falha ao processar áudio base64:', err);
    return url;
  }
}
