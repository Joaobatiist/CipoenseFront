# ====================================================================
# STAGE 1: BUILDER - Faz o build estático, incluindo dependências de dev
# ====================================================================
FROM node:22-alpine AS builder

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração de pacotes
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies necessárias para o 'expo export')
RUN npm install

# Copia o restante do código fonte
COPY . .

# Executa o script de build que cria a pasta 'web-build'
# O script 'heroku-postbuild' ou 'build' do seu package.json deve ser executado aqui.
# Usaremos 'npm run heroku-postbuild' que executa o 'npm run build'
RUN npm run heroku-postbuild


# ====================================================================
# STAGE 2: PRODUCTION - Servir apenas a build estática com 'serve'
# ====================================================================
FROM node:22-alpine

# A porta padrão do Dokku/Heroku é 5000, mas vamos usar 8080 ou 5000 e deixar o Dokku mapear
# Usaremos 5000 para compatibilidade, mas o Dokku mapeia a porta interna.
ENV PORT 5000
EXPOSE 5000

# Instala o 'serve' globalmente para ser usado como servidor web estático
RUN npm install -g serve

# Cria o diretório de trabalho final
WORKDIR /usr/src/app

# Copia APENAS o resultado do build (a pasta web-build) do Stage 1
COPY --from=builder /app/web-build ./web-build

# Comando de inicialização: Serve a pasta web-build na porta definida
# O '$PORT' será automaticamente preenchido pelo Dokku no tempo de execução.
CMD ["serve", "-s", "web-build", "-l", "tcp/0.0.0.0:${PORT}"]