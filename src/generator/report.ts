import { generate } from "../ai/gemini.js";
import { REPO_REPORT_PROMPT } from "../ai/prompts.js";
import { RepoReport, FileSummary } from "../types.js";
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config.js";

export async function generateRepoReport(
  fileSummaries: FileSummary[],
  repoName: string,
  repoDescription: string | null,
): Promise<RepoReport> {
  const summariesText = fileSummaries
    .map((fs) => `### ${fs.path}\n${fs.summary}`)
    .join("\n\n");

  const prompt = REPO_REPORT_PROMPT.replace("{{REPO_NAME}}", repoName)
    .replace("{{REPO_DESCRIPTION}}", repoDescription || "No description")
    .replace("{{FILE_SUMMARIES}}", summariesText);

  const response = await generate(GEMINI_API_KEY, {
    model: GEMINI_MODEL,
    prompt,
    system:
      "You are a helpful assistant that analyzes repository summaries and outputs strict JSON. Never include text outside the JSON object.",
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON for repo report");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    name: repoName,
    fullName: repoName,
    url: "",
    description: repoDescription,
    language: null,
    topics: [],
    stars: 0,
    forks: 0,
    purpose: parsed.purpose || "",
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
    mainFeatures: Array.isArray(parsed.mainFeatures) ? parsed.mainFeatures : [],
    notableDetails: Array.isArray(parsed.notableDetails)
      ? parsed.notableDetails
      : [],
    fileSummaries,
  };
}
