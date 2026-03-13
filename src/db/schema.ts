import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const skills = sqliteTable("skills", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  type: text("type", {
    enum: ["prompt", "workflow", "technique", "snippet", "config"],
  }).notNull(),
  parameters: text("parameters"), // JSON string of parameter definitions
  examples: text("examples"), // JSON string of usage examples
  tokenEstimate: integer("token_estimate"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6b7280"),
});

export const skillTags = sqliteTable("skill_tags", {
  skillId: text("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
