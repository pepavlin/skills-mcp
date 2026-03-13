import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchSkills, getSkill, listSkills, SkillType } from "../lib/skills";
import { listTags } from "../lib/tags";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "ai-skills",
    version: "1.0.0",
  });

  // Tool: search_skills - find skills by query and filters
  server.tool(
    "search_skills",
    "Search for AI skills by keyword, tags, or type. Use this to find relevant skills for your current task. Returns skill metadata (name, description, type, tags) without full content - use get_skill to retrieve the complete skill content.",
    {
      query: z
        .string()
        .describe(
          "Search query - matches against skill name, description, and content"
        ),
      tags: z
        .array(z.string())
        .optional()
        .describe("Filter by tag names (e.g. ['react', 'testing'])"),
      type: z
        .enum(["prompt", "workflow", "technique", "snippet", "config"])
        .optional()
        .describe("Filter by skill type"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max results to return (default: 20)"),
    },
    async ({ query, tags, type, limit }) => {
      const skills = await searchSkills(query, {
        type: type as SkillType | undefined,
        tagNames: tags,
        limit: limit || 20,
      });

      if (skills.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No skills found matching "${query}". Try broadening your search or use list_skills to browse all available skills.`,
            },
          ],
        };
      }

      const result = skills.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        type: s.type,
        tags: s.tags.map((t) => t.name),
        tokenEstimate: s.tokenEstimate,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Tool: get_skill - retrieve full skill content
  server.tool(
    "get_skill",
    "Get the complete content of a specific AI skill by its name, slug, or ID. Returns the full skill including instructions. Use this after finding a skill via search_skills or list_skills.",
    {
      identifier: z
        .string()
        .describe("Skill ID, slug, or exact name to retrieve"),
    },
    async ({ identifier }) => {
      // Try direct lookup first
      let skill = await getSkill(identifier);

      // If not found, try searching by name
      if (!skill) {
        const results = await searchSkills(identifier, { limit: 1 });
        if (results.length > 0) {
          skill = results[0];
        }
      }

      if (!skill) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Skill "${identifier}" not found. Use search_skills to find available skills.`,
            },
          ],
        };
      }

      const output: Record<string, unknown> = {
        name: skill.name,
        type: skill.type,
        description: skill.description,
        content: skill.content,
        tags: skill.tags.map((t) => t.name),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    }
  );

  // Tool: list_skills - browse available skills
  server.tool(
    "list_skills",
    "List all available AI skills with optional filtering by type or tags. Returns lightweight metadata for each skill. Use this to discover what skills are available before searching for specific ones.",
    {
      type: z
        .enum(["prompt", "workflow", "technique", "snippet", "config"])
        .optional()
        .describe("Filter by skill type"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Filter by tag names"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max results (default: 50)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Pagination offset (default: 0)"),
    },
    async ({ type, tags, limit, offset }) => {
      let tagIds: string[] | undefined;
      if (tags?.length) {
        const allTags = await listTags();
        tagIds = allTags
          .filter((t) => tags.includes(t.name))
          .map((t) => t.id);
      }

      const result = await listSkills({
        type: type as SkillType | undefined,
        tagIds,
        limit: limit || 50,
        offset: offset || 0,
      });

      const output = {
        total: result.total,
        hasMore: result.hasMore,
        skills: result.skills.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          type: s.type,
          tags: s.tags.map((t) => t.name),
          tokenEstimate: s.tokenEstimate,
        })),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    }
  );

  // Tool: list_tags - see available tag categories
  server.tool(
    "list_tags",
    "List all available tags/categories for filtering skills. Shows tag names and how many skills each tag has.",
    {},
    async () => {
      const tags = await listTags();
      const output = tags.map((t) => ({
        name: t.name,
        color: t.color,
        skillCount: t.skillCount,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    }
  );

  return server;
}
