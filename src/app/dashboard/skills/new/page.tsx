"use client";

import { SkillForm } from "@/components/skill-form";

export default function NewSkillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Skill</h1>
        <p className="text-muted-foreground">
          Add a new AI skill to your collection
        </p>
      </div>
      <SkillForm mode="create" />
    </div>
  );
}
