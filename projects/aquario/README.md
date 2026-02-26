---
id: aquario
name: "AquaBook - Sistema de Monitoramento de Aquário Marinho"
description: "Sistema completo de monitoramento e controle de aquário marinho 200L com ESP32, sensores, aplicação web full-stack e rede social para aquaristas"
repo: "/home/carlosfarah/Projects/aquario"
tech_stack:
  - esp32
  - arduino
  - python
  - fastapi
  - sqlalchemy
  - postgresql
  - timescaledb
  - nextjs
  - react
  - typescript
  - tailwindcss
  - shadcn-ui
  - recharts
  - zustand
  - mqtt
  - docker
  - telegram-bot
status: active
created_at: "2025-02-13T10:30:00-03:00"
created_by: claude-code
---

## Visão Geral

**AquaBook** — Sistema completo de monitoramento e controle para aquário marinho de 200L (misto: peixes + corais).
Conecta microcontroladores ESP32 com sensores a uma aplicação web full-stack para monitoramento
em tempo real, alertas, controle de equipamentos e rede social para aquaristas.

## Estado Atual

- **Firmware ESP32**: Monitor funcional (DHT11 + TDS + OLED + MQTT)
- **Backend Social**: Completo (auth, posts, likes, comments, friendships)
- **Frontend Social**: Completo (feed, perfil, amigos, upload mídia)
- **Backend Monitoramento**: Não implementado (diretórios scaffolded vazios)
- **Frontend Monitoramento**: Não implementado (páginas vazias)
- **Infraestrutura**: Docker Compose funcional (TimescaleDB, Mosquitto, backup)

## Escopo MVP (5 Fases)

### Incluído
- Firmware ESP32 para leitura de sensores (temperatura, TDS, pH futuro)
- Backend API (FastAPI) com MQTT consumer, WebSocket e persistência TimescaleDB
- Frontend dashboard (Next.js) com gráficos em tempo real e admin template
- Sistema de alertas multi-canal (WebSocket, Telegram, Email)
- CRUD de aquários, devices e parâmetros
- Leituras manuais (test kits) além de sensores automáticos
- Rede social para aquaristas (já implementada)

### Excluído do MVP
- Controle de relés/outlets (Fase 6+)
- Marketplace (Fase 7)
- Multi-tenant/SaaS (Fase 8)
- App mobile nativo
- Firmware OTA

## Arquitetura

```
┌──────────┐    MQTT     ┌────────────┐    HTTP/WS    ┌────────────┐
│  ESP32   │ ──────────→ │  Mosquitto │ ←───────────→ │  FastAPI   │
│ Sensores │             │  Broker    │               │  Backend   │
│ (ctrl1)  │             └────────────┘               └─────┬──────┘
└──────────┘                                                │
                                                            │ SQLAlchemy async
                                                            ▼
┌──────────────┐    HTTP/WS    ┌─────────────────────────────────┐
│   Next.js    │ ←───────────→ │  PostgreSQL 16 + TimescaleDB    │
│   Frontend   │               └─────────────────────────────────┘
└──────────────┘
```

## Setup do Ambiente

```bash
cd /home/carlosfarah/Projects/aquario
cp .env.example .env
./infrastructure/scripts/setup.sh
make up
make migrate
make seed
```

## Links e Referências

- Repositório: `/home/carlosfarah/Projects/aquario`
- Documentação: `/home/carlosfarah/Projects/aquario/docs/`
- Plano de implantação: `docs/dev/PLANO_IMPLANTACAO.md`
- Template admin: `docs/Admin-Dashboard/` (referência visual para frontend)

## OKRs Vinculados

- OKR-2026-Q1-01: Entregar MVP AquaBook com monitoramento completo

## Notas

- Arquitetura async-first (FastAPI + asyncpg + SQLAlchemy async)
- Autenticação JWT (access 15min + refresh 7d)
- WebSockets para atualização em tempo real
- Template Admin-Dashboard (Bootstrap 5) usado como referência visual, recriado em React/Tailwind/shadcn
- Hot-reload via docker-compose.override.yml
