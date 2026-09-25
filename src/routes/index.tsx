import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Floww! — Gestão de RH" },
      {
        name: "description",
        content:
          "Acesse o Floww!, a plataforma de gestão de RH para times, admissões, ponto e folha.",
      },
      { property: "og:title", content: "Floww! — Gestão de RH" },
      {
        property: "og:description",
        content:
          "Acesse o Floww!, a plataforma de gestão de RH para times, admissões, ponto e folha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ kind: "error", text: "E-mail ou senha inválidos." });
      return;
    }
    setMessage({ kind: "ok", text: "Bem-vindo de volta!" });
    navigate({ to: "/" });
  }

  async function handleReset() {
    if (!email) {
      setMessage({ kind: "error", text: "Informe seu e-mail para redefinir a senha." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setMessage(
      error
        ? { kind: "error", text: "Não foi possível enviar o e-mail agora." }
        : { kind: "ok", text: "Enviamos um link de redefinição para o seu e-mail." },
    );
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      {/* Lado esquerdo: marca */}
      <section className="relative flex flex-col justify-center overflow-hidden px-8 py-16 sm:px-16">
        <div className="brand-glow" aria-hidden />
        <div className="brand-arc" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Gestão de RH
          </span>
          <h1 className="mt-8 font-display text-6xl font-bold leading-[0.95] tracking-tight text-brand sm:text-7xl">
            Floww
            <span className="brand-bang">!</span>
          </h1>
          <div className="mt-5 h-2 w-40 rounded-full bg-[image:var(--gradient-accent)]" />
          <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
            Pessoas, admissões, ponto e folha em um só fluxo. Simples para o time,
            completo para o RH.
          </p>
          <ul className="mt-10 grid max-w-md gap-3 text-sm font-medium text-brand/80">
            {["Cadastro e jornada do colaborador", "Controle de férias e ponto", "Indicadores de RH em tempo real"].map(
              (item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[image:var(--gradient-accent)]" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* Lado direito: formulário */}
      <section className="flex items-center justify-center px-6 py-14 sm:px-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-3xl bg-[image:var(--gradient-form)] p-8 shadow-[var(--shadow-form)] sm:p-10"
        >
          <h2 className="font-display text-2xl font-semibold text-form-foreground">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-sm text-form-foreground/70">
            Use suas credenciais corporativas para acessar o Floww!
          </p>

          <label className="mt-8 block text-sm font-medium text-form-foreground" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com.br"
            className="mt-2 w-full rounded-xl border border-form-border bg-form-field px-4 py-3 text-sm text-form-foreground placeholder:text-form-foreground/45 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
          />

          <label className="mt-6 block text-sm font-medium text-form-foreground" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-form-border bg-form-field px-4 py-3 text-sm text-form-foreground placeholder:text-form-foreground/45 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
          />

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-medium text-form-foreground underline decoration-brand/50 decoration-2 underline-offset-4 transition hover:decoration-brand"
            >
              Esqueci a minha senha
            </button>
          </div>

          {message && (
            <p
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium ${
                message.kind === "error"
                  ? "bg-destructive/12 text-destructive"
                  : "bg-brand/10 text-brand"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-[image:var(--gradient-brand)] px-5 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-[var(--shadow-brand)] transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="mt-6 text-center text-xs text-form-foreground/65">
            Floww! — Gestão de RH · acesso restrito a colaboradores
          </p>
        </form>
      </section>
    </main>
  );
}
