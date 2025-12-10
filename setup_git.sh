#!/bin/bash

echo "🚀 Configurando Git para: rede-do-bem..."

# 1. Inicializar (se não existir)
git init

# 2. Adicionar TODOS os arquivos (não só o README)
git add .

# 3. Commit
git commit -m "Initial commit: Rede do Bem (Hospitalar) - MVP Completo"

# 4. Renomear branch para main
git branch -M main

# 5. Adicionar remoto (se falhar porque já existe, remove e adiciona de novo)
git remote remove origin 2>/dev/null
git remote add origin https://github.com/jmbento/rede-do-bem.git

# 6. Push
echo "📤 Enviando para o GitHub..."
git push -u origin main

echo ""
echo "✅ Sucesso! Agora acesse a Vercel e importe este repositório."
