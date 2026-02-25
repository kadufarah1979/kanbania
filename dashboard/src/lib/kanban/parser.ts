import matter from "gray-matter";
import yaml from "js-yaml";
import fs from "fs";

export interface ParsedMarkdown<T = Record<string, unknown>> {
  frontmatter: T;
  content: string;
}

export function parseMarkdownFile<T = Record<string, unknown>>(filePath: string): ParsedMarkdown<T> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return { frontmatter: data as T, content: content.trim() };
  } catch {
    return null;
  }
}

export function parseYamlFile<T = Record<string, unknown>>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return yaml.load(raw) as T;
  } catch {
    return null;
  }
}

export function parseJsonlFile<T = Record<string, unknown>>(filePath: string): T[] {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        try {
          return JSON.parse(line) as T;
        } catch {
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  } catch {
    return [];
  }
}

/**
 * Read the last N lines of a JSONL file efficiently (reads from end of file).
 * Returns items in reverse order (newest first).
 */
export function parseJsonlFileTail<T = Record<string, unknown>>(
  filePath: string,
  count: number
): { items: T[]; total: number } {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size === 0) return { items: [], total: 0 };

    const fd = fs.openSync(filePath, "r");
    try {
      const CHUNK = 8192;
      let pos = stat.size;
      let tail = "";
      const lines: string[] = [];

      // We need count lines + some extra to count total
      while (pos > 0 && lines.length <= count) {
        const readSize = Math.min(CHUNK, pos);
        pos -= readSize;
        const buf = Buffer.alloc(readSize);
        fs.readSync(fd, buf, 0, readSize, pos);
        tail = buf.toString("utf-8") + tail;

        const parts = tail.split("\n");
        // Keep the first partial line for next iteration
        tail = parts[0];
        // Add complete lines (from end)
        for (let i = parts.length - 1; i >= 1; i--) {
          if (parts[i].trim()) lines.push(parts[i]);
        }
      }
      // Don't forget the remaining partial first line
      if (tail.trim()) lines.push(tail);

      // Count total lines efficiently
      let totalLines: number;
      if (pos === 0 && lines.length <= count) {
        totalLines = lines.length;
      } else {
        // Count remaining lines we didn't read
        const remaining = fs.readFileSync(filePath, "utf-8");
        totalLines = remaining.split("\n").filter((l) => l.trim()).length;
      }

      const items = lines
        .slice(0, count)
        .map((line) => {
          try {
            return JSON.parse(line) as T;
          } catch {
            return null;
          }
        })
        .filter((item): item is T => item !== null);

      return { items, total: totalLines };
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return { items: [], total: 0 };
  }
}
