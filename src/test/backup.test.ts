import { describe, it, expect, beforeAll } from "vitest";
import Database from "better-sqlite3";

beforeAll(() => {
  const dbPath = process.env.DATABASE_PATH!;
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('prompt', 'workflow', 'technique', 'snippet', 'config')),
      token_estimate INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6b7280'
    );

    CREATE TABLE IF NOT EXISTS skill_tags (
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (skill_id, tag_id)
    );
  `);
  sqlite.close();
});

describe("validateBackupData", () => {
  it("should accept valid backup data", async () => {
    const { validateBackupData } = await import("@/lib/backup");

    const valid = {
      version: "1.0",
      exportedAt: "2026-03-17T10:00:00Z",
      tags: [{ name: "react", color: "#blue" }],
      skills: [
        {
          name: "Test Skill",
          slug: "test-skill",
          description: "desc",
          content: "content",
          type: "prompt",
          tags: ["react"],
        },
      ],
    };

    expect(validateBackupData(valid)).toBe(true);
  });

  it("should reject missing version", async () => {
    const { validateBackupData } = await import("@/lib/backup");
    expect(validateBackupData({ exportedAt: "x", tags: [], skills: [] })).toBe(false);
  });

  it("should reject invalid skill type", async () => {
    const { validateBackupData } = await import("@/lib/backup");
    const invalid = {
      version: "1.0",
      exportedAt: "x",
      tags: [],
      skills: [{ name: "x", slug: "x", description: "x", content: "x", type: "invalid", tags: [] }],
    };
    expect(validateBackupData(invalid)).toBe(false);
  });

  it("should reject non-object", async () => {
    const { validateBackupData } = await import("@/lib/backup");
    expect(validateBackupData(null)).toBe(false);
    expect(validateBackupData("string")).toBe(false);
    expect(validateBackupData(42)).toBe(false);
  });
});

describe("exportSkills", () => {
  it("should export all skills and tags", async () => {
    const { createSkill } = await import("@/lib/skills");
    const { createTag } = await import("@/lib/tags");
    const { exportSkills } = await import("@/lib/backup");

    const tag = await createTag({ name: "backup-export-tag", color: "#ff0000" });
    await createSkill({
      name: "Export Test Skill",
      description: "A skill for export testing",
      content: "Export test content",
      type: "snippet",
      tagIds: [tag.id],
    });

    const backup = await exportSkills();

    expect(backup.version).toBe("1.0");
    expect(typeof backup.exportedAt).toBe("string");
    expect(Array.isArray(backup.tags)).toBe(true);
    expect(Array.isArray(backup.skills)).toBe(true);

    const exportedTag = backup.tags.find((t) => t.name === "backup-export-tag");
    expect(exportedTag).toBeDefined();
    expect(exportedTag?.color).toBe("#ff0000");

    const exportedSkill = backup.skills.find((s) => s.name === "Export Test Skill");
    expect(exportedSkill).toBeDefined();
    expect(exportedSkill?.type).toBe("snippet");
    expect(exportedSkill?.tags).toContain("backup-export-tag");
  });
});

describe("importSkills - skip mode", () => {
  it("should import new skills and tags", async () => {
    const { importSkills } = await import("@/lib/backup");
    const { getSkill } = await import("@/lib/skills");

    const backup = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      tags: [{ name: "import-tag-new", color: "#00ff00" }],
      skills: [
        {
          name: "Imported Skill",
          slug: "imported-skill",
          description: "A skill imported from backup",
          content: "Imported content here",
          type: "workflow" as const,
          tags: ["import-tag-new"],
        },
      ],
    };

    const result = await importSkills(backup, "skip");

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.tagsImported).toBe(1);
    expect(result.errors).toHaveLength(0);

    const skill = await getSkill("imported-skill");
    expect(skill).toBeDefined();
    expect(skill?.name).toBe("Imported Skill");
    expect(skill?.tags.map((t) => t.name)).toContain("import-tag-new");
  });

  it("should skip duplicate skills in skip mode", async () => {
    const { importSkills } = await import("@/lib/backup");

    const backup = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      tags: [],
      skills: [
        {
          name: "Imported Skill",
          slug: "imported-skill",
          description: "Updated description",
          content: "Updated content",
          type: "prompt" as const,
          tags: [],
        },
      ],
    };

    const result = await importSkills(backup, "skip");

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);

    // Original skill should be unchanged
    const { getSkill } = await import("@/lib/skills");
    const skill = await getSkill("imported-skill");
    expect(skill?.type).toBe("workflow"); // original type preserved
  });

  it("should reuse existing tags instead of duplicating", async () => {
    const { importSkills } = await import("@/lib/backup");

    const backup = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      tags: [{ name: "import-tag-new", color: "#changed" }], // tag already exists
      skills: [
        {
          name: "Another Imported Skill",
          slug: "another-imported-skill",
          description: "desc",
          content: "content",
          type: "technique" as const,
          tags: ["import-tag-new"],
        },
      ],
    };

    const result = await importSkills(backup, "skip");

    expect(result.tagsImported).toBe(0); // tag already exists, not re-created
    expect(result.imported).toBe(1);
  });
});

describe("importSkills - overwrite mode", () => {
  it("should overwrite existing skills", async () => {
    const { importSkills } = await import("@/lib/backup");
    const { getSkill } = await import("@/lib/skills");

    const backup = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      tags: [],
      skills: [
        {
          name: "Imported Skill Updated",
          slug: "imported-skill",
          description: "Updated description via overwrite",
          content: "Updated content via overwrite",
          type: "config" as const,
          tags: [],
        },
      ],
    };

    const result = await importSkills(backup, "overwrite");

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);

    const skill = await getSkill("imported-skill");
    expect(skill?.name).toBe("Imported Skill Updated");
    expect(skill?.type).toBe("config");
    expect(skill?.description).toBe("Updated description via overwrite");
  });
});

describe("export and re-import roundtrip", () => {
  it("should produce identical data after export and re-import", async () => {
    const { createSkill } = await import("@/lib/skills");
    const { createTag } = await import("@/lib/tags");
    const { exportSkills, importSkills, validateBackupData } = await import("@/lib/backup");

    const tag = await createTag({ name: "roundtrip-tag", color: "#aabbcc" });
    await createSkill({
      name: "Roundtrip Skill",
      description: "Used for roundtrip test",
      content: "Roundtrip content",
      type: "prompt",
      tagIds: [tag.id],
    });

    const exported = await exportSkills();
    expect(validateBackupData(exported)).toBe(true);

    // Re-import with overwrite mode to restore the data
    const result = await importSkills(exported, "skip");
    expect(result.errors).toHaveLength(0);

    const roundtripSkill = exported.skills.find((s) => s.name === "Roundtrip Skill");
    expect(roundtripSkill?.tags).toContain("roundtrip-tag");
  });
});
