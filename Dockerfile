# ====================================================================
# STAGE 2: PRODUCTION - Servir apenas a build estática com 'http-server'
# ====================================================================
FROM node:22-alpine

# Define a porta que o Dokku usará para rotear
ENV PORT 5000
EXPOSE 5000

# MUDANÇA 1: Instala o 'http-server' no lugar do 'serve'
RUN npm install -g http-server

# Cria o diretório de trabalho final
WORKDIR /usr/src/app

# Copia APENAS o resultado do build (a pasta web-build) do Stage 1
COPY --from=builder /app/web-build ./web-build

# MUDANÇA 2: Novo Comando de inicialização para o http-server
# -d false: desabilita o fallback para index.html (bom para SPAs)
# -p $PORT: usa a variável do Dokku
# -a 0.0.0.0: escuta em todas as interfaces
# MUDANÇA 3: Usamos a pasta de build como primeiro argumento
CMD http-server web-build -d false -p $PORT -a 0.0.0.0