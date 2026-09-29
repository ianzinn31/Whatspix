import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SalesFunnel } from '../types/index.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabaseServer: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (isServerSupabaseConfigured) {
  console.log('✅ Supabase conectado com sucesso no servidor!');
} else {
  console.log('ℹ️ Supabase não configurado no backend (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY vazios no .env). Executando com persistência em disco local.');
}

export class SupabaseService {
  static isConfigured(): boolean {
    return isServerSupabaseConfigured && !!supabaseServer;
  }

  static async getFunnels(): Promise<SalesFunnel[] | null> {
    if (!this.isConfigured() || !supabaseServer) return null;
    try {
      const { data, error } = await supabaseServer
        .from('funnels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ [Supabase] Erro ao buscar funis:', error.message);
        return null;
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        active: row.active ?? true,
        triggerType: row.trigger_type || 'meta_ads_keyword',
        triggerKeywords: row.trigger_keywords || ['QUERO'],
        nodes: row.nodes || [],
        edges: row.edges || [],
        stats: row.stats || { started: 0, completed: 0, conversions: 0, conversionRate: 0 },
        createdAt: row.created_at || new Date().toISOString()
      }));
    } catch (err: any) {
      console.warn('⚠️ [Supabase] Exceção ao consultar funis:', err.message);
      return null;
    }
  }

  static async upsertFunnel(funnel: SalesFunnel): Promise<boolean> {
    if (!this.isConfigured() || !supabaseServer) return false;
    try {
      const record = {
        id: funnel.id,
        name: funnel.name,
        description: funnel.description || '',
        active: funnel.active ?? true,
        trigger_type: funnel.triggerType || 'meta_ads_keyword',
        trigger_keywords: funnel.triggerKeywords || ['QUERO'],
        nodes: funnel.nodes || [],
        edges: funnel.edges || [],
        stats: funnel.stats || {},
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseServer.from('funnels').upsert(record);
      if (error) {
        console.warn('⚠️ [Supabase] Erro ao salvar funil:', error.message);
        return false;
      }
      console.log(`☁️ [Supabase] Funil "${funnel.name}" (${funnel.id}) salvo com sucesso na nuvem!`);
      return true;
    } catch (err: any) {
      console.warn('⚠️ [Supabase] Exceção ao salvar funil:', err.message);
      return false;
    }
  }

  static async deleteFunnel(id: string): Promise<boolean> {
    if (!this.isConfigured() || !supabaseServer) return false;
    try {
      const { error } = await supabaseServer.from('funnels').delete().eq('id', id);
      if (error) {
        console.warn('⚠️ [Supabase] Erro ao excluir funil:', error.message);
        return false;
      }
      console.log(`☁️ [Supabase] Funil ${id} removido da nuvem.`);
      return true;
    } catch (err: any) {
      console.warn('⚠️ [Supabase] Exceção ao excluir funil:', err.message);
      return false;
    }
  }
}
