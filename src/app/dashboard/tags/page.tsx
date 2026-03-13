"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Tags</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {tags.length} tag{tags.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Create tag card */}
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Create New Tag</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              placeholder="Tag name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 w-48 text-sm bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Color</label>
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-5 w-5 rounded-full transition-all ${
                    newColor === c
                      ? "scale-125 ring-2 ring-offset-1 ring-offset-background"
                      : "opacity-70 hover:opacity-100 hover:scale-110"
                  }`}
                  style={{
                    backgroundColor: c,
                    "--tw-ring-color": c,
                  } as React.CSSProperties}
                  onClick={() => setNewColor(c)}
                />
              ))}
              <div
                className="ml-1 h-5 w-5 rounded-full ring-2 ring-offset-1 ring-offset-background"
                style={{ backgroundColor: newColor, "--tw-ring-color": newColor } as React.CSSProperties}
              />
            </div>
          </div>
          <Button type="submit" className="h-9 px-4 text-sm">
            Create Tag
          </Button>
        </form>
      </div>

      {/* Tags table */}
      {tags.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card py-16 text-center shadow-sm">
          <div className="rounded-full bg-primary/10 p-4">
            <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No tags yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first tag above</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground">Color</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Skills</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {tags.map((tag) => (
                <tr key={tag.id} className="group transition-colors hover:bg-accent/50">
                  {editingId === tag.id ? (
                    <>
                      <td className="px-5 py-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-40 text-xs"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`h-4 w-4 rounded-full transition-all ${
                                editColor === c
                                  ? "scale-125 ring-2 ring-offset-1 ring-offset-background"
                                  : "opacity-70 hover:opacity-100 hover:scale-110"
                              }`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-xs text-muted-foreground">
                        {tag.skillCount}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(tag.id)}
                            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-border/40 shadow-sm" style={{ backgroundColor: tag.color }} />
                          <span className="font-mono text-xs text-muted-foreground">{tag.color}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-xs text-muted-foreground">
                        <span className="rounded-full bg-accent px-2 py-0.5 font-medium">{tag.skillCount}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(tag)}
                            className="rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
