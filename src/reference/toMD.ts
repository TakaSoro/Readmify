import { Downloader } from "nodejs-file-downloader";
import { readFile, writeFile } from "node:fs/promises";
import { checkHash, downloadFile } from "./ready.js";
import pipelines from "../generated/pipelines.ts";

export async function toMD(url: string, ext: string): Promise<string> {
  const check = await checkHash(url);
  if (check[0]) return check[1];

  const filePath = await downloadFile(url);
  let ext_ = ext;

  if (Object.hasOwn(pipelines, ext)) {
    for (const func of pipelines[ext]) {
      console.log(func);
      [, ext_] = await func(filePath, ext_);
    }
  } else {
    console.log("The provided file extension is not supported.");
    return "";
  }

  const markdown = await readFile(filePath, "utf-8");
  await writeFile(check[2], markdown, "utf-8");

  return markdown;
}
