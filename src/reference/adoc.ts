import { convert } from "@asciidoctor/core";
import { readFile, writeFile } from "node:fs/promises";

export async function adocToHTML(
  filePath: string,
  ext: string,
): [string, string] {
  const adoc = await readFile(filePath, "utf-8");
  const html = await convert(adoc, { attributes: { showtitle: true } });

  await writeFile(`${filePath}.html`, html, "utf-8");

  return [`${filePath}.html`, "html"];
}
