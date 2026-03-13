"use client";

import Link from "next/link";
import { SkillForm } from "@/components/skill-form";

export default function NewSkillPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/dashboard/skills" className="hover:text-zinc-700">Skills</Link>
        <span>/</span>
        <span className="text-zinc-700">New</span>
      </div>
      <SkillForm mode="create" />
    </div>
  );
}
