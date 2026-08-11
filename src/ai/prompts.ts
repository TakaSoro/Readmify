export const FILE_SUMMARY_PROMPT = `You are an expert code reviewer. Analyze the following file and produce a concise summary.

File: {{FILE_PATH}}

Rules:
- ONLY describe what is actually present in the file. Do NOT invent or guess information.
- Ignore trivial boilerplate (empty constructors, simple getters/setters, default config stubs, pass-through code).
- Be concise.

Summary format:
### Purpose
<1-2 sentences describing what the file does>

### Key exports
- <function/class/component>: <purpose>

### Dependencies
- <important dependencies or imports>

### Contribution
<1 sentence on how this file contributes to the project>`;

export const REPO_REPORT_PROMPT = `You are an expert software engineer. Analyze the following repository file summaries and produce a concise structured report.

Repository: {{REPO_NAME}}
Description: {{REPO_DESCRIPTION}}

File Summaries:
{{FILE_SUMMARIES}}

Rules:
- ONLY use information from the summaries below. Do NOT invent or guess facts.
- If information is not present, omit it rather than making it up.
- Keep descriptions concise (1-2 sentences per field).

Output format (strict JSON):
{
  "purpose": "<one sentence describing what the project does>",
  "languages": ["<language>"],
  "technologies": ["<library/framework/tool>"],
  "mainFeatures": ["<feature>"],
  "notableDetails": ["<implementation detail worth mentioning>"]
}`;

export const README_GENERATION_PROMPT = `You are an expert technical writer. Generate a polished, professional GitHub profile README.md using ONLY the provided profile and repository reports.

Rules:
- Do NOT invent any information. Only use what is provided below.
- Write in a professional yet friendly tone.
- Include: hero header with avatar, intro/bio, tech stack, featured projects, and contact/social links.
- Use Markdown formatting, emojis sparingly, and badges where appropriate.
- Keep it visually clean and scannable.

Profile Data:
{{PROFILE_DATA}}

Repository Reports:
{{REPO_REPORTS}}

Reference Material:
{{REFERENCE_MARKDOWN}}

Preferred Style:
{{STYLE}}
`;
