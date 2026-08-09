import { Octokit } from "octokit";
import { GITHUB_TOKEN } from "../config.js";

export function createOctokit(): Octokit {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is required. Set it in your environment or .env file.");
  }
  return new Octokit({ auth: GITHUB_TOKEN });
}