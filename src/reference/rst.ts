import { RstToHtmlCompiler } from 'rst-compiler'
import { readFile, writeFile } from "node:fs/promises";

export async function rstToHTML(
  filePath: string,
  ext: string,
): [string, string] {
  const rst = await readFile(filePath, "utf-8");
  const html = new RstToHtmlCompiler().compile(rst).body;

  await writeFile(`${filePath}.html`, html, "utf-8");

  return [`${filePath}.html`, "html"];
}
