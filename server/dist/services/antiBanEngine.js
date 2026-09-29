export class AntiBanEngine {
    /**
     * Resolve Spintax format: {Olá|Oi|E aí} tudo bem?
     */
    static processSpintax(text) {
        const spintaxRegex = /\{([^{}]+)\}/g;
        let result = text;
        while (spintaxRegex.test(result)) {
            result = result.replace(spintaxRegex, (_, choices) => {
                const options = choices.split('|');
                return options[Math.floor(Math.random() * options.length)];
            });
        }
        return result;
    }
    /**
     * Calcula delay de digitação humanizada em milissegundos
     */
    static calculateTypingDelay(text, config) {
        const charCount = text.length;
        // Human average: ~50ms por caractere com jitter
        const minSpeed = config.typingSpeedMinMs || 40;
        const maxSpeed = config.typingSpeedMaxMs || 85;
        const randomSpeed = Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
        // Pequena pausa inicial de "pensamento" (500ms a 1500ms)
        const thinkingPause = Math.floor(Math.random() * 1000) + 500;
        const calculated = thinkingPause + (charCount * randomSpeed);
        // Limite mínimo de 1.5s e máximo de 10s para não travar a conversa
        return Math.min(Math.max(calculated, 1500), 10000);
    }
    /**
     * Calcula tempo de simulação de "gravando áudio..."
     */
    static calculateAudioRecordingDelay(audioDurationSec) {
        // Simula gravação real + 500ms de preparação
        return (audioDurationSec * 1000) + 500;
    }
    /**
     * Intervalo randômico entre mensagens sequenciais (jitter)
     */
    static getRandomInterval(config) {
        const min = config.randomIntervalMinSec || 5;
        const max = config.randomIntervalMaxSec || 15;
        const seconds = Math.floor(Math.random() * (max - min + 1)) + min;
        return seconds * 1000;
    }
    /**
     * Calcula limite diário com base no dia da esteira de aquecimento (Warmup)
     */
    static getWarmupDailyLimit(day) {
        if (day <= 1)
            return 15;
        if (day <= 3)
            return 25;
        if (day <= 5)
            return 45;
        if (day <= 7)
            return 70;
        if (day <= 10)
            return 120;
        if (day <= 14)
            return 200;
        if (day <= 21)
            return 350;
        return 600; // Totalmente aquecido
    }
    /**
     * Avalia a pontuação de saúde e risco de banimento (0 a 100)
     */
    static calculateHealthScore(instance, metrics) {
        let score = 100;
        const recs = [];
        // Limites diários
        const limit = instance.antiBanConfig.warmupModeActive
            ? this.getWarmupDailyLimit(instance.warmupDay)
            : instance.antiBanConfig.dailyLimit;
        if (metrics.messagesSent > limit) {
            score -= 35;
            recs.push(`Limite diário excedido (${metrics.messagesSent}/${limit}). Reduza os disparos.`);
        }
        else if (metrics.messagesSent > limit * 0.85) {
            score -= 15;
            recs.push('Próximo ao teto diário seguro.');
        }
        // Taxa de resposta dos leads (quanto mais leads respondem, menor o risco de ban)
        if (metrics.replyRatePercent < 20) {
            score -= 30;
            recs.push('Baixa taxa de resposta (<20%). Leads podem estar marcando como Spam.');
        }
        else if (metrics.replyRatePercent < 40) {
            score -= 10;
            recs.push('Taxa de resposta moderada. Aprimore o gancho da 1ª mensagem.');
        }
        // Denúncias de spam detectadas
        if (metrics.blockedReportsCount > 0) {
            score -= metrics.blockedReportsCount * 25;
            recs.push(`Alerta: ${metrics.blockedReportsCount} bloqueios/denúncias recentes detectados!`);
        }
        score = Math.max(0, Math.min(100, score));
        let level = 'safe';
        if (score < 50)
            level = 'danger';
        else if (score < 80)
            level = 'caution';
        return {
            score,
            level,
            recommendations: recs.length > 0 ? recs : ['Instância operando dentro dos parâmetros de máxima segurança.']
        };
    }
}
