import dotenv from 'dotenv';
dotenv.config();
import { VoiceService } from './services/voiceService.js';
async function test() {
    console.log('Testing VoiceService.synthesizeVoice...');
    const res = await VoiceService.synthesizeVoice({
        text: 'Olá, este é um teste de áudio gravado no WhatsApp pelo Fish Audio.',
        voiceModel: 'fish-audio/s2.1-pro-free:free'
    });
    console.log('Success:', res.success);
    console.log('Duration:', res.durationSeconds);
    console.log('Provider:', res.provider);
    console.log('AudioUrl length:', res.audioUrl?.length);
    console.log('AudioUrl sample:', res.audioUrl?.slice(0, 100));
    if (res.audioUrl && res.audioUrl.startsWith('data:')) {
        const base64Data = res.audioUrl.split(',')[1];
        const buf = Buffer.from(base64Data, 'base64');
        console.log('Decoded buffer size in bytes:', buf.length);
        console.log('First 64 bytes as hex:', buf.slice(0, 64).toString('hex'));
        console.log('First 64 bytes as utf-8:', buf.slice(0, 64).toString('utf-8'));
        // Check if it's actually an MP3 or OGG or WAV or JSON error!
        if (buf.toString('utf-8').trim().startsWith('{') || buf.toString('utf-8').trim().startsWith('<')) {
            console.error('ERROR: Returned data is text/html/json, NOT audio binary!');
            console.log('Content:', buf.toString('utf-8'));
        }
    }
}
test().catch(console.error);
