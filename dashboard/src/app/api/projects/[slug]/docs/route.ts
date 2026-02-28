import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const KANBAN_ROOT = process.env.KANBAN_ROOT || "";

interface DocFile {
  name: string;
  folder: string;
  path: string;
  size_kb: number;
  modified_at: string;
}

function listDocsRecursive(dir: string): DocFile[] {
  const results: DocFile[] = [];
  if (!fs.existsSync(dir)) return results;

  const walk = (current: string, relative: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relPath = path.join(relative, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith(".pdf")) {
        const stat = fs.statSync(fullPath);
        results.push({
          name: entry.name,
          folder: relative.replace(/\\/g, "/").split("/").slice(0, -1).join("/") || "/",
          path: relPath.replace(/\\/g, "/"),
          size_kb: Math.round(stat.size / 1024),
          modified_at: stat.mtime.toISOString(),
        });
      }
    }
  };

  walk(dir, "");
  // Ordenar alfabeticamente: pasta primeiro, depois nome do arquivo
  results.sort((a, b) => {
    const folderCmp = a.folder.localeCompare(b.folder);
    return folderCmp !== 0 ? folderCmp : a.name.localeCompare(b.name);
  });
  return results;
}

export function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const docsDir = path.join(KANBAN_ROOT, "projects", params.slug, "docs");
  const docs = listDocsRecursive(docsDir);
  return NextResponse.json({ docs, docs_dir: docsDir });
}
