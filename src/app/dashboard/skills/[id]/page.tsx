"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SkillForm } from "@/components/skill-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChevronRightIcon, CopyIcon, Trash2Icon } from "lucide-react";

interface SkillData {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  type: string;
  tokenEstimate: number | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string; color: string }>;
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
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading skill...</p>
        </div>
      </div>
    );
  }

  if (!skill) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/dashboard/skills" className="hover:text-foreground transition-colors">Skills</Link>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{skill.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copySkillMd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            Export .md
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2Icon className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Skill header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">{skill.name}</h1>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass[skill.type] || "bg-muted text-muted-foreground"}`}>
            {typeLabels[skill.type] || skill.type}
          </span>
          {skill.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: tag.color + "18", color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-2xl">
          {skill.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t border-border pt-4">
          <span>
            <span className="font-medium text-foreground">Slug:</span>{" "}
            <code className="font-mono">{skill.slug}</code>
          </span>
          <span>
            <span className="font-medium text-foreground">Tokens:</span>{" "}
            ~{skill.tokenEstimate}
          </span>
          <span>
            <span className="font-medium text-foreground">Updated:</span>{" "}
            {new Date(skill.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view" className="text-sm">View</TabsTrigger>
          <TabsTrigger value="edit" className="text-sm">Edit</TabsTrigger>
          <TabsTrigger value="skillmd" className="text-sm">SKILL.md</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">Content</span>
            </div>
            <pre className="whitespace-pre-wrap p-6 font-mono text-sm leading-relaxed text-foreground">
              {skill.content}
            </pre>
          </div>
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
              tags: skill.tags,
            }}
          />
        </TabsContent>

        <TabsContent value="skillmd" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">Agent Skills Format</span>
              <button
                onClick={copySkillMd}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <pre className="whitespace-pre-wrap bg-zinc-950 p-6 font-mono text-xs text-zinc-300 rounded-b-xl">
              {generateSkillMd()}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
