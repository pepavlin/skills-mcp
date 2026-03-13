"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SkillForm } from "@/components/skill-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  prompt: { label: "Prompt", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  workflow: { label: "Workflow", color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
  technique: { label: "Technique", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
  snippet: { label: "Snippet", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
  config: { label: "Config", color: "text-zinc-700", bg: "bg-zinc-50 border-zinc-200" },
};

function safeJsonFormat(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

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
    return `---\nname: ${skill.slug}\ndescription: >\n  ${skill.description}\n---\n\n${skill.content}`;
  }

  function copySkillMd() {
    navigator.clipboard.writeText(generateSkillMd());
    toast.success("SKILL.md copied to clipboard");
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!skill) return null;

  const cfg = typeConfig[skill.type];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/skills" className="hover:text-foreground">Skills</Link>
        <span>/</span>
        <span className="text-foreground">{skill.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{skill.name}</h1>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg?.bg || ""} ${cfg?.color || ""}`}>
              {cfg?.label || skill.type}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {skill.description}
          </p>
          {skill.tags.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              {skill.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="font-normal"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={copySkillMd}>
            Export SKILL.md
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="font-mono">{skill.slug}</span>
        <span className="tabular-nums">~{skill.tokenEstimate} tokens</span>
        <span>Updated {new Date(skill.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="skillmd">SKILL.md</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-6 space-y-4">
          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-medium">Content</h3>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-700">
                {skill.content}
              </pre>
            </div>
          </div>

          {skill.parameters && (
            <div className="rounded-xl border bg-white">
              <div className="border-b px-6 py-4">
                <h3 className="text-sm font-medium">Parameters</h3>
              </div>
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-700">
                  {safeJsonFormat(skill.parameters)}
                </pre>
              </div>
            </div>
          )}

          {skill.examples && (
            <div className="rounded-xl border bg-white">
              <div className="border-b px-6 py-4">
                <h3 className="text-sm font-medium">Examples</h3>
              </div>
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-700">
                  {safeJsonFormat(skill.examples)}
                </pre>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
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

        <TabsContent value="skillmd" className="mt-6">
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-sm font-medium">Agent Skills Format</h3>
              <Button variant="outline" size="sm" onClick={copySkillMd}>
                Copy
              </Button>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap rounded-lg bg-zinc-950 p-4 font-mono text-sm text-zinc-300">
                {generateSkillMd()}
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
