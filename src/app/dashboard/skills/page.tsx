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
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-zinc-500">
          Skills <span className="tabular-nums text-zinc-400">({total})</span>
        </h1>
        <Link
          href="/dashboard/skills/new"
          className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          + New Skill
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-28 text-xs">
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
          <SelectTrigger className="h-8 w-28 text-xs">
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
        <div className="flex h-32 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-sm text-zinc-400">
          {query || typeFilter !== "all" || tagFilter !== "all"
            ? "No skills match your filters."
            : "No skills yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
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
              {skills.map((skill) => (
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
        </div>
      )}
    </div>
  );
}
