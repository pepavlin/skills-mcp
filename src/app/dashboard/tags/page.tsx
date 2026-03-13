"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TagWithCount {
  id: string;
  name: string;
  color: string;
  skillCount: number;
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
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
      <div>
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-muted-foreground">
          Organize your skills with tags
        </p>
      </div>

      {/* Create tag */}
      <Card>
        <CardHeader>
          <CardTitle>Create Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Tag name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full transition-transform ${
                      newColor === c ? "scale-125 ring-2 ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tags list */}
      <Card>
        <CardHeader>
          <CardTitle>All Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  {editingId === tag.id ? (
                    <div className="flex flex-1 items-center gap-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-48"
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`h-5 w-5 rounded-full transition-transform ${
                              editColor === c
                                ? "scale-125 ring-2 ring-offset-1"
                                : ""
                            }`}
                            style={{ backgroundColor: c }}
                            onClick={() => setEditColor(c)}
                          />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(tag.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Badge
                          style={{
                            backgroundColor: tag.color,
                            color: "white",
                          }}
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {tag.skillCount} skill
                          {tag.skillCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(tag)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
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
        </CardContent>
      </Card>
    </div>
  );
}
