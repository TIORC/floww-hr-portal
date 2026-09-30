import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Plus, Save, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  PERFIS_DISC,
  TONS_DISC,
  type PerfilDisc,
  type PercentuaisDisc,
} from "@/components/processos-seletivos/perfis-disc";
import { TrilhaProcesso } from "@/components/processos-seletivos/trilha-processo";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

const OUTRO = "outro";

type Setor = Tables<"setores">;
type Cargo = Tables<"cargos">;

const PERCENTUAIS_INICIAIS: PercentuaisDisc = {
  Comunicador: 40,
  Executor: 30,
  Analista: 20,
  Planejador: 10,
};

export type NovoProcessoSeletivo = {
  cargoId: string;
  cargo: string;
  setorId: string;
  setor: string;
  vagaId: string | null;
  perfilDisc: PerfilDisc;
  percentuaisDisc: PercentuaisDisc;
  dataAbertura: string;
};

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function formatarDataBr(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

const PASSO = 5;
const TOTAL = 100;
const TOTAL_PASSOS = TOTAL / PASSO;

/**
 * Trava um perfil no valor arrastado e reescala os outros para a soma fechar em
 * 100% exatos, sempre em multiplos do passo e nunca negativos.
 *
 * A redistribuicao usa o metodo do maior resto: os demais perfis mantem a
 * proporcao que ja tinham entre si, e a sobra das casas decimais vai para
 * quem mais tem a perder. Isso evita os desvios de arredondamento que faziam a
 * soma escapar de 100%.
 */
function redistribuir(
  atual: PercentuaisDisc,
  alvo: PerfilDisc,
  valorBruto: number,
): PercentuaisDisc {
  const outros = PERFIS_DISC.map((perfil) => perfil.valor).filter(
    (perfil) => perfil !== alvo,
  );

  const passosAlvo = Math.min(
    TOTAL_PASSOS,
    Math.max(0, Math.round(valorBruto / PASSO)),
  );
  const passosRestantes = TOTAL_PASSOS - passosAlvo;

  const somaPeso = outros.reduce((total, perfil) => total + atual[perfil], 0);
  const pesos = outros.map((perfil) =>
    somaPeso > 0 ? atual[perfil] / somaPeso : 1 / outros.length,
  );

  const parcelas = pesos.map((peso, indice) => ({
    perfil: outros[indice] as PerfilDisc,
    bruto: peso * passosRestantes,
    inteiro: Math.floor(peso * passosRestantes),
  }));

  let sobra = passosRestantes - parcelas.reduce((t, p) => t + p.inteiro, 0);

  const ordem = [...parcelas]
    .map((parcela) => ({
      perfil: parcela.perfil,
      fracao: parcela.bruto - parcela.inteiro,
      inteiro: parcela.inteiro,
    }))
    .sort(
      (a, b) =>
        b.fracao - a.fracao ||
        atual[b.perfil] - atual[a.perfil] ||
        a.perfil.localeCompare(b.perfil),
    );

  for (const parcela of ordem) {
    if (sobra <= 0) break;
    parcelas.find((p) => p.perfil === parcela.perfil)!.inteiro += 1;
    sobra -= 1;
  }

  const proximo = {} as PercentuaisDisc;
  proximo[alvo] = passosAlvo * PASSO;
  for (const parcela of parcelas) {
    proximo[parcela.perfil] = parcela.inteiro * PASSO;
  }
  return proximo;
}

/**
 * Uma faixa do perfil DISC: slider + digitacao manual do percentual.
 *
 * O input usa um rascunho local porque a redistribuicao reescreve os outros
 * perfis a cada tecla. O rascunho so vira valor ao confirmar (blur ou Enter),
 * para o campo nao "brigar" com quem esta digitando.
 */
function BarraPercentualDisc({
  perfil,
  valor,
  predominante,
  aoAplicar,
}: {
  perfil: PerfilDisc;
  valor: number;
  predominante: boolean;
  aoAplicar: (valor: number) => void;
}) {
  const [rascunho, setRascunho] = useState<string | null>(null);
  const atalho = PERFIS_DISC.find((item) => item.valor === perfil)?.atalho;
  const tom = TONS_DISC[perfil];

  function confirmar() {
    if (rascunho === null) return;
    const digitado = Number(rascunho.replace(",", "."));
    setRascunho(null);
    if (!Number.isFinite(digitado)) return;
    aoAplicar(digitado);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={`disc-${atalho}`}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          {perfil}
          {predominante ? (
            <span
              aria-label="Perfil predominante"
              className={cn("size-2 rounded-full", tom.ponto)}
            />
          ) : null}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={PASSO}
            aria-label={`Percentual de ${perfil}`}
            value={rascunho ?? String(valor)}
            onChange={(event) => setRascunho(event.target.value)}
            onBlur={confirmar}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setRascunho(null);
              }
            }}
            className={cn(
              "h-8 w-16 px-2 text-right font-display text-sm font-semibold tabular-nums",
              predominante ? tom.texto : "text-muted-foreground",
            )}
          />
          <span aria-hidden className="text-xs text-muted-foreground">
            %
          </span>
        </div>
      </div>
      <Slider
        id={`disc-${atalho}`}
        aria-label={`Ajustar percentual de ${perfil}`}
        min={0}
        max={100}
        step={PASSO}
        value={[valor]}
        onValueChange={(proximo) => aoAplicar(proximo[0] ?? 0)}
        onDoubleClick={() => aoAplicar(0)}
        trackClassName="bg-muted"
        rangeClassName={tom.barra}
        thumbClassName={tom.thumb}
      />
    </div>
  );
}

function Campo({
  label,
  children,
  obrigatorio,
  erro,
  descricao,
  className,
}: {
  label: string;
  children: ReactNode;
  obrigatorio?: boolean;
  erro?: string | undefined;
  descricao?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label className="text-sm font-medium">
        {label}
        {obrigatorio ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {descricao ? (
        <p className="text-xs text-muted-foreground">{descricao}</p>
      ) : null}
      {erro ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export function AbrirProcessoDialog({
  open,
  onOpenChange,
  onCriar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCriar: (processo: NovoProcessoSeletivo) => void;
}) {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [carregandoSetores, setCarregandoSetores] = useState(false);
  const [carregandoCargos, setCarregandoCargos] = useState(false);
  const [setorId, setSetorId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [vagaId, setVagaId] = useState<string | null>(null);
  const [novoCargo, setNovoCargo] = useState("");
  const [salvandoCargo, setSalvandoCargo] = useState(false);
  const [perfilDisc, setPerfilDisc] = useState<PerfilDisc>("Comunicador");
  const [percentuais, setPercentuais] =
    useState<PercentuaisDisc>(PERCENTUAIS_INICIAIS);
  const [dataAbertura, setDataAbertura] = useState(hoje);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    setCarregandoSetores(true);
    supabase
      .from("setores")
      .select("id, nome, sigla")
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          toast.error("Não foi possível carregar os setores.");
          setSetores([]);
        } else {
          setSetores(data ?? []);
        }
        setCarregandoSetores(false);
      });
    return () => {
      cancelado = true;
    };
  }, [open]);

  useEffect(() => {
    if (!setorId) {
      setCargos([]);
      setCarregandoCargos(false);
      return;
    }
    let cancelado = false;
    setCarregandoCargos(true);
    (async () => {
      const { data: vagasAtivas, error } = await supabase
        .from("vagas")
        .select("id, cargo_id")
        .eq("status", "ativa")
        .eq("setor_id", setorId);
      if (cancelado) return;
      if (error) {
        toast.error("Não foi possível verificar as vagas ativas do setor.");
        setCargos([]);
        setCarregandoCargos(false);
        return;
      }

      const linked = vagasAtivas ?? [];
      setVagaId(linked.length === 1 ? linked[0].id : null);

      const cargoIds = [...new Set(linked.map((vaga) => vaga.cargo_id))];
      if (cargoIds.length === 0) {
        setCargos([]);
        setCarregandoCargos(false);
        return;
      }

      const { data: lista, error: erroCargos } = await supabase
        .from("cargos")
        .select("id, nome")
        .eq("setor_id", setorId)
        .in("id", cargoIds)
        .order("nome", { ascending: true });
      if (cancelado) return;
      if (erroCargos) {
        toast.error("Não foi possível carregar os cargos do setor.");
        setCargos([]);
      } else {
        setCargos(lista ?? []);
      }
      setCarregandoCargos(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [setorId]);

  const setor = useMemo(
    () => setores.find((item) => item.id === setorId),
    [setores, setorId],
  );
  const cargo = useMemo(
    () => cargos.find((item) => item.id === cargoId),
    [cargos, cargoId],
  );

  const totalPercentuais = useMemo(
    () =>
      PERFIS_DISC.reduce(
        (total, perfil) => total + percentuais[perfil.valor],
        0,
      ),
    [percentuais],
  );
  const somaCorreta = totalPercentuais === 100;

  const setorSemVaga = Boolean(setorId) && !carregandoCargos && cargos.length === 0;

  function atualizar<K extends keyof PercentuaisDisc>(
    perfil: K,
    valor: number[],
  ) {
    setPercentuais((atuais) => redistribuir(atuais, perfil as PerfilDisc, valor[0] ?? 0));
  }

  async function cadastrarCargo() {
    const nome = novoCargo.trim();
    if (!setorId || !nome) return;

    setSalvandoCargo(true);
    try {
      const { data: existente, error: erroBusca } = await supabase
        .from("cargos")
        .select("id, nome, setor_id")
        .eq("nome", nome)
        .maybeSingle();
      if (erroBusca) {
        toast.error("Não foi possível verificar o cadastro do cargo.");
        return;
      }

      if (existente) {
        if (existente.setor_id !== setorId) {
          toast.warning(
            `O cargo “${existente.nome}” já existe em outro setor e será reaproveitado.`,
          );
        } else {
          toast.info(`O cargo “${existente.nome}” já estava cadastrado.`);
        }
        setCargos((atuais) =>
          [...atuais, existente].sort((a, b) => a.nome.localeCompare(b.nome)),
        );
        setCargoId(existente.id);
        setErros((atuais) => ({ ...atuais, cargo: "" }));
        return;
      }

      const { data: criado, error } = await supabase
        .from("cargos")
        .insert({ nome, setor_id: setorId })
        .select("id, nome")
        .single();
      if (error || !criado) {
        toast.error("Não foi possível cadastrar o cargo.");
        return;
      }

      setCargos((atuais) =>
        [...atuais, criado].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setCargoId(criado.id);
      setErros((atuais) => ({ ...atuais, cargo: "" }));
      toast.success(`Cargo “${criado.nome}” cadastrado em Cargos & Salários.`);
    } finally {
      setSalvandoCargo(false);
    }
  }

  function validar() {
    const novosErros: Record<string, string> = {};
    if (!setorId) novosErros["setor"] = "Selecione o setor da vaga.";
    if (setorSemVaga) {
      novosErros["setor"] = "Este setor não possui vaga ativa.";
    }
    if (!cargoId) novosErros["cargo"] = "Selecione o cargo da vaga.";
    if (!dataAbertura) novosErros["data"] = "Informe a data de abertura.";
    if (!somaCorreta) {
      novosErros["disc"] = `Os percentuais somam ${totalPercentuais}%. Ajuste para 100%.`;
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function resetar() {
    setSetorId("");
    setCargoId("");
    setVagaId(null);
    setNovoCargo("");
    setPerfilDisc("Comunicador");
    setPercentuais(PERCENTUAIS_INICIAIS);
    setDataAbertura(hoje());
    setErros({});
  }

  function fechar(aberto: boolean) {
    onOpenChange(aberto);
    if (!aberto) resetar();
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validar() || !setor || !cargo) return;
    setEnviando(true);
    onCriar({
      cargoId: cargo.id,
      cargo: cargo.nome,
      setorId: setor.id,
      setor: setor.nome,
      vagaId,
      perfilDisc,
      percentuaisDisc: percentuais,
      dataAbertura,
    });
    fechar(false);
  }

  const bloqueado =
    enviando || setorSemVaga || Boolean(setorId) && cargos.length === 0;

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-7">
          <DialogTitle className="font-display text-2xl">
            Abrir Processo Seletivo
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da vaga. Só é possível abrir processo para cargos com
            vaga ativa no setor.
          </DialogDescription>
        </DialogHeader>

        <TrilhaProcesso etapaAtual={1} className="mb-6 mt-2" />

        <form onSubmit={enviar} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo label="Setor" obrigatorio erro={erros["setor"]}>
              <Select
                value={setorId}
                onValueChange={(valor) => {
                  setSetorId(valor);
                  setCargoId("");
                  setVagaId(null);
                  setErros((atuais) => ({ ...atuais, setor: "", cargo: "" }));
                }}
                disabled={carregandoSetores}
              >
                <SelectTrigger aria-label="Setor da vaga">
                  <SelectValue
                    placeholder={
                      carregandoSetores ? "Carregando setores..." : "Selecione um setor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            <Campo
              label="Data de Abertura da Vaga"
              obrigatorio
              erro={erros["data"]}
            >
              <Input
                type="date"
                value={dataAbertura}
                max={hoje()}
                onChange={(event) => {
                  setDataAbertura(event.target.value);
                  setErros((atuais) => ({ ...atuais, data: "" }));
                }}
              />
            </Campo>
          </div>

          <Campo
            label="Nome do cargo"
            obrigatorio
            erro={erros["cargo"]}
            descricao={
              setorSemVaga
                ? undefined
                : "Apenas cargos com vaga ativa neste setor são exibidos."
            }
            className="min-w-0"
          >
            <Select
              value={cargoId}
              onValueChange={(valor) => {
                if (valor === OUTRO) {
                  setCargoId("");
                  setErros((atuais) => ({
                    ...atuais,
                    cargo: "Escreva o nome do cargo e clique em Cadastrar cargo.",
                  }));
                  return;
                }
                setCargoId(valor);
                setNovoCargo("");
                setErros((atuais) => ({ ...atuais, cargo: "" }));
              }}
              disabled={!setorId || carregandoCargos}
            >
              <SelectTrigger aria-label="Nome do cargo">
                <SelectValue
                  placeholder={
                    !setorId
                      ? "Selecione um setor primeiro"
                      : carregandoCargos
                        ? "Carregando cargos..."
                        : setorSemVaga
                          ? "Nenhum cargo com vaga ativa"
                          : "Selecione um cargo"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cargos.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome}
                  </SelectItem>
                ))}
                <SelectItem value={OUTRO}>
                  <span className="flex items-center gap-2">
                    <Plus className="size-4" aria-hidden />
                    Outro (cadastrar novo cargo)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {setorSemVaga ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                Não há vaga ativa para este setor. Abra a vaga em Vagas antes de criar o
                processo seletivo.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Input
                aria-label="Nome de um novo cargo"
                placeholder="Ex.: Analista de Dados Sênior"
                value={novoCargo}
                onChange={(event) => setNovoCargo(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    cadastrarCargo();
                  }
                }}
                disabled={!setorId || salvandoCargo}
                className="min-w-48 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={cadastrarCargo}
                disabled={!setorId || salvandoCargo || novoCargo.trim().length === 0}
              >
                {salvandoCargo ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                Cadastrar cargo
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O cargo é gravado automaticamente na base de Cargos &amp; Salários e já
              fica disponível para outras vagas.
            </p>
          </Campo>

          <fieldset
            className={cn(
              "grid gap-4 rounded-xl border p-4 transition-colors",
              TONS_DISC[perfilDisc].bloco,
            )}
          >
            <legend className="px-1 text-sm font-semibold">
              Perfil DISC esperado
            </legend>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo label="Perfil predominante" obrigatorio>
                <Select
                  value={perfilDisc}
                  onValueChange={(valor) => setPerfilDisc(valor as PerfilDisc)}
                >
                  <SelectTrigger aria-label="Perfil DISC predominante">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFIS_DISC.map((perfil) => (
                      <SelectItem key={perfil.valor} value={perfil.valor}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "grid size-6 place-items-center rounded-md text-xs font-bold",
                              TONS_DISC[perfil.valor].chip,
                            )}
                          >
                            {perfil.atalho}
                          </span>
                          {perfil.valor}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>

              <div className="grid content-start gap-1.5">
                <Label className="text-sm font-medium">
                  Soma dos percentuais
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <div
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-md border px-3",
                    somaCorreta
                      ? "border-border bg-background"
                      : "border-destructive bg-background",
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-lg font-semibold tabular-nums",
                      somaCorreta
                        ? TONS_DISC[perfilDisc].texto
                        : "text-destructive",
                    )}
                  >
                    {totalPercentuais}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {somaCorreta
                      ? "Distribuição válida"
                      : "Precisa fechar em 100%"}
                  </span>
                </div>
                {erros["disc"] ? (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                    {erros["disc"]}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {PERFIS_DISC.map((perfil) => (
                <BarraPercentualDisc
                  key={perfil.valor}
                  perfil={perfil.valor}
                  valor={percentuais[perfil.valor]}
                  predominante={perfil.valor === perfilDisc}
                  aoAplicar={(novo) => atualizar(perfil.valor, [novo])}
                />
              ))}
            </div>
          </fieldset>

          <section className="grid gap-3 rounded-xl border-accent-yellow bg-accent-soft/60 p-4">
            <h3 className="font-display text-base font-semibold">
              Resumo do processo
            </h3>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Setor</dt>
                <dd className="mt-0.5 break-words text-sm">
                  {setor?.nome ?? "—"}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Cargo</dt>
                <dd className="mt-0.5 break-words text-sm">
                  {cargo?.nome ?? "—"}
                </dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Perfil DISC</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {PERFIS_DISC.map((perfil) => (
                    <span
                      key={perfil.valor}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        TONS_DISC[perfil.valor].chip,
                        perfil.valor !== perfilDisc && "opacity-45",
                      )}
                    >
                      {perfil.valor}
                      <span className="tabular-nums">
                        {percentuais[perfil.valor]}%
                      </span>
                    </span>
                  ))}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  Data de abertura
                </dt>
                <dd className="mt-0.5 text-sm">
                  {dataAbertura ? formatarDataBr(dataAbertura) : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <DialogFooter className="border-t border-border pt-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => fechar(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={bloqueado || enviando}
              className="bg-accent-yellow text-slate-900 shadow hover:bg-accent-yellow/90 hover:text-slate-900"
            >
              <Save className="size-4" aria-hidden />
              {enviando ? "Abrindo..." : "Abrir Processo Seletivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}