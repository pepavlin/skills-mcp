"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const typeLabels: Record<string, string> = {
  prompt: "Prompts",
  workflow: "Workflows",
  technique: "Techniques",
  snippet: "Snippets",
  config: "Configs",
};

const typeColors: Record<string, string> = {
  prompt: "bg-blue-100 text-blue-800",
  workflow: "bg-purple-100 text-purple-800",
  technique: "bg-green-100 text-green-800",
  snippet: "bg-orange-100 text-orange-800",
  config: "bg-gray-100 text-gray-800",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your AI skills collection
          </p>
        </div>
        <Link href="/dashboard/skills/new">
          <Button>+ New Skill</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSkills}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalTags}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${typeColors[type] || ""}`}
                >
                  {typeLabels[type] || type}: {count}
                </span>
              ))}
              {Object.keys(stats.byType).length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No skills yet
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent skills */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentSkills.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No skills yet.</p>
              <Link href="/dashboard/skills/new">
                <Button variant="outline" className="mt-2">
                  Create your first skill
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentSkills.map((skill) => (
                <Link
                  key={skill.id}
                  href={`/dashboard/skills/${skill.id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{skill.name}</h3>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[skill.type] || ""}`}
                        >
                          {skill.type}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {skill.description}
                      </p>
                      {skill.tags.length > 0 && (
                        <div className="mt-2 flex gap-1">
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
                    {skill.tokenEstimate && (
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        ~{skill.tokenEstimate} tokens
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MCP Config info */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Server Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Add this to your Claude Code MCP settings to connect the AI Skills server:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(
              {
                mcpServers: {
                  "ai-skills": {
                    command: "npx",
                    args: ["tsx", "src/mcp/stdio.ts"],
                    cwd: "/path/to/skills-mcp",
                  },
                },
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
