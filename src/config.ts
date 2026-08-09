import dotenv from "dotenv";

dotenv.config();

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
export const REPO_MAX_SIZE_MB = Number(process.env.REPO_MAX_SIZE_MB || 50);
export const MAX_REPOS = Number(process.env.MAX_REPOS || 50);

export function validateConfig(): void {
  const missing: string[] = [];
  if (!GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  if (!GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
