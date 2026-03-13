"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-medium">Details</h3>
            </div>
            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. React Component Builder"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {description.length} chars
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this skill does and when to use it. Most important field for MCP discoverability."
                  rows={3}
                />
                {description.length > 0 && description.length < 20 && (
                  <p className="text-xs text-destructive">
                    Too short for effective MCP discovery (min 20 chars)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <span className={`text-xs tabular-nums ${tokenEstimate > 5000 ? "text-destructive" : tokenEstimate > 3000 ? "text-amber-600" : "text-muted-foreground"}`}>
                    ~{tokenEstimate} tokens
                  </span>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="The full skill content &#8212; instructions, prompt template, workflow steps, etc."
                  rows={16}
                  className="font-mono text-sm"
                />
                {tokenEstimate > 5000 && (
                  <p className="text-xs text-amber-600">
                    Exceeds 5000 tokens. Consider splitting into smaller skills.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-medium">Type</h3>
            </div>
            <div className="p-6">
              <Select value={type} onValueChange={(v) => setType(v ?? "prompt")}>
                <SelectTrigger>
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
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-medium">Tags</h3>
            </div>
            <div className="p-6">
              {availableTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags yet. Create some in Tags.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        style={
                          selected
                            ? { backgroundColor: tag.color, borderColor: tag.color, color: "white" }
                            : { borderColor: tag.color, color: tag.color }
                        }
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-medium">Token Budget</h3>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated</span>
                <span className="font-mono tabular-nums">{tokenEstimate}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    tokenEstimate > 5000 ? "bg-red-500" : tokenEstimate > 3000 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min((tokenEstimate / 5000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {tokenEstimate > 5000 ? "Over budget" : tokenEstimate > 3000 ? "Near limit" : "Within budget"} (target: &lt;5000)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Update Skill" : "Create Skill"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
