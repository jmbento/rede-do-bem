# 🏥 Rede do Bem - Sistema de Doação Hospitalar

Sistema completo de gerenciamento de equipamentos hospitalares com rastreamento por QR Code, fila priorizada, logística de distribuição e múltiplos perfis de usuário.

## 🎯 Objetivo

Conectar pessoas que têm equipamentos hospitalares parados em casa com quem precisa urgentemente, facilitando a logística através de voluntários.

> **⚠️ Escopo de Atuação:** A Rede do Bem foca na intermediação de **mobiliário e equipamentos de apoio** (ex: cadeiras de rodas, camas, muletas), mas estamos abertos a outros itens de ajuda duráveis.
>
> **Não realizamos intermediação de:**
> - Medicamentos de qualquer tipo (Proibido)
> - Consultas ou atendimentos médicos

## 🚀 Tecnologias

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Mapas**: Leaflet (open-source)
- **QR Code**: html5-qrcode + qrcode.react
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta Supabase (gratuita)

## ⚙️ Setup do Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Criar conta em [https://supabase.com](https://supabase.com)
2. Criar novo projeto
3. Ir em `SQL Editor` e executar o arquivo `supabase/schema.sql`
4. Ir em `Settings > API` e copiar:
   - Project URL
   - anon/public key

### 3. Configurar Variáveis de Ambiente

Copiar `.env.example` para `.env`:

```bash
cp .env.example .env
```

Editar `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Configurar Storage no Supabase

1. Ir em `Storage` no painel Supabase
2. Criar bucket `items-photos` (público)
3. Criar bucket `medical-documents` (privado)

### 5. Rodar Aplicação

```bash
npm run dev
```

Aplicação estará rodando em: `http://localhost:5173`

## 👥 Perfis de Usuário

### Doador
- Cadastrar itens para doação
- Visualizar status dos itensDoados
- Gerar QR Codes

### Solicitante
- Solicitar equipamentos
- Ver posição na fila (algoritmo de prioridade)
- Confirmar recebimento

### Distribuidor (Voluntário)
- Ver missões disponíveis próximas
- Aceitar rotas
- Scanner QR para confirmar coleta/entrega

### Armazenador (Voluntário)
- Gerenciar estoque
- Check-in/Check-out de itens
- Controle de capacidade

### Gestor/Admin
- Aprovar solicitações
- Alterar urgência
- Dashboard completo

## 🔐 Segurança & Privacidade (LGPD)

- **Row Level Security (RLS)** implementado
- **Geo-obfuscation**: endereços completos apenas para voluntários com missão aceita
- **Data Masking**: público vê apenas bairro/cidade
- **Laudos médicos**: URLs assinadas temporárias

## 📱 Funcionalidades Principais

### Algoritmo de Prioridade
```
Score = (Nível Urgência × 10) + (Dias na Fila × 1)
```

### Fluxo de Status dos Itens
1. **Disponível**: Item cadastrado pelo doador
2. **Aguardando Coleta**: Match com solicitante
3. **Em Trânsito**: Distribuidor em rota
4. **Em Uso**: Entregue ao solicitante
5. **Manutenção**: Item precisa de reparo

### Geolocalização
- Mapa com pinos coloridos por tipo de usuário
- Cálculo de distância para missões próximas
- Deep links para Waze/Google Maps

## 🗺️ Estrutura do Projeto

```
src/
├── components/
│   ├── Map/              # Mapa interativo
│   ├── Navigation/       # Bottom Bar
│   ├── QRCode/          # Scanner e Generator
│   └── UI/              # Componentes reutilizáveis
├── contexts/            # AuthContext
├── hooks/               # Geolocation, Realtime
├── pages/               # Telas principais
├── utils/               # Algoritmos e helpers
└── lib/                 # Supabase client
```

## 📊 Banco de Dados

5 tabelas principais:
- `users`: Perfis de usuário
- `items`: Equipamentos com QR Code
- `requests`: Fila de espera priorizada
- `missions`: Logística de distribuição
- `notifications`: Sistema de notificações

## 🎨 Design System

- **Mobile-First**: Layout responsivo
- **Tema Hospitalar**: Cores clean e alto contraste
- **Bottom Bar**: Navegação variável por perfil
- **FAB**: Ações rápidas
- **Status Badges**: Visual claro do estado

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter
```

## 📝 Próximos Passos

- [ ] Implementar notificações push/email
- [ ] Sistema de avaliações
- [ ] Histórico completo de transações
- [ ] Relatórios e analytics
- [ ] App mobile (React Native)

## 🤝 Contribuindo

Este é um projeto de impacto social. Contribuições são bem-vindas!

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para a Rede do Bem**
