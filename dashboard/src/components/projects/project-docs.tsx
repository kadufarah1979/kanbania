"use client";

import { useEffect, useState } from "react";
import { FileText, Download, FolderOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface DocFile {
  name: string;
  folder: string;
  path: string;
  size_kb: number;
  modified_at: string;
}

interface ProjectDocsProps {
  projectSlug: string;
}

export function ProjectDocs({ projectSlug }: ProjectDocsProps) {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectSlug}/docs`)
      .then((r) => r.json())
      .then((data) => setDocs(data.docs ?? []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [projectSlug]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando documentos...
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhum documento disponivel para este projeto.
      </p>
    );
  }

  // Agrupar por pasta
  const grouped = docs.reduce((acc, doc) => {
    const key = doc.folder || "/";
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, DocFile[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([folder, files]) => (
        <div key={folder}>
          <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="font-mono">{folder}</span>
          </div>
          <div className="space-y-1.5">
            {files.map((doc) => (
              <div
                key={doc.path}
                className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 font-medium">{doc.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {format(parseISO(doc.modified_at), "dd/MM/yyyy HH:mm")}
                </span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {doc.size_kb} KB
                </Badge>
                <a
                  href={`/api/projects/${projectSlug}/docs/download?file=${encodeURIComponent(doc.path)}`}
                  download={doc.name}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1 rounded hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
