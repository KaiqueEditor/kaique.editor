#!/bin/bash
# =============================================
# Kaique.Editor - Script de Inicialização
# Clique duplo neste arquivo para rodar o app!
# =============================================

# Mudar para a pasta do projeto
cd "$(dirname "$0")"

echo ""
echo "🚀 Kaique.Editor - Iniciando..."
echo ""

# Tentar encontrar npm em locais comuns
NPM=""
for path in "/usr/local/bin/npm" "/opt/homebrew/bin/npm" "$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin/npm"; do
  if [ -f "$path" ]; then
    NPM="$path"
    break
  fi
done

# Tentar no PATH normal
if [ -z "$NPM" ]; then
  NPM=$(which npm 2>/dev/null)
fi

if [ -z "$NPM" ]; then
  echo "❌ Node.js não encontrado!"
  echo ""
  echo "Por favor, instale o Node.js primeiro:"
  echo "→ Acesse: https://nodejs.org/"
  echo "→ Baixe a versão LTS e instale"
  echo "→ Depois clique novamente neste arquivo"
  echo ""
  read -p "Pressione ENTER para fechar..."
  exit 1
fi

echo "✅ Node.js encontrado: $NPM"
echo ""

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências (primeira vez - pode demorar ~1 min)..."
  echo ""
  $NPM install
  echo ""
fi

# Verificar se há .env.local
if [ ! -f ".env.local" ]; then
  echo "⚠️  Arquivo .env.local não encontrado!"
  echo ""
  echo "Para usar a IA, você precisa de uma API Key do Google Gemini."
  echo "1. Acesse: https://aistudio.google.com/app/apikey"
  echo "2. Crie uma chave gratuita"
  echo "3. Cole ela quando solicitado abaixo"
  echo ""
  read -p "Cole sua GEMINI_API_KEY aqui (ou pressione ENTER para pular): " API_KEY

  if [ -n "$API_KEY" ]; then
    echo "GEMINI_API_KEY=$API_KEY" > .env.local
    echo "✅ API Key salva!"
  else
    echo "⚠️  Sem API Key - funcionalidades de IA não estarão disponíveis"
    echo "GEMINI_API_KEY=" > .env.local
  fi
  echo ""
fi

echo "🌐 Iniciando servidor..."
echo "→ O app vai abrir automaticamente no seu navegador"
echo "→ Endereço: http://localhost:3000"
echo ""
echo "Para fechar: pressione CTRL+C nesta janela"
echo ""

# Iniciar o servidor de desenvolvimento
$NPM run dev
