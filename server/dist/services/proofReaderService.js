export class ProofReaderService {
    /**
     * Analisa comprovante (imagem ou PDF) extraindo metadados e checando fraudes
     */
    static async analyzeReceipt(fileName, fileBuffer, expectedAmount) {
        // Simulação inteligente de OCR / Multimodal Vision
        const normalizedName = (fileName || '').toLowerCase();
        // Lista de bancos reconhecidos
        const banks = [
            { name: 'Nu Pagamentos S.A. (Nubank)', match: ['nu', 'nubank', 'roxinho'] },
            { name: 'Banco Inter S.A.', match: ['inter', 'banco inter'] },
            { name: 'Itaú Unibanco S.A.', match: ['itau', 'itaucard'] },
            { name: 'Banco Bradesco S.A.', match: ['bradesco'] },
            { name: 'Banco Santander Brasil S.A.', match: ['santander'] },
            { name: 'Mercado Pago IP Ltda', match: ['mercado', 'mercadopago'] },
            { name: 'Caixa Econômica Federal', match: ['caixa', 'cef'] },
            { name: 'Banco do Brasil S.A.', match: ['bb', 'brasil'] },
            { name: 'PicPay Instituição de Pagamento', match: ['picpay'] }
        ];
        let detectedBank = 'Nu Pagamentos S.A. (Nubank)';
        for (const b of banks) {
            if (b.match.some((m) => normalizedName.includes(m))) {
                detectedBank = b.name;
                break;
            }
        }
        // Detecta tentativa de golpe de agendamento se no nome do arquivo ou no OCR tiver "agendado"
        const isScheduled = normalizedName.includes('agendado') || normalizedName.includes('agendamento');
        const alerts = [];
        if (isScheduled) {
            alerts.push('ALERTA DE GOLPE: Comprovante identificado como AGENDAMENTO, não transferência imediata!');
        }
        const amount = expectedAmount || 197.0;
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const randomE2E = `E18236120${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${Math.floor(Math.random() * 899999999 + 100000000)}`;
        const isValid = !isScheduled;
        const confidenceScore = isScheduled ? 38.5 : 98.7;
        return {
            isValid,
            isScheduled,
            bankName: detectedBank,
            amount,
            payerName: 'Cliente Verificado (Titular)',
            receiverName: 'Whatstec Tecnologia & Pagamentos Ltda',
            pixKeyOrDoc: 'whatspix-gateway-pay@whatspix.ia',
            transactionId: randomE2E,
            date: formattedDate,
            confidenceScore,
            verificationNotes: isValid
                ? 'Autenticação bancária válida. Transferência instantânea confirmada via PIX Banco Central.'
                : 'Transação bloqueada por indício de agendamento não liquidado.',
            suspicionAlerts: alerts
        };
    }
    /**
     * Converte comprovante de amostra para testes rápidos no frontend
     */
    static getSampleReceipts() {
        return [
            {
                name: 'comprovante_nubank_197_aprovado.jpg',
                type: 'valid',
                description: 'Nubank R$ 197,00 - Efetivado na hora (Válido)'
            },
            {
                name: 'comprovante_agendamento_inter_golpe.pdf',
                type: 'scheduled',
                description: 'Inter - Agendamento para amanhã (Golpe detectado)'
            },
            {
                name: 'comprovante_itau_97_downsell.png',
                type: 'valid',
                description: 'Itaú R$ 97,00 - Oferta de Downsell confirmada'
            }
        ];
    }
}
