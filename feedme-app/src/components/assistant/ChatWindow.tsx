"use client";

import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { Bot, SendHorizontal } from "lucide-react";
import { ChatMessage, MAX_MESSAGE_LENGTH, sendMessage } from "@/lib/assistant";
import MessageBubble from "./MessageBubble";

const SUGGESTIONS = [
  "J'ai 7 € et peu de temps, je veux un truc chaud",
  "Un repas à moins de 5 €",
  "Quelque chose de rapide à 6 €",
];

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Salut ! Dis-moi ton budget et ton envie, je te trouve un plan près du campus.",
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    const history = messages.filter((m) => m.id !== "welcome");

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const { reply, spots } = await sendMessage(content, history);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: reply, spots },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-[480px] flex-col overflow-hidden rounded-[24px] bg-surface-container-low shadow-[0_4px_30px_rgba(58,48,42,0.06)]">
      <div
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6"
        role="log"
        aria-live="polite"
        aria-label="Conversation avec l'assistant"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant" aria-label="L'assistant écrit">
            <Bot size={18} className="animate-pulse text-primary" aria-hidden="true" />
            <span>L'assistant réfléchit…</span>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col gap-3 bg-surface-container-lowest p-4">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                disabled={loading}
                className="rounded-xl bg-primary-fixed px-3.5 py-2 text-xs font-medium text-on-primary-fixed transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Ton message
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            autoComplete="off"
            placeholder="Ex : j'ai 7 € et 30 minutes…"
            className="h-12 flex-1 rounded-xl border border-surface-container-high bg-surface px-4 text-sm transition placeholder:text-secondary/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Envoyer"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            <SendHorizontal size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}