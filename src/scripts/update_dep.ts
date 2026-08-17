import { parseImports } from "parse-imports";
import { readFile, writeFile } from "node:fs/promises";

const code = await readFile("./dist/index.mjs", "utf-8");
let packages: string[] = [];

for (const $import of await parseImports(code)) {
  if ($import["moduleSpecifier"]["type"] === "package") {
    if (!($import["moduleSpecifier"]["value"].startsWith("node:"))) {
      packages.push($import["moduleSpecifier"]["value"]);
    }
  }
}

let json = JSON.parse(await readFile("./package.json", "utf-8"));
let new_dep = {};

for (const [key, value] of Object.entries(json["dependencies"])) {
  if (packages.includes(key)) new_dep[key] = value;
}

json["dependencies"] = new_dep;

await writeFile("./package-new.json", JSON.stringify(json), "utf-8");
