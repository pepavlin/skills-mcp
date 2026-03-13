import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface TagInput {
  name: string;
  color?: string;
}

export interface TagWithCount extends schema.Tag {
  skillCount: number;
}

export async function createTag(input: TagInput): Promise<schema.Tag> {
  const id = uuid();
  const tag = {
    id,
    name: input.name,
    color: input.color || "#6b7280",
  };

  db.insert(schema.tags).values(tag).run();
  return tag;
}

export async function updateTag(
  id: string,
  input: Partial<TagInput>
): Promise<schema.Tag | null> {
  const existing = db
    .select()
    .from(schema.tags)
    .where(eq(schema.tags.id, id))
    .get();

  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.color !== undefined) updates.color = input.color;

  db.update(schema.tags).set(updates).where(eq(schema.tags.id, id)).run();

  return db.select().from(schema.tags).where(eq(schema.tags.id, id)).get() || null;
}

export async function deleteTag(id: string): Promise<boolean> {
  const result = db.delete(schema.tags).where(eq(schema.tags.id, id)).run();
  return result.changes > 0;
}

export async function listTags(): Promise<TagWithCount[]> {
  const rows = db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color,
      skillCount: sql<number>`COUNT(${schema.skillTags.skillId})`,
    })
    .from(schema.tags)
    .leftJoin(schema.skillTags, eq(schema.tags.id, schema.skillTags.tagId))
    .groupBy(schema.tags.id)
    .orderBy(schema.tags.name)
    .all();

  return rows;
}

export async function getTag(id: string): Promise<schema.Tag | null> {
  return (
    db.select().from(schema.tags).where(eq(schema.tags.id, id)).get() || null
  );
}
