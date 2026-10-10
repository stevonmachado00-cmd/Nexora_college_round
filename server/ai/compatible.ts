import type { WebsiteDocument } from "../../builder/shared/schema";
import type { WebsiteAIProvider } from "./provider";
import { systemPrompt } from "./prompts";
export class CompatibleProvider implements WebsiteAIProvider {
  readonly name = "Configured AI provider";
  private async request(content: string) {
    const base = process.env.WEBSITE_AI_BASE_URL,
      model = process.env.WEBSITE_AI_MODEL,
      key = process.env.WEBSITE_AI_API_KEY;
    if (!base || !model)
      throw new Error(
        "Set WEBSITE_AI_BASE_URL and WEBSITE_AI_MODEL on the server before using AI.",
      );
    const url = new URL(`${base.replace(/\/$/, "")}/chat/completions`);
    if (!["https:", "http:"].includes(url.protocol))
      throw new Error("The configured AI endpoint must use HTTP or HTTPS.");
    const response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(45000),
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content },
        ],
      }),
    });
    if (!response.ok)
      throw new Error(
        `The AI provider returned HTTP ${response.status}. Your current page is unchanged.`,
      );
    const payload = await response.text();
    if (payload.length > 500000)
      throw new Error("The AI response is too large.");
    let data: { choices?: { message?: { content?: string } }[] };
    try {
      data = JSON.parse(payload);
    } catch {
      throw new Error("The AI provider returned invalid JSON.");
    }
    const json = data.choices?.[0]?.message?.content;
    if (!json) throw new Error("The AI provider returned an empty response.");
    try {
      return JSON.parse(json);
    } catch {
      throw new Error("The AI response was not a JSON website configuration.");
    }
  }
  generateWebsite(prompt: string) {
    return this.request(`Generate a website. Business description: ${prompt}`);
  }
  editWebsite(current: WebsiteDocument, instruction: string) {
    return this.request(
      `Edit only what is requested. Instruction: ${instruction}\nCurrent configuration: ${JSON.stringify(current)}`,
    );
  }
}
