-- =====================================================================
-- WHATSPIX AI PLATFORM - SUPABASE PRODUCTION DATABASE SCHEMA
-- =====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. WHATSAPP INSTANCES (WAHA / Evolution)
create table if not exists public.instances (
  id text primary key default ('inst_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  status text default 'connecting' check (status in ('connected', 'connecting', 'disconnected', 'banned_risk')),
  provider text default 'waha' check (provider in ('waha', 'evolution', 'meta_cloud')),
  server_url text default 'http://localhost:3000',
  api_key text,
  qr_code text,
  health_score integer default 95,
  warmup_day integer default 1,
  warmup_target integer default 30,
  messages_sent_today integer default 0,
  anti_ban_config jsonb default '{
    "typingSpeedMinMs": 45,
    "typingSpeedMaxMs": 85,
    "simulateAudioRecording": true,
    "audioRecordingSecondsPer10Words": 3,
    "randomIntervalMinSec": 6,
    "randomIntervalMaxSec": 15,
    "dailyLimit": 300,
    "hourlyLimit": 40,
    "warmupModeActive": true,
    "spintaxEnabled": true
  }'::jsonb,
  last_active timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. SALES FUNNELS & FLOWS (React Flow Nodes & Edges)
create table if not exists public.funnels (
  id text primary key default ('funnel_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  active boolean default true,
  trigger_type text default 'meta_ads_keyword',
  trigger_keywords text[] default array['QUERO', 'METODO', 'COMPRAR'],
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  stats jsonb default '{
    "started": 0,
    "completed": 0,
    "conversions": 0,
    "conversionRate": 0
  }'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. CRM LEADS
create table if not exists public.leads (
  id text primary key default ('lead_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id uuid references auth.users(id) on delete cascade,
  instance_id text references public.instances(id) on delete set null,
  phone text not null,
  name text not null,
  avatar text,
  status text default 'new' check (status in ('new', 'negotiating', 'pix_generated', 'paid', 'transferred', 'lost')),
  ai_active boolean default true,
  assigned_funnel_id text references public.funnels(id) on delete set null,
  current_step_id text,
  tags text[] default array[]::text[],
  product_interest text,
  offer_value numeric(10,2) default 197.00,
  origin text default 'meta_ads',
  ad_id text,
  ad_name text,
  pix_code text,
  pix_tx_id text,
  proof_validated boolean default false,
  notes text,
  unread_count integer default 0,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. CHAT MESSAGES
create table if not exists public.messages (
  id text primary key default ('msg_' || replace(uuid_generate_v4()::text, '-', '')),
  lead_id text not null references public.leads(id) on delete cascade,
  sender text not null check (sender in ('lead', 'ai', 'human', 'system')),
  type text default 'text' check (type in ('text', 'audio', 'image', 'pix', 'document')),
  content text not null,
  media_url text,
  status text default 'delivered' check (status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  is_proof_receipt boolean default false,
  proof_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. AI AGENT CONFIGURATION & KNOWLEDGE BASE
create table if not exists public.ai_agent_configs (
  id text primary key default 'default_config',
  user_id uuid references auth.users(id) on delete cascade,
  provider text default 'gemini',
  api_key text,
  model text default 'gemini-1.5-flash',
  persona_name text default 'Sofia',
  agent_role text default 'Especialista em Vendas X1 & Fechamento',
  tone text default 'persuasive',
  custom_instructions text,
  temperature numeric(3,2) default 0.7,
  tools_enabled jsonb default '{
    "generatePix": true,
    "checkReceipt": true,
    "applyDiscount": true,
    "handoffHuman": true
  }'::jsonb,
  knowledge_base jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. META ADS CAMPAIGNS & CAPI METRICS
create table if not exists public.meta_campaigns (
  id text primary key default ('camp_' || replace(uuid_generate_v4()::text, '-', '')),
  user_id uuid references auth.users(id) on delete cascade,
  campaign_id text not null,
  campaign_name text not null,
  spend numeric(10,2) default 0.00,
  impressions integer default 0,
  clicks integer default 0,
  cpc numeric(10,2) default 0.00,
  ctr numeric(5,2) default 0.00,
  whatsapp_conversations integer default 0,
  cost_per_conversation numeric(10,2) default 0.00,
  revenue numeric(10,2) default 0.00,
  roas numeric(5,2) default 0.00,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Storage bucket for receipt OCR verification
insert into storage.buckets (id, name, public) 
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Storage bucket for voice notes
insert into storage.buckets (id, name, public) 
values ('audio_notes', 'audio_notes', true)
on conflict (id) do nothing;

-- Enable Row Level Security (RLS)
alter table public.instances enable row level security;
alter table public.funnels enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;
alter table public.ai_agent_configs enable row level security;
alter table public.meta_campaigns enable row level security;

-- Policies (Allow all for anon in local dev / authenticated users in prod)
create policy "Allow all access to instances" on public.instances for all using (true);
create policy "Allow all access to funnels" on public.funnels for all using (true);
create policy "Allow all access to leads" on public.leads for all using (true);
create policy "Allow all access to messages" on public.messages for all using (true);
create policy "Allow all access to ai_agent_configs" on public.ai_agent_configs for all using (true);
create policy "Allow all access to meta_campaigns" on public.meta_campaigns for all using (true);

-- Realtime subscriptions for Live Chat and Pipeline
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.messages;
