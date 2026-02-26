---
id: sprint-076
title: "WAF Akamai - Consolidação Porta 443 HML"
goal: "Migrar todos os serviços públicos do ALB HML para compartilhar o listener 443, configurar roteamento por host_header, integrar com WAF Akamai e validar endpoints"
start_date: "2026-02-24"
end_date: "2026-03-09"
status: active
capacity: 21
created_by: "claude-code"
okrs: []
acted_by:
  - agent: "claude-code"
    action: created
    date: "2026-02-24T00:00:00-03:00"
---

## Objetivo do Sprint

Consolidar os listeners do ALB público HML na porta 443 com roteamento por host_header, eliminando listeners em portas não-padrão (8080, 8001, 12170, 12186, 9021). A mudança inclui refatoração do módulo ALB, atualização dos stages HML (load balancer, security groups, route53), configuração do Akamai como WAF/CDN e validação completa dos endpoints após a mudança.

## Tarefas Planejadas

| ID | Título | Pontos | Prioridade | Assigned |
|----|--------|--------|------------|----------|
| TASK-0548 | Refatorar módulo ALB para suportar host_header e create_listener | 3 | high | - |
| TASK-0549 | Atualizar locals_load_balancer.tf do HML para porta 443 | 3 | high | - |
| TASK-0550 | Atualizar Security Groups do ALB público HML | 2 | high | - |
| TASK-0551 | Sincronizar Route53 HML com DNS Akamai no Terraform | 2 | high | - |
| TASK-0552 | Configurar origins no painel Akamai para ALB HML | 2 | high | - |
| TASK-0553 | Atualizar upstreams do Kong HML (media e mdm) | 2 | medium | - |
| TASK-0554 | Executar terraform plan e validar diff HML | 2 | high | - |
| TASK-0555 | Aplicar terraform apply HML (janela de manutenção) | 1 | critical | - |
| TASK-0556 | Validar endpoints após apply HML | 1 | high | - |

**Total de Pontos**: 18 / 21

## OKRs Vinculados

- Nenhum OKR vinculado nesta sprint

## Retrospectiva

{Preenchido ao final do sprint}

### O que foi bem
- {item}

### O que pode melhorar
- {item}

### Métricas
- **Pontos planejados**: 18
- **Pontos entregues**: 0
- **Velocidade**: 0 pts/sprint
- **Taxa de conclusão**: 0%
