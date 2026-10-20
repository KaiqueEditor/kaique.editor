---
description: Como fazer deploy do CarrosselPro na Vercel (commit + push + verificar)
---

# Deploy CarrosselPro na Vercel

## Pré-requisitos
- As credenciais do GitHub já estão salvas via `git credential store`
- O remote origin é `https://github.com/KaiqueEditor/carrossel-pro.git`
- A Vercel faz deploy automático ao detectar push na branch `main`

## Passos

// turbo-all

1. Verificar status do repositório:
```bash
cd "/Users/kaiquetorres/Documents/CARROSSEL 2026/ANTIGRAVITY/CarrosselPro" && git status
```

2. Verificar se o TypeScript compila sem erros:
```bash
cd "/Users/kaiquetorres/Documents/CARROSSEL 2026/ANTIGRAVITY/CarrosselPro" && npx tsc --noEmit --skipLibCheck
```

3. Fazer build de produção para validar:
```bash
cd "/Users/kaiquetorres/Documents/CARROSSEL 2026/ANTIGRAVITY/CarrosselPro" && npx vite build 2>&1 | tail -20
```

4. Adicionar todas as alterações e commitar:
```bash
cd "/Users/kaiquetorres/Documents/CARROSSEL 2026/ANTIGRAVITY/CarrosselPro" && git add -A && git commit -m "<MENSAGEM_DO_COMMIT>"
```
> Substitua `<MENSAGEM_DO_COMMIT>` por uma descrição adequada das mudanças.

5. Push para o GitHub (Vercel faz deploy automático):
```bash
cd "/Users/kaiquetorres/Documents/CARROSSEL 2026/ANTIGRAVITY/CarrosselPro" && git push origin main 2>&1
```

6. Verificar se o push foi bem-sucedido checando a saída do comando anterior.

## Notas
- O token PAT (Personal Access Token) expira em ~30 dias (20 de abril de 2026). Quando expirar, é necessário gerar um novo em https://github.com/settings/tokens/new com scope `repo` e atualizar com:
```bash
printf "protocol=https\nhost=github.com\nusername=KaiqueEditor\npassword=<NOVO_TOKEN>\n" | git credential approve
```
- A URL do deploy é: https://kaique-editor.vercel.app
- O vercel.json está em `/Users/kaiquetorres/Documents/CARROSSEL 2026/ANTIGRAVITY/CarrosselPro/vercel.json`
