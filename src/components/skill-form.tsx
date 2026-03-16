"use client";

import { useState, useEffect, useCallback } from "react";
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
import { SaveIcon, XIcon, SparklesIcon } from "lucide-react";
import { AIAssistantPanel } from "@/components/ai-assistant-panel";
import type { SkillFieldUpdates } from "@/app/api/ai/chat/route";

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

// Fields that can be highlighted when updated by AI
type HighlightableField = "name" | "description" | "content" | "type" | "tags";

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
  const [showAI, setShowAI] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<Set<HighlightableField>>(new Set());

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

  /** Temporarily highlight a field to indicate it was updated by AI */
  function flashField(field: HighlightableField) {
    setHighlightedFields((prev) => new Set([...prev, field]));
    setTimeout(() => {
      setHighlightedFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 2000);
  }

  /** Called by AIAssistantPanel when the AI suggests field updates */
  const handleAIFieldsUpdate = useCallback(
    (updates: SkillFieldUpdates) => {
      if (updates.name !== undefined) {
        setName(updates.name);
        flashField("name");
      }
      if (updates.description !== undefined) {
        setDescription(updates.description);
        flashField("description");
      }
      if (updates.content !== undefined) {
        setContent(updates.content);
        flashField("content");
      }
      if (updates.type !== undefined) {
        setType(updates.type);
        flashField("type");
      }
      if (updates.suggestedTags !== undefined && updates.suggestedTags.length > 0) {
        // Map suggested tag names to existing tag IDs
        const matchedIds = updates.suggestedTags
          .map((tagName) =>
            availableTags.find(
              (t) => t.name.toLowerCase() === tagName.toLowerCase()
            )?.id
          )
          .filter((id): id is string => id !== undefined);

        if (matchedIds.length > 0) {
          setSelectedTagIds((prev) => {
            const combined = [...new Set([...prev, ...matchedIds])];
            return combined;
          });
          flashField("tags");
        }
      }
    },
    [availableTags]
  );

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

  const tokenPercent = Math.min((tokenEstimate / 5000) * 100, 100);
  const tokenColor =
    tokenEstimate > 5000
      ? "bg-red-500"
      : tokenEstimate > 3000
      ? "bg-amber-500"
      : "bg-emerald-500";
  const tokenTextColor =
    tokenEstimate > 5000
      ? "text-red-600"
      : tokenEstimate > 3000
      ? "text-amber-600"
      : "text-muted-foreground";

  function highlightClass(field: HighlightableField) {
    return highlightedFields.has(field)
      ? "ring-2 ring-violet-400 ring-offset-1 transition-all duration-300"
      : "transition-all duration-300";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* AI toggle bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {mode === "create" ? "New skill" : "Edit skill"}
        </p>
        <Button
          type="button"
          variant={showAI ? "default" : "outline"}
          size="sm"
          className={`gap-1.5 text-xs ${
            showAI
              ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600"
              : "border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
          }`}
          onClick={() => setShowAI((v) => !v)}
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          {showAI ? "Hide AI Assistant" : "Fill with AI"}
        </Button>
      </div>

      <div className={`grid gap-6 ${showAI ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
        {/* Main fields */}
        <div className={`space-y-6 ${showAI ? "lg:col-span-2" : "lg:col-span-2"}`}>
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-4">Skill details</h2>
            <div className="space-y-4">
              <div className={`space-y-1.5 rounded-lg ${highlightClass("name")}`}>
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. React Component Builder"
                  className="h-10"
                />
              </div>

              <div className={`space-y-1.5 rounded-lg ${highlightClass("description")}`}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <span className={`text-xs tabular-nums ${description.length < 20 && description.length > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                    {description.length} chars
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this skill does. Important for MCP discoverability."
                  rows={2}
                />
                {description.length > 0 && description.length < 20 && (
                  <p className="text-xs text-red-500">
                    Too short for MCP discovery — min 20 characters
                  </p>
                )}
              </div>

              <div className={`space-y-1.5 rounded-lg ${highlightClass("content")}`}>
                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="text-sm font-medium">Content</Label>
                  <span className={`text-xs tabular-nums ${tokenTextColor}`}>
                    ~{tokenEstimate} tokens
                  </span>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full skill content — instructions, prompt template, workflow steps, etc."
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className={`rounded-xl border border-border bg-card shadow-sm p-5 ${highlightClass("type")}`}>
            <Label className="text-sm font-medium">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "prompt")}>
              <SelectTrigger className="mt-2 h-10">
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

          <div className={`rounded-xl border border-border bg-card shadow-sm p-5 ${highlightClass("tags")}`}>
            <Label className="text-sm font-medium">Tags</Label>
            {availableTags.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No tags yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all hover:scale-105 ${
                        selected ? "text-white shadow-sm" : ""
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

          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token budget</span>
              <span className={`font-mono text-xs tabular-nums ${tokenTextColor}`}>
                {tokenEstimate} / 5000
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${tokenColor}`}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
            {tokenEstimate > 3000 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {tokenEstimate > 5000
                  ? "Over budget — consider splitting this skill."
                  : "Getting large — consider trimming content."}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving}>
              <SaveIcon className="h-4 w-4 mr-1.5" />
              {saving ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="px-3"
              onClick={() => router.back()}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAI && (
          <div className="lg:col-span-2 h-[600px]">
            <AIAssistantPanel
              onClose={() => setShowAI(false)}
              currentValues={{ name, description, content, type }}
              onFieldsUpdate={handleAIFieldsUpdate}
              availableTags={availableTags}
            />
          </div>
        )}
      </div>
    </form>
  );
}
