# ====================================================================
# STAGE 1: BUILDER - Cria a build estática, incluindo dependências de dev
# ====================================================================
FROM node:22-alpine AS builder

# A CORREÇÃO PRINCIPAL: Instala as ferramentas de compilação nativas
# (necessárias para muitos pacotes que não são puramente JS, comuns em projetos RN/Expo)
RUN apk add --no-cache python3 make g++

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração de pacotes
COPY package*.json ./

# Instala todas as dependências
RUN npm install --force

# Copia o restante do código fonte
COPY . .

# Executa o script de build para criar a pasta 'web-build'
RUN npm run heroku-postbuild


# ====================================================================
# STAGE 2: PRODUCTION - Servir apenas a build estática com 'serve'
# ====================================================================
FROM node:22-alpine

# Define a porta que o Dokku usará para rotear
ENV PORT 5000
EXPOSE 5000

# Instala o 'serve' globalmente para ser usado como servidor web estático
RUN npm install -g serve

# Cria o diretório de trabalho final
WORKDIR /usr/src/app

# Copia APENAS o resultado do build (a pasta web-build) do Stage 1
COPY --from=builder /app/web-build ./web-build

# Comando de inicialização: Serve a pasta web-build na porta definida
CMD serve -s web-build -l 0.0.0.0:$PORT