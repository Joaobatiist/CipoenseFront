# ====================================================================
# STAGE 1: BUILD - Cria o build estático
# ====================================================================
FROM node:22 AS builder # <-- IMPORTANTE: AS builder DEVE ESTAR AQUI

WORKDIR /app
# ... o resto do seu código de build (npm install, npm run build)

# ====================================================================
# STAGE 2: PRODUCTION - Servir apenas a build estática com 'http-server'
# ====================================================================
FROM node:22-alpine

# Define a porta que o Dokku usará para rotear (pode ser redundante, mas ajuda)
ENV PORT 5000
EXPOSE 5000

# MUDANÇA: Instala o 'http-server'
RUN npm install -g http-server

# Cria o diretório de trabalho final
WORKDIR /usr/src/app

# Copia APENAS o resultado do build do Stage 1
COPY --from=builder /app/web-build ./web-build

# Comando de inicialização para o http-server
# Usando '|| 5000' como fallback caso $PORT não seja expandido corretamente
CMD http-server web-build -d false -p ${PORT:-5000} -a 0.0.0.0