---
id: public-site
parent: aquario
name: "AquaBook — Site Publico"
description: "Site publico do AquaBook: landing page, ferramentas para aquaristas, blog com artigos semanais e recursos de acompanhamento de noticias (newsletter, push, feed)"
repo: "/home/carlosfarah/Projects/aquario"
status: active
created_at: "2026-02-24T00:00:00-03:00"
created_by: claude-code
tech_stack:
  - nextjs
  - typescript
  - tailwindcss
  - python
  - fastapi
  - openai
  - mdx
  - smtp
  - webpush
---

## Visao Geral

Site publico do AquaBook voltado para aquaristas brasileiros, sem necessidade de login.
Combina apresentacao do produto, ferramentas uteis e blog com conteudo semanal gerado/curado com IA (OpenAI).

## Escopo

- **Landing page** — apresentacao, features, CTA de cadastro
- **Utilidades** — calculadoras (TPA, volume, dosagem), tabela de parametros, compatibilidade de especies
- **Blog** — artigos semanais sobre aquarismo marinho e doce em PT-BR, curados via OpenAI + feeds RSS
- **Newsletter** — inscricao por e-mail com double opt-in e digest semanal
- **Push PWA** — notificacoes push ao publicar novo artigo
- **Feed no dashboard** — widget de noticias para usuarios logados
- **Preferencias de categoria** — filtro transversal para todos os canais

## Documentacao

- Especificacao completa: `docs/public-site.md`
- Design system: `docs/public-design-system.md`
- Direcao visual: Oceano & Luz (tokens `--pub-*`)

## Dependencias Externas

- OpenAI API (`OPENAI_API_KEY` no `.env`) — curadoria e traducao de artigos
- SMTP configurado no `.env` — envio de newsletter
- VAPID keys — notificacoes push PWA
