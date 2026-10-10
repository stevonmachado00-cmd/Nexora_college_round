import { z } from "zod";
import { WebsiteDocumentSchema } from "./schema";
export const ProjectSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    ownerId: z.string().optional(),
    document: WebsiteDocumentSchema,
    status: z.enum(["draft", "published"]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    publishedAt: z.string().datetime().nullable(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .min(1)
      .max(80),
    publishedDocument: WebsiteDocumentSchema.nullable(),
  })
  .strict();
export type WebsiteProject = z.infer<typeof ProjectSchema>;
export const SaveProjectSchema = z
  .object({
    name: ProjectSchema.shape.name,
    slug: ProjectSchema.shape.slug,
    document: WebsiteDocumentSchema,
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .strict();
