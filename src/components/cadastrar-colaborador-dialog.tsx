import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

type FormularioColaborador = {
  nome: string;
  nomeCompleto: string;
  matricula: string;
  email: string;
  cpf: string;
  cargo: string;
  cargoVisivel: string;
  unidade: string;
  departamento: string;
  grupos: string;
  papel: string;
  gestorDireto: string;
  etnia: string;
  sexo: string;
  genero: string;
  dataNascimento: string;
  dataAdmissao: string;
  situacao: string;
  ultimoAcesso: string;
  origem: string;
  gestorDiretoEmail: string;
  participaGamificacao: string;
};

const FORMULARIO_INICIAL: FormularioColaborador = {
  nome: "",
  nomeCompleto: "",
  matricula: "",
  email: "",
  cpf: "",
  cargo: "",
  cargoVisivel: "",
  unidade: "",
  departamento: "",
  grupos: "",
  papel: "",
  gestorDireto: "",
  etnia: "",
  sexo: "",
  genero: "",
  dataNascimento: "",
  dataAdmissao: "",
  situacao: "Ativo",
  ultimoAcesso: "",
  origem: "Manual",
  gestorDiretoEmail: "",
  participaGamificacao: "Não",
};

function mascaraCpf(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function dataParaTexto(iso: string) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

async function lerFotoComprimida(arquivo: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });
  try {
    const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () => reject(new Error("Imagem inválida."));
      elemento.src = dataUrl;
    });
    const ladoMaximo = 640;
    const escala = Math.min(1, ladoMaximo / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagem.width * escala));
    canvas.height = Math.max(1, Math.round(imagem.height * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) return dataUrl;
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

function Campo({
  id,
  label,
  obrigatorio,
  className,
  children,
}: {
  id: string;
  label: string;
  obrigatorio?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {obrigatorio ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

type CadastrarColaboradorDialogProps = {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: () => void | Promise<void>;
};

export function CadastrarColaboradorDialog({
  aberto,
  aoFechar,
  aoSalvar,
}: CadastrarColaboradorDialogProps) {
  const [formulario, setFormulario] = useState<FormularioColaborador>(FORMULARIO_INICIAL);
  const [fotoUrl, setFotoUrl] = useState("");
  const [cargos, setCargos] = useState<{ id: string; nome: string }[]>([]);
  const [carregandoCargos, setCarregandoCargos] = useState(false);
  const [gestores, setGestores] = useState<{ nome: string; email: string }[]>([]);
  const [carregandoGestores, setCarregandoGestores] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [lendoFoto, setLendoFoto] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aberto) return;
    setFormulario(FORMULARIO_INICIAL);
    setFotoUrl("");
    let cancelado = false;
    setCarregandoCargos(true);
    setCarregandoGestores(true);
    (async () => {
      const [cargosResultado, colaboradoresResultado] = await Promise.all([
        supabase.from("cargos").select("id, nome").order("nome", { ascending: true }),
        supabase
          .from("colaboradores_importados")
          .select("nome, nome_completo, email, gestor_direto, gestor_direto_email")
          .order("nome", { ascending: true }),
      ]);
      if (cancelado) return;
      if (cargosResultado.error) {
        toast.error("Não foi possível carregar os cargos de Cargos & Salários.");
        setCargos([]);
      } else {
        setCargos(cargosResultado.data ?? []);
      }
      setCarregandoCargos(false);

      if (colaboradoresResultado.error) {
        toast.error("Não foi possível carregar os gestores do cadastro.");
        setGestores([]);
      } else {
        const porNome = new Map<string, string>();
        for (const item of colaboradoresResultado.data ?? []) {
          const email = (item.email ?? "").trim().toLowerCase();
          for (const nome of [item.nome, item.nome_completo]) {
            const chave = (nome ?? "").trim();
            if (chave && (!porNome.has(chave) || !porNome.get(chave))) {
              porNome.set(chave, email);
            }
          }
          const nomeGestor = (item.gestor_direto ?? "").trim();
          const emailGestor = (item.gestor_direto_email ?? "").trim().toLowerCase();
          if (nomeGestor && (!porNome.has(nomeGestor) || !porNome.get(nomeGestor))) {
            porNome.set(nomeGestor, emailGestor);
          }
        }
        setGestores(
          [...porNome.entries()]
            .map(([nome, email]) => ({ nome, email }))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        );
      }
      setCarregandoGestores(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [aberto]);

  function atualizar(campo: keyof FormularioColaborador, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarGestor(nome: string) {
    const gestor = gestores.find((item) => item.nome === nome);
    setFormulario((atual) => ({
      ...atual,
      gestorDireto: nome,
      gestorDiretoEmail: gestor?.email ?? "",
    }));
  }

  async function aoSelecionarFoto(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    if (!/^image\//.test(arquivo.type)) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG ou WebP).");
      return;
    }
    setLendoFoto(true);
    try {
      setFotoUrl(await lerFotoComprimida(arquivo));
    } catch {
      toast.error("Não foi possível carregar a imagem.");
    } finally {
      setLendoFoto(false);
    }
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    const nome = formulario.nome.trim();
    const nomeCompleto = formulario.nomeCompleto.trim();
    const email = formulario.email.trim().toLowerCase();
    if (!nome) {
      toast.error("Informe o Nome (nome que será exibido).");
      return;
    }
    if (!nomeCompleto) {
      toast.error("Informe o Nome Completo.");
      return;
    }
    if (!email) {
      toast.error("Informe o E-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setSalvando(true);
    try {
      const hoje = new Date().toLocaleDateString("pt-BR");
      const { error } = await supabase.from("colaboradores_importados").insert({
        id_planilha: crypto.randomUUID(),
        nome,
        nome_completo: nomeCompleto,
        matricula: formulario.matricula.trim(),
        email,
        cpf: formulario.cpf.trim(),
        cargo: formulario.cargo.trim(),
        cargo_visivel: formulario.cargoVisivel.trim(),
        unidade: formulario.unidade.trim(),
        departamento: formulario.departamento.trim(),
        grupos: formulario.grupos.trim(),
        papel: formulario.papel.trim(),
        gestor_direto: formulario.gestorDireto.trim(),
        etnia: formulario.etnia.trim(),
        sexo: formulario.sexo.trim(),
        genero: formulario.genero.trim(),
        data_nascimento: dataParaTexto(formulario.dataNascimento),
        data_admissao: dataParaTexto(formulario.dataAdmissao),
        data_cadastro: hoje,
        situacao: formulario.situacao.trim() || "Ativo",
        ultimo_acesso: formulario.ultimoAcesso.trim(),
        origem_cadastro: formulario.origem.trim() || "Manual",
        gestor_direto_email: formulario.gestorDiretoEmail.trim(),
        participa_gamificacao: formulario.participaGamificacao,
        foto_url: fotoUrl || null,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe um colaborador com este E-mail ou Matrícula.");
        } else if (error.code === "42P01") {
          toast.error("Tabela ainda não criada. Rode a migration 20261007000000.");
        } else {
          toast.error("Não foi possível salvar o colaborador.");
        }
        return;
      }
      toast.success("Colaborador cadastrado com sucesso.");
      aoFechar();
      await aoSalvar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(abertura) => !abertura && aoFechar()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Cadastrar colaborador</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo colaborador. Campos com <span className="text-destructive">*</span>{" "}
            são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[17rem_1fr]">
          <div className="flex flex-col items-center gap-3">
            <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-3xl border border-dashed border-border bg-muted/40">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Pré-visualização da foto do colaborador"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center text-muted-foreground">
                  <UserRound className="size-16" strokeWidth={1.2} aria-hidden />
                  <p className="text-xs">Nenhuma foto selecionada</p>
                </div>
              )}
            </div>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={aoSelecionarFoto}
            />
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={lendoFoto}
                onClick={() => inputFotoRef.current?.click()}
              >
                {lendoFoto ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Camera className="size-4" aria-hidden />
                )}
                {fotoUrl ? "Trocar foto" : "Selecionar foto"}
              </Button>
              {fotoUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remover foto"
                  onClick={() => setFotoUrl("")}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          </div>

          <form
            id="form-cadastrar-colaborador"
            onSubmit={salvar}
            className="grid max-h-[60vh] content-start gap-4 overflow-y-auto pr-1 sm:grid-cols-2"
          >
            <Campo id="col-nome" label="Nome (nome que será exibido)" obrigatorio className="sm:col-span-2">
              <Input
                id="col-nome"
                value={formulario.nome}
                onChange={(e) => atualizar("nome", e.target.value)}
                placeholder="Ex.: Maria Silva"
                maxLength={120}
                required
              />
            </Campo>
            <Campo id="col-nome-completo" label="Nome Completo" obrigatorio className="sm:col-span-2">
              <Input
                id="col-nome-completo"
                value={formulario.nomeCompleto}
                onChange={(e) => atualizar("nomeCompleto", e.target.value)}
                placeholder="Ex.: Maria Silva Santos"
                maxLength={160}
                required
              />
            </Campo>
            <Campo id="col-matricula" label="Matrícula (não obrigatório)">
              <Input
                id="col-matricula"
                value={formulario.matricula}
                onChange={(e) => atualizar("matricula", e.target.value)}
                placeholder="Ex.: 12345"
                maxLength={40}
              />
            </Campo>
            <Campo id="col-email" label="E-mail" obrigatorio>
              <Input
                id="col-email"
                type="email"
                value={formulario.email}
                onChange={(e) => atualizar("email", e.target.value)}
                placeholder="Ex.: maria.silva@empresa.com"
                maxLength={160}
                required
              />
            </Campo>
            <Campo id="col-cpf" label="CPF">
              <Input
                id="col-cpf"
                value={formulario.cpf}
                onChange={(e) => atualizar("cpf", mascaraCpf(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
              />
            </Campo>
            <Campo id="col-cargo" label="Cargo">
              <Select
                value={formulario.cargo}
                onValueChange={(valor) => atualizar("cargo", valor)}
              >
                <SelectTrigger id="col-cargo" className="w-full" aria-label="Cargo">
                  <SelectValue
                    placeholder={
                      carregandoCargos
                        ? "Carregando cargos..."
                        : cargos.length > 0
                          ? "Selecione um cargo"
                          : "Nenhum cargo em Cargos & Salários"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.nome}>
                      {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="col-cargo-visivel" label="Cargo visível">
              <Input
                id="col-cargo-visivel"
                value={formulario.cargoVisivel}
                onChange={(e) => atualizar("cargoVisivel", e.target.value)}
                placeholder="Ex.: Analista de Operações"
                maxLength={120}
              />
            </Campo>
            <Campo id="col-unidade" label="Unidade">
              <Input
                id="col-unidade"
                value={formulario.unidade}
                onChange={(e) => atualizar("unidade", e.target.value)}
                placeholder="Ex.: Matriz"
                maxLength={120}
              />
            </Campo>
            <Campo id="col-departamento" label="Departamento">
              <Input
                id="col-departamento"
                value={formulario.departamento}
                onChange={(e) => atualizar("departamento", e.target.value)}
                placeholder="Ex.: Operações"
                maxLength={120}
              />
            </Campo>
            <Campo id="col-grupos" label="Grupos">
              <Input
                id="col-grupos"
                value={formulario.grupos}
                onChange={(e) => atualizar("grupos", e.target.value)}
                placeholder="Ex.: Grupo A"
                maxLength={120}
              />
            </Campo>
            <Campo id="col-papel" label="Papel">
              <Input
                id="col-papel"
                value={formulario.papel}
                onChange={(e) => atualizar("papel", e.target.value)}
                placeholder="Ex.: Colaborador"
                maxLength={120}
              />
            </Campo>
            <Campo id="col-gestor" label="Gestor Direto">
              <Select
                value={formulario.gestorDireto}
                onValueChange={selecionarGestor}
              >
                <SelectTrigger id="col-gestor" className="w-full" aria-label="Gestor Direto">
                  <SelectValue
                    placeholder={
                      carregandoGestores
                        ? "Carregando gestores..."
                        : gestores.length > 0
                          ? "Selecione um gestor"
                          : "Nenhum colaborador cadastrado"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((gestor) => (
                    <SelectItem key={gestor.nome} value={gestor.nome}>
                      {gestor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="col-gestor-email" label="Gestor Direto - E-mail">
              <Input
                id="col-gestor-email"
                type="email"
                value={formulario.gestorDiretoEmail}
                onChange={(e) => atualizar("gestorDiretoEmail", e.target.value)}
                placeholder="Ex.: joao.souza@empresa.com"
                maxLength={160}
              />
            </Campo>
            <Campo id="col-etnia" label="Etnia">
              <Input
                id="col-etnia"
                value={formulario.etnia}
                onChange={(e) => atualizar("etnia", e.target.value)}
                placeholder="Ex.: Branca"
                maxLength={60}
              />
            </Campo>
            <Campo id="col-sexo" label="Sexo">
              <Input
                id="col-sexo"
                value={formulario.sexo}
                onChange={(e) => atualizar("sexo", e.target.value)}
                placeholder="Ex.: Feminino"
                maxLength={40}
              />
            </Campo>
            <Campo id="col-genero" label="Gênero">
              <Input
                id="col-genero"
                value={formulario.genero}
                onChange={(e) => atualizar("genero", e.target.value)}
                placeholder="Ex.: Mulher"
                maxLength={60}
              />
            </Campo>
            <Campo id="col-nascimento" label="Data de Nascimento">
              <Input
                id="col-nascimento"
                type="date"
                value={formulario.dataNascimento}
                onChange={(e) => atualizar("dataNascimento", e.target.value)}
              />
            </Campo>
            <Campo id="col-admissao" label="Data de Admissão">
              <Input
                id="col-admissao"
                type="date"
                value={formulario.dataAdmissao}
                onChange={(e) => atualizar("dataAdmissao", e.target.value)}
              />
            </Campo>
            <Campo id="col-situacao" label="Situação">
              <Input
                id="col-situacao"
                value={formulario.situacao}
                onChange={(e) => atualizar("situacao", e.target.value)}
                placeholder="Ex.: Ativo"
                maxLength={60}
              />
            </Campo>
            <Campo id="col-ultimo-acesso" label="Último Acesso">
              <Input
                id="col-ultimo-acesso"
                value={formulario.ultimoAcesso}
                onChange={(e) => atualizar("ultimoAcesso", e.target.value)}
                placeholder="Ex.: 05/10/2026"
                maxLength={60}
              />
            </Campo>
            <Campo id="col-origem" label="Origem">
              <Input
                id="col-origem"
                value={formulario.origem}
                onChange={(e) => atualizar("origem", e.target.value)}
                placeholder="Ex.: Manual"
                maxLength={60}
              />
            </Campo>
            <fieldset className="grid gap-2 sm:col-span-2">
              <legend className="text-sm font-medium">Participa da gamificação?</legend>
              <RadioGroup
                value={formulario.participaGamificacao}
                onValueChange={(valor) => atualizar("participaGamificacao", valor)}
                className="mt-1 flex gap-6"
              >
                <label
                  htmlFor="gam-sim"
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <RadioGroupItem id="gam-sim" value="Sim" />
                  Sim
                </label>
                <label
                  htmlFor="gam-nao"
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <RadioGroupItem id="gam-nao" value="Não" />
                  Não
                </label>
              </RadioGroup>
            </fieldset>
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-cadastrar-colaborador"
            disabled={salvando || lendoFoto}
          >
            {salvando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {salvando ? "Salvando..." : "Cadastrar colaborador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
