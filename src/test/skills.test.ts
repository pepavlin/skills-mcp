import { describe, it, expect, beforeAll } from "vitest";
import Database from "better-sqlite3";
import path from "path";

// Run migration on test DB
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

describe("Skills CRUD", () => {
  it("should create a skill", async () => {
    const { createSkill } = await import("@/lib/skills");

    const skill = await createSkill({
      name: "Test Skill",
      description: "A test skill for unit testing purposes",
      content: "This is the content of the test skill",
      type: "prompt",
    });

    expect(skill).toBeDefined();
    expect(skill.name).toBe("Test Skill");
    expect(skill.slug).toBe("test-skill");
    expect(skill.type).toBe("prompt");
    expect(skill.tokenEstimate).toBeGreaterThan(0);
    expect(skill.tags).toEqual([]);
  });

  it("should get a skill by id", async () => {
    const { createSkill, getSkill } = await import("@/lib/skills");

    const created = await createSkill({
      name: "Get Test",
      description: "A skill to test get functionality",
      content: "Content here",
      type: "technique",
    });

    const fetched = await getSkill(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe("Get Test");
  });

  it("should get a skill by slug", async () => {
    const { getSkill } = await import("@/lib/skills");

    const fetched = await getSkill("get-test");
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe("Get Test");
  });

  it("should list skills", async () => {
    const { listSkills } = await import("@/lib/skills");

    const result = await listSkills();
    expect(result.skills.length).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
  });

  it("should search skills by query", async () => {
    const { searchSkills } = await import("@/lib/skills");

    const results = await searchSkills("unit testing");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe("Test Skill");
  });

  it("should filter skills by type", async () => {
    const { listSkills } = await import("@/lib/skills");

    const result = await listSkills({ type: "technique" });
    expect(result.skills.every((s) => s.type === "technique")).toBe(true);
  });

  it("should update a skill", async () => {
    const { createSkill, updateSkill } = await import("@/lib/skills");

    const skill = await createSkill({
      name: "Update Me",
      description: "This skill will be updated in the test",
      content: "Original content",
      type: "snippet",
    });

    const updated = await updateSkill(skill.id, {
      name: "Updated Skill",
      content: "New content",
    });

    expect(updated).toBeDefined();
    expect(updated!.name).toBe("Updated Skill");
    expect(updated!.content).toBe("New content");
    expect(updated!.slug).toBe("updated-skill");
  });

  it("should delete a skill", async () => {
    const { createSkill, deleteSkill, getSkill } = await import(
      "@/lib/skills"
    );

    const skill = await createSkill({
      name: "Delete Me",
      description: "This skill will be deleted in the test",
      content: "To be deleted",
      type: "config",
    });

    const deleted = await deleteSkill(skill.id);
    expect(deleted).toBe(true);

    const fetched = await getSkill(skill.id);
    expect(fetched).toBeNull();
  });

  it("should handle skills with tags", async () => {
    const { createSkill } = await import("@/lib/skills");
    const { createTag } = await import("@/lib/tags");

    const tag1 = await createTag({ name: "react", color: "#61dafb" });
    const tag2 = await createTag({ name: "testing", color: "#22c55e" });

    const skill = await createSkill({
      name: "Tagged Skill",
      description: "A skill with tags for testing tag functionality",
      content: "Content with tags",
      type: "prompt",
      tagIds: [tag1.id, tag2.id],
    });

    expect(skill.tags).toHaveLength(2);
    expect(skill.tags.map((t) => t.name).sort()).toEqual(["react", "testing"]);
  });

  it("should filter skills by tag", async () => {
    const { listSkills } = await import("@/lib/skills");
    const { listTags } = await import("@/lib/tags");

    const allTags = await listTags();
    const reactTag = allTags.find((t) => t.name === "react");

    const result = await listSkills({ tagIds: [reactTag!.id] });
    expect(result.skills.length).toBeGreaterThanOrEqual(1);
    expect(
      result.skills.every((s) => s.tags.some((t) => t.name === "react"))
    ).toBe(true);
  });

  it("should get stats", async () => {
    const { getStats } = await import("@/lib/skills");

    const stats = await getStats();
    expect(stats.totalSkills).toBeGreaterThan(0);
    expect(stats.totalTags).toBeGreaterThan(0);
    expect(stats.recentSkills.length).toBeGreaterThan(0);
  });
});

describe("Tags CRUD", () => {
  it("should create a tag", async () => {
    const { createTag } = await import("@/lib/tags");

    const tag = await createTag({ name: "typescript", color: "#3178c6" });
    expect(tag.name).toBe("typescript");
    expect(tag.color).toBe("#3178c6");
  });

  it("should list tags with counts", async () => {
    const { listTags } = await import("@/lib/tags");

    const tags = await listTags();
    expect(tags.length).toBeGreaterThan(0);
    // Each tag should have a skillCount property
    tags.forEach((tag) => {
      expect(typeof tag.skillCount).toBe("number");
    });
  });

  it("should update a tag", async () => {
    const { createTag, updateTag } = await import("@/lib/tags");

    const tag = await createTag({ name: "to-update", color: "#000" });
    const updated = await updateTag(tag.id, {
      name: "updated-tag",
      color: "#fff",
    });

    expect(updated).toBeDefined();
    expect(updated!.name).toBe("updated-tag");
    expect(updated!.color).toBe("#fff");
  });

  it("should delete a tag", async () => {
    const { createTag, deleteTag, getTag } = await import("@/lib/tags");

    const tag = await createTag({ name: "to-delete" });
    const deleted = await deleteTag(tag.id);
    expect(deleted).toBe(true);

    const fetched = await getTag(tag.id);
    expect(fetched).toBeNull();
  });
});
