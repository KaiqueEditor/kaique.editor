# 🚀 CarrosselPro — Automação de Carrossel com IA

Transforme textos em carrosséis estratégicos de alta performance para redes sociais usando Inteligência Artificial.

---

## ▶️ Como Rodar (Fácil)

### Passo 1 — Instalar Node.js (só na primeira vez)

1. Acesse **<https://nodejs.org/>**
2. Clique no botão verde **"LTS"** (versão recomendada)
3. Baixe e instale normalmente (como qualquer programa)

### Passo 2 — Configurar sua API Key (só na primeira vez)

1. Acesse **<https://aistudio.google.com/app/apikey>**
2. Faça login com sua conta Google
3. Clique em **"Create API Key"** (é grátis!)
4. Copie a chave gerada
5. Abra o arquivo **`.env.local`** nesta pasta
6. Cole assim: `GEMINI_API_KEY=sua_chave_aqui`

### Passo 3 — Rodar o App

**Opção A (mais fácil):** Clique duplo no arquivo **`RODAR.command`**

**Opção B (terminal):**

```bash
npm install   # só na primeira vez
npm run dev
```

O app vai abrir automaticamente em **<http://localhost:3000>** 🎉

---

## 📁 Estrutura do Projeto (Refatorada)

```
Carrossel/
├── src/
│   ├── components/
│   │   ├── carousel/         # Componentes do slide
│   │   ├── chat/             # Agente IA
│   │   ├── editor/           # Painel de edição
│   │   ├── export/           # Preview e exportação
│   │   └── common/           # Componentes reutilizáveis
│   ├── hooks/                # Lógica reutilizável
│   ├── services/
│   │   ├── api/              # Gemini AI (com retry)
│   │   ├── processors/       # Processamento de imagens
│   │   └── storage/          # Salvar/carregar projetos
│   ├── store/                # Zustand (gerenciamento de estado)
│   ├── types/                # TypeScript types
│   ├── constants/            # Fontes, cores, atalhos
│   └── utils/                # Funções utilitárias
├── .env.local                # ← Coloque sua API Key aqui
├── RODAR.command             # ← Clique duplo para iniciar
└── package.json
```

---

## ✨ Funcionalidades

### Editor Principal

- **3 Layouts:** Background, Storytelling, Social Post
- **Paleta de Cores:** Cor de fundo, títulos, corpo, branding
- **Tipografia:** 17 fontes incluindo Anton, Unbounded, Inter
- **Ajuste de Imagem:** Posição X/Y, zoom, contraste
- **Posição do Texto:** Slider vertical para ajuste fino

### Agente IA Estrategista

- Conversa passo a passo para criar roteiro viral
- 6 fórmulas de headline MyHub
- Botão de alimentar diretamente no editor

### Geração de Imagens IA

- Geração automática por slide (Gemini AI)
- Upload de foto/vídeo próprio
- Processamento sequencial respeitando limites da API

### Exportação

- Preview de todos os slides antes de exportar
- Download em ZIP (PNG por slide, MP4 para slides com vídeo)
- Qualidade 1080x1440px (proporção Stories/Reels)

### Atalhos de Teclado

- `←` `→` — Navegar entre slides
- `⌘K` — Abrir Agente IA

---

## 🔧 Dependências Principais

| Pacote | Função |
|--------|--------|
| React 19 | Interface |
| Zustand | Gerenciamento de estado |
| @google/genai | IA Gemini |
| html-to-image | Exportar slides como PNG |
| JSZip | Compactar em ZIP |
| react-hot-toast | Notificações |
| Tailwind CSS | Estilização |

---

## 🆘 Problemas Comuns

**"App não abre no navegador"**
→ Abra manualmente: <http://localhost:3000>

**"Imagens não geram"**
→ Verifique se a API Key está no arquivo `.env.local`
→ Confira se a chave é válida em: <https://aistudio.google.com/app/apikey>

**"Erro 429 - Rate limit"**
→ Normal! O app faz retry automático com intervalo de 2 segundos

---
*CarrosselPro v2.0 — Metodologia Viral IA*
