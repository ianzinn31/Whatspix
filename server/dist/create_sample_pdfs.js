import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filesDir = path.resolve(__dirname, '../../data/files');
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}
function createMinimalPdf(title, text) {
    const content = `BT /F1 18 Tf 50 720 Td (${title}) Tj ET BT /F1 12 Tf 50 670 Td (${text}) Tj ET`;
    const len = Buffer.byteLength(content);
    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${len} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;
    return Buffer.from(pdf);
}
const samplePdfs = [
    {
        name: 'COBERTURAS PORCELANA.pdf',
        title: 'Guia Mestre de Coberturas de Porcelana',
        text: 'Apostila Completa com formulas, dosagens e acabamento perfeito sem rachaduras.'
    },
    {
        name: 'BRIGADEIRO SEM FOGO.pdf',
        title: 'Receitas de Brigadeiro Sem Fogo',
        text: 'Metodo rapido e lucrativo para preparar brigadeiros gourmet em minutos.'
    },
    {
        name: 'RECHEIO SEM FOGO.pdf',
        title: 'Recheios Estruturados Sem Fogo',
        text: 'Estruturas firmes para bolos de andar com ponto de corte perfeito.'
    },
    {
        name: 'COMO VENDER.pdf',
        title: 'Manual de Vendas no WhatsApp',
        text: 'Scripts de vendas e quebra de objecoes para faturar alto todos os dias.'
    }
];
for (const p of samplePdfs) {
    const filePath = path.join(filesDir, p.name);
    fs.writeFileSync(filePath, createMinimalPdf(p.title, p.text));
    console.log(`📄 Arquivo PDF criado com sucesso: ${filePath}`);
}
console.log('✅ Todos os 4 arquivos PDFs do funil foram gerados com sucesso!');
process.exit(0);
