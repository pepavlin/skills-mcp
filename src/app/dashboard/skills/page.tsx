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
import { ZapIcon, PlusIcon, SearchIcon, PencilIcon } from "lucide-react";

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

const typeBadgeClass: Record<string, string> = {
  prompt: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  workflow: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  technique: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  snippet: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  config: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "skill" : "skills"} total
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="h-9 w-32">
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
          <SelectTrigger className="h-9 w-32">
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
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      ) : skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <ZapIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-semibold">
            {query || typeFilter !== "all" || tagFilter !== "all"
              ? "No skills match your filters"
              : "No skills yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query || typeFilter !== "all" || tagFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first skill to get started."}
          </p>
          {!query && typeFilter === "all" && tagFilter === "all" && (
            <Link
              href="/dashboard/skills/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 277), oklch(0.55 0.25 300))" }}
            >
              <PlusIcon className="h-4 w-4" />
              New Skill
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Tokens</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {skills.map((skill) => (
                <tr key={skill.id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-6 py-4">
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
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass[skill.type] || "bg-muted text-muted-foreground"}`}>
                      {typeLabels[skill.type] || skill.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
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
                  <td className="px-4 py-4 text-right text-xs tabular-nums text-muted-foreground">
                    {skill.tokenEstimate ? `~${skill.tokenEstimate}` : "—"}
                  </td>
                  <td className="px-4 py-4 text-right text-xs text-muted-foreground">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/skills/${skill.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Edit
                    </Link>
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
