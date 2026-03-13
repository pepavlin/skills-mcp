"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface SkillData {
  id?: string;
  name: string;
  description: string;
  content: string;
  type: string;
  tags?: Tag[];
}

interface SkillFormProps {
  initialData?: SkillData;
  mode: "create" | "edit";
}

export function SkillForm({ initialData, mode }: SkillFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [type, setType] = useState(initialData?.type || "prompt");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map((t) => t.id) || []
  );
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

  const tokenEstimate = Math.ceil((content.length + description.length) / 4);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setAvailableTags);
  }, []);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !description || !content) {
      toast.error("Name, description, and content are required");
      return;
    }

    if (description.length < 20) {
      toast.error("Description should be at least 20 characters for good MCP discoverability");
      return;
    }

    setSaving(true);

    try {
      const body = {
        name,
        description,
        content,
        type,
        tagIds: selectedTagIds,
      };

      const url = mode === "edit" ? `/api/skills/${initialData?.id}` : "/api/skills";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save skill");
        return;
      }

      const skill = await res.json();
      toast.success(mode === "edit" ? "Skill updated" : "Skill created");
      router.push(`/dashboard/skills/${skill.id}`);
    } catch {
      toast.error("Failed to save skill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main fields */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. React Component Builder"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <span className="text-[10px] tabular-nums text-zinc-400">
                    {description.length} chars
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this skill does. Important for MCP discoverability."
                  rows={2}
                  className="text-sm"
                />
                {description.length > 0 && description.length < 20 && (
                  <p className="text-[10px] text-red-500">
                    Too short for MCP discovery (min 20 chars)
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="text-xs">Content</Label>
                  <span className={`text-[10px] tabular-nums ${tokenEstimate > 5000 ? "text-red-500" : tokenEstimate > 3000 ? "text-amber-500" : "text-zinc-400"}`}>
                    ~{tokenEstimate} tokens
                  </span>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full skill content — instructions, prompt template, workflow steps, etc."
                  rows={14}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "prompt")}>
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prompt">Prompt</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
                <SelectItem value="snippet">Snippet</SelectItem>
                <SelectItem value="config">Config</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <Label className="text-xs">Tags</Label>
            {availableTags.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-400">No tags yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`rounded px-2 py-0.5 text-xs transition-colors ${
                        selected ? "text-white" : ""
                      }`}
                      style={
                        selected
                          ? { backgroundColor: tag.color, color: "white" }
                          : { backgroundColor: tag.color + "18", color: tag.color }
                      }
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Token budget</span>
              <span className={`font-mono tabular-nums ${tokenEstimate > 5000 ? "text-red-500" : tokenEstimate > 3000 ? "text-amber-500" : "text-zinc-600"}`}>
                {tokenEstimate} / 5000
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-all ${
                  tokenEstimate > 5000 ? "bg-red-500" : tokenEstimate > 3000 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min((tokenEstimate / 5000) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1 text-xs" disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
