import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import config from "../reference.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");

const OUTPUT = path.join(ROOT, "generated", "pipelines.ts");

/**
 * Conversion pipeline required by each file extension.
 */
const pipelines = {
  md: [],
  txt: [],
  html: ["htmlToMD"],
  adoc: ["adocToHTML", "htmlToMD"],
  docx: ["officeToMD"],
  pptx: ["officeToMD"],
  xlsx: ["officeToMD"],
  rst: ["rstToHTML", "htmlToMD"],
} as const;

/**
 * Possible implementations for each conversion step.
 *
 * `size` is the estimated bundled size of the FILE.
 *
 * If two functions come from the same file, that file's size
 * is counted only once.
 */
const implementations = {
  adocToHTML: [
    {
      file: "../reference/adoc.ts",
      export: "adocToHTML",
      size: 3,
    },
  ],

  htmlToMD: [
    {
      file: "../reference/html.ts",
      export: "htmlToMD",
      size: 8,
    },
    {
      file: "../reference/office.ts",
      export: "officeToMD",
      size: 102,
    },
  ],

  officeToMD: [
    {
      file: "../reference/office.ts",
      export: "officeToMD",
      size: 102,
    },
  ],
  
  rstToHTML: [
    {
      file: "../reference/rst.ts",
      export: "rstToHTML",
      size: 22,
    },
  ],
} as const;

type Format = keyof typeof pipelines;

type Step = keyof typeof implementations;

type Implementation = {
  file: string;
  export: string;
  size: number;
};

type Choice = Record<string, Implementation>;

function getRequiredSteps(formats: Format[]): Step[] {
  return [...new Set(formats.flatMap((format) => pipelines[format]))] as Step[];
}

/**
 * Generate every possible combination of implementations.
 *
 * Example:
 *
 * adocToHtml:
 *   A
 *
 * htmlToMD:
 *   B
 *   C
 *
 * officeToMD:
 *   D
 *
 * produces:
 *
 * A B D
 * A C D
 */
function generateCombinations(
  steps: Step[],
  index = 0,
  current: Choice = {},
): Choice[] {
  if (index >= steps.length) {
    return [{ ...current }];
  }

  const step = steps[index];
  const candidates = implementations[step];

  const result: Choice[] = [];

  for (const implementation of candidates) {
    current[step] = implementation;

    result.push(...generateCombinations(steps, index + 1, current));
  }

  delete current[step];

  return result;
}

/**
 * Calculate the total size of a combination.
 *
 * IMPORTANT:
 * The size of a file is counted only once.
 */
function calculateSize(choice: Choice): number {
  const files = new Map<string, number>();

  for (const implementation of Object.values(choice)) {
    files.set(implementation.file, implementation.size);
  }

  return [...files.values()].reduce((total, size) => total + size, 0);
}

/**
 * Find the globally smallest combination.
 */
function findBestCombination(formats: Format[]) {
  const steps = getRequiredSteps(formats);

  const combinations = generateCombinations(steps);

  let best: Choice | undefined;
  let bestSize = Infinity;

  for (const combination of combinations) {
    const size = calculateSize(combination);

    if (size < bestSize) {
      best = combination;
      bestSize = size;
    }
  }

  if (!best) {
    throw new Error("Could not find a valid implementation combination.");
  }

  return {
    choice: best,
    size: bestSize,
  };
}

async function main() {
  const formats = config.formats as Format[];

  /*
   * Validate formats.
   */
  for (const format of formats) {
    if (!(format in pipelines)) {
      throw new Error(`Unknown reference format: "${format}"`);
    }
  }

  /*
   * IMPORTANT:
   *
   * Resolve ALL formats together.
   */
  const result = findBestCombination(formats);

  const choice = result.choice;

  /*
   * Group imports by file.
   */
  const imports = new Map<string, Set<string>>();

  for (const implementation of Object.values(choice)) {
    let exports = imports.get(implementation.file);

    if (!exports) {
      exports = new Set();
      imports.set(implementation.file, exports);
    }

    exports.add(implementation.export);
  }

  const output: string[] = [];

  output.push("// AUTO-GENERATED FILE.");

  output.push("// DO NOT EDIT MANUALLY.");

  output.push("");

  /*
   * Imports
   */
  for (const [file, exports] of imports) {
    output.push(`import { ${[...exports].join(", ")} } from "${file}";`);
  }

  output.push("");

  /*
   * Pipelines
   */
  output.push("export default {");

  for (const format of formats) {
    output.push(`  ${format}: [`);

    for (const step of pipelines[format]) {
      const implementation = choice[step];

      if (!implementation) {
        throw new Error(`No implementation selected for "${step}".`);
      }

      output.push(`    ${implementation.export},`);
    }

    output.push("  ],");
  }

  output.push("};");
  output.push("");

  await fs.mkdir(path.dirname(OUTPUT), {
    recursive: true,
  });

  await fs.writeFile(OUTPUT, output.join("\n"), "utf8");

  console.log(`Formats: ${formats.join(", ")}`);

  console.log(`Optimal size: ${result.size}`);

  console.log("Selected implementations:");

  for (const [step, implementation] of Object.entries(choice)) {
    console.log(`  ${step} → ${implementation.file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
