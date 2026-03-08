# 🎠 Kaique.Editor — Automação de Carrossel

Crie carrosséis profissionais para Instagram em minutos. Editor visual completo com IA integrada.

---

## ✨ Funcionalidades

- **Editor Visual** — 3 layouts (Background, Storytelling, Social Post)
- **17 Fontes** — Anton, Unbounded, Inter, Poppins e mais
- **Controle Total** — Zoom, escurecimento, degradê e área da imagem
- **4 Formatos** — Carrossel (3:4), Stories (9:16), Feed (4:5), LinkedIn (1:1)
- **Exportação** — ZIP com PNGs de alta qualidade (1080px)
- **Agentes IA** — GPTs para gerar roteiros e imagens via ChatGPT
- **Mobile** — Bottom tab bar com 5 seções: Editor, Projetos, Preview, Criar, Ajustes

---

## 🚀 Como Rodar (Local)

```bash
npm install
npm run dev
```

Acesse **<http://localhost:3001>**

---

## 🔧 Stack

| Tecnologia | Uso |
| ---------- | --- |
| React 19 + TypeScript | Interface |
| Zustand | Estado global |
| Tailwind CSS | Estilos |
| html-to-image + JSZip | Exportação |
| Supabase | Auth |
| Vercel | Deploy |

---

## 📁 Estrutura

```
src/
├── components/
│   ├── auth/          # Login
│   ├── carousel/      # Slide + Footer
│   ├── chat/          # Agentes IA (ChatGPT)
│   ├── editor/        # Painel de edição
│   ├── export/        # Preview + export
│   ├── history/       # Projetos salvos
│   └── layout/        # BottomTabBar
├── hooks/             # useExport, useProcessText...
├── services/          # Gemini AI, storage
├── store/             # Zustand slices
├── constants/         # Tema, fontes, cores
├── types/             # TypeScript types
└── utils/             # Formatters, validation
```

---

*Kaique.Editor v2.0*
