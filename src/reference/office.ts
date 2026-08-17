import { OfficeConverter } from "officeparser";
import { writeFile } from "node:fs/promises";

export async function officeToMD(
  filePath: string,
  ext: string,
): [string, string] {
  const { value: markdown } = await OfficeConverter.convert(
    `${filePath}.${ext}`,
    "md",
  );
  await writeFile(`${filePath}.md`, markdown, "utf-8");
  return [`${filePath}.md`, "md"];
}
