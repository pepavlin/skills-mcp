"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SkillForm } from "@/components/skill-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!skill) return null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Link href="/dashboard/skills" className="hover:text-zinc-700">Skills</Link>
          <span>/</span>
          <span className="text-zinc-700">{skill.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copySkillMd}
            className="rounded border px-2.5 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            Export .md
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-lg font-semibold text-zinc-900">{skill.name}</span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
          {typeLabels[skill.type] || skill.type}
        </span>
        {skill.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded px-1.5 py-0.5"
            style={{ backgroundColor: tag.color + "18", color: tag.color }}
          >
            {tag.name}
          </span>
        ))}
        <div className="flex-1" />
        <span className="font-mono text-zinc-400">{skill.slug}</span>
        <span className="tabular-nums text-zinc-400">~{skill.tokenEstimate} tok</span>
        <span className="text-zinc-400">{new Date(skill.updatedAt).toLocaleDateString()}</span>
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-zinc-500">{skill.description}</p>

      {/* Tabs */}
      <Tabs defaultValue="view">
        <TabsList className="h-8">
          <TabsTrigger value="view" className="text-xs">View</TabsTrigger>
          <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
          <TabsTrigger value="skillmd" className="text-xs">SKILL.md</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="mt-3">
          <div className="rounded-lg border bg-white">
            <pre className="whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-zinc-700">
              {skill.content}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-3">
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

        <TabsContent value="skillmd" className="mt-3">
          <div className="rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-xs text-zinc-400">Agent Skills Format</span>
              <button
                onClick={copySkillMd}
                className="rounded border px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
              >
                Copy
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-b-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-300">
              {generateSkillMd()}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
