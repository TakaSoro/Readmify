import { chat } from "../ai/gemini.js";
import { README_GENERATION_PROMPT } from "../ai/prompts.js";
import { ProfileData } from "../types.js";
import { GEMINI_API_KEY, GEMINI_MODEL } from "../config.js";

export async function generateReadme(
  profileData: ProfileData,
  style: string,
): Promise<string> {
  const profileJson = JSON.stringify(profileData.profile, null, 2);
  const reportsJson = JSON.stringify(profileData.repoReports, null, 2);

  const prompt = README_GENERATION_PROMPT.replace(
    "{{PROFILE_DATA}}",
    profileJson,
  )
    .replace("{{REPO_REPORTS}}", reportsJson)
    .replace("{{STYLE}}", style);

  const response = await chat(GEMINI_API_KEY, {
    model: GEMINI_MODEL,
    messages: [
      {
        role: "user",
        content:
          "You are a helpful assistant that generates Markdown README files. Output ONLY the Markdown content, no extra commentary.\n\n" +
          prompt,
      },
    ],
  });

  return response.trim();
}
