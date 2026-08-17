import { Downloader } from "nodejs-file-downloader";
import { OfficeConverter } from 'officeparser';
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { checkHash, downloadFile } from "./ready.js";

async function directToMD(
  check: [boolean, string, string],
  filePath: string,
): Promise<string> {
  return await readFile(filePath, "utf-8");
}

async function officeToMD(
  check: [boolean, string, string],
  filePath: string,
  ext: string,
): Promise<string> {
  const { value: markdown } = await OfficeConverter.convert(`${filePath}.${ext}`, 'md');

  return markdown;
}

async function typToMD(
  check: [boolean, string, string],
  filePath: string,
): Promise<string> {
  const pdf = await NodeCompiler.create().pdf({ mainFilePath: filePath });
  await writeFile(`${filePath}.pdf`, pdf);

  const { value: markdown } = await OfficeConverter.convert(`${filePath}.pdf`, 'md');

  return markdown;
}

export async function toMD(url: string, ext: string): Promise<string> {
  const check = await checkHash(url);
  if (check[0]) return check[1];

  const filePath = await downloadFile(url);
  let func = null;

  switch (ext) {
	case "txt":
    case "md":
      func = directToMD;
      break;
	case "typ":
	  func = typToMD;
	  break;
	case "pptx":
	case "xlsx":
	case "odt":
	case "odp":
	case "ods":
	case "rtf":
	case "csv":
	case "epub":
	case "pdf":
	case "docx":
	case "html":
	   func = async (check: [boolean, string, string], filePath: string) => await officeToMD(check, filePath, ext);
	   break;
    default:
      console.log("The provided file extension is not supported.");
      return "";
  }

  const markdown = await func(check, filePath);
  await writeFile(check[2], markdown, "utf-8");

  return markdown;
}
