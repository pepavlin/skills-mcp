"use client";

import Link from "next/link";
import { SkillForm } from "@/components/skill-form";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

export default function NewSkillPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/skills" className="hover:text-foreground transition-colors">Skills</Link>
        <ChevronRightIcon className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium flex items-center gap-1.5">
          <PlusIcon className="h-3.5 w-3.5" />
          New Skill
        </span>
      </div>
      <SkillForm mode="create" />
    </div>
  );
}
