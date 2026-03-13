"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { SkillForm } from "@/components/skill-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SkillData {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  type: string;
  parameters: string | null;
  examples: string | null;
  tokenEstimate: number | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string; color: string }>;
}

const typeColors: Record<string, string> = {
  prompt: "bg-blue-100 text-blue-800",
  workflow: "bg-purple-100 text-purple-800",
  technique: "bg-green-100 text-green-800",
  snippet: "bg-orange-100 text-orange-800",
  config: "bg-gray-100 text-gray-800",
};

export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [skill, setSkill] = useState<SkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/skills/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setSkill)
      .catch(() => router.push("/dashboard/skills"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleDelete() {
    if (!confirm("Delete this skill? This cannot be undone.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/skills/${skill?.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Skill deleted");
      router.push("/dashboard/skills");
    } catch {
      toast.error("Failed to delete skill");
      setDeleting(false);
    }
  }

  function generateSkillMd(): string {
    if (!skill) return "";
    return `---
name: ${skill.slug}
description: >
  ${skill.description}
---

${skill.content}`;
  }

  function copySkillMd() {
    navigator.clipboard.writeText(generateSkillMd());
    toast.success("SKILL.md content copied to clipboard");
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!skill) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{skill.name}</h1>
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${typeColors[skill.type] || ""}`}
            >
              {skill.type}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">{skill.description}</p>
          {skill.tags.length > 0 && (
            <div className="mt-2 flex gap-1">
              {skill.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copySkillMd}>
            Export SKILL.md
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Slug: {skill.slug}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>~{skill.tokenEstimate} tokens</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Updated: {new Date(skill.updatedAt).toLocaleString()}</span>
      </div>

      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="skillmd">SKILL.md</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
                {skill.content}
              </pre>
            </CardContent>
          </Card>

          {skill.parameters && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
                  {JSON.stringify(JSON.parse(skill.parameters), null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {skill.examples && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
                  {JSON.stringify(JSON.parse(skill.examples), null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <SkillForm
            mode="edit"
            initialData={{
              id: skill.id,
              name: skill.name,
              description: skill.description,
              content: skill.content,
              type: skill.type,
              parameters: skill.parameters || "",
              examples: skill.examples || "",
              tags: skill.tags,
            }}
          />
        </TabsContent>

        <TabsContent value="skillmd" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agent Skills Format (SKILL.md)</CardTitle>
                <Button variant="outline" size="sm" onClick={copySkillMd}>
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
                {generateSkillMd()}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
