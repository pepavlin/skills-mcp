import { db, schema } from "@/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export type SkillType = "prompt" | "workflow" | "technique" | "snippet" | "config";

export interface SkillInput {
  name: string;
  description: string;
  content: string;
  type: SkillType;
  parameters?: string;
  examples?: string;
  tagIds?: string[];
}

export interface SkillWithTags extends schema.Skill {
  tags: schema.Tag[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Rough token estimate: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function createSkill(input: SkillInput): Promise<SkillWithTags> {
  const id = uuid();
  const now = new Date().toISOString();
  const slug = slugify(input.name);
  const tokenEstimate = estimateTokens(input.content + input.description);

  db.insert(schema.skills)
    .values({
      id,
      name: input.name,
      slug,
      description: input.description,
      content: input.content,
      type: input.type,
      parameters: input.parameters || null,
      examples: input.examples || null,
      tokenEstimate,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  if (input.tagIds?.length) {
    for (const tagId of input.tagIds) {
      db.insert(schema.skillTags)
        .values({ skillId: id, tagId })
        .run();
    }
  }

  const skill = await getSkill(id);
  return skill as SkillWithTags;
}

export async function updateSkill(
  id: string,
  input: Partial<SkillInput>
): Promise<SkillWithTags | null> {
  const existing = db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.id, id))
    .get();

  if (!existing) return null;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = slugify(input.name);
  }
  if (input.description !== undefined) updates.description = input.description;
  if (input.content !== undefined) updates.content = input.content;
  if (input.type !== undefined) updates.type = input.type;
  if (input.parameters !== undefined) updates.parameters = input.parameters;
  if (input.examples !== undefined) updates.examples = input.examples;

  if (input.content !== undefined || input.description !== undefined) {
    const desc = input.description ?? existing.description;
    const content = input.content ?? existing.content;
    updates.tokenEstimate = estimateTokens(content + desc);
  }

  db.update(schema.skills)
    .set(updates)
    .where(eq(schema.skills.id, id))
    .run();

  if (input.tagIds !== undefined) {
    db.delete(schema.skillTags)
      .where(eq(schema.skillTags.skillId, id))
      .run();

    for (const tagId of input.tagIds) {
      db.insert(schema.skillTags)
        .values({ skillId: id, tagId })
        .run();
    }
  }

  return getSkill(id);
}

export async function deleteSkill(id: string): Promise<boolean> {
  const result = db
    .delete(schema.skills)
    .where(eq(schema.skills.id, id))
    .run();
  return result.changes > 0;
}

export async function getSkill(idOrSlug: string): Promise<SkillWithTags | null> {
  const skill = db
    .select()
    .from(schema.skills)
    .where(
      sql`${schema.skills.id} = ${idOrSlug} OR ${schema.skills.slug} = ${idOrSlug}`
    )
    .get();

  if (!skill) return null;

  const tagRows = db
    .select({ tag: schema.tags })
    .from(schema.skillTags)
    .innerJoin(schema.tags, eq(schema.skillTags.tagId, schema.tags.id))
    .where(eq(schema.skillTags.skillId, skill.id))
    .all();

  return { ...skill, tags: tagRows.map((r) => r.tag) };
}

export interface ListSkillsOptions {
  query?: string;
  type?: SkillType;
  tagIds?: string[];
  limit?: number;
  offset?: number;
}

export interface ListSkillsResult {
  skills: SkillWithTags[];
  total: number;
  hasMore: boolean;
}

export async function listSkills(
  options: ListSkillsOptions = {}
): Promise<ListSkillsResult> {
  const { query, type, tagIds, limit = 50, offset = 0 } = options;
  const conditions = [];

  if (query) {
    const q = `%${query}%`;
    conditions.push(
      sql`(${schema.skills.name} LIKE ${q} OR ${schema.skills.description} LIKE ${q} OR ${schema.skills.content} LIKE ${q})`
    );
  }

  if (type) {
    conditions.push(eq(schema.skills.type, type));
  }

  let skillIds: string[] | undefined;
  if (tagIds?.length) {
    const rows = db
      .select({ skillId: schema.skillTags.skillId })
      .from(schema.skillTags)
      .where(inArray(schema.skillTags.tagId, tagIds))
      .all();
    skillIds = [...new Set(rows.map((r) => r.skillId))];
    if (skillIds.length === 0) {
      return { skills: [], total: 0, hasMore: false };
    }
    conditions.push(inArray(schema.skills.id, skillIds));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.skills)
    .where(where)
    .get();
  const total = totalRow?.count ?? 0;

  const rows = db
    .select()
    .from(schema.skills)
    .where(where)
    .orderBy(sql`${schema.skills.updatedAt} DESC`)
    .limit(limit)
    .offset(offset)
    .all();

  // Fetch tags for all skills
  const allSkillIds = rows.map((r) => r.id);
  const allTagRows =
    allSkillIds.length > 0
      ? db
          .select({
            skillId: schema.skillTags.skillId,
            tag: schema.tags,
          })
          .from(schema.skillTags)
          .innerJoin(schema.tags, eq(schema.skillTags.tagId, schema.tags.id))
          .where(inArray(schema.skillTags.skillId, allSkillIds))
          .all()
      : [];

  const tagMap = new Map<string, schema.Tag[]>();
  for (const row of allTagRows) {
    const existing = tagMap.get(row.skillId) || [];
    existing.push(row.tag);
    tagMap.set(row.skillId, existing);
  }

  const skills: SkillWithTags[] = rows.map((skill) => ({
    ...skill,
    tags: tagMap.get(skill.id) || [],
  }));

  return { skills, total, hasMore: offset + limit < total };
}

export async function searchSkills(
  query: string,
  options: { type?: SkillType; tagNames?: string[]; limit?: number } = {}
): Promise<SkillWithTags[]> {
  const { type, tagNames, limit = 20 } = options;

  let tagIds: string[] | undefined;
  if (tagNames?.length) {
    const tagRows = db
      .select()
      .from(schema.tags)
      .where(inArray(schema.tags.name, tagNames))
      .all();
    tagIds = tagRows.map((t) => t.id);
  }

  const result = await listSkills({ query, type, tagIds, limit });
  return result.skills;
}

export async function getStats(): Promise<{
  totalSkills: number;
  byType: Record<string, number>;
  totalTags: number;
  recentSkills: SkillWithTags[];
}> {
  const totalRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.skills)
    .get();

  const byTypeRows = db
    .select({
      type: schema.skills.type,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.skills)
    .groupBy(schema.skills.type)
    .all();

  const totalTagsRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.tags)
    .get();

  const recentResult = await listSkills({ limit: 5 });

  const byType: Record<string, number> = {};
  for (const row of byTypeRows) {
    byType[row.type] = row.count;
  }

  return {
    totalSkills: totalRow?.count ?? 0,
    byType,
    totalTags: totalTagsRow?.count ?? 0,
    recentSkills: recentResult.skills,
  };
}
