"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TagWithCount {
  id: string;
  name: string;
  color: string;
  skillCount: number;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  async function fetchTags() {
    const res = await fetch("/api/tags");
    setTags(await res.json());
  }

  useEffect(() => {
    fetchTags();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });

    if (!res.ok) {
      toast.error("Failed to create tag");
      return;
    }

    toast.success("Tag created");
    setNewName("");
    fetchTags();
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, color: editColor }),
    });

    if (!res.ok) {
      toast.error("Failed to update tag");
      return;
    }

    toast.success("Tag updated");
    setEditingId(null);
    fetchTags();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"? Skills will be untagged.`)) return;

    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete tag");
      return;
    }

    toast.success("Tag deleted");
    fetchTags();
  }

  function startEdit(tag: TagWithCount) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize your skills with tags
        </p>
      </div>

      {/* Create tag */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-medium">New Tag</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreate} className="flex items-center gap-4">
            <Input
              placeholder="Tag name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    newColor === c ? "scale-110 border-zinc-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
            <Button type="submit" size="sm">Create</Button>
          </form>
        </div>
      </div>

      {/* Tags list */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-medium">All Tags ({tags.length})</h2>
        </div>
        {tags.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No tags yet. Create one above.</p>
          </div>
        ) : (
          <div className="divide-y">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-6 py-3.5">
                {editingId === tag.id ? (
                  <div className="flex flex-1 items-center gap-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-44"
                    />
                    <div className="flex gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`h-6 w-6 rounded-full border-2 transition-all ${
                            editColor === c ? "scale-110 border-zinc-900" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                          onClick={() => setEditColor(c)}
                        />
                      ))}
                    </div>
                    <Button size="sm" onClick={() => handleUpdate(tag.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Badge
                        className="font-normal"
                        style={{ backgroundColor: tag.color, color: "white", border: "none" }}
                      >
                        {tag.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {tag.skillCount} skill{tag.skillCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => startEdit(tag)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tag.id, tag.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
