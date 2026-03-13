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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  parameters?: string;
  examples?: string;
  tags?: Tag[];
}

interface SkillFormProps {
  initialData?: SkillData;
  mode: "create" | "edit";
}

export function SkillForm({ initialData, mode }: SkillFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [type, setType] = useState(initialData?.type || "prompt");
  const [parameters, setParameters] = useState(
    initialData?.parameters || ""
  );
  const [examples, setExamples] = useState(initialData?.examples || "");
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
      toast.error(
        "Description should be at least 20 characters for good MCP discoverability"
      );
      return;
    }

    setSaving(true);

    try {
      const body = {
        name,
        description,
        content,
        type,
        parameters: parameters || undefined,
        examples: examples || undefined,
        tagIds: selectedTagIds,
      };

      const url =
        mode === "edit" ? `/api/skills/${initialData?.id}` : "/api/skills";
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
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Skill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <span className="text-xs text-muted-foreground">
                    {description.length} chars (min 20 for MCP discovery)
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this skill does and when to use it. This is the most important field for MCP discoverability."
                  rows={3}
                />
                {description.length > 0 && description.length < 20 && (
                  <p className="text-xs text-destructive">
                    Description too short for effective MCP discovery
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <span className="text-xs text-muted-foreground">
                    ~{tokenEstimate} tokens
                  </span>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="The full skill content — instructions, prompt template, workflow steps, etc."
                  rows={15}
                  className="font-mono text-sm"
                />
                {tokenEstimate > 5000 && (
                  <p className="text-xs text-amber-600">
                    Warning: Content exceeds 5000 tokens. Consider splitting
                    into smaller skills for better context management.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Optional fields */}
          <Card>
            <CardHeader>
              <CardTitle>Optional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parameters">Parameters (JSON)</Label>
                <Textarea
                  id="parameters"
                  value={parameters}
                  onChange={(e) => setParameters(e.target.value)}
                  placeholder='e.g. [{"name": "language", "description": "Target programming language"}]'
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examples">Usage Examples (JSON)</Label>
                <Textarea
                  id="examples"
                  value={examples}
                  onChange={(e) => setExamples(e.target.value)}
                  placeholder='e.g. [{"input": "Build a card component", "output": "..."}]'
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Type</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {availableTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags yet. Create some in the Tags section.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer"
                        style={
                          selected
                            ? { backgroundColor: tag.color, borderColor: tag.color }
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated tokens</span>
                <span className="font-mono">{tokenEstimate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget status</span>
                <span
                  className={
                    tokenEstimate > 5000
                      ? "text-destructive"
                      : tokenEstimate > 3000
                        ? "text-amber-600"
                        : "text-green-600"
                  }
                >
                  {tokenEstimate > 5000
                    ? "Over budget"
                    : tokenEstimate > 3000
                      ? "Near limit"
                      : "Good"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
