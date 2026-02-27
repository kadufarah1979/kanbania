import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const KANBAN_ROOT = process.env.KANBAN_ROOT || "";

export function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("file");

  if (!filePath) {
    return NextResponse.json({ error: "file param required" }, { status: 400 });
  }

  // Sanitize: impede path traversal — aceita apenas .pdf dentro de docs/
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!normalized.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
  }

  const fullPath = path.join(KANBAN_ROOT, "projects", params.slug, "docs", normalized);

  // Confirmar que o arquivo esta dentro do diretorio esperado
  const docsBase = path.join(KANBAN_ROOT, "projects", params.slug, "docs");
  if (!fullPath.startsWith(docsBase)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const filename = path.basename(fullPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": fileBuffer.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
