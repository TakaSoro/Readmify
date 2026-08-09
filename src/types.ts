export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter: string | null;
  email: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  avatarUrl: string;
  htmlUrl: string;
  createdAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  size: number;
  topics: string[];
  updatedAt: string;
  createdAt: string;
  private: boolean;
  fork: boolean;
  cloneUrl: string;
}

export interface RepoReport {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  purpose: string;
  languages: string[];
  technologies: string[];
  mainFeatures: string[];
  notableDetails: string[];
  fileSummaries?: FileSummary[];
}

export interface ProfileData {
  profile: GitHubProfile;
  repoReports: RepoReport[];
}

export interface GenerationOptions {
  outputPath: string;
  model: string;
}

export interface FileSummary {
  path: string;
  summary: string;
}

export interface CollectedFile {
  path: string;
  content: string;
}