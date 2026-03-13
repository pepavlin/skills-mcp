"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const typeColors: Record<string, string> = {
  prompt: "bg-blue-100 text-blue-800",
  workflow: "bg-purple-100 text-purple-800",
  technique: "bg-green-100 text-green-800",
  snippet: "bg-orange-100 text-orange-800",
  config: "bg-gray-100 text-gray-800",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skills</h1>
          <p className="text-muted-foreground">{total} skills total</p>
        </div>
        <Link href="/dashboard/skills/new">
          <Button>+ New Skill</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
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
        <p className="text-muted-foreground">Loading...</p>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {query || typeFilter !== "all" || tagFilter !== "all"
                ? "No skills match your filters."
                : "No skills yet. Create your first one!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/dashboard/skills/${skill.id}`}
              className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{skill.name}</h3>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[skill.type] || ""}`}
                    >
                      {skill.type}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {skill.description}
                  </p>
                  {skill.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {skill.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {skill.tokenEstimate && (
                    <span className="text-xs text-muted-foreground">
                      ~{skill.tokenEstimate} tok
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
