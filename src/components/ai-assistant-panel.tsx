"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, XIcon, SparklesIcon, Loader2Icon } from "lucide-react";
import type { AIChatResponse, ChatMessage, SkillFieldUpdates } from "@/app/api/ai/chat/route";

interface CurrentSkillValues {
  name?: string;
  description?: string;
  content?: string;
  type?: string;
}

interface AIAssistantPanelProps {
  onClose: () => void;
  currentValues: CurrentSkillValues;
  onFieldsUpdate: (updates: SkillFieldUpdates) => void;
  availableTags: Array<{ id: string; name: string }>;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  updatedFields?: string[];
}

const UPDATED_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  content: "Content",
  type: "Type",
  suggestedTags: "Tags",
};

export function AIAssistantPanel({
  onClose,
  currentValues,
  onFieldsUpdate,
  availableTags,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Tell me what you'd like this skill to do — I'll help you fill in the form. You can describe the purpose, give me an example, or just start with a rough idea.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // API-format conversation history (excludes the initial greeting)
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: text };
    const newApiMessages = [...apiMessages, userMsg];

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newApiMessages,
          currentSkill: currentValues,
          availableTags: availableTags.map((t) => t.name),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data: AIChatResponse = await res.json();

      const assistantApiMsg: ChatMessage = { role: "assistant", content: data.message };
      setApiMessages([...newApiMessages, assistantApiMsg]);

      // Collect updated field names for display
      const updatedFields: string[] = [];
      if (data.fieldUpdates) {
        onFieldsUpdate(data.fieldUpdates);
        updatedFields.push(
          ...Object.keys(data.fieldUpdates)
            .filter((k) => data.fieldUpdates![k as keyof SkillFieldUpdates] !== undefined)
            .map((k) => UPDATED_FIELD_LABELS[k] ?? k)
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          updatedFields: updatedFields.length > 0 ? updatedFields : undefined,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      // Restore input so user can retry
      setInput(text);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          aria-label="Close AI assistant"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
            {msg.updatedFields && msg.updatedFields.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                <SparklesIcon className="h-3 w-3" />
                <span>Updated: {msg.updatedFields.join(", ")}</span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want this skill to do..."
            rows={2}
            className="resize-none text-sm flex-1"
            disabled={loading}
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 flex-shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}
