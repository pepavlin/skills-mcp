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

const typeColors: Record<string, string> = {
  prompt: "bg-blue-50 text-blue-700 ring-blue-100",
  workflow: "bg-violet-50 text-violet-700 ring-violet-100",
  technique: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  snippet: "bg-orange-50 text-orange-700 ring-orange-100",
  config: "bg-cyan-50 text-cyan-700 ring-cyan-100",
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
      <div className="flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage your AI skills and MCP configuration</p>
        </div>
        <Link
          href="/dashboard/skills/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Skill
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Skills</p>
              <p className="mt-1.5 text-3xl font-bold tabular-nums text-foreground">{stats.totalSkills}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Tags</p>
              <p className="mt-1.5 text-3xl font-bold tabular-nums text-foreground">{stats.totalTags}</p>
            </div>
            <div className="rounded-lg bg-violet-100 p-2">
              <svg className="h-4 w-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
          </div>
        </div>

        {Object.entries(stats.byType).slice(0, 2).map(([type, count]) => (
          <div key={type} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{typeLabels[type] || type}s</p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums text-foreground">{count}</p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${typeColors[type] || "bg-zinc-50 text-zinc-600 ring-zinc-100"}`}>
                {typeLabels[type] || type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Type breakdown (if more than 2 types) */}
      {Object.keys(stats.byType).length > 2 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${typeColors[type] || "bg-zinc-50 text-zinc-600 ring-zinc-100"}`}>
              <span className="tabular-nums font-bold">{count}</span>
              <span>{typeLabels[type]?.toLowerCase() || type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent skills */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Recent Skills</h2>
          <Link href="/dashboard/skills" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>
        {stats.recentSkills.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No skills yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <Link href="/dashboard/skills/new" className="text-primary hover:underline">Create your first skill</Link> to get started
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <th className="px-5 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-5 py-2.5 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-2.5 text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Tokens</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {stats.recentSkills.map((skill) => (
                <tr key={skill.id} className="group transition-colors hover:bg-accent/50">
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${typeColors[skill.type] || "bg-zinc-50 text-zinc-600 ring-zinc-100"}`}>
                      {typeLabels[skill.type] || skill.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: tag.color + "18", color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-xs text-muted-foreground">
                    {skill.tokenEstimate ? `~${skill.tokenEstimate}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MCP config */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-emerald-100 p-1">
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-foreground">MCP Configuration</h2>
          </div>
          <button
            onClick={copyConfig}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              copied
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-accent text-muted-foreground hover:text-foreground ring-1 ring-border/60"
            }`}
          >
            {copied ? (
              <>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div>
            <p className="mb-2.5 text-xs text-muted-foreground">
              Add to{" "}
              <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-[11px] text-foreground">~/.claude.json</code>
              {" "}or{" "}
              <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-[11px] text-foreground">.mcp.json</code>
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 shadow-inner">
              {mcpConfig}
            </pre>
          </div>
          <div>
            <p className="mb-2.5 text-xs text-muted-foreground">Available tools</p>
            <div className="space-y-1.5">
              {[
                { name: "search_skills", args: "query, tags?, type?", desc: "Find skills by keyword" },
                { name: "get_skill", args: "identifier", desc: "Get full skill content" },
                { name: "list_skills", args: "type?, tags?, limit?", desc: "Browse available skills" },
                { name: "list_tags", args: "", desc: "List tags with counts" },
              ].map((tool) => (
                <div key={tool.name} className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-accent/30 px-3.5 py-2.5 transition-colors hover:bg-accent">
                  <code className="font-mono text-xs font-semibold text-foreground">{tool.name}</code>
                  {tool.args && <span className="text-[11px] text-muted-foreground">({tool.args})</span>}
                  <span className="ml-auto text-[11px] text-muted-foreground">{tool.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
