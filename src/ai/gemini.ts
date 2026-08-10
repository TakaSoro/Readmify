import { GoogleGenAI } from "@google/genai";

export interface GeminiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GeminiGenerateOptions {
  model: string;
  prompt: string;
  system?: string;
}

export interface GeminiChatOptions {
  model: string;
  messages: GeminiChatMessage[];
}

export async function generate(
  apiKey: string,
  options: GeminiGenerateOptions,
): Promise<string> {
  const client = new GoogleGenAI({ apiKey });
  const contents = [
    { role: "user" as const, parts: [{ text: options.prompt }] },
  ];
  const response = await client.models.generateContent({
    model: options.model,
    contents,
    config: options.system ? { systemInstruction: options.system } : undefined,
  });
  return response.text || "";
}

export async function chat(
  apiKey: string,
  options: GeminiChatOptions,
): Promise<string> {
  const client = new GoogleGenAI({ apiKey });
  const contents = options.messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : msg.role,
    parts: [{ text: msg.content }],
  }));
  const response = await client.models.generateContent({
    model: options.model,
    contents,
  });
  return response.text || "";
}

export async function checkGeminiHealth(
  apiKey: string,
  model: string,
): Promise<boolean> {
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model,
      contents: [{ role: "user" as const, parts: [{ text: "Hi" }] }],
    });
    return response.text !== undefined;
  } catch {
    return false;
  }
}
