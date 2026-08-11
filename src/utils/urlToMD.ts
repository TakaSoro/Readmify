import { Downloader } from "nodejs-file-downloader";
import pdf2html from "pdf2html";
import TurndownService from "turndown";
import path from "node:path";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const CACHE_DIR = "./.cache/refs";

function generateRandomText(length: number) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}

export async function urlToMD(url: string): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });

  const cacheKey = createHash("sha256").update(url).digest("hex");
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.md`);

  try {
    const cached = await readFile(cachePath, "utf-8");
    return cached;
  } catch {
    // proceed with download
  }

  const dir = "./.cache/files";
  const filename = generateRandomText(16);
  const downloader = new Downloader({
    url: url,
    directory: dir,
    onProgress: function (percentage, chunk, remainingSize) {
      console.log("% ", percentage);
      console.log("Current chunk of data: ", chunk);
      console.log("Remaining bytes: ", remainingSize);
    },
    fileName: `${filename}.pdf`,
  });

  await downloader.download();

  const filePath = path.resolve(dir, `${filename}.pdf`);

  const html = await pdf2html.html(filePath);

  const turndown = new TurndownService();
  const markdown = turndown.turndown(html);

  await writeFile(cachePath, markdown, "utf-8");

  return markdown;
}
