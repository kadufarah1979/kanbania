#!/usr/bin/env node
/**
 * post-to-x.js — Publica no X (Twitter) quando uma task é movida para done.
 *
 * Uso: node scripts/post-to-x.js <caminho-do-arquivo-task>
 *
 * Credenciais lidas de config.local.yaml (gitignored).
 * Configuracao de template lida de config.yaml.
 */

import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

// ── Parsers simples ────────────────────────────────────────────────────────────

function parseYaml(text) {
  const obj = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^(\w[\w_-]*):\s*"?([^"#\r\n]*)"?\s*$/);
    if (m) obj[m[1].trim()] = m[2].trim();
  }
  return obj;
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  return parseYaml(m[1]);
}

function readNestedYaml(text, section) {
  const lines = text.split("\n");
  const result = {};
  let inSection = false;
  for (const line of lines) {
    if (line.startsWith(`${section}:`)) { inSection = true; continue; }
    if (inSection) {
      if (/^\S/.test(line) && !line.startsWith(" ") && !line.startsWith("\t")) break;
      const m = line.match(/^\s+(\w[\w_-]*):\s*"?([^"#\r\n]*)"?\s*$/);
      if (m) result[m[1].trim()] = m[2].trim();
    }
  }
  return result;
}

// ── Carrega configs ────────────────────────────────────────────────────────────

function loadConfig() {
  const localPath = resolve(ROOT, "config.local.yaml");
  const globalPath = resolve(ROOT, "config.yaml");

  if (!existsSync(localPath)) {
    console.error("[post-to-x] config.local.yaml nao encontrado. Abortando.");
    process.exit(0);
  }

  const localText = readFileSync(localPath, "utf8");
  const globalText = readFileSync(globalPath, "utf8");

  const xCreds = readNestedYaml(localText, "x_integration");
  const xConfig = readNestedYaml(globalText, "x_integration");

  return { creds: xCreds, config: xConfig, globalText };
}

// ── OAuth 1.0a ─────────────────────────────────────────────────────────────────

function oauthSign({ method, url, params, consumerKey, consumerSecret, tokenKey, tokenSecret }) {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: tokenKey,
    oauth_version: "1.0",
  };

  const allParams = { ...params, ...oauthParams };
  const enc = (s) => encodeURIComponent(s);

  const paramStr = Object.keys(allParams)
    .sort()
    .map((k) => `${enc(k)}=${enc(allParams[k])}`)
    .join("&");

  const base = [method.toUpperCase(), enc(url), enc(paramStr)].join("&");
  const signingKey = `${enc(consumerSecret)}&${enc(tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(base).digest("base64");

  oauthParams.oauth_signature = signature;

  const header = "OAuth " + Object.keys(oauthParams)
    .sort()
    .map((k) => `${enc(k)}="${enc(oauthParams[k])}"`)
    .join(", ");

  return header;
}

// ── Posta tweet ────────────────────────────────────────────────────────────────

async function postTweet(text, creds) {
  const url = "https://api.twitter.com/2/tweets";
  const body = JSON.stringify({ text });

  const authHeader = oauthSign({
    method: "POST",
    url,
    params: {},
    consumerKey: creds.api_key,
    consumerSecret: creds.api_secret,
    tokenKey: creds.access_token,
    tokenSecret: creds.access_token_secret,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`X API error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

// ── Formata tweet ──────────────────────────────────────────────────────────────

function formatTweet(task, template) {
  const map = {
    "{title}": task.title || "",
    "{id}": task.id || "",
    "{project}": task.project || "",
    "{story_points}": task.story_points || "",
    "{sprint}": task.sprint || "",
    "{labels}": task.labels ? task.labels.replace(/[\[\]]/g, "") : "",
  };

  let tweet = template || "✅ {title} #{project} #kanbania #buildinpublic";
  for (const [k, v] of Object.entries(map)) {
    tweet = tweet.replaceAll(k, v);
  }
  // Limita a 280 chars
  return tweet.slice(0, 280);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const taskFile = process.argv[2];
  if (!taskFile) {
    console.error("[post-to-x] Uso: node scripts/post-to-x.js <arquivo-task>");
    process.exit(1);
  }

  const { creds, config } = loadConfig();

  // Verifica se integracao esta habilitada
  if (config.enabled === "false") {
    console.log("[post-to-x] Integracao desabilitada em config.yaml. Saindo.");
    process.exit(0);
  }

  // Verifica credenciais
  const required = ["api_key", "api_secret", "access_token", "access_token_secret"];
  for (const key of required) {
    if (!creds[key] || creds[key].startsWith("SEU_")) {
      console.error(`[post-to-x] Credencial '${key}' nao configurada em config.local.yaml`);
      process.exit(0);
    }
  }

  // Le a task
  const taskPath = resolve(ROOT, taskFile);
  if (!existsSync(taskPath)) {
    console.error(`[post-to-x] Arquivo nao encontrado: ${taskPath}`);
    process.exit(1);
  }

  const content = readFileSync(taskPath, "utf8");
  const task = parseFrontmatter(content);

  if (!task.title) {
    console.error("[post-to-x] Task sem titulo. Abortando.");
    process.exit(0);
  }

  // Filtra por labels se configurado
  if (config.only_labels) {
    const allowed = config.only_labels.split(",").map((s) => s.trim());
    const taskLabels = (task.labels || "").replace(/[\[\]]/g, "").split(",").map((s) => s.trim());
    const match = allowed.some((l) => taskLabels.includes(l));
    if (!match) {
      console.log(`[post-to-x] Task ${task.id} sem labels correspondentes. Pulando.`);
      process.exit(0);
    }
  }

  const tweet = formatTweet(task, config.tweet_template);
  console.log(`[post-to-x] Publicando: ${tweet}`);

  const result = await postTweet(tweet, creds);
  console.log(`[post-to-x] Publicado com sucesso! ID: ${result?.data?.id}`);
}

main().catch((err) => {
  console.error("[post-to-x] Erro:", err.message);
  process.exit(1);
});
