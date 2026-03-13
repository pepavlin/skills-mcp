"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  prompt: { label: "Prompt", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  workflow: { label: "Workflow", color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
  technique: { label: "Technique", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
  snippet: { label: "Snippet", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
  config: { label: "Config", color: "text-zinc-700", bg: "bg-zinc-50 border-zinc-200" },
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI skills at a glance
          </p>
        </div>
        <Link href="/dashboard/skills/new">
          <Button className="gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Skill
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Skills</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.totalSkills}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{stats.totalTags}</p>
        </div>
        {Object.entries(stats.byType).slice(0, 2).map(([type, count]) => (
          <div key={type} className="rounded-xl border bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {typeConfig[type]?.label || type}s
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent skills */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">Recent Skills</h2>
              <Link href="/dashboard/skills" className="text-sm text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
            {stats.recentSkills.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">No skills yet.</p>
                <Link href="/dashboard/skills/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    Create your first skill
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentSkills.map((skill) => (
                  <Link
                    key={skill.id}
                    href={`/dashboard/skills/${skill.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium">{skill.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeConfig[skill.type]?.bg || ""} ${typeConfig[skill.type]?.color || ""}`}>
                          {typeConfig[skill.type]?.label || skill.type}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {skill.description}
                      </p>
                      {skill.tags.length > 0 && (
                        <div className="mt-1.5 flex gap-1">
                          {skill.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="h-5 text-[10px] font-normal"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {skill.tokenEstimate && (
                        <p className="text-xs tabular-nums text-muted-foreground">
                          ~{skill.tokenEstimate} tok
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Type breakdown */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold">By Type</h2>
            </div>
            <div className="p-6">
              {Object.keys(stats.byType).length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const pct = stats.totalSkills > 0 ? (count / stats.totalSkills) * 100 : 0;
                    const cfg = typeConfig[type];
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${cfg?.color || ""}`}>
                            {cfg?.label || type}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-zinc-900 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MCP Setup */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Connect via MCP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add this MCP server to your AI assistant to access your skills
          </p>
        </div>
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Config */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Configuration</h3>
                <Button variant="outline" size="sm" onClick={copyConfig} className="h-7 text-xs">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Add to <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono">~/.claude.json</code> or project <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono">.mcp.json</code>
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-300">
                {mcpConfig}
              </pre>
            </div>

            {/* Tools reference */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Available Tools</h3>
              <div className="space-y-2.5">
                {[
                  { name: "search_skills", params: "query, tags?, type?", desc: "Find skills by keyword and filters" },
                  { name: "get_skill", params: "identifier", desc: "Get full content of a specific skill" },
                  { name: "list_skills", params: "type?, tags?, limit?", desc: "Browse all available skills" },
                  { name: "list_tags", params: "", desc: "List all tags with skill counts" },
                ].map((tool) => (
                  <div key={tool.name} className="rounded-lg border border-zinc-100 bg-zinc-50/50 px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <code className="text-sm font-semibold">{tool.name}</code>
                      {tool.params && (
                        <span className="text-xs text-muted-foreground">({tool.params})</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
