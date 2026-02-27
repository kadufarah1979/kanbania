#!/usr/bin/env python3
"""
Template padrao para geracao de PDFs de relatorios de infraestrutura — INNOVAQ.

Uso:
    python3 pdf_report.py \
        --inputs fase1.md fase2.md \
        --output relatorio.pdf \
        --title "Titulo Principal" \
        --subtitle "Subtitulo ou descricao" \
        --tasks "TASK-0647 / TASK-0648" \
        --periodo "2026-02-13 a 2026-02-27" \
        --ambiente "PRD — AWS account 189958392649 (us-east-1)" \
        --footer "Documento gerado pelo departamento de DevOps da Amazonas Inovare"

Para uso programatico (sem CLI):
    from pdf_report import generate_pdf
    generate_pdf(
        inputs=["fase1.md", "fase2.md"],
        output="relatorio.pdf",
        title="Titulo",
        subtitle="Subtitulo",
        tasks="TASK-0647",
        periodo="2026-02-13 a 2026-02-27",
        ambiente="PRD",
        footer="Documento gerado pelo departamento de DevOps da Amazonas Inovare",
    )
"""

import re
import subprocess
import os
import argparse


# ---------------------------------------------------------------------------
# Acentuacao: restaura acentos em textos gerados sem acentos (convencao kanbania)
# ---------------------------------------------------------------------------

ACCENT_MAP = [
    ("nao ", "não "), ("Nao ", "Não "), (" nao\n", " não\n"),
    ("esta ", "está "), ("Esta ", "Está "),
    ("colecao", "coleção"), ("Colecao", "Coleção"),
    ("Regiao", "Região"), ("regiao", "região"),
    ("Periodo", "Período"), ("periodo", "período"),
    ("instancia", "instância"), ("Instancia", "Instância"),
    ("media ", "média "), ("Media ", "Média "),
    ("maximo", "máximo"), ("Maximo", "Máximo"),
    ("minimo", "mínimo"), ("Minimo", "Mínimo"),
    ("critico", "crítico"), ("Critico", "Crítico"), ("CRITICO", "CRÍTICO"),
    ("versao", "versão"), ("Versao", "Versão"),
    ("solucao", "solução"), ("Solucao", "Solução"),
    ("integracao", "integração"), ("Integracao", "Integração"),
    ("configuracao", "configuração"), ("Configuracao", "Configuração"),
    ("retencao", "retenção"), ("Retencao", "Retenção"),
    ("politica", "política"), ("Politica", "Política"),
    ("acoes", "ações"), ("Acoes", "Ações"),
    ("divergencia", "divergência"), ("Divergencia", "Divergência"),
    ("anomalia", "anomalia"),
    ("indices", "índices"), ("Indices", "Índices"),
    ("analise", "análise"), ("Analise", "Análise"),
    ("metricas", "métricas"), ("Metricas", "Métricas"),
    ("informacao", "informação"), ("Informacao", "Informação"),
    ("execucao", "execução"), ("Execucao", "Execução"),
    ("inventario", "inventário"), ("Inventario", "Inventário"),
    ("proximos", "próximos"), ("Proximos", "Próximos"),
    ("lentidao", "lentidão"), ("Lentidao", "Lentidão"),
    ("observacoes", "observações"), ("Observacoes", "Observações"),
    ("referencia", "referência"), ("Referencia", "Referência"),
    ("referencias", "referências"), ("Referencias", "Referências"),
    ("conexoes", "conexões"), ("Conexoes", "Conexões"),
    ("historico", "histórico"), ("Historico", "Histórico"),
    ("usuario", "usuário"), ("Usuario", "Usuário"),
    ("usuarios", "usuários"), ("Usuarios", "Usuários"),
    ("publico", "público"), ("Publico", "Público"),
    ("orfaos", "órfãos"), ("Orfaos", "Órfãos"),
    ("trafego", "tráfego"), ("Trafego", "Tráfego"),
    ("horario", "horário"), ("Horario", "Horário"),
    ("diagnostico", "diagnóstico"), ("Diagnostico", "Diagnóstico"),
    ("priorizacao", "priorização"), ("Priorizacao", "Priorização"),
    ("migracao", "migração"), ("Migracao", "Migração"),
    ("paginas", "páginas"), ("Paginas", "Páginas"),
    ("pagina", "página"), ("Pagina", "Página"),
    ("arquitetura", "arquitetura"),
]


def apply_accents(text: str) -> str:
    for old, new in ACCENT_MAP:
        text = text.replace(old, new)
    return text


# ---------------------------------------------------------------------------
# Markdown → HTML
# ---------------------------------------------------------------------------

def inline_format(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    return text


def md_to_html(text: str) -> str:
    lines = text.split("\n")
    html = []
    in_table = False
    in_pre = False
    in_blockquote = False
    table_rows = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Code block
        if line.startswith("```"):
            if not in_pre:
                in_pre = True
                html.append("<pre><code>")
            else:
                in_pre = False
                html.append("</code></pre>")
            i += 1
            continue

        if in_pre:
            html.append(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            i += 1
            continue

        # Table
        if "|" in line and line.strip().startswith("|"):
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(line)
            i += 1
            if i >= len(lines) or not ("|" in lines[i] and lines[i].strip().startswith("|")):
                thtml = "<table>"
                is_header = True
                for row in table_rows:
                    cells = [c.strip() for c in row.split("|")[1:-1]]
                    if all(re.match(r"^[-:]+$", c.replace(" ", "")) for c in cells):
                        is_header = False
                        continue
                    tag = "th" if is_header else "td"
                    thtml += "<tr>"
                    for cell in cells:
                        thtml += f"<{tag}>{inline_format(cell)}</{tag}>"
                    thtml += "</tr>"
                    if is_header:
                        is_header = False
                thtml += "</table>"
                html.append(thtml)
                in_table = False
                table_rows = []
            continue
        else:
            in_table = False

        # Blockquote
        if line.startswith(">"):
            content = inline_format(line[1:].strip())
            if not in_blockquote:
                in_blockquote = True
                html.append("<blockquote>")
            html.append(f"<p>{content}</p>")
            i += 1
            if i >= len(lines) or not lines[i].startswith(">"):
                html.append("</blockquote>")
                in_blockquote = False
            continue

        in_blockquote = False

        if re.match(r"^---+$", line.strip()):
            html.append("<hr>")
        elif line.startswith("### "):
            html.append(f"<h3>{inline_format(line[4:])}</h3>")
        elif line.startswith("## "):
            html.append(f"<h2>{inline_format(line[3:])}</h2>")
        elif line.startswith("# "):
            html.append(f"<h1>{inline_format(line[2:])}</h1>")
        elif line.startswith("- ") or line.startswith("* "):
            html.append(f"<ul><li>{inline_format(line[2:])}</li></ul>")
        elif re.match(r"^\d+\. ", line):
            content = re.sub(r"^\d+\. ", "", line)
            html.append(f"<ol><li>{inline_format(content)}</li></ol>")
        elif line.strip() == "":
            html.append("")
        else:
            html.append(f"<p>{inline_format(line)}</p>")

        i += 1

    return "\n".join(html)


# ---------------------------------------------------------------------------
# CSS do template
# ---------------------------------------------------------------------------

CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'DejaVu Sans', Arial, sans-serif;
  font-size: 10pt;
  line-height: 1.6;
  color: #1a1a2e;
  background: white;
}
@page {
  size: A4;
  margin: 2.2cm 2cm 2.5cm 2cm;
  @bottom-center {
    content: "%(footer)s";
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 8pt;
    color: #888;
    border-top: 1px solid #e0e0e0;
    padding-top: 6px;
    width: 100%%;
    text-align: center;
  }
  @bottom-right {
    content: "Pág. " counter(page) " / " counter(pages);
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 8pt;
    color: #aaa;
    padding-top: 6px;
  }
}
@page :first {
  margin: 0;
  @bottom-center { content: none; }
  @bottom-right  { content: none; }
}
.cover {
  height: 29.7cm; width: 21cm;
  background: linear-gradient(160deg, #0f0c29 0%%, #302b63 50%%, #24243e 100%%);
  display: flex; flex-direction: column;
  justify-content: center; align-items: flex-start;
  padding: 3cm 3cm;
  color: white;
  page-break-after: always;
  position: relative;
}
.cover-tag {
  background: rgba(99,179,237,0.2);
  border: 1px solid rgba(99,179,237,0.4);
  border-radius: 20px;
  padding: 5px 16px;
  font-size: 9pt; color: #90cdf4;
  letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 24px;
}
.cover h1 { font-size: 30pt; font-weight: 700; line-height: 1.2; color: #ffffff; margin-bottom: 10px; }
.cover-subtitle { font-size: 13pt; color: #a0aec0; margin-bottom: 12px; }
.cover-desc { font-size: 11pt; color: #718096; margin-bottom: 40px; max-width: 480px; }
.cover-divider { width: 60px; height: 3px; background: linear-gradient(90deg, #63b3ed, #9f7aea); border-radius: 2px; margin-bottom: 30px; }
.cover-meta { display: flex; flex-direction: column; gap: 10px; }
.cover-meta-item { display: flex; align-items: center; gap: 10px; }
.cover-meta-label { font-size: 8pt; color: #718096; text-transform: uppercase; letter-spacing: 0.1em; width: 100px; }
.cover-meta-value { font-size: 10pt; color: #e2e8f0; font-weight: 500; }
.cover-footer {
  position: absolute; bottom: 2cm; left: 3cm; right: 3cm;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 20px;
}
.cover-footer span { font-size: 9pt; color: #4a5568; }
.phase-divider {
  page-break-before: always;
  margin-bottom: 32px;
  padding: 20px 24px;
  background: linear-gradient(90deg, #302b63 0%%, #1a1a2e 100%%);
  border-radius: 10px;
  color: white;
}
.phase-divider .phase-label { font-size: 8pt; color: #90cdf4; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
.phase-divider h2 { font-size: 16pt; font-weight: 700; color: white; border: none; padding: 0; margin: 0; background: none; }
h1 { font-size: 16pt; font-weight: 700; color: #1a1a2e; margin: 0 0 14px 0; padding-bottom: 8px; border-bottom: 2px solid #302b63; page-break-after: avoid; }
h2 { font-size: 12pt; font-weight: 600; color: #302b63; margin: 26px 0 10px 0; padding: 7px 0 7px 12px; border-left: 4px solid #63b3ed; page-break-after: avoid; }
h3 { font-size: 10.5pt; font-weight: 600; color: #2d3748; margin: 18px 0 8px 0; page-break-after: avoid; }
p { margin: 7px 0; text-align: justify; }
strong { font-weight: 600; color: #1a1a2e; }
code { font-family: 'DejaVu Sans Mono', monospace; font-size: 8.5pt; background: #edf2f7; padding: 1px 5px; border-radius: 3px; color: #2d3748; }
pre { font-family: 'DejaVu Sans Mono', monospace; font-size: 8pt; background: #1a202c; color: #e2e8f0; padding: 12px 14px; border-radius: 6px; margin: 10px 0; white-space: pre-wrap; word-break: break-all; page-break-inside: avoid; }
pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
table { width: 100%%; border-collapse: collapse; margin: 12px 0; font-size: 8.5pt; page-break-inside: avoid; }
th { background: #2d3748; color: #e2e8f0; padding: 6px 9px; text-align: left; font-weight: 600; font-size: 8pt; }
td { padding: 5px 9px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
tr:nth-child(even) td { background: #f7fafc; }
blockquote { border-left: 4px solid #63b3ed; background: #ebf8ff; padding: 9px 13px; margin: 10px 0; border-radius: 0 6px 6px 0; font-size: 9.5pt; }
blockquote p { margin: 3px 0; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
ul, ol { padding-left: 22px; margin: 7px 0; }
li { margin: 3px 0; }
"""


# ---------------------------------------------------------------------------
# Funcao principal
# ---------------------------------------------------------------------------

def generate_pdf(
    inputs: list[str],
    output: str,
    title: str = "Relatório de Infraestrutura",
    subtitle: str = "",
    description: str = "",
    tasks: str = "",
    periodo: str = "",
    ambiente: str = "",
    data: str = "",
    footer: str = "Documento gerado pelo departamento de DevOps da Amazonas Inovare",
    phase_labels: list[str] | None = None,
) -> str:
    """
    Gera um PDF de relatório de infra a partir de um ou mais arquivos Markdown.

    Args:
        inputs:       Lista de caminhos para arquivos .md
        output:       Caminho do PDF de saida
        title:        Titulo principal (capa)
        subtitle:     Subtitulo (capa)
        description:  Descricao curta (capa)
        tasks:        IDs das tasks (ex: "TASK-0647 / TASK-0648")
        periodo:      Periodo analisado
        ambiente:     Ambiente AWS
        data:         Data do documento (default: hoje)
        footer:       Texto do rodape
        phase_labels: Labels para separadores entre secoes (ex: ["Fase 1 · TASK-0647", "Fase 2 · TASK-0648"])

    Returns:
        Caminho do PDF gerado.
    """
    import datetime
    if not data:
        data = datetime.date.today().strftime("%Y-%m-%d")

    css = CSS % {"footer": footer}

    # Capa
    meta_rows = ""
    if tasks:
        meta_rows += f'<div class="cover-meta-item"><span class="cover-meta-label">TASKs</span><span class="cover-meta-value">{tasks}</span></div>'
    if periodo:
        meta_rows += f'<div class="cover-meta-item"><span class="cover-meta-label">Período</span><span class="cover-meta-value">{periodo}</span></div>'
    if ambiente:
        meta_rows += f'<div class="cover-meta-item"><span class="cover-meta-label">Ambiente</span><span class="cover-meta-value">{ambiente}</span></div>'
    meta_rows += f'<div class="cover-meta-item"><span class="cover-meta-label">Data</span><span class="cover-meta-value">{data}</span></div>'

    cover = f"""
<div class="cover">
  <div class="cover-tag">Relatório de Infraestrutura — INNOVAQ PRD</div>
  <h1>{title}</h1>
  {"<div class='cover-subtitle'>" + subtitle + "</div>" if subtitle else ""}
  {"<div class='cover-desc'>" + description + "</div>" if description else ""}
  <div class="cover-divider"></div>
  <div class="cover-meta">{meta_rows}</div>
  <div class="cover-footer">
    <span>Amazonas Inovare — Departamento de DevOps</span>
    <span>Confidencial</span>
  </div>
</div>"""

    # Seções
    sections = []
    for idx, path in enumerate(inputs):
        text = apply_accents(open(path, encoding="utf-8").read())
        body = md_to_html(text)

        if len(inputs) > 1:
            label = (phase_labels[idx] if phase_labels and idx < len(phase_labels) else f"Seção {idx + 1}")
            # Titulo da secao: pegar o primeiro h1 do markdown
            first_h1 = re.search(r"^# (.+)$", text, re.MULTILINE)
            sec_title = first_h1.group(1) if first_h1 else label
            divider = f"""
<div class="phase-divider">
  <div class="phase-label">{label}</div>
  <h2>{sec_title}</h2>
</div>"""
            sections.append(divider + f'\n<div class="content">\n{body}\n</div>')
        else:
            sections.append(f'<div class="content">\n{body}\n</div>')

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>{css}</style>
</head>
<body>
{cover}
{"".join(sections)}
</body>
</html>"""

    tmp_html = output.replace(".pdf", "_tmp.html")
    with open(tmp_html, "w", encoding="utf-8") as f:
        f.write(html)

    result = subprocess.run(
        ["python3", "-m", "weasyprint", tmp_html, output],
        capture_output=True, text=True,
    )
    os.remove(tmp_html)

    if result.returncode != 0:
        raise RuntimeError(f"weasyprint falhou:\n{result.stderr}")

    size_kb = os.path.getsize(output) // 1024
    print(f"PDF gerado: {output} ({size_kb} KB)")
    return output


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera PDF de relatorio de infra — INNOVAQ")
    parser.add_argument("--inputs", nargs="+", required=True, help="Arquivos .md de entrada")
    parser.add_argument("--output", required=True, help="Caminho do PDF de saida")
    parser.add_argument("--title", default="Relatório de Infraestrutura")
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--description", default="")
    parser.add_argument("--tasks", default="")
    parser.add_argument("--periodo", default="")
    parser.add_argument("--ambiente", default="")
    parser.add_argument("--data", default="")
    parser.add_argument("--footer", default="Documento gerado pelo departamento de DevOps da Amazonas Inovare")
    parser.add_argument("--phase-labels", nargs="*", help="Labels dos separadores entre secoes")
    args = parser.parse_args()

    generate_pdf(
        inputs=args.inputs,
        output=args.output,
        title=args.title,
        subtitle=args.subtitle,
        description=args.description,
        tasks=args.tasks,
        periodo=args.periodo,
        ambiente=args.ambiente,
        data=args.data,
        footer=args.footer,
        phase_labels=args.phase_labels,
    )
