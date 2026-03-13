"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalSkills: number;
  byType: Record<string, number>;
  totalTags: number;
  recentSkills: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    type: string;
    tokenEstimate: number | null;
    tags: Array<{ id: string; name: string; color: string }>;
    updatedAt: string;
  }>;
}

const typeLabels: Record<string, string> = {
  prompt: "Prompt",
  workflow: "Workflow",
  technique: "Technique",
  snippet: "Snippet",
  config: "Config",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        "ai-skills": {
          type: "url",
          url: "https://ai-skills.pavlin.dev/api/mcp",
        },
      },
    },
    null,
    2
  );

  function copyConfig() {
    navigator.clipboard.writeText(mcpConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!stats) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-2xl font-semibold tabular-nums">{stats.totalSkills}</span>
          <span className="ml-1.5 text-zinc-500">skills</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        <div>
          <span className="text-2xl font-semibold tabular-nums">{stats.totalTags}</span>
          <span className="ml-1.5 text-zinc-500">tags</span>
        </div>
        <div className="h-4 w-px bg-zinc-200" />
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="text-zinc-500">
            <span className="font-medium tabular-nums text-zinc-700">{count}</span>{" "}
            {typeLabels[type]?.toLowerCase() || type}
          </div>
        ))}
        <div className="flex-1" />
        <Link
          href="/dashboard/skills/new"
          className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          + New Skill
        </Link>
      </div>

      {/* Recent skills table */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Recent Skills</h2>
          <Link href="/dashboard/skills" className="text-xs text-zinc-400 hover:text-zinc-700">
            View all
          </Link>
        </div>
        {stats.recentSkills.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            No skills yet.{" "}
            <Link href="/dashboard/skills/new" className="text-zinc-700 underline">
              Create one
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-400">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Tags</th>
                <th className="px-4 py-2 font-medium text-right">Tokens</th>
                <th className="px-4 py-2 font-medium text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.recentSkills.map((skill) => (
                <tr key={skill.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/dashboard/skills/${skill.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {skill.name}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
                      {skill.description}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                      {typeLabels[skill.type] || skill.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded px-1.5 py-0.5 text-[11px]"
                          style={{ backgroundColor: tag.color + "18", color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-500">
                    {skill.tokenEstimate ? `~${skill.tokenEstimate}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-zinc-400">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MCP config */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">MCP Configuration</h2>
          <button
            onClick={copyConfig}
            className="rounded border px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-zinc-400">
              Add to <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">~/.claude.json</code> or{" "}
              <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">.mcp.json</code>
            </p>
            <pre className="overflow-x-auto rounded bg-zinc-900 p-3 font-mono text-xs leading-relaxed text-zinc-300">
              {mcpConfig}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-xs text-zinc-400">Available tools</p>
            <div className="space-y-1 text-xs">
              {[
                { name: "search_skills", args: "query, tags?, type?", desc: "Find skills by keyword" },
                { name: "get_skill", args: "identifier", desc: "Get full skill content" },
                { name: "list_skills", args: "type?, tags?, limit?", desc: "Browse available skills" },
                { name: "list_tags", args: "", desc: "List tags with counts" },
              ].map((tool) => (
                <div key={tool.name} className="flex items-baseline gap-2 rounded bg-zinc-50 px-3 py-2">
                  <code className="font-mono font-medium text-zinc-800">{tool.name}</code>
                  {tool.args && <span className="text-zinc-400">({tool.args})</span>}
                  <span className="ml-auto text-zinc-400">{tool.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
