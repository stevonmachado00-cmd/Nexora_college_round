import {
  GenerationRequestSchema,
  EditRequestSchema,
  validateDocument,
} from "../../builder/shared/schema";
import { DemoProvider } from "./demo";
import { CompatibleProvider } from "./compatible";
import type { WebsiteAIProvider } from "./provider";
export function provider(): WebsiteAIProvider {
  const id = process.env.WEBSITE_AI_PROVIDER || "demo";
  if (id === "demo") return new DemoProvider();
  if (id === "compatible") return new CompatibleProvider();
  throw new Error("Unknown WEBSITE_AI_PROVIDER. Choose demo or compatible.");
}
export async function generateWebsite(
  input: unknown,
  p: WebsiteAIProvider = provider(),
) {
  const request = GenerationRequestSchema.parse(input);
  return validateDocument(await p.generateWebsite(request.prompt));
}
export async function editWebsite(
  input: unknown,
  p: WebsiteAIProvider = provider(),
) {
  const request = EditRequestSchema.parse(input);
  return validateDocument(await p.editWebsite(request.current, request.prompt));
}
