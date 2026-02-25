# Procedimento de QA Backend — Aquario

> Documento obrigatorio para o agente QA (codex) ao validar tasks de backend.
> Resolve problemas recorrentes de gate falhando por ambiente Docker sujo.

---

## 1. Pre-requisitos de Ambiente

### 1.1 Garantir containers limpos

O banco de testes pode ficar em estado inconsistente (tabelas orfas, locks, schema parcial).
**SEMPRE** resetar antes de rodar gates:

```bash
cd /home/carlosfarah/Projects/aquario

# Opcao A: Rebuild completo (recomendado para primeira execucao)
docker compose down -v && docker compose up -d --build

# Opcao B: Apenas recriar o banco de testes
docker compose exec -T postgres psql -U aquario -c "DROP DATABASE IF EXISTS aquario_test;"
docker compose exec -T postgres psql -U aquario -c "CREATE DATABASE aquario_test OWNER aquario;"
```

### 1.2 Aguardar banco pronto

Apos restart, aguardar 5-10 segundos para o PostgreSQL aceitar conexoes.

```bash
docker compose exec -T postgres pg_isready -U aquario
```

---

## 2. Gate Obrigatorio

```bash
cd /home/carlosfarah/Projects/aquario && make test
```

- O resultado esperado e **59 passed** (ou mais, conforme novas tasks adicionem testes)
- Exit 0 = OK

---

## 3. Troubleshooting de Erros Conhecidos

| Erro | Causa | Solucao |
|------|-------|---------|
| `UndefinedTableError: table "alert_events" does not exist` | Schema de teste incompleto/corrompido | Resetar banco (secao 1.1 opcao B) |
| `Future attached to a different loop` | Event loop mismatch no asyncpg | Ja corrigido: `asyncio_default_test_loop_scope = "session"` em pyproject.toml. Se persistir, fazer `docker compose down -v && docker compose up -d --build` |
| `DeadlockDetectedError` | Estado transacional sujo entre testes | Resetar banco (secao 1.1 opcao B) |
| `UniqueViolationError` em `create_all` | Tabelas pre-existentes conflitando | Resetar banco (secao 1.1 opcao B) |
| `DependentObjectsStillExistError` em `drop_all` | Foreign keys impedindo drop | Resetar banco (secao 1.1 opcao B) |
| `relation "users" does not exist` | Schema nao criado corretamente | Resetar banco (secao 1.1 opcao B) |
| Testes passam localmente mas falham no Docker | Imagem desatualizada | `docker compose build --no-cache backend` |

### Regra geral:
Todos esses erros sao problemas de **estado do ambiente**, nao do codigo.
Se `make test` falha, resetar o banco e tentar novamente ANTES de reprovar.

---

## 4. Validacao Funcional

Alem do gate, verificar no codigo que:

1. Endpoints existem e retornam os status corretos (200, 201, 422, 404)
2. Ownership check presente (usuario so acessa seus proprios aquarios)
3. Schemas Pydantic com validacao adequada
4. Testes cobrem os cenarios descritos nos criterios de aceite

---

## 5. Resultado do QA

### Aprovar:
- Mover para `done/`
- Adicionar `acted_by` com `action: approved`

### Reprovar:
- Manter em `review/` (NAO mover para in-progress)
- Adicionar nota com bloqueador(es) objetivo(s)
- **NAO reprovar por erros de banco/environment.** Se o erro e um dos listados na secao 3, resetar o banco e retestar.

---

## 6. Estado Atual dos Testes

Ultima execucao validada pelo claude-code em 2026-02-14 19:55:
```
$ cd /home/carlosfarah/Projects/aquario && make test
59 passed in 18.18s
```

Se voce observar um numero diferente de testes, verifique se o banco esta limpo (secao 1.1).
