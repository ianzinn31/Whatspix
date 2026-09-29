import { MetaAdsMetric } from '../types/index.js';
import { db } from '../store/db.js';

export class MetaAdsService {
  /**
   * Retorna campanhas e métricas de anúncios com ROAS calculado
   */
  static getCampaigns(): MetaAdsMetric[] {
    return db.metaCampaigns;
  }

  /**
   * Adiciona ou atualiza gasto de campanha
   */
  static updateCampaignSpend(campaignId: string, additionalSpend: number, additionalRevenue: number): MetaAdsMetric | undefined {
    const camp = db.metaCampaigns.find((c) => c.campaignId === campaignId);
    if (camp) {
      camp.spend += additionalSpend;
      camp.revenue += additionalRevenue;
      camp.roas = camp.spend > 0 ? parseFloat((camp.revenue / camp.spend).toFixed(2)) : 0;
      return camp;
    }
    return undefined;
  }

  /**
   * Dispara evento de Conversão CAPI (Meta Conversions API) para o Pixel do Facebook
   * Eventos: Lead, InitiateCheckout (PIX gerado), Purchase (PIX pago)
   */
  static async sendMetaConversionEvent(
    eventName: 'Lead' | 'InitiateCheckout' | 'Purchase',
    userData: { phone: string; email?: string; name?: string },
    customData: { value: number; currency: string; content_name: string }
  ): Promise<{ success: boolean; eventId: string; status: string }> {
    const eventId = `meta-capi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    console.log(`[META CAPI] Evento enviado: ${eventName} | Valor: R$ ${customData.value} | Phone: ${userData.phone}`);

    // Em produção com chave Meta:
    // axios.post(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, payload)

    return {
      success: true,
      eventId,
      status: `Disparado com sucesso para o Pixel Meta Ads (Evento: ${eventName})`
    };
  }
}
