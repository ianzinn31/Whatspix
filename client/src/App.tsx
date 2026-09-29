import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LiveChat } from './pages/LiveChat';
import { KanbanBoard } from './pages/KanbanBoard';
import { FlowBuilder } from './pages/FlowBuilder';
import { AiAgent } from './pages/AiAgent';
import { AntiBan } from './pages/AntiBan';
import { ProofReader } from './pages/ProofReader';
import { MetaAds } from './pages/MetaAds';
import { Integrations } from './pages/Integrations';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Visão Geral & Retorno de Vendas (ROAS)',
          subtitle: 'Métricas consolidadas de vendas X1, anúncios e conversões em tempo real'
        };
      case 'live_chat':
        return {
          title: 'Chats ao Vivo X1 WhatsApp',
          subtitle: 'Multiatendimento com copiloto de vendas IA e gerador de PIX instantâneo'
        };
      case 'kanban':
        return {
          title: 'Pipeline Comercial & Kanban CRM',
          subtitle: 'Gestão visual de leads e avanço nas etapas de venda no WhatsApp'
        };
      case 'funnels':
        return {
          title: 'Construtor de Funis & IA Canvas',
          subtitle: 'Desenhe cada etapa da esteira de vendas com ferramentas, simulador e IA'
        };
      case 'ai_agent':
        return {
          title: 'Agentes de IA & Treinamento (RAG)',
          subtitle: 'Modelos prontos (Leo Vendas, Nina Suporte, Teo Recuperação) e base de conhecimento'
        };
      case 'antiban':
        return {
          title: 'Escudo Anti-Banimento Blindado',
          subtitle: 'Digitação humanizada, pausas naturais, aquecimento de chips e spintax'
        };
      case 'proof_reader':
        return {
          title: 'Leitor Inteligente de Comprovantes OCR',
          subtitle: 'Validação automática de transferências PIX em imagens e PDFs com antifraude'
        };
      case 'meta_ads':
        return {
          title: 'Meta Ads & Conversions API (CAPI)',
          subtitle: 'Rastreamento de custo por conversa no WhatsApp e disparo de conversões'
        };
      case 'integrations':
        return {
          title: 'Configurações, Conexões & Modelos de IA',
          subtitle: 'Escolha de modelos NVIDIA NIM da API em tempo real, chips WhatsApp (WAHA), Supabase e Webhooks'
        };
      default:
        return { title: 'WhatsPix AI', subtitle: 'Plataforma de Vendas X1 no WhatsApp' };
    }
  };

  const { title, subtitle } = getPageInfo();

  const handleSimulateNewLead = () => {
    setCurrentTab('live_chat');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadCount={0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          onSimulateLead={handleSimulateNewLead}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'live_chat' && <LiveChat />}
          {currentTab === 'kanban' && <KanbanBoard onOpenChat={(id) => setCurrentTab('live_chat')} />}
          {currentTab === 'funnels' && <FlowBuilder />}
          {currentTab === 'ai_agent' && <AiAgent />}
          {currentTab === 'antiban' && <AntiBan onNavigateTab={(tab) => setCurrentTab(tab as NavTab)} />}
          {currentTab === 'proof_reader' && <ProofReader />}
          {currentTab === 'meta_ads' && <MetaAds />}
          {currentTab === 'integrations' && <Integrations />}
        </main>
      </div>
    </div>
  );
}

export default App;
