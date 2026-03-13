"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquarePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function SuggestChangeButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const resetForm = useCallback(() => {
    setMessage("");
    setError(null);
    setSuccess(false);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  async function handleSubmit() {
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }

      setSuccess(true);
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nepodařilo se odeslat návrh. Zkuste to prosím znovu."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="default"
            size="sm"
            className="fixed right-4 bottom-4 z-40 shadow-lg"
            aria-label="Navrhnout změnu"
          />
        }
      >
        <MessageSquarePlusIcon className="size-4" />
        <span className="hidden sm:inline">Navrhnout změnu</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Navrhni změnu aplikace</DialogTitle>
          <DialogDescription>
            Popiš bug, nápad nebo požadavek na změnu. Návrh bude odeslán AI
            systému k analýze a implementaci.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (success) setSuccess(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              "Popiš, co by se mělo změnit nebo opravit...\nNapříklad: Přidejte tmavý režim na tuto stránku."
            }
            rows={4}
            disabled={submitting}
            className="resize-none"
          />

          {success && (
            <p className="text-sm text-emerald-600">
              Děkujeme. Návrh byl odeslán. Můžeš napsat další.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
          >
            {submitting ? "Odesílání..." : "Odeslat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
