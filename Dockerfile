# ==========================================
# Estágio 1: Builder (Compilação Full-Stack)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instala ferramentas de compilação para módulos nativos (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Instala dependências do monorepo / raiz
COPY package*.json ./
RUN npm ci

# Instala dependências do client
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copia todo o código-fonte
COPY server/ ./server/
COPY client/ ./client/

# Compila o backend e o frontend
RUN npm run build

# ==========================================
# Estágio 2: Runner (Imagem Enxuta de Produção)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/illumina.db

# Instala dependências de runtime necessárias para better-sqlite3
RUN apk add --no-cache libstdc++

# Copia manifestos de pacote e instala apenas pacotes de produção
COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && apk del python3 make g++

# Copia os artefatos compilados
COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/client/dist ./client/dist

# Cria diretório de volume para persistência do banco SQLite
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "dist/server/index.js"]
