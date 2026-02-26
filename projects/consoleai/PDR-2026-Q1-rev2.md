---
id: PDR-2026-Q1-rev2
project: "consoleai"
period: "2026-Q1"
created_at: "2026-02-25T01:00:00-03:00"
created_by: "claude-code"
status: approved
replaces: PDR-2026-Q1
---

# PDR — ConsoleAI (2026-Q1 rev2)

> Revisao incremental do PDR-2026-Q1.
> Contexto: migracao React concluida na sprint-077. Este PDR cobre os itens pendentes do Q1.

## 1. Visao do Produto

### 1.1 Problema

O ConsoleAI opera com 57 tenants AWS Organizations, todos com custo e inventario visivel
no React frontend — porem a persistencia e fragmentada (SQLite) e faltam as camadas de
inteligencia: tendencias de custo, rightsizing, Savings Plans contextualizados e rastreabilidade
de quem visualizou dados financeiros sensiveis.

### 1.2 Proposta de valor

Completar a integracao AWS no ConsoleAI com: persistencia PostgreSQL unificada,
recomendacoes de otimizacao de custo (Savings Plans + Rightsizing), custo visivel
no fluxo de aprovacao operacional e observabilidade completa (logs, audit, E2E tests).

### 1.3 Usuarios/Stakeholders

- **DevOps Gestor**: aprova chamados vendo custo do recurso, acompanha tendencia de custo
- **DevOps Executor**: solicita acoes, ve recomendacoes de rightsizing por tenant
- **Gestor Financeiro**: acompanha Savings Plans e projecoes por OU
- **Administrador**: gerencia infra, monitora observabilidade e logs

---

## 2. Estado Atual

### 2.1 O que ja existe (pos sprint-077)

**Frontend React (Vite + Mantine + AdminLTE):**
- Auth Bearer com persistencia Zustand + localStorage
- Seletor de tenant pesquisavel no header (57 tenants)
- Dashboard com KPIs de custo e auditoria por tenant
- Paginas FinOps: Sumario, Fase1, FinopsTenant, Pendentes, Relatorio, Inventario
- Paginas Operacionais: Recursos (EC2/ELB/Domains), Chamados (workflow), Auditoria
- Paginas Admin: Usuarios & Tenants, Configuracoes (budget por tenant)

**Backend FastAPI:**
- Auth endpoints: /api/auth/login, /api/auth/me, /api/auth/logout
- Budget endpoints: /api/tenants/:id/budget/me, POST configurar budget
- Inventory: /api/tenants/:id/inventory/ec2, elb, domains
- Audit: /api/audit/:tenant_id
- Workflow: /api/tenants/:id/workflow (chamados)
- Org sync diario via AWS Organizations

**Infraestrutura:**
- Docker Compose: nginx + api + frontend + ui(Streamlit legado) + certbot
- Deploy via GitLab CI/CD com rsync + docker compose --build
- WAF AWS com allowlist de IPs
- ALB com SSL termination

### 2.2 Metricas atuais

| Metrica | Valor |
|---------|-------|
| Tasks concluidas | 34 |
| Tasks pendentes | 0 |
| Pontos entregues | 116 SP |
| Sprints consoleai completados | 7 |
| Velocidade media | 15-17 SP/sprint |
| OKRs ativos | 1 (OKR-2026-Q1-03) |

### 2.3 Divida tecnica

- Persistencia FinOps ainda em SQLite (consoleai.db) — sem PostgreSQL
- Container Streamlit (consoleai-ui) ainda rodando sem uso real
- Pages legadas (fase1/2/3.py) coexistem com frontend React
- Logs boto3 nao estruturados — dificulta rastreabilidade de chamadas AWS
- OKR-2026-Q1-03 KRs nunca atualizados com progresso real

---

## 3. Gap Analysis

### 3.1 Funcionalidades faltantes

1. **[P0] Migracao PostgreSQL** — schema + ETL SQLite + atualizar services
2. **[P1] Savings Plans por OU** — endpoint API + pagina React com cenarios de economia
3. **[P1] Custo no fluxo de aprovacao** — exibir custo mensal do recurso ao revisar chamado
4. **[P1] Logs estruturados boto3** — JSON logs em cost_service, inventory_service, domain_service
5. **[P1] Audit trail de visualizacoes** — registrar quem viu dados de custo e quando
6. **[P1] Testes E2E** — Playwright cobrindo auth, dashboard e fluxo de chamado
7. **[P2] Trend chart de custo** — grafico dos ultimos 3 meses por tenant
8. **[P2] Rightsizing recommendations** — CloudWatch metrics + custo para sugerir resize
9. **[P2] Export PDF por tenant** — relatorio custo + inventario em PDF
10. **[P2] Remover legado Streamlit** — container ui e pages/ desnecessarios

### 3.2 Requisitos nao-funcionais

- **Performance**: dashboard < 3s com cache ativo (KR-04 do OKR)
- **Seguranca**: zero cross-tenant em dados de custo
- **Observabilidade**: logs JSON em todas as chamadas boto3 criticas
- **Rastreabilidade**: audit trail de acesso a dados financeiros por usuario/tenant

### 3.3 Dependencias externas

- PostgreSQL instance disponivel no servidor de producao
- AWS Cost Explorer API com permissoes ce:GetCostAndUsage e organizations
- CloudWatch metrics para rightsizing (GetMetricStatistics)

---

## 4. Decisoes Tecnicas

### 4.1 Arquitetura alvo

```
React SPA (Vite + Mantine)
  └── Bearer auth → FastAPI
        ├── PostgreSQL (persistencia unificada)
        │    ├── auth.db migrada
        │    ├── cost_cache (TTL 1h)
        │    ├── finops_decisions
        │    └── audit_log (visualizacoes)
        ├── AWS Cost Explorer (cached)
        ├── AWS CloudWatch (rightsizing)
        └── AWS Organizations (org_sync diario)
```

### 4.2 Trade-offs

| Decisao | Opcao escolhida | Alternativa | Justificativa |
|---------|-----------------|-------------|---------------|
| Persistencia | PostgreSQL | Manter SQLite | Queries relacionais + transacoes |
| Rightsizing | CloudWatch GetMetricStatistics | Trusted Advisor | Controle direto + sem custo adicional |
| E2E tests | Playwright | Cypress | Melhor suporte TypeScript + headless |
| Legado | Remover Streamlit na sprint-079 | Manter | Reducao de overhead do container |

### 4.3 Riscos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| PostgreSQL nao disponivel no servidor | Media | Alto | Verificar disponibilidade antes da sprint-078 |
| CloudWatch sem dados suficientes para rightsizing | Alta | Medio | Fallback: exibir apenas custo sem recomendacao |
| ETL com perda de dados historicos | Baixa | Alto | Backup SQLite antes do ETL + validacao de contagens |

---

## 5. Priorizacao

### 5.1 Must-have P0

1. Schema e migracao PostgreSQL (TASK-0557, TASK-0558, TASK-0559)

### 5.2 Should-have P1

1. Savings Plans por OU contextualizado (TASK-0560)
2. Custo no fluxo de aprovacao de chamados (TASK-0561)
3. Logs estruturados boto3 (TASK-0562)
4. Audit trail de visualizacoes de custo (TASK-0563)
5. Testes E2E Playwright (TASK-0564)

### 5.3 Nice-to-have P2

1. Trend chart de custo 3 meses (TASK-0565)
2. Rightsizing recommendations (TASK-0566)
3. Export PDF por tenant (TASK-0567)
4. Documentacao API Swagger (TASK-0568)
5. Performance dashboard < 3s (TASK-0569)
6. Remover legado Streamlit (TASK-0570)
7. Testes de integracao finais (TASK-0571)

### 5.4 Criterios de priorizacao

- P0: eliminar divida tecnica critica (SQLite)
- P1: completar integracao AWS com valor direto ao usuario
- P2: polimento, performance e limpeza

---

## 6. Estimativa de Esforco

| Categoria | Tasks | Pontos | Sprints |
|-----------|-------|--------|---------|
| P0 - Must-have | 3 | 8 SP | 0.5 |
| P1 - Should-have | 5 | 13 SP | 1.0 |
| P2 - Nice-to-have | 7 | 16 SP | 1.0 |
| **Total** | **15** | **37 SP** | **2 sprints** |

Capacidade: 21 SP/sprint. Folga de 5 SP para bugs e ajustes.

---

## 7. Roadmap Visual (IDs definitivos)

```
Q1 2026 — ConsoleAI: Integracao AWS Completa
OKR: OKR-2026-Q1-03
============================================================
sprint-078 (Feb 25 – Mar 10) [P0 + P1] — 21 SP
  ├── TASK-0557: Schema PostgreSQL FinOps (2 SP)
  ├── TASK-0558: ETL SQLite -> PostgreSQL (3 SP)
  ├── TASK-0559: Atualizar services para PostgreSQL (3 SP)
  ├── TASK-0560: Savings Plans por OU — API + React (3 SP)
  ├── TASK-0561: Custo no fluxo de aprovacao de chamados (2 SP)
  ├── TASK-0562: Logs estruturados boto3 (2 SP)
  ├── TASK-0563: Audit trail de visualizacoes de custo (3 SP)
  └── TASK-0564: Testes E2E Playwright (3 SP)

sprint-079 (Mar 11 – Mar 24) [P2 + Finalizacao] — 16 SP
  ├── TASK-0565: Trend chart de custo 3 meses (3 SP)
  ├── TASK-0566: Rightsizing recommendations CloudWatch (3 SP)
  ├── TASK-0567: Export PDF por tenant (2 SP)
  ├── TASK-0568: Documentacao API Swagger (1 SP)
  ├── TASK-0569: Performance dashboard < 3s (2 SP)
  ├── TASK-0570: Remover legado Streamlit (3 SP)
  └── TASK-0571: Testes de integracao finais + OKR update (2 SP)
```

---

## 8. Criterios de Sucesso

Vinculados ao OKR-2026-Q1-03:

1. PostgreSQL ativo em producao com todos os dados migrados do SQLite
2. Savings Plans contextualizados exibidos para todos os tenants com dados
3. Custo do recurso visivel na tela de revisao de chamados
4. Logs JSON em 100% das chamadas boto3 criticas
5. Suite E2E cobrindo auth + dashboard + chamado flow (0 falhas)
6. Dashboard carregando em < 3s com cache ativo

---

## 9. Historico de Revisoes

| Data | Autor | Mudanca |
|------|-------|---------|
| 2026-02-23 | claude-code | Criacao inicial (PDR-2026-Q1) |
| 2026-02-25 | claude-code | Rev2: arquitetura React entregue, replanejar P0/P1/P2 pendentes |
