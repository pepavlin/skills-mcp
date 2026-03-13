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
    <div className="space-y-4">
      <h1 className="text-sm font-medium text-zinc-500">
        Tags <span className="tabular-nums text-zinc-400">({tags.length})</span>
      </h1>

      {/* Create tag - inline */}
      <form onSubmit={handleCreate} className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
        <Input
          placeholder="New tag name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-8 max-w-[200px] text-xs"
        />
        <div className="flex gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-5 w-5 rounded-full border-2 transition-all ${
                newColor === c ? "scale-110 border-zinc-900" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setNewColor(c)}
            />
          ))}
        </div>
        <Button type="submit" size="sm" className="h-7 text-xs">
          Create
        </Button>
      </form>

      {/* Tags table */}
      {tags.length === 0 ? (
        <div className="rounded-lg border bg-white py-8 text-center text-sm text-zinc-400">
          No tags yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-zinc-400">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Color</th>
                <th className="px-4 py-2 font-medium text-right">Skills</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-zinc-50">
                  {editingId === tag.id ? (
                    <>
                      <td className="px-4 py-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 w-40 text-xs"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`h-4 w-4 rounded-full border-2 ${
                                editColor === c ? "border-zinc-900" : "border-transparent"
                              }`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                        {tag.skillCount}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleUpdate(tag.id)}
                          className="text-xs text-zinc-700 hover:underline"
                        >
                          Save
                        </button>
                        <span className="mx-1.5 text-zinc-200">|</span>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-zinc-400 hover:text-zinc-600"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs text-zinc-400">{tag.color}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                        {tag.skillCount}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => startEdit(tag)}
                          className="text-xs text-zinc-500 hover:text-zinc-700"
                        >
                          Edit
                        </button>
                        <span className="mx-1.5 text-zinc-200">|</span>
                        <button
                          onClick={() => handleDelete(tag.id, tag.name)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
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
