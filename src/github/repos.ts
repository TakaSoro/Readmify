import { Octokit } from "octokit";
import { createOctokit } from "./client.js";
import { GitHubRepo } from "../types.js";

export async function fetchRepos(
  username: string,
  maxRepos: number = 50,
): Promise<GitHubRepo[]> {
  const octokit = createOctokit();
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (repos.length < maxRepos) {
    const { data } = await octokit.rest.repos.listForUser({
      username,
      type: "owner",
      sort: "updated",
      per_page: perPage,
      page,
    });

    if (data.length === 0) break;

    for (const repo of data) {
      if (repos.length >= maxRepos) break;
      repos.push({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description ?? null,
        htmlUrl: repo.html_url,
        language: repo.language ?? null,
        stargazersCount: repo.stargazers_count ?? 0,
        forksCount: repo.forks_count ?? 0,
        size: repo.size ?? 0,
        topics: repo.topics ?? [],
        updatedAt: repo.updated_at ?? "",
        createdAt: repo.created_at ?? "",
        private: repo.private,
        fork: repo.fork,
        cloneUrl: repo.clone_url ?? "",
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return repos.filter((r) => !r.private && !r.fork);
}
