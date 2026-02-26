---
id: sprint-002
title: "AquaBook Fase 1 — Fundação: Models, DB e Infraestrutura"
goal: "Criar estrutura de banco de dados completa para monitoramento (models, migrations, hypertables, seed data) com Docker funcional"
start_date: "2026-02-28"
end_date: "2026-03-13"
status: completed
project: aquario
capacity: 21
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-14T10:00:00-03:00"
---

## Objetivo do Sprint

Estabelecer a fundação do sistema de monitoramento AquaBook. Criar todos os models SQLAlchemy para aquários, devices, parâmetros, leituras e alertas. Gerar e rodar a primeira migration Alembic (unificando models sociais existentes + monitoramento). Configurar TimescaleDB hypertable para sensor_readings. Criar catálogo de parâmetros como seed data.

**Ao final deste sprint:** `docker compose up` funcional com schema completo no banco, pronto para receber dados.

## Tarefas Planejadas

| ID | Título | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0010 | Criar models SQLAlchemy para monitoramento | 5 | critical | claude-code |
| TASK-0011 | Criar schemas Pydantic para monitoramento | 3 | high | claude-code |
| TASK-0012 | Gerar e rodar migration Alembic inicial | 3 | critical | claude-code |
| TASK-0013 | Configurar TimescaleDB hypertable | 2 | high | claude-code |
| TASK-0014 | Criar catálogo de parâmetros (seed data) | 3 | high | claude-code |
| TASK-0015 | Configurar init SQL + validar docker-compose | 2 | medium | claude-code |
| TASK-0016 | Setup pytest com fixtures async e smoke test | 2 | medium | claude-code |

**Total de Pontos**: 20 / 21

## OKRs Vinculados

- OKR-2026-Q1-01: Entregar MVP AquaBook — contribui para KR-04 (fase 1 de 5)

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Métricas
- **Pontos planejados**: 20
- **Pontos entregues**: 0
- **Velocidade**: 0 pts/sprint
- **Taxa de conclusão**: 0%
