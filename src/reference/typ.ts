import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { writeFile } from "node:fs/promises";

export async function typToPDF(
  filePath: string,
  ext: string,
): [string, string] {
  const pdf = await NodeCompiler.create().pdf({ mainFilePath: filePath });

  await writeFile(`${filePath}.pdf`, pdf);
  return [`${filePath}.pdf`, "pdf"];
}
