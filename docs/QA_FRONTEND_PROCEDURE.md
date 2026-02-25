# Procedimento de QA Frontend — Aquario

> Documento obrigatorio para o agente QA (codex) ao validar tasks de frontend.
> Resolve problemas recorrentes de gate falhando por ambiente sujo.

---

## 1. Pre-requisitos de Ambiente

### 1.1 Limpar `.next` com permissoes corretas

O `.next` pode ter sido gerado como `root:root` (ex: build via Docker).
**SEMPRE** limpar antes de rodar gates:

```bash
# Opcao A: corrigir ownership (se souber o user correto)
sudo chown -R $(whoami):$(whoami) /home/carlosfarah/Projects/aquario/frontend/.next 2>/dev/null

# Opcao B: remover e deixar rebuildar (preferido)
sudo rm -rf /home/carlosfarah/Projects/aquario/frontend/.next
```

### 1.2 Garantir node_modules atualizados

```bash
cd /home/carlosfarah/Projects/aquario/frontend && npm ci
```

---

## 2. Gates Obrigatorios

Rodar na ordem. **Ambos devem passar** para aprovar.

### Gate 1: TypeScript

```bash
cd /home/carlosfarah/Projects/aquario/frontend && npx tsc --noEmit
```

- Exit 0 = OK
- **NAO** depende de `.next/types` — se der `TS6053` referenciando `.next/types`, significa que `.next` esta sujo. Limpar com a opcao B acima e rerodar.

### Gate 2: Build de producao

```bash
cd /home/carlosfarah/Projects/aquario/frontend && npm run build
```

- Exit 0 = OK
- Se falhar com `EACCES` → limpar `.next` (secao 1.1)
- Se falhar com `webpack errors` generico → limpar `.next` e rerodar
- Se falhar com `EAI_AGAIN fonts.googleapis.com` → erro de rede, NAO e bloqueador da task
- Rodar 2x se suspeitar de flake

---

## 3. Checklist Design System

Referencia completa: `docs/dev/DESIGN_SYSTEM.md`

Para cada arquivo `.tsx` tocado pela task, verificar:

| # | Regra | Como verificar |
|---|-------|----------------|
| 1 | Sem cores hardcoded | `grep -E 'text-(white|black|red|green|blue|yellow|emerald|amber|purple|gray|slate|zinc|neutral|stone|orange|teal|cyan|sky|indigo|violet|pink|rose|fuchsia|lime)-' arquivo.tsx` deve retornar vazio |
| 2 | Sem box-shadow | `grep -E 'shadow-(sm|md|lg|xl|2xl|inner)' arquivo.tsx` deve retornar vazio |
| 3 | Sem transition-all | `grep 'transition-all' arquivo.tsx` deve retornar vazio |
| 4 | Icones lucide-react | Imports de icone devem vir de `lucide-react` |
| 5 | Status colors | Online/OK=`status-ok`, Warning=`status-warn`, Critical/Error=`status-crit`, Offline=`status-off` |
| 6 | Font mono | Valores numericos/timestamps com `font-mono` |
| 7 | Touch targets | Botoes/links interativos com `min-h-[44px]` ou `p-3`+ |
| 8 | Focus ring | Elementos clicaveis com `focus-visible:ring-2 focus-visible:ring-ring` |

### Comando rapido DS (rodar na raiz do frontend):

```bash
cd /home/carlosfarah/Projects/aquario/frontend/src

# Cores hardcoded (ignorar chart config com hex intencional)
grep -rn --include='*.tsx' -E '(text|bg|border)-(white|black|red|green|blue|yellow|emerald|amber|purple)-[0-9]' app/ components/ | grep -v 'chart' | grep -v 'node_modules'

# Box shadow
grep -rn --include='*.tsx' -E 'shadow-(sm|md|lg|xl)' app/ components/

# Transition-all
grep -rn --include='*.tsx' 'transition-all' app/ components/
```

---

## 4. Validacao Funcional por Task

Alem dos gates, cada task tem criterios de aceite especificos.
O QA deve verificar **no codigo** que:

1. A funcionalidade descrita nos criterios esta implementada
2. Empty states existem para listas vazias
3. Loading/error states existem
4. Null/undefined handling (ex: `last_seen_at` null mostra "Nunca")

---

## 5. Resultado do QA

### Aprovar:
- Mover para `done/`
- Adicionar `acted_by` com `action: approved`

### Reprovar:
- Manter em `review/` (NAO mover para in-progress — o claude-code verifica review tambem)
- Adicionar nota com: bloqueador(es) objetivo(s) e comando(s) exato(s) para reproduzir
- **NAO reprovar por gate falhando se o motivo for `.next` sujo ou erro de rede**

---

## 6. Problemas Conhecidos

| Problema | Causa | Solucao |
|----------|-------|---------|
| `EACCES .next/server/*` | `.next` criado como root via Docker | `sudo rm -rf frontend/.next` |
| `TS6053 .next/types` | TypeScript procura types de build anterior | Limpar `.next` e rerodar |
| `webpack errors` sem stack | `.next` corrupto | Limpar `.next` e rerodar |
| `EAI_AGAIN fonts.googleapis.com` | Sem acesso a internet | NAO e bloqueador |
| `MODULE_NOT_FOUND middleware-manifest` | Build anterior incompleto | Limpar `.next` e rerodar |
