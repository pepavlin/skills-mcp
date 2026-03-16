"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  tokenEstimate: number | null;
  tags: Array<{ id: string; name: string; color: string }>;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  skillCount: number;
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

export default function SkillsListPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    if (tagFilter && tagFilter !== "all") params.set("tags", tagFilter);

    const res = await fetch(`/api/skills?${params}`);
    const data = await res.json();
    setSkills(data.skills || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [query, typeFilter, tagFilter]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTags);
  }, []);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Skills</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} skill{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/dashboard/skills/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-150 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Skill
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9 text-sm bg-card"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="h-9 w-32 text-sm bg-card">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="prompt">Prompt</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="technique">Technique</SelectItem>
            <SelectItem value="snippet">Snippet</SelectItem>
            <SelectItem value="config">Config</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={(v) => setTagFilter(v ?? "all")}>
          <SelectTrigger className="h-9 w-32 text-sm bg-card">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name} ({tag.skillCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border/50 bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      ) : skills.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card py-16 text-center shadow-sm shadow-black/[0.03]">
          <div className="rounded-full bg-primary/10 p-4">
            <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {query || typeFilter !== "all" || tagFilter !== "all"
                ? "No skills match your filters"
                : "No skills yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {query || typeFilter !== "all" || tagFilter !== "all" ? (
                <button onClick={() => { setQuery(""); setTypeFilter("all"); setTagFilter("all"); }} className="text-primary hover:underline">
                  Clear filters
                </button>
              ) : (
                <Link href="/dashboard/skills/new" className="text-primary hover:underline">Create your first skill</Link>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm shadow-black/[0.03]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Tokens</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {skills.map((skill) => (
                <tr key={skill.id} className="group transition-colors hover:bg-accent/50">
                  <td className="px-5 py-3.5">
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
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${typeColors[skill.type] || "bg-zinc-50 text-zinc-600 ring-zinc-100"}`}>
                      {typeLabels[skill.type] || skill.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
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
                  <td className="px-5 py-3.5 text-right tabular-nums text-xs text-muted-foreground">
                    {skill.tokenEstimate ? `~${skill.tokenEstimate}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
