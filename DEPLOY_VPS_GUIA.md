# 🚀 Guia Prático de Deploy na VPS - WhatsPix AI & WAHA (24/7)

Este guia rápido explica como enviar o **WhatsPix AI** do seu computador para a sua **VPS** (Hostinger, Contabo, DigitalOcean, Hetzner, AWS, etc.) e colocar tudo rodando 24 horas por dia.

---

## 📦 PASSO 1: Como Enviar o Projeto do PC para a VPS

Escolha a opção que achar mais fácil:

### 🟢 Opção A: Via Git / GitHub Privado (Mais Fácil & Recomendada)
Se você já usa Git, esta é a forma mais prática para enviar e atualizar o código no futuro:

1. **No seu computador (Terminal ou VS Code na pasta do WhatsPix):**
   ```bash
   git init
   git add .
   git commit -m "WhatsPix AI Enterprise"
   git branch -M main
   # Crie um repositório PRIVADO no seu GitHub e vincule:
   git remote add origin https://github.com/SEU_USUARIO/whatspix.git
   git push -u origin main
   ```

2. **Na sua VPS (conectado via SSH):**
   ```bash
   git clone https://github.com/SEU_USUARIO/whatspix.git
   cd whatspix
   ```

---

### 🟡 Opção B: Via FileZilla / WinSCP ou Compactado (.zip) (Sem precisar de Git)

1. **No seu computador:**
   - Comprima a pasta do projeto em um arquivo `.zip` (ex: `whatspix.zip`).
   - *(Dica: Não precisa compactar as pastas `node_modules`, pois elas são pesadas e serão geradas direto na VPS).*

2. **Enviar para a VPS:**
   - Abra o **FileZilla** ou **WinSCP**.
   - Conecte usando:
     * **Host:** `sftp://IP_DA_SUA_VPS`
     * **Usuário:** `root`
     * **Senha:** (sua senha da VPS ou chave SSH)
     * **Porta:** `22`
   - Arraste o arquivo `whatspix.zip` para a pasta `/root/` ou `/var/www/`.

3. **Na VPS (via SSH):**
   ```bash
   apt install -y unzip
   unzip whatspix.zip -d whatspix
   cd whatspix
   ```

---

## 🛠️ PASSO 2: Preparar a VPS (Instalar Node.js, Docker e PM2)

Conectado no terminal da VPS via SSH (Putty ou terminal do Windows `ssh root@IP_DA_VPS`):

```bash
# 1. Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker e Docker Compose (para o WAHA)
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker

# 3. Instalar Node.js 20+ e PM2 (gerenciador de processos 24 horas)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 📱 PASSO 3: Iniciar o WAHA (WhatsApp API) na VPS

Dentro da pasta do projeto (`cd whatspix`), execute:

```bash
docker-compose up -d
```

Verifique se o container subiu:
```bash
docker ps
```
> O WAHA estará ativo na porta `3000`. Você pode testar abrindo no navegador: `http://IP_DA_SUA_VPS:3000/dashboard`

---

## ⚙️ PASSO 4: Configurar o arquivo `.env` na VPS

Copie ou edite o arquivo `server/.env`:
```bash
nano server/.env
```

Verifique se as chaves da NVIDIA e do Fish Audio estão corretas e ajuste a URL do WAHA:
```env
PORT=3001

# Supabase
SUPABASE_URL=https://zddvlvkcfbidivsvcpjz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WAHA na própria VPS
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=

# Chaves de IA
NVIDIA_API_KEY=sua_chave_nvidia
FISH_AUDIO_API_KEY=sua_chave_fish_audio
FISH_AUDIO_VOICE_ID=5ead3a4fedda4d1f8419ca8b2452f6d5
SYSTEM_ARCHITECT_MODEL=z-ai/glm-5.3
```
*(Para salvar no nano: aperte `Ctrl + O`, depois `Enter`, e `Ctrl + X` para sair).*

---

## 🚀 PASSO 5: Instalar Dependências e Rodar o WhatsPix 24/7 com PM2

Ainda na pasta raiz do projeto (`whatspix`):

```bash
# 1. Instalar dependências da raiz, do cliente e do servidor
npm install
npm install --prefix client
npm install --prefix server

# 2. Compilar Frontend e Backend
npm run build --prefix client
npm run build --prefix server

# 3. Iniciar o servidor 24 horas por dia com PM2
cd server
pm2 start dist/index.js --name "whatspix"

# 4. Salvar para reiniciar automaticamente caso a VPS seja reiniciada
pm2 startup
pm2 save
```

---

## 🎉 TUDO PRONTO! COMO ACESSAR:

O WhatsPix agora serve tanto o Frontend completo quanto a API pela mesma porta:

* 🌐 **Painel do WhatsPix:** `http://IP_DA_SUA_VPS:3001`
* 📱 **Painel do WAHA:** `http://IP_DA_SUA_VPS:3000`

### Como Conectar o seu WhatsApp na VPS:
1. Abra `http://IP_DA_SUA_VPS:3001` no seu navegador.
2. Vá em **Configurações & Conexões** no menu lateral.
3. Clique em **"Ver QR Code"** no chip do WhatsApp.
4. Escaneie com seu celular no WhatsApp (**Aparelhos Conectados**).
5. No campo **"🎯 Funil Ativo neste Número"**, selecione o funil desejado (ex: `Mentoria Pão Artesanal`).
6. Pronto! Seus leads já serão atendidos 100% no automático pela IA 24 horas por dia!

---

## 🔒 PASSO EXTRA (Opcional): Colocar Domínio Próprio com SSL (HTTPS Grátis)

Se quiser acessar por `app.seudominio.com` com cadeado verde (HTTPS):

1. Aponte o registro **A** do seu domínio (ex: `app`) para o `IP_DA_SUA_VPS`.
2. Na VPS, instale o Nginx e Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
3. Crie o arquivo `/etc/nginx/sites-available/whatspix`:
   ```nginx
   server {
       server_name app.seudominio.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. Ative e gere o SSL grátis:
   ```bash
   sudo ln -s /etc/nginx/sites-available/whatspix /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d app.seudominio.com
   ```
