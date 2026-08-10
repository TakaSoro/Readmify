import { exec } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm } from "node:fs/promises";
import { join, sep } from "node:path";
import { tmpdir } from "node:os";
import { readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";

const execAsync = promisify(exec);

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "target",
  ".next",
  ".nuxt",
  "coverage",
  ".cache",
  "tmp",
  "temp",
  "__pycache__",
  ".venv",
  "venv",
  "env",
  ".idea",
  ".vscode",
]);

const IGNORED_FILE_PATTERNS = [
  /\.lock$/,
  /\.log$/,
  /\.map$/,
  /\.min\.(js|css|mjs|cjs)$/,
  /\.bundle\.(js|mjs|cjs)$/,
  /\.generated\./,
  /\.g\.(dart|go)$/,
  /\.pb\.(go|cc|h|java)$/,
  /\.exe$/,
  /\.dll$/,
  /\.so(\.\d+)?$/,
  /\.dylib$/,
  /\.bin$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.ico$/,
  /\.webp$/,
  /\.pdf$/,
  /\.zip$/,
  /\.tar(\.gz)?$/,
  /\.whl$/,
  /\.egg$/,
];

const MAX_FILE_SIZE = 50 * 1024;

export interface CollectedFile {
  path: string;
  content: string;
}

export async function collectRepoFiles(
  repoFullName: string,
  cloneUrl: string,
  maxSizeMB: number,
): Promise<CollectedFile[]> {
  const tempDir = await mkdtemp(join(tmpdir(), "readme-gen-"));
  const repoDir = join(tempDir, repoFullName.replace("/", sep));

  try {
    await execAsync(
      `git clone --depth 1 --single-branch ${cloneUrl} ${repoDir}`,
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const repoSize = await getDirSize(repoDir);
    if (repoSize > maxSizeBytes) {
      throw new Error(
        `Repository size (${(repoSize / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB`,
      );
    }

    const files: CollectedFile[] = [];
    await walk(repoDir, repoDir, files);
    return files;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function walk(
  dir: string,
  repoDir: string,
  files: CollectedFile[],
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = fullPath.slice(repoDir.length + 1);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await walk(fullPath, repoDir, files);
    } else if (entry.isFile()) {
      if (isIgnoredFile(entry.name)) continue;
      try {
        const stats = await stat(fullPath);
        if (stats.size > MAX_FILE_SIZE) continue;

        const content = await readFileContent(fullPath);
        if (content === null) continue;

        files.push({ path: relPath, content });
      } catch {
        // skip unreadable files
      }
    }
  }
}

function isIgnoredFile(name: string): boolean {
  for (const pattern of IGNORED_FILE_PATTERNS) {
    if (pattern.test(name)) return true;
  }
  return false;
}

async function readFileContent(path: string): Promise<string | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(path);
    const str = buffer.toString("utf-8");
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(str)) return null;
    return str;
  } catch {
    return null;
  }
}

async function getDirSize(dir: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `powershell -Command "(Get-ChildItem -LiteralPath '${dir}' -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB"`,
    );
    const mb = parseFloat(stdout.trim());
    return isNaN(mb) ? 0 : mb * 1024 * 1024;
  } catch {
    return 0;
  }
}

export function fileCacheKey(
  repoFullName: string,
  filePath: string,
  content: string,
): string {
  return createHash("sha256")
    .update(`${repoFullName}\0${filePath}\0${content}`)
    .digest("hex");
}
