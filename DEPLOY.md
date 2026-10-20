# Guia de Deploy e Produção — Illumina

Este guia descreve os passos para compilar e executar o Illumina em ambiente de produção, seja via Node.js nativo ou via containers Docker.

---

## 1. Variáveis de Ambiente (.env)

Crie ou configure o arquivo `.env` na raiz do projeto com base no [`.env.example`](file:///.env.example):

```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
NODE_ENV=production
DB_PATH=illumina.db
```

---

## 2. Execução Local em Modo Produção (Node.js)

O backend Express serve a API REST e os ficheiros estáticos do SPA compilado (`client/dist`), incluindo fallback para rotas SPA e compressão Gzip.

```bash
# 1. Instalar dependências completas
npm install

# 2. Inicializar o banco e importar a Bíblia completa (se ainda não fez)
npm run db:setup
npm run db:import-bible

# 3. Compilar frontend e backend
npm run build

# 4. Iniciar a aplicação monolítica em produção
npm run start
```

Acesse a aplicação em: **`http://localhost:3001`**.

---

## 3. Execução via Docker e Docker Compose

O projeto conta com um [`Dockerfile`](file:///Dockerfile) multi-stage otimizado em Alpine Linux e persistência de volume para o banco SQLite.

### A. Subir via Docker Compose (Recomendado)

```bash
# Iniciar o container com rebuild
docker compose up -d --build

# Ver logs do serviço
docker compose logs -f illumina
```

O banco SQLite é armazenado no volume persistente `illumina-data` (`/app/data/illumina.db`), garantindo que o progresso de leitura, ofensivas, notas e comentários nunca sejam perdidos entre recriações de containers.

### B. Parar o serviço

```bash
docker compose down
```

---

## 4. Otimizações de Produção Integradas

- **Segurança (Helmet)**: Proteção de cabeçalhos HTTP com Content Security Policy (CSP) liberando Web Fonts do Google, scripts locais e áudios de streaming da Bíblia.
- **Compressão (Gzip)**: Middleware `compression` ativo para transferência rápida de assets estáticos e payloads JSON da API.
- **Cache Offline (PWA)**: Assets e chamadas de API (`/api/verses/**` e `/api/commentary/**`) indexados no Service Worker Workbox via `StaleWhileRevalidate`.
