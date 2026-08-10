import { Octokit } from "octokit";
import { createOctokit } from "./client.js";
import { GitHubProfile } from "../types.js";

export async function fetchProfile(username: string): Promise<GitHubProfile> {
  const octokit = createOctokit();
  const { data } = await octokit.rest.users.getByUsername({ username });
  return {
    login: data.login,
    name: data.name,
    bio: data.bio,
    location: data.location,
    company: data.company,
    blog: data.blog,
    twitter: data.twitter_username ?? null,
    email: data.email ?? null,
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    createdAt: data.created_at,
  };
}
