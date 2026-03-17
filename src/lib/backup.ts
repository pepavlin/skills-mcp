import { db, schema } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { listTags } from "@/lib/tags";
import { listSkills, SkillType } from "@/lib/skills";

export const BACKUP_VERSION = "1.0";

export interface BackupTag {
  name: string;
  color: string;
}

export interface BackupSkill {
  name: string;
  slug: string;
  description: string;
  content: string;
  type: SkillType;
  tags: string[]; // tag names
}

export interface BackupData {
  version: string;
  exportedAt: string;
  tags: BackupTag[];
  skills: BackupSkill[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  tagsImported: number;
  errors: string[];
}

export type ImportMode = "skip" | "overwrite";

export async function exportSkills(): Promise<BackupData> {
  const tagsResult = await listTags();
  const skillsResult = await listSkills({ limit: 10000 });

  const tags: BackupTag[] = tagsResult.map((t) => ({
    name: t.name,
    color: t.color,
  }));

  const skills: BackupSkill[] = skillsResult.skills.map((s) => ({
    name: s.name,
    slug: s.slug,
    description: s.description,
    content: s.content,
    type: s.type as SkillType,
    tags: s.tags.map((t) => t.name),
  }));

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tags,
    skills,
  };
}

export function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.version !== "string") return false;
  if (typeof d.exportedAt !== "string") return false;
  if (!Array.isArray(d.tags)) return false;
  if (!Array.isArray(d.skills)) return false;

  const validTypes = new Set(["prompt", "workflow", "technique", "snippet", "config"]);

  for (const tag of d.tags) {
    if (!tag || typeof tag !== "object") return false;
    const t = tag as Record<string, unknown>;
    if (typeof t.name !== "string" || !t.name) return false;
    if (typeof t.color !== "string") return false;
  }

  for (const skill of d.skills) {
    if (!skill || typeof skill !== "object") return false;
    const s = skill as Record<string, unknown>;
    if (typeof s.name !== "string" || !s.name) return false;
    if (typeof s.description !== "string") return false;
    if (typeof s.content !== "string") return false;
    if (typeof s.type !== "string" || !validTypes.has(s.type)) return false;
    if (!Array.isArray(s.tags)) return false;
  }

  return true;
}

export async function importSkills(
  data: BackupData,
  mode: ImportMode = "skip"
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    tagsImported: 0,
    errors: [],
  };

  // Step 1: Ensure all tags exist, build name→id map
  const tagNameToId = new Map<string, string>();

  // Load existing tags
  const existingTags = db.select().from(schema.tags).all();
  for (const tag of existingTags) {
    tagNameToId.set(tag.name, tag.id);
  }

  // Create missing tags
  for (const backupTag of data.tags) {
    if (!tagNameToId.has(backupTag.name)) {
      const id = uuid();
      db.insert(schema.tags)
        .values({ id, name: backupTag.name, color: backupTag.color || "#6b7280" })
        .run();
      tagNameToId.set(backupTag.name, id);
      result.tagsImported++;
    }
  }

  // Step 2: Import skills
  const now = new Date().toISOString();

  for (const backupSkill of data.skills) {
    try {
      // Check if skill with same slug already exists
      const existing = db
        .select()
        .from(schema.skills)
        .where(eq(schema.skills.slug, backupSkill.slug))
        .get();

      if (existing && mode === "skip") {
        result.skipped++;
        continue;
      }

      const tokenEstimate = Math.ceil(
        (backupSkill.content.length + backupSkill.description.length) / 4
      );

      if (existing && mode === "overwrite") {
        // Update existing skill
        db.update(schema.skills)
          .set({
            name: backupSkill.name,
            description: backupSkill.description,
            content: backupSkill.content,
            type: backupSkill.type,
            tokenEstimate,
            updatedAt: now,
          })
          .where(eq(schema.skills.id, existing.id))
          .run();

        // Replace tags
        db.delete(schema.skillTags)
          .where(eq(schema.skillTags.skillId, existing.id))
          .run();

        for (const tagName of backupSkill.tags) {
          const tagId = tagNameToId.get(tagName);
          if (tagId) {
            db.insert(schema.skillTags)
              .values({ skillId: existing.id, tagId })
              .run();
          }
        }

        result.imported++;
      } else {
        // Insert new skill
        const id = uuid();
        db.insert(schema.skills)
          .values({
            id,
            name: backupSkill.name,
            slug: backupSkill.slug,
            description: backupSkill.description,
            content: backupSkill.content,
            type: backupSkill.type,
            tokenEstimate,
            createdAt: now,
            updatedAt: now,
          })
          .run();

        for (const tagName of backupSkill.tags) {
          const tagId = tagNameToId.get(tagName);
          if (tagId) {
            db.insert(schema.skillTags).values({ skillId: id, tagId }).run();
          }
        }

        result.imported++;
      }
    } catch (err) {
      result.errors.push(
        `Failed to import skill "${backupSkill.name}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}
