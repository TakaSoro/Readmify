import { Downloader } from "nodejs-file-downloader";
import pdf2html from "pdf2html";
import TurndownService from "turndown";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import mammoth from "mammoth";
import { checkHash, downloadFile } from "./ready.js";

async function pdfToMD(
  check: [boolean, string, string],
  filePath: string,
): Promise<string> {
  const html = await pdf2html.html(filePath);

  const turndown = new TurndownService();
  const markdown = turndown.turndown(html);

  return markdown;
}

async function htmlToMD(
  check: [boolean, string, string],
  filePath: string,
): Promise<string> {
  const html = await readFile(filePath, "utf-8");

  const turndown = new TurndownService();
  const markdown = turndown.turndown(html);

  return markdown;
}

async function mdToMD(
  check: [boolean, string, string],
  filePath: string,
): Promise<string> {
  return await readFile(filePath, "utf-8");
}

async function docxToMD(
  check: [boolean, string, string],
  filePath: string,
): Promise<string> {
  const html = (await mammoth.convertToHtml({ path: filePath })).value;

  const turndown = new TurndownService();
  const markdown = turndown.turndown(html);

  return markdown;
}

export async function toMD(url: string, ext: string): Promise<string> {
  const check = await checkHash(url);
  if (check[0]) return check[1];

  const filePath = await downloadFile(url);
  let func = null;

  switch (ext) {
    case "pdf":
      func = pdfToMD;
      break;
    case "md":
      func = mdToMD;
      break;
    case "html":
      func = htmlToMD;
      break;
    case "docx":
      func = docxToMD;
      break;
    default:
      console.log("The provided file extension is not supported.");
      return "";
  }

  const markdown = await func(check, filePath);
  await writeFile(check[2], markdown, "utf-8");

  return markdown;
}
