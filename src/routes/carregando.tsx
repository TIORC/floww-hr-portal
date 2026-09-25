import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandBubbles } from "@/components/brand-bubbles";
import { pickRandomMessages } from "@/lib/loading-messages";
import { supabase } from "@/integrations/supabase/client";

const MESSAGE_DURATION_MS = 5000;
const TOTAL_DURATION_MS = 15000;
const MESSAGE_COUNT = TOTAL_DURATION_MS / MESSAGE_DURATION_MS;

export const Route = createFileRoute("/carregando")({
  head: () => ({
    meta: [{ title: "Carregando — Floww!" }],
  }),
  component: Loading,
});

function LoadingSpiral() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="brand-spiral size-24 shrink-0 sm:size-28"
      role="status"
      aria-label="Carregando"
    >
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="var(--accent-yellow)"
        strokeOpacity="0.18"
        strokeWidth="6"
      />
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="var(--accent-yellow)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="100.53 301.59"
      />
    </svg>
  );
}

function Loading() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        navigate({ to: "/", replace: true });
        return;
      }
      setMessages(pickRandomMessages(MESSAGE_COUNT));
      timers.push(
        setTimeout(() => setIndex(1), MESSAGE_DURATION_MS),
        setTimeout(() => setIndex(2), MESSAGE_DURATION_MS * 2),
        setTimeout(() => navigate({ to: "/painel" }), TOTAL_DURATION_MS),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [navigate]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6">
      <BrandBubbles />
      <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
        <LoadingSpiral />
        <div
          aria-live="polite"
          className="mt-10 flex min-h-[9rem] w-full items-center justify-center"
        >
          {messages[index] && (
            <p
              key={index}
              className="brand-message font-display text-2xl font-semibold leading-snug text-brand sm:text-3xl"
            >
              {messages[index]}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
