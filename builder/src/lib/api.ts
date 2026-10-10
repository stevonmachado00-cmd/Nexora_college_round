import { ProjectSchema, type WebsiteProject } from "../../shared/project";
import { validateDocument, type WebsiteDocument } from "../../shared/schema";
const base = "/api/website-builder";
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(base + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: options.signal || AbortSignal.timeout(55000),
  });
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(
      "Nexus returned an unexpected response. Check that the API server is running.",
    );
  }
  if (!response.ok)
    throw new Error(
      (json as { error?: string }).error ||
        `Request failed (${response.status}).`,
    );
  return json as T;
}
export interface ProjectStorage {
  get(id: string): Promise<WebsiteProject>;
  save(input: {
    id?: string;
    name: string;
    slug: string;
    document: WebsiteDocument;
    expectedUpdatedAt?: string;
  }): Promise<WebsiteProject>;
  publish(
    project: WebsiteProject,
    document: WebsiteDocument,
    name: string,
    slug: string,
  ): Promise<WebsiteProject>;
}
export const projectStorage: ProjectStorage = {
  async get(id) {
    return ProjectSchema.parse(await request(`/projects/${id}`));
  },
  async save({ id, ...input }) {
    return ProjectSchema.parse(
      await request(id ? `/projects/${id}` : "/projects", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async publish(project, document, name, slug) {
    return ProjectSchema.parse(
      await request(`/projects/${project.id}/publish`, {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          document,
          expectedUpdatedAt: project.updatedAt,
        }),
      }),
    );
  },
};
export async function generateWebsite(prompt: string) {
  const response = await request<{ document: unknown }>("/ai/generate", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  return validateDocument(response.document);
}
export async function editWebsite(current: WebsiteDocument, prompt: string) {
  const response = await request<{ document: unknown }>("/ai/edit", {
    method: "POST",
    body: JSON.stringify({ prompt, current }),
  });
  return validateDocument(response.document);
}
