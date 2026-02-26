---
id: sprint-013
title: "Sprint 13 — Identidade Visual AquaBook"
goal: "Aplicar a nova identidade visual da marca AquaBook ao frontend, incluindo paleta de cores, tipografia e logotipo"
start_date: "2026-02-15"
end_date: "2026-02-22"
status: completed
project: aquario
capacity: 8
created_by: claude-code
okrs: [OKR-2026-Q1-01]
acted_by:
  - agent: claude-code
    action: created
    date: "2026-02-15T21:00:00-03:00"
---

## Objetivo do Sprint

Aplicar a identidade visual documentada em `docs/assets/identidade_visual_aqua_book.md` ao frontend do AquaBook. Executar em camadas incrementais para minimizar risco e facilitar revisao.

## Tarefas Planejadas

| ID | Titulo | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0111 | Identidade Visual: paleta de cores (CSS variables) | 3 | high | — |
| TASK-0112 | Identidade Visual: tipografia (Poppins + Inter) | 2 | high | — |
| TASK-0113 | Identidade Visual: logotipo e favicon | 2 | medium | — |
| TASK-0114 | Identidade Visual: border-radius e sombras | 1 | low | — |

**Total de Pontos**: 8

## Dependencias

```
TASK-0111 (cores)
    |
    └-> TASK-0112 (tipografia)
          |
          └-> TASK-0113 (logotipo)
                |
                └-> TASK-0114 (border-radius e sombras)
```

## Referencia

- Documento de identidade visual: `docs/assets/identidade_visual_aqua_book.md`
- Logos: `docs/assets/favicon.png`, `docs/assets/nome_isolado.png`

## Criterios de Aceite da Sprint

- [ ] Paleta de cores alinhada ao documento (Azul Profundo, Azul Oceano, Verde Aqua)
- [ ] Tipografia Poppins para titulos e Inter para corpo
- [ ] Logotipo e favicon atualizados
- [ ] Cards com border-radius 16px e sombra suave
