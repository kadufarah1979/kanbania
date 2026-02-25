# Dashboard — Operacao e Atualizacao

Guia de referencia para reiniciar, atualizar e depurar o dashboard do Kanbania.

---

## Status rapido (checar em 30 segundos)

```bash
# 1. Quais processos estao nas portas?
ss -tlnp | grep -E "8765|8766"
# Esperado:
#   0.0.0.0:8765  users:(("next-server ..."))
#   0.0.0.0:8766  users:(("node" ou "tsx" ...))

# 2. Os servidores respondem?
curl -s -o /dev/null -w "Next.js: %{http_code}\n" http://localhost:8765/home
curl -s -o /dev/null -w "WS server: %{http_code}\n" http://localhost:8766/
# Esperado: Next.js: 200  |  WS server: 404 (nao tem rota GET /, e correto)

# 3. Os chunks JS estao sendo servidos? (se nao, React nao hidrata)
curl -s -o /dev/null -w "Chunks: %{http_code}\n" \
  "http://localhost:8765/_next/static/chunks/webpack-$(ls .next/static/chunks/webpack-*.js | head -1 | xargs basename | sed 's/.js//'  ).js"
# Esperado: Chunks: 200  |  Se retornar 404: matar e reiniciar o Next.js
```

---

## Arquitetura de processos

| Processo | Comando | Porta | Descricao |
|---|---|---|---|
| Next.js (frontend) | `node .next/standalone/server.js` | **8765** | App React/Next.js servido em modo standalone |
| WebSocket + Webhook | `npx tsx server.ts` | **8766** | Server TS que emite eventos WS e recebe webhooks do GitLab |

> **Atencao:** existe um container Docker legado `dashboard-dashboard-1` que tambem tentava usar a porta 8765.
> Ele esta parado (`docker stop dashboard-dashboard-1`) e nao deve ser reiniciado.
> Se reiniciar a maquina e a porta 8765 estiver ocupada por `docker-proxy`, execute:
> `docker stop dashboard-dashboard-1`

---

## Como reiniciar apos build

```bash
cd /home/carlosfarah/kanbania/dashboard

# 1. Garantir portas livres
sudo fuser -k 8765/tcp 2>/dev/null || true
sudo fuser -k 8766/tcp 2>/dev/null || true

# 2. Copiar arquivos estaticos para o standalone (OBRIGATORIO apos cada build)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

# 3. Subir Next.js standalone
KANBAN_ROOT=/home/carlosfarah/kanbania PORT=8765 \
  nohup node .next/standalone/server.js > /tmp/kanbania-next.log 2>&1 &

# 4. Subir WebSocket server
KANBAN_ROOT=/home/carlosfarah/kanbania WS_PORT=8766 \
  nohup npx tsx server.ts > /tmp/kanbania-ws.log 2>&1 &

# 5. Verificar
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:8765/
# Esperado: 307 ou 200
tail -2 /tmp/kanbania-ws.log
# Esperado: "[WS] HTTP + WebSocket server running on port 8766"
```

---

## Fluxo de atualizacao do dashboard

Sempre que houver mudanca em `dashboard/src/` ou `dashboard/server.ts`:

```bash
cd /home/carlosfarah/kanbania/dashboard

# 1. Build (Next.js standalone)
npm run build

# 2. Copiar estaticos (passo critico — sem isso o React nao carrega no browser)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

# 3. Parar e reiniciar servidores
sudo fuser -k 8765/tcp 2>/dev/null || true
sudo fuser -k 8766/tcp 2>/dev/null || true
KANBAN_ROOT=/home/carlosfarah/kanbania PORT=8765 \
  nohup node .next/standalone/server.js > /tmp/kanbania-next.log 2>&1 &
KANBAN_ROOT=/home/carlosfarah/kanbania WS_PORT=8766 \
  nohup npx tsx server.ts > /tmp/kanbania-ws.log 2>&1 &
```

> **Sobre output: standalone**
> O Next.js usa `output: standalone` (`next.config.js`). O `npm run build` gera `.next/standalone/`
> com tudo necessario para rodar, MAS os arquivos estaticos (JS/CSS do browser) ficam em
> `.next/static/` e devem ser copiados manualmente para `.next/standalone/.next/static/`.
> Sem essa copia, a pagina carrega o HTML mas o React nunca inicializa — fica eternamente
> no skeleton de loading.
>
> NAO usar `next start` — nao funciona com standalone e ignora o `PORT`.

---

## Sobre o WS server (server.ts)

O `server.ts` usa chokidar v5 (ESM-only). Nao pode ser compilado para CommonJS nem rodado via `ts-node --esm` (falha com ERR_UNKNOWN_FILE_EXTENSION no Node 18).

**Comando correto:** `npx tsx server.ts`

`tsx` trata TypeScript com suporte nativo a ESM sem necessidade de configuracao adicional.

Nao usar:
- `node dist/server.js` — CommonJS, quebra com chokidar
- `npx ts-node --esm server.ts` — falha ERR_UNKNOWN_FILE_EXTENSION no Node 18

---

## Depuracao

```bash
# Logs em tempo real
tail -f /tmp/kanbania-next.log
tail -f /tmp/kanbania-ws.log

# Verificar portas (sem sudo funciona para ver processos proprios)
ss -tlnp | grep -E "8765|8766"

# Testar APIs
curl -s http://localhost:8765/api/board | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,len(v)) for k,v in d.items()]"
curl -s http://localhost:8765/api/agents/status

# Container Docker legado (nao deve estar rodando)
docker ps | grep dashboard
```

---

## Variaveis de ambiente relevantes

| Variavel | Arquivo | Valor padrao | Descricao |
|---|---|---|---|
| `KANBAN_ROOT` | `.env.local` | `/home/carlosfarah/kanbania` | Raiz do repositorio kanban |
| `PORT` | env ao iniciar | `3000` | Porta do Next.js — definir como `8765` |
| `WS_PORT` | env ao iniciar | `8766` | Porta do WebSocket server |
| `NEXT_PUBLIC_WS_URL` | `.env.local` | auto-detect | URL do WS para o cliente (deixar vazio para auto) |

---

## Historico de incidentes

### 2026-02-23 — Pagina travada no skeleton de loading
- **Sintoma:** Board carrega HTML mas fica eternamente no skeleton, React nao inicializa
- **Causa:** Arquivos estaticos (`.next/static/`) nao copiados para `.next/standalone/.next/static/` apos o build — JS do browser nunca foi servido
- **Resolucao:** `cp -r .next/static .next/standalone/.next/static` + reinicio do servidor
- **Prevencao:** Sempre copiar estaticos apos `npm run build` (ver fluxo acima)

### 2026-02-23 — WS server falhando com ts-node
- **Sintoma:** `ERR_UNKNOWN_FILE_EXTENSION` ou `ERR_REQUIRE_ESM` ao iniciar server.ts
- **Causa:** chokidar v5 e ESM-only; ts-node no Node 18 nao consegue resolver o modulo
- **Resolucao:** Usar `npx tsx server.ts` em vez de `npx ts-node --esm server.ts`

### 2026-02-23 — Porta 8765 bloqueada por docker-proxy
- **Sintoma:** ERR_CONNECTION_RESET ao acessar `localhost:8765`
- **Causa:** Container `dashboard-dashboard-1` (instalacao Docker antiga) parado internamente, mas `docker-proxy` (root) ainda segurava a porta 8765
- **Resolucao:** `docker stop dashboard-dashboard-1` + reinicio dos processos Node
- **Prevencao:** Container Docker do dashboard nao deve ser reiniciado; usar processos Node diretos

### 2026-02-23 — Pagina branca apos reinicio (chunks JS retornam 404)
- **Sintoma:** Dashboard carrega HTML/nav mas fica branco — React nao hidrata; `/_next/static/chunks/*.js` retornam 404
- **Causa:** Processo Next.js antigo entrou em estado corrompido apos `npm run build` substituir o diretorio `.next/standalone/`. O processo continuava servindo HTML das paginas (via cache em memoria) mas perdia a capacidade de servir arquivos estaticos do disco
- **Diagnostico:** `curl -o /dev/null -w "%{http_code}" http://localhost:8765/_next/static/chunks/webpack-*.js` retorna 404 mesmo com o arquivo existindo em disco
- **Resolucao:** `kill <pid>` do processo next-server + `cp -r .next/static .next/standalone/.next/static` + reinicio limpo
- **Como achar o PID:** `ss -tlnp | grep 8765` (mostra o pid na coluna Process)
- **Prevencao:** Sempre matar o processo antigo antes de reiniciar — nunca confiar que um servidor sobreviveu a um `npm run build`
