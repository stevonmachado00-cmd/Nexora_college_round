import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { z } from "zod";
import { ProjectSchema, type WebsiteProject } from "../builder/shared/project";
export interface ProjectRepository {
  list(): Promise<WebsiteProject[]>;
  get(id: string): Promise<WebsiteProject | null>;
  save(project: WebsiteProject): Promise<void>;
}
export class JsonProjectRepository implements ProjectRepository {
  constructor(private path = resolve(".nexus-data/projects.json")) {}
  async list() {
    try {
      return z
        .array(ProjectSchema)
        .parse(JSON.parse(await readFile(this.path, "utf8")));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw new Error(
        "Project storage could not be read. Existing records have not been overwritten.",
      );
    }
  }
  async get(id: string) {
    return (await this.list()).find((p) => p.id === id) || null;
  }
  async save(project: WebsiteProject) {
    const parsed = ProjectSchema.parse(project),
      all = await this.list(),
      i = all.findIndex((p) => p.id === parsed.id);
    if (all.some((p) => p.id !== parsed.id && p.slug === parsed.slug))
      throw new Error("That website slug is already in use.");
    if (i < 0) all.push(parsed);
    else all[i] = parsed;
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    await writeFile(temporary, JSON.stringify(all, null, 2), "utf8");
    await rename(temporary, this.path);
  }
}
// The single-process prototype serializes writes. Replace with DB transactions for multi-instance hosting.
let writeQueue: Promise<unknown> = Promise.resolve();
export function transaction<T>(work: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(work);
  writeQueue = result.catch(() => undefined);
  return result;
}
