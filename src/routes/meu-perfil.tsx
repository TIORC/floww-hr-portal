import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  type TipoPreferenciaEmail,
  usePreferenciasEmail,
  useSalvarPreferenciasEmail,
} from "@/hooks/use-preferencias-email";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormacaoDialog } from "@/components/formacao-dialog";
import {
  type Formacao,
  useFormacoes,
  useRemoverFormacao,
} from "@/hooks/use-formacoes";
import { cn } from "@/lib/utils";
import { getIniciais } from "@/lib/iniciais";
import {
  type ContatoPerfil,
  useMeuPerfil,
  useSalvarMeuPerfil,
  useSalvarMinhasInformacoes,
} from "@/hooks/use-meu-perfil";

export const Route = createFileRoute("/meu-perfil")({
  head: () => ({
    meta: [{ title: "Meu Perfil — Floww!" }],
  }),
  component: MeuPerfilPage,
});

const ABAS = [
  "Perfil",
  "Informações",
  "Educação",
  "Configuração",
  "Notificações",
  "Senha e Segurança",
] as const;

const IDIOMAS = ["Português - Brasil", "English", "Español"] as const;
const TIPOS_CONTATO: ContatoPerfil["tipo"][] = ["Whatsapp", "Telefone", "E-mail"];

function CampoSomenteLeitura({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-foreground">{rotulo}</label>
      <Input value={valor} readOnly disabled className="bg-muted/60" />
    </div>
  );
}

function AbaPerfil() {
  const { data: perfil, isPending, isError } = useMeuPerfil();
  const salvar = useSalvarMeuPerfil();

  const [cargoVisivel, setCargoVisivel] = useState("");
  const [idioma, setIdioma] = useState<string>(IDIOMAS[0]);
  const [contatos, setContatos] = useState<ContatoPerfil[]>([]);

  useEffect(() => {
    if (!perfil) return;
    setCargoVisivel(perfil.cargo_visivel);
    setIdioma(perfil.idioma);
    setContatos(perfil.contatos);
  }, [perfil]);

  if (isPending) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando perfil...</p>;
  }

  if (isError || !perfil) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Não foi possível carregar o seu perfil.
      </p>
    );
  }

  function atualizarContato(indice: number, campo: keyof ContatoPerfil, valor: string) {
    setContatos((lista) =>
      lista.map((contato, i) =>
        i === indice ? { ...contato, [campo]: valor } : contato,
      ),
    );
  }

  function removerContato(indice: number) {
    setContatos((lista) => lista.filter((_, i) => i !== indice));
  }

  function adicionarContato() {
    setContatos((lista) => [...lista, { tipo: "Whatsapp", valor: "" }]);
  }

  function salvarPerfil() {
    salvar.mutate(
      { cargo_visivel: cargoVisivel, idioma, contatos },
      {
        onSuccess: () => toast.success("Perfil salvo com sucesso."),
        onError: (erro) => toast.error(erro.message),
      },
    );
  }

  return (
    <div className="grid gap-5">
      <CampoSomenteLeitura rotulo="Nome" valor={perfil.nome} />

      <div className="grid gap-1.5">
        <label htmlFor="cargo-visivel" className="text-sm font-semibold text-foreground">
          Cargo visível
        </label>
        <Input
          id="cargo-visivel"
          value={cargoVisivel}
          onChange={(evento) => setCargoVisivel(evento.target.value)}
        />
      </div>

      <CampoSomenteLeitura rotulo="E-mail" valor={perfil.email} />

      <div className="grid gap-1.5">
        <label htmlFor="idioma" className="text-sm font-semibold text-foreground">
          Idioma
        </label>
        <select
          id="idioma"
          value={idioma}
          onChange={(evento) => setIdioma(evento.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {IDIOMAS.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-border" />

      <section aria-labelledby="contatos-titulo" className="grid gap-3">
        <h3 id="contatos-titulo" className="font-display text-xl font-semibold text-foreground">
          Contatos
        </h3>

        {contatos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
        )}

        {contatos.map((contato, indice) => (
          <div key={indice} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
            <select
              aria-label={`Tipo do contato ${indice + 1}`}
              value={contato.tipo}
              onChange={(evento) =>
                atualizarContato(indice, "tipo", evento.target.value as ContatoPerfil["tipo"])
              }
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {TIPOS_CONTATO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            <Input
              aria-label={`Valor do contato ${indice + 1}`}
              placeholder="(99) 99999-9999"
              value={contato.valor}
              onChange={(evento) => atualizarContato(indice, "valor", evento.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remover contato ${indice + 1}`}
              onClick={() => removerContato(indice)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ))}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={adicionarContato}>
            <Plus className="mr-1.5 size-4" aria-hidden />
            Adicionar novo
          </Button>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="button" onClick={salvarPerfil} disabled={salvar.isPending}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

const LIMITE_BIOGRAFIA = 6000;

function AbaInformacoes() {
  const { data: perfil, isPending, isError } = useMeuPerfil();
  const salvar = useSalvarMinhasInformacoes();

  const [biografia, setBiografia] = useState("");
  const [habilidades, setHabilidades] = useState("");

  useEffect(() => {
    if (!perfil) return;
    setBiografia(perfil.biografia);
    setHabilidades(perfil.habilidades);
  }, [perfil]);

  if (isPending) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando informações...</p>;
  }

  if (isError || !perfil) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Não foi possível carregar as suas informações.
      </p>
    );
  }

  function salvarInformacoes() {
    salvar.mutate(
      { biografia, habilidades },
      {
        onSuccess: () => toast.success("Informações salvas com sucesso."),
        onError: (erro) => toast.error(erro.message),
      },
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <label htmlFor="biografia" className="text-sm font-semibold text-foreground">
          Biografia
        </label>
        <Textarea
          id="biografia"
          value={biografia}
          maxLength={LIMITE_BIOGRAFIA}
          rows={6}
          placeholder="Conte um pouco sobre você"
          onChange={(evento) => setBiografia(evento.target.value)}
        />
        <p className="text-right text-xs text-muted-foreground">
          {biografia.length}/{LIMITE_BIOGRAFIA} caracteres
        </p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="habilidades" className="text-sm font-semibold text-foreground">
          Habilidades
        </label>
        <Input
          id="habilidades"
          value={habilidades}
          placeholder="Ex.: React, SQL, comunicação"
          onChange={(evento) => setHabilidades(evento.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={salvarInformacoes} disabled={salvar.isPending}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

function formatarDataFormacao(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function AbaEducacao() {
  const { data: formacoes = [], isPending, isError } = useFormacoes();
  const remover = useRemoverFormacao();

  // null = fechado; "nova" = cadastro novo; Formacao = edição.
  const [editando, setEditando] = useState<Formacao | "nova" | null>(null);

  function excluir(formacao: Formacao) {
    if (!window.confirm(`Remover "${formacao.formacao}" de ${formacao.instituicao}?`)) return;
    remover.mutate(formacao.id, {
      onSuccess: () => toast.success("Formação removida."),
      onError: (erro) => toast.error(erro.message),
    });
  }

  return (
    <div className="grid gap-5">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setEditando("nova")}>
          <Plus className="mr-1.5 size-4" aria-hidden />
          Adicionar formação
        </Button>
      </div>

      {isPending && <p className="py-8 text-center text-sm text-muted-foreground">Carregando formações...</p>}

      {isError && (
        <p className="py-8 text-center text-sm text-destructive">Não foi possível carregar as formações.</p>
      )}

      {!isPending && !isError && formacoes.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma formação cadastrada.</p>
      )}

      <ul className="grid gap-3">
        {formacoes.map((formacao) => (
          <li
            key={formacao.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-brand">
                {formacao.tipo}
              </span>
              <p className="mt-2 font-display text-sm font-bold text-foreground">{formacao.formacao}</p>
              <p className="text-sm text-muted-foreground">{formacao.instituicao}</p>
              {formacao.area && <p className="text-xs text-muted-foreground">Área: {formacao.area}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatarDataFormacao(formacao.data_inicio)} – {formatarDataFormacao(formacao.data_termino)}
              </p>
              {formacao.diploma_url && (
                <a
                  href={formacao.diploma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-brand underline"
                >
                  Ver diploma/certificado
                </a>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditando(formacao)}>
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover ${formacao.formacao}`}
                onClick={() => excluir(formacao)}
                disabled={remover.isPending}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editando !== null && (
        <FormacaoDialog
          formacao={editando === "nova" ? null : editando}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

const TIPOS_EMAIL_PERFIL: { tipo: TipoPreferenciaEmail; titulo: string; descricao: string }[] = [
  {
    tipo: "lembrete_celebracao",
    titulo: "Lembrete de Celebração",
    descricao: "E-mail enviado para lembrar de celebrar com o time",
  },
  {
    tipo: "atualizacoes_okr",
    titulo: "Atualizações de OKR",
    descricao: "E-mail enviado para avisar de atualizações nos OKRs",
  },
  {
    tipo: "nova_celebracao",
    titulo: "Nova celebração recebida",
    descricao: "E-mail notificando uma nova celebração recebida",
  },
  {
    tipo: "novo_feedback",
    titulo: "Novo feedback recebido",
    descricao: "E-mail notificando um novo feedback recebido",
  },
  {
    tipo: "novo_objetivo",
    titulo: "Novo objetivo criado",
    descricao: "E-mail notificando um novo objetivo criado e definido você como dono deste objetivo",
  },
];

function AbaNotificacoes() {
  const { data: preferenciasSalvas, isPending, isError } = usePreferenciasEmail();
  const salvar = useSalvarPreferenciasEmail();
  const [ativos, setAtivos] = useState<Record<TipoPreferenciaEmail, boolean>>({
    lembrete_celebracao: true,
    atualizacoes_okr: true,
    nova_celebracao: true,
    novo_feedback: true,
    novo_objetivo: true,
  });

  useEffect(() => {
    if (!preferenciasSalvas) return;
    setAtivos((atual) => {
      const proximo = { ...atual };
      preferenciasSalvas.forEach((preferencia) => {
        proximo[preferencia.tipo] = preferencia.ativo;
      });
      return proximo;
    });
  }, [preferenciasSalvas]);

  if (isPending) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Carregando preferências...</p>;
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Não foi possível carregar as suas preferências.
      </p>
    );
  }

  function salvarPreferencias() {
    salvar.mutate(
      TIPOS_EMAIL_PERFIL.map(({ tipo }) => ({ tipo, ativo: ativos[tipo] })),
      {
        onSuccess: () => toast.success("Preferências de notificação salvas."),
        onError: (erro) => toast.error(erro.message),
      },
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <h3 className="font-display text-base font-semibold text-foreground">Descrição</h3>
        <h3 className="font-display text-base font-semibold text-foreground">Notificação por E-mail</h3>
      </div>

      <ul className="grid gap-5">
        {TIPOS_EMAIL_PERFIL.map(({ tipo, titulo, descricao }) => (
          <li key={tipo} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{titulo}</p>
              <p className="text-sm text-muted-foreground">{descricao}</p>
            </div>
            <Switch
              aria-label={`Receber e-mail: ${titulo}`}
              checked={ativos[tipo]}
              onCheckedChange={(valor) => setAtivos((atual) => ({ ...atual, [tipo]: valor }))}
            />
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <Button type="button" onClick={salvarPreferencias} disabled={salvar.isPending}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

// Oito ou mais caracteres, com pelo menos uma minúscula, uma maiúscula, um número e um símbolo.
const REGRA_SENHA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function AbaSenhaESeguranca() {
  const { data: perfil } = useMeuPerfil();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [alterando, setAlterando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterarSenha() {
    setErro(null);

    if (!senhaAtual || !novaSenha) {
      setErro("Preencha a senha atual e a nova senha.");
      return;
    }

    if (!REGRA_SENHA.test(novaSenha)) {
      setErro(
        "A senha deve ter oito ou mais caracteres e pelo menos um número, uma letra minúscula, uma letra maiúscula e um símbolo.",
      );
      return;
    }

    if (novaSenha === senhaAtual) {
      setErro("A nova senha deve ser diferente da senha atual.");
      return;
    }

    if (!perfil?.email) {
      setErro("Não foi possível identificar o seu e-mail.");
      return;
    }

    setAlterando(true);

    // Confere a senha atual antes de trocar.
    const { error: erroAtual } = await supabase.auth.signInWithPassword({
      email: perfil.email,
      password: senhaAtual,
    });

    if (erroAtual) {
      setAlterando(false);
      setErro("A senha atual está incorreta.");
      return;
    }

    const { error: erroTroca } = await supabase.auth.updateUser({ password: novaSenha });
    setAlterando(false);

    if (erroTroca) {
      setErro(erroTroca.message);
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    toast.success("Senha alterada com sucesso.");
  }

  return (
    <div className="grid gap-5">
      <div>
        <h3 className="font-display text-xl font-semibold text-foreground">Alterar senha</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Para alterar a senha, digite sua senha atual e a nova senha desejada.
        </p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="senha-atual" className="text-sm font-semibold text-foreground">
          Senha atual
        </label>
        <Input
          id="senha-atual"
          type="password"
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(evento) => setSenhaAtual(evento.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="nova-senha" className="text-sm font-semibold text-foreground">
          Nova senha
        </label>
        <Input
          id="nova-senha"
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(evento) => setNovaSenha(evento.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A senha deve ter oito ou mais caracteres e pelo menos um número, uma letra minúscula, uma
          letra maiúscula e um símbolo.
        </p>
      </div>

      {erro && <p className="text-sm font-semibold text-destructive">{erro}</p>}

      <div className="flex justify-end">
        <Button type="button" onClick={alterarSenha} disabled={alterando}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

function AbaEmBreve() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Esta seção ainda não está disponível.
    </p>
  );
}

function MeuPerfilPage() {
  const [abaAtiva, setAbaAtiva] = useState<(typeof ABAS)[number]>("Perfil");
  const { data: perfil } = useMeuPerfil();
  const nome = perfil?.nome ?? "";

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-accent-soft p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
          <aside className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <Avatar className="mx-auto size-32 border border-brand/20">
              <AvatarFallback className="bg-[image:var(--gradient-brand)] font-display text-2xl font-bold text-primary-foreground">
                {getIniciais(nome || "?")}
              </AvatarFallback>
            </Avatar>
            <p className="mt-4 font-display text-base font-bold text-foreground">{nome}</p>
            <p className="text-sm font-semibold text-destructive">{perfil?.cargo_visivel || perfil?.cargo}</p>
          </aside>

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <nav aria-label="Seções do perfil" className="flex flex-wrap gap-1 border-b border-border">
              {ABAS.map((aba) => (
                <button
                  key={aba}
                  type="button"
                  onClick={() => setAbaAtiva(aba)}
                  aria-current={abaAtiva === aba ? "page" : undefined}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    abaAtiva === aba
                      ? "border-brand text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {aba}
                </button>
              ))}
            </nav>

            <div className="mt-6">
              {abaAtiva === "Perfil" && <AbaPerfil />}
              {abaAtiva === "Informações" && <AbaInformacoes />}
              {abaAtiva === "Educação" && <AbaEducacao />}
              {abaAtiva === "Notificações" && <AbaNotificacoes />}
              {abaAtiva === "Senha e Segurança" && <AbaSenhaESeguranca />}
              {!["Perfil", "Informações", "Educação", "Notificações", "Senha e Segurança"].includes(abaAtiva) && <AbaEmBreve />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
