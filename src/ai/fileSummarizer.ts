import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generate } from "../ai/gemini.js";
import { FILE_SUMMARY_PROMPT } from "../ai/prompts.js";
import { FileSummary } from "../types.js";
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config.js";
import { fileCacheKey } from "../collector/files.js";

const CACHE_DIR = ".cache/file-summaries";

export async function getCachedSummary(key: string): Promise<string | null> {
  try {
    const data = await readFile(join(CACHE_DIR, `${key}.json`), "utf-8");
    const parsed = JSON.parse(data);
    if (typeof parsed.summary === "string") return parsed.summary;
    return null;
  } catch {
    return null;
  }
}

export async function setCachedSummary(
  key: string,
  summary: string,
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(join(CACHE_DIR, `${key}.json`), JSON.stringify({ summary }));
}

export async function summarizeFile(
  repoFullName: string,
  filePath: string,
  content: string,
): Promise<FileSummary> {
  const cacheKey = fileCacheKey(repoFullName, filePath, content);
  const cached = await getCachedSummary(cacheKey);
  if (cached) return { path: filePath, summary: cached };

  const prompt = FILE_SUMMARY_PROMPT.replace("{{FILE_PATH}}", filePath);

  const response = await generate(GEMINI_API_KEY, {
    model: GEMINI_MODEL,
    prompt: `${prompt}\n\nFile content:\n\`\`\`\n${content.slice(0, 12000)}\n\`\`\``,
    system:
      "You are a helpful assistant that analyzes source files and outputs concise summaries. Never include text outside the requested format.",
  });

  const summary = response.trim();
  await setCachedSummary(cacheKey, summary);
  return { path: filePath, summary };
}
