import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { input, checkbox, confirm } from "@inquirer/prompts";
import { fetchProfile } from "./github/profile.js";
import { fetchRepos } from "./github/repos.js";
import { collectRepoFiles, CollectedFile } from "./collector/files.js";
import { summarizeFile } from "./ai/fileSummarizer.js";
import { generateRepoReport } from "./generator/report.js";
import { generateReadme } from "./generator/readme.js";
import {
  validateConfig,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  REPO_MAX_SIZE_MB,
} from "./config.js";
import { ProfileData, RepoReport } from "./types.js";
import { checkGeminiHealth } from "./ai/gemini.js";
import { toMD } from "./reference/toMD.js";

const program = new Command();

const CONCURRENCY = 4;

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

program
  .name("readme-gen")
  .description("Generate a GitHub profile README using AI")
  .version("1.0.0")
  .argument("<username>", "GitHub username")
  .option("-o, --output <path>", "Output file path", "README-gen.md")
  .option("-m, --model <name>", "Gemini model to use")
  .option("-a, --all-repos", "Select all repositories without prompting")
  .option("-n, --max-repos <number>", "Maximum repos to process", "20")
  .action(async (username: string, options: any) => {
    try {
      validateConfig();

      if (!existsSync(".env")) {
        console.warn(
          "Warning: .env file not found. Using environment variables.",
        );
      }

      console.log(`Checking Gemini with model ${GEMINI_MODEL}...`);
      const geminiHealthy = await checkGeminiHealth(
        GEMINI_API_KEY,
        GEMINI_MODEL,
      );
      if (!geminiHealthy) {
        console.error(
          `Error: Gemini is not reachable or model ${GEMINI_MODEL} is invalid. Check your API key.`,
        );
        process.exit(1);
      }
      console.log("Gemini is healthy.");

      console.log(`Fetching profile for ${username}...`);
      const profile = await fetchProfile(username);
      console.log(`Profile loaded: ${profile.name || profile.login}`);

      console.log("Fetching repositories...");
      const maxRepos = parseInt(options.maxRepos || "20", 10);
      const repos = await fetchRepos(username, Math.min(maxRepos, 50));
      console.log(`Found ${repos.length} public repositories.`);

      const style = await input({
        message: "What style would you like for the README?",
      });

      const addReferences = await confirm({
        message: "Do you want to add reference materials?",
        default: false,
      });

      const referenceMarkdowns: string[] = [];
      if (addReferences) {
        while (true) {
          const url = await input({
            message: "Enter reference URL:",
          });

          const ext = await input({
            message: "Enter the file extension of reference:",
          });

          process.stdout.write("Downloading reference file... ");
          try {
            const markdown = await toMD(url, ext);
            referenceMarkdowns.push(markdown);
            console.log("done");
          } catch (err: any) {
            console.error(err.stack);
            console.log(`failed (${err.message})`);
          }

          const another = await confirm({
            message: "Add another reference?",
            default: false,
          });
          if (!another) break;
        }
      }

      const referenceMarkdown =
        referenceMarkdowns.length > 0
          ? referenceMarkdowns.join("\n\n")
          : undefined;

      if (repos.length === 0) {
        console.log(
          "No repositories found. Generating README with profile info only.",
        );
        const profileData: ProfileData = {
          profile,
          repoReports: [],
          referenceMarkdown,
        };
        const readme = await generateReadme(profileData, style);
        await writeFile(options.output, readme, "utf-8");
        console.log(`README saved to ${options.output}`);
        return;
      }

      let selectedRepos = repos;
      if (options.allRepos) {
        selectedRepos = repos;
      } else {
        const answer = await confirm({
          message: `Do you want to include all ${repos.length} repositories?`,
          default: false,
        });

        if (answer) {
          selectedRepos = repos;
        } else {
          const repoChoices = repos.map((r) => ({
            name: `${r.name} (${r.language || "unknown"}) - ${r.description || "no description"}`,
            value: r,
            short: r.name,
          }));

          selectedRepos = await checkbox({
            message: "Select repositories to include:",
            choices: repoChoices,
            required: true,
          });
        }
      }

      const repoReports: RepoReport[] = [];

      for (const repo of selectedRepos) {
        process.stdout.write(`Processing ${repo.fullName}... `);
        try {
          const collectedFiles = await collectRepoFiles(
            repo.fullName,
            repo.cloneUrl,
            REPO_MAX_SIZE_MB,
          );

          if (collectedFiles.length === 0) {
            console.log("skipped (no meaningful files)");
            continue;
          }

          process.stdout.write(
            `${collectedFiles.length} files, summarizing... `,
          );

          const fileSummaries = await mapWithLimit<
            CollectedFile,
            { path: string; summary: string }
          >(collectedFiles, CONCURRENCY, async (file) => {
            const summary = await summarizeFile(
              repo.fullName,
              file.path,
              file.content,
            );
            return { path: summary.path, summary: summary.summary };
          });

          const report = await generateRepoReport(
            fileSummaries,
            repo.name,
            repo.description,
          );
          report.fullName = repo.fullName;
          report.url = repo.htmlUrl;
          report.language = repo.language;
          report.topics = repo.topics;
          report.stars = repo.stargazersCount;
          report.forks = repo.forksCount;
          repoReports.push(report);
          console.log("done");
        } catch (err: any) {
          console.log(`failed (${err.message})`);
        }
      }

      if (repoReports.length === 0) {
        console.log(
          "No repository reports generated. Generating README with profile info only.",
        );
        const profileData: ProfileData = {
          profile,
          repoReports: [],
          referenceMarkdown,
        };
        const readme = await generateReadme(profileData, style);
        await writeFile(options.output, readme, "utf-8");
        console.log(`README saved to ${options.output}`);
        return;
      }

      console.log(`\nGenerating README from ${repoReports.length} reports...`);
      const profileData: ProfileData = {
        profile,
        repoReports,
        referenceMarkdown,
      };
      const readme = await generateReadme(profileData, style);
      await writeFile(options.output, readme, "utf-8");
      console.log(`README saved to ${options.output}`);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
