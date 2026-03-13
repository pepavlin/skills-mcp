"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ZapIcon,
  TagIcon,
  PlusIcon,
  CopyIcon,
  CheckIcon,
  TerminalIcon,
  SearchIcon,
  LayoutListIcon,
  ListIcon,
} from "lucide-react";

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

const typeBadgeClass: Record<string, string> = {
  prompt: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  workflow: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  technique: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  snippet: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  config: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
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
          type: "http",
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading stats...</p>
        </div>
      </div>
    );
  }

  const totalTokens = stats.recentSkills.reduce(
    (sum, s) => sum + (s.tokenEstimate || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your AI skills and MCP configuration
          </p>
        </div>
        <Link
          href="/dashboard/skills/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 277), oklch(0.55 0.25 300))" }}
        >
          <PlusIcon className="h-4 w-4" />
          New Skill
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Skills stat */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Skills</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <ZapIcon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold tabular-nums tracking-tight">{stats.totalSkills}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).map(([type, count]) => (
              <span
                key={type}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass[type] || "bg-muted text-muted-foreground"}`}
              >
                {count} {typeLabels[type]?.toLowerCase() || type}
              </span>
            ))}
          </div>
        </div>

        {/* Tags stat */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
              <TagIcon className="h-4 w-4 text-violet-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold tabular-nums tracking-tight">{stats.totalTags}</span>
          </div>
          <div className="mt-3">
            <Link href="/dashboard/tags" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Manage tags →
            </Link>
          </div>
        </div>

        {/* MCP quick stat */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">MCP Status</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <TerminalIcon className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700">Active</span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              ~{totalTokens.toLocaleString()} tokens across recent skills
            </p>
          </div>
        </div>
      </div>

      {/* Recent skills */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Recent Skills</h2>
          <Link href="/dashboard/skills" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>
        {stats.recentSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <ZapIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">No skills yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <Link href="/dashboard/skills/new" className="text-primary hover:underline">
                Create your first skill
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Tokens</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentSkills.map((skill) => (
                <tr key={skill.id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/dashboard/skills/${skill.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {skill.name}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {skill.description}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass[skill.type] || "bg-muted text-muted-foreground"}`}>
                      {typeLabels[skill.type] || skill.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: tag.color + "18", color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs tabular-nums text-muted-foreground">
                    {skill.tokenEstimate ? `~${skill.tokenEstimate}` : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-right text-xs text-muted-foreground">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MCP config */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">MCP Configuration</h2>
          </div>
          <button
            onClick={copyConfig}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-3.5 w-3.5" />
                Copy config
              </>
            )}
          </button>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs text-muted-foreground">
              Add to{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">~/.claude.json</code>{" "}
              or{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.mcp.json</code>
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
              {mcpConfig}
            </pre>
          </div>
          <div>
            <p className="mb-3 text-xs text-muted-foreground">Available MCP tools</p>
            <div className="space-y-2">
              {[
                { name: "search_skills", icon: SearchIcon, args: "query, tags?, type?", desc: "Find skills by keyword" },
                { name: "get_skill", icon: ZapIcon, args: "identifier", desc: "Get full skill content" },
                { name: "list_skills", icon: LayoutListIcon, args: "type?, tags?, limit?", desc: "Browse available skills" },
                { name: "list_tags", icon: ListIcon, args: "", desc: "List tags with counts" },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.name} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <code className="font-mono text-xs font-semibold text-foreground">{tool.name}</code>
                        {tool.args && (
                          <span className="text-xs text-muted-foreground">({tool.args})</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{tool.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
