import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
function addWavHeader(pcmBuffer, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcmBuffer]);
}
async function testWav() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const res = await axios.post('https://openrouter.ai/api/v1/audio/speech', {
        model: 'fish-audio/s2.1-pro-free:free',
        input: 'Olá Alexandre, passando para confirmar sua inscrição no curso de Canva Pro.'
    }, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
    });
    const rawPcm = Buffer.from(res.data);
    const wavBuffer = addWavHeader(rawPcm, 44100, 1, 16);
    console.log('Raw PCM length:', rawPcm.length);
    console.log('WAV Buffer length:', wavBuffer.length);
    console.log('First 44 bytes string:', wavBuffer.slice(0, 44).toString('binary'));
    console.log('WAV RIFF marker:', wavBuffer.slice(0, 4).toString('ascii'));
    console.log('WAV WAVE marker:', wavBuffer.slice(8, 12).toString('ascii'));
    console.log('WAV fmt marker:', wavBuffer.slice(12, 16).toString('ascii'));
    console.log('WAV data marker:', wavBuffer.slice(36, 40).toString('ascii'));
    const dataUri = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
    console.log('Data URI start:', dataUri.slice(0, 50));
    console.log('Calculated duration seconds:', (rawPcm.length / (44100 * 2)).toFixed(2));
}
testWav().catch(console.error);
