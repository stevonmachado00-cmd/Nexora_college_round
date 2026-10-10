import { Render } from "@puckeditor/core";
import { config } from "../puck/config";
import { validateDocument, type WebsiteDocument } from "../../shared/schema";
export function WebsiteRenderer({ document }: { document: WebsiteDocument }) {
  const page = validateDocument(document);
  return <Render config={config} data={page.data} />;
}
