# 🎠 Kaique.Editor

**Editor de Carrossel Profissional para Instagram**

Crie carrosséis de alta performance em minutos. Editor visual completo, agentes de IA integrados e exportação em alta qualidade — tudo no navegador.

🌐 **Acesse online:** [kaique-editor.vercel.app](https://kaique-editor.vercel.app)

---

## ✨ Funcionalidades

### 🎨 Editor Visual Completo

- **3 Layouts** — Background (imagem cheia), Storytelling (imagem + texto), Social Post (estilo feed)
- **17 Fontes profissionais** — Anton, Unbounded, Inter, Poppins, Montserrat, Outfit e mais
- **Paleta de cores** — Cor de fundo, título, corpo, branding, tudo customizável
- **Formatação de texto** — Negrito, itálico, tachado e highlight com sintaxe simples
- **Alinhamento** — Esquerda, centro, direita para cada slide
- **Marca d'água** — Adicione @seuinstagram em todos os slides automaticamente

### 🖼️ Controle de Imagem

- **Upload de foto ou vídeo** — Arraste ou selecione do dispositivo
- **Posição X/Y** — Ajuste fino da posição da imagem
- **Zoom** — De 1x até 4x
- **Escurecimento** — Overlay preto de 0% a 95%
- **Degradê** — Intensidade do gradiente de 0% a 100%
- **Área da Imagem** — Controle quanto da tela a imagem ocupa (30% a 100%)

### 🤖 Agentes de IA

- **Agente de Texto** — GPT especializado que gera roteiros virais para carrosséis via ChatGPT
- **Agente de Imagem** — GPT que gera imagens otimizadas para slides via ChatGPT
- **Processamento inteligente** — Cole o roteiro e o editor distribui automaticamente nos slides

### 📱 Mobile First

- **Bottom Tab Bar** com 5 seções: Editor, Projetos, Preview, Criar, Ajustes
- **Canvas fullscreen** no celular — preview exatamente como vai ficar no Instagram
- **Criação manual** — Adicione slides sem usar IA, edite tudo direto no celular
- **Tema claro/escuro** — Alterne entre modos com um toque

### 📦 Exportação Profissional

- **4 formatos de exportação:**
  - Carrossel Instagram (1080×1440 — 3:4)
  - Stories/Reels (1080×1920 — 9:16)
  - Feed quadrado (1080×1350 — 4:5)
  - LinkedIn (1080×1080 — 1:1)
- **Download em ZIP** — Todos os slides em PNG de alta qualidade
- **Export PDF** — Visualize e compartilhe como documento
- **Slides com vídeo** — Exportados automaticamente como .mp4

### 💾 Projetos

- **Salvamento automático** — Nunca perca seu trabalho
- **Histórico de projetos** — Acesse e restaure carrosséis anteriores
- **Slides padrão** — Ao abrir, já vem com 3 slides prontos para editar

### ⌨️ Atalhos de Teclado

| Atalho | Ação |
| ------ | ---- |
| `←` `→` | Navegar entre slides |
| `⌘K` | Abrir Agente de Texto |
| `⌘⇧K` | Abrir Agente de Imagem |

---

## 🔧 Stack Técnica

| Tecnologia | Uso |
| ---------- | --- |
| React 19 + TypeScript | Interface reativa |
| Zustand | Gerenciamento de estado |
| Tailwind CSS | Estilização |
| Supabase | Autenticação (Email, Google, GitHub) |
| html-to-image | Renderização de slides em PNG |
| JSZip | Compactação para download |
| Vercel | Deploy e hosting |

---

## 🚀 Rodando Localmente

```bash
git clone https://github.com/KaiqueEditor/kaique.editor.git
cd kaique.editor
npm install
npm run dev
```

Acesse **<http://localhost:3001>**

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/          # Login (Email, Google, GitHub)
│   ├── carousel/      # CarouselSlide + SlideFooter
│   ├── chat/          # Agentes IA (ChatGPT redirects)
│   ├── editor/        # SlideEditor + PropertyPanel
│   ├── export/        # ExportPreview
│   ├── history/       # ProjectHistory
│   └── layout/        # BottomTabBar (mobile)
├── hooks/             # useExport, useProcessText, useFileUpload...
├── services/
│   ├── api/           # GeminiService (processamento de texto)
│   ├── processors/    # Processamento de imagens
│   └── storage/       # Salvar/carregar projetos (localStorage)
├── store/             # Zustand (carouselSlice + editorSlice)
├── constants/         # Tema, fontes (17), cores, atalhos
├── types/             # Section, ProjectConfig, ChatMessage
└── utils/             # Formatters (bold/italic/highlight), validation
```

---

## 📄 Licença

Projeto privado — © Kaique Torres
