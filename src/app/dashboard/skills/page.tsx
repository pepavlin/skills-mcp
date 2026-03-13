"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  prompt: { label: "Prompt", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  workflow: { label: "Workflow", color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
  technique: { label: "Technique", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
  snippet: { label: "Snippet", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
  config: { label: "Config", color: "text-zinc-700", bg: "bg-zinc-50 border-zinc-200" },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} skill{total !== 1 ? "s" : ""} in your collection
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-36">
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
          <SelectTrigger className="w-36">
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

      {/* Skills list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            {query || typeFilter !== "all" || tagFilter !== "all"
              ? "No skills match your filters."
              : "No skills yet. Create your first one!"}
          </p>
          {!query && typeFilter === "all" && tagFilter === "all" && (
            <Link href="/dashboard/skills/new">
              <Button variant="outline" size="sm" className="mt-4">
                Create skill
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="divide-y">
            {skills.map((skill) => {
              const cfg = typeConfig[skill.type];
              return (
                <Link
                  key={skill.id}
                  href={`/dashboard/skills/${skill.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-medium">{skill.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg?.bg || ""} ${cfg?.color || ""}`}>
                        {cfg?.label || skill.type}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {skill.description}
                    </p>
                    {skill.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
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
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                    {skill.tokenEstimate && (
                      <span className="tabular-nums">~{skill.tokenEstimate} tok</span>
                    )}
                    <span>{new Date(skill.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
