"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TagIcon, PlusIcon, PencilIcon, Trash2Icon, CheckIcon, XIcon } from "lucide-react";

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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tags.length} {tags.length === 1 ? "tag" : "tags"} total
        </p>
      </div>

      {/* Create tag card */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <PlusIcon className="h-4 w-4 text-primary" />
          Create Tag
        </h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tag name</label>
            <Input
              placeholder="e.g. react, backend, prompting"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 w-52"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Color</label>
            <div className="flex items-center gap-1.5 h-9">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`h-6 w-6 rounded-full transition-all hover:scale-110 ${
                    newColor === c ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setNewColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 items-center rounded-full px-3 text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: newColor }}
            >
              {newName || "preview"}
            </div>
            <Button type="submit" size="sm" className="h-9 px-4">
              Create tag
            </Button>
          </div>
        </form>
      </div>

      {/* Tags table */}
      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <TagIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-base font-semibold">No tags yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first tag to organize your skills.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Tag</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Color</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Skills</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tags.map((tag) => (
                <tr key={tag.id} className="group transition-colors hover:bg-muted/30">
                  {editingId === tag.id ? (
                    <>
                      <td className="px-6 py-3.5">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-44 text-sm"
                          autoFocus
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`h-5 w-5 rounded-full transition-all hover:scale-110 ${
                                editColor === c ? "ring-2 ring-offset-1 ring-foreground/30 scale-110" : ""
                              }`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm tabular-nums text-muted-foreground">
                        {tag.skillCount}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(tag.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                          <span className="font-mono text-xs text-muted-foreground">{tag.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">
                        {tag.skillCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => startEdit(tag)}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <PencilIcon className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                          >
                            <Trash2Icon className="h-3 w-3" />
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
