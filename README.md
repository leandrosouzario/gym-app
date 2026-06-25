# Gym App

Copie `.env.example` para `.env` e preencha as variáveis antes de executar.

## Pré-requisitos

- Docker e Docker Compose

## Build e execução (Docker)

```bash
cp .env.example .env
docker compose build --no-cache
docker compose up -d
```

Aplicação disponível em `http://localhost:3020`.

## Ícones PWA (iPhone / Tela de Início)

Os PNGs são gerados automaticamente no **build Docker** a partir de `public/icons/icon.svg`. Não é necessário `npm install` na máquina host.

Para alterar o ícone, edite o SVG e rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

## Desenvolvimento local (opcional)

Requer Node.js 18+ instalado na máquina:

```bash
npm install
npm run dev
```
