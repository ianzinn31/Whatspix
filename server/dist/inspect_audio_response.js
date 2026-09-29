import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
async function inspectSpeech() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('API Key exists:', !!apiKey);
    const res = await axios.post('https://openrouter.ai/api/v1/audio/speech', {
        model: 'fish-audio/s2.1-pro-free:free',
        input: 'Teste de áudio.'
    }, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
    });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    const buf = Buffer.from(res.data);
    console.log('Length:', buf.length);
    console.log('First 32 bytes hex:', buf.slice(0, 32).toString('hex'));
}
inspectSpeech().catch((err) => console.error(err.response?.data?.toString() || err.message));
