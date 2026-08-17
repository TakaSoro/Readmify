import { readFile, writeFile } from "node:fs/promises";
import TurndownService from "turndown";

export async function htmlToMD(
  filePath: string,
  ext: string,
): [string, string] {
  const html = await readFile(filePath, "utf-8");
  const turndownService = new TurndownService();

  const markdown = turndownService.turndown(html);
  await writeFile(`${filePath}.md`, markdown, "utf-8");
  return [`${filePath}.md`, "md"];
}
