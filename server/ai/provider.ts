import type { WebsiteDocument } from "../../builder/shared/schema";
export interface WebsiteAIProvider {
  readonly name: string;
  generateWebsite(prompt: string): Promise<unknown>;
  editWebsite(current: WebsiteDocument, instruction: string): Promise<unknown>;
}
// New providers implement this interface. Component code never enters provider context.
// Future sandbox-generated components must be reviewed and registered separately, not executed here.
