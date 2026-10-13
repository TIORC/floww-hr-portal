import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Plus, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { CadastrarColaboradorDialog } from "@/components/cadastrar-colaborador-dialog";
import { DetalhesColaboradorDialog } from "@/components/detalhes-colaborador-dialog";
import { Sidebar } from "@/routes/painel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getIniciais } from "@/lib/iniciais";

export const Route = createFileRoute("/cadastro-desligamento")({
  component: CadastroDesligamentoPage,
});

type ColaboradorLinha = {
  id: string;
  nome: string;
  fotoUrl: string;
  setor: string;
  gestorDireto: string;
  gestorDiretoFotoUrl: string;
  unidade: string;
  email: string;
  cargo: string;
  cargoVisivel: string;
  dadosPlanilha: Record<string, string>;
};

function FotoPessoa({ nome, fotoUrl }: { nome: string; fotoUrl: string }) {
  return (
    <Avatar className="size-9 shrink-0">
      <AvatarImage src={fotoUrl || undefined} alt={`Foto de ${nome}`} />
      <AvatarFallback>{getIniciais(nome || "?")}</AvatarFallback>
    </Avatar>
  );
}

const TEXTO_NAO_INFORMADO = "—";

const COLUNAS_MODELO = [
  "ID",
  "Nome",
  "Nome Completo",
  "Matricula",
  "Email",
  "CPF",
  "Cargo",
  "Cargo Visível ( editável )",
  "Unidade",
  "Departamento",
  "Grupos",
  "Papel",
  "Gestor Direto",
  "Etnia",
  "Sexo",
  "Gênero",
  "Data de Nascimento",
  "Data de Admissão",
  "Data de Cadastro",
  "Situação",
  "Ultimo Acesso",
  "Origem do Cadastro",
  "Gestor Direto - E-mail",
  "Participa gamificação",
  "Desligamento",
  "Ultimo dia trabalhado",
  "Biografia",
  "Idioma",
] as const;

type LinhaImportada = {
  dados: Record<string, string>;
  nome: string;
  setor: string;
  gestorDireto: string;
  unidade: string;
  erro?: string;
};

type ItemRelatorioImportacao = {
  nome: string;
  identificador: string;
  motivo: string;
};

type RelatorioImportacao = {
  salvos: number;
  duplicados: ItemRelatorioImportacao[];
  falhas: ItemRelatorioImportacao[];
};

const TAMANHO_PAGINA_BANCO = 1000;

// Busca todas as chaves já cadastradas (ID, e-mail e CPF), página a página.
async function buscarChavesExistentes() {
  const chaves: { id_planilha: string; email: string; cpf: string }[] = [];
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA_BANCO) {
    const { data, error } = await supabase
      .from("colaboradores_importados")
      .select("id_planilha, email, cpf")
      .order("id_planilha", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA_BANCO - 1);
    if (error) throw error;
    chaves.push(...(data ?? []));
    if (!data || data.length < TAMANHO_PAGINA_BANCO) break;
  }
  return chaves;
}

function normalizarTexto(valor: unknown) {
  if (valor instanceof Date) return valor.toLocaleDateString("pt-BR");
  return String(valor ?? "").trim();
}

// Compara nomes de coluna ignorando maiúsculas, acentos, espaços e pontuação.
// Ex.: "Matrícula", "matricula" e "MATRICULA" viram "matricula".
function chaveColuna(valor: unknown) {
  return normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function ehLinhaVazia(valores: unknown[]) {
  return valores.every((valor) => normalizarTexto(valor) === "");
}

// Localiza cada coluna pelo nome no cabeçalho. Colunas ausentes ou vazias são aceitas.
function mapearColunas(cabecalho: unknown[]) {
  const indicePorColuna = new Map<string, number>();
  cabecalho.forEach((valor, indice) => {
    const chave = chaveColuna(valor);
    if (chave && !indicePorColuna.has(chave)) indicePorColuna.set(chave, indice);
  });
  return indicePorColuna;
}

function validarCabecalho(indicePorColuna: Map<string, number>) {
  const faltando: string[] = [];
  if (!indicePorColuna.has(chaveColuna("ID"))) faltando.push("ID");
  if (!indicePorColuna.has(chaveColuna("Email"))) faltando.push("Email");
  if (
    !indicePorColuna.has(chaveColuna("Nome")) &&
    !indicePorColuna.has(chaveColuna("Nome Completo"))
  ) {
    faltando.push("Nome ou Nome Completo");
  }
  if (faltando.length > 0) {
    return `Colunas obrigatórias não encontradas no cabeçalho: ${faltando.join(", ")}.`;
  }
  return null;
}

function lerPlanilha(arquivo: File) {
  return new Promise<LinhaImportada[]>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const dados = leitor.result as ArrayBuffer;
        const workbook = XLSX.read(dados, { type: "array", cellDates: true });
        const primeiraAba = workbook.SheetNames[0];
        if (!primeiraAba) {
          reject(new Error("Planilha sem abas."));
          return;
        }
        const planilha = workbook.Sheets[primeiraAba];
        // raw: false usa o texto exibido na célula, para preservar zeros à esquerda (CPF, Matrícula).
        const matriz = XLSX.utils.sheet_to_json<unknown[]>(planilha, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: false,
        });
        const linhasMatriz = matriz.filter((linha) => Array.isArray(linha) && !ehLinhaVazia(linha));
        if (linhasMatriz.length === 0) {
          resolve([]);
          return;
        }
        const indicePorColuna = mapearColunas(linhasMatriz[0]);
        const erroCabecalho = validarCabecalho(indicePorColuna);
        if (erroCabecalho) {
          reject(new Error(erroCabecalho));
          return;
        }
        const linhasDados = linhasMatriz.slice(1);
        const normalizadas: LinhaImportada[] = linhasDados.map((valores) => {
          const dadosLinha: Record<string, string> = {};
          // Campo vazio ou coluna ausente fica como "" e não bloqueia a importação.
          COLUNAS_MODELO.forEach((coluna) => {
            const indice = indicePorColuna.get(chaveColuna(coluna));
            dadosLinha[coluna] = indice === undefined ? "" : normalizarTexto(valores[indice]);
          });
          const nome = dadosLinha["Nome Completo"] || dadosLinha["Nome"];
          const setor = dadosLinha["Departamento"];
          const gestorDireto = dadosLinha["Gestor Direto"];
          const unidade = dadosLinha["Unidade"];
          const erros: string[] = [];
          if (!nome) erros.push("Informe o Nome / Nome Completo.");
          if (!dadosLinha["ID"]) erros.push("Informe o ID.");
          if (!dadosLinha["Email"]) erros.push("Informe o Email.");
          const erro = erros.length > 0 ? erros.join(" ") : undefined;
          return { dados: dadosLinha, nome, setor, gestorDireto, unidade, erro };
        });
        resolve(normalizadas);
      } catch {
        reject(new Error("Não foi possível ler a planilha."));
      }
    };
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.readAsArrayBuffer(arquivo);
  });
}

function baixarModelo() {
  const workbook = XLSX.utils.book_new();
  const planilha = XLSX.utils.aoa_to_sheet([
    [...COLUNAS_MODELO],
    [
      "1",
      "Maria Silva",
      "Maria Silva Santos",
      "12345",
      "maria.silva@empresa.com",
      "123.456.789-00",
      "Analista",
      "Analista de Operações",
      "Matriz",
      "Operações",
      "Grupo A",
      "Colaborador",
      "João Souza",
      "",
      "",
      "",
      "01/01/1990",
      "10/01/2020",
      "10/01/2020",
      "Ativo",
      "",
      "Manual",
      "joao.souza@empresa.com",
      "Sim",
      "",
      "",
      "",
      "Português",
    ],
  ]);
  planilha["!cols"] = COLUNAS_MODELO.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(workbook, planilha, "Colaboradores");
  XLSX.writeFile(workbook, "modelo-importacao-colaboradores.xlsx");
}

function CadastroDesligamentoPage() {
  const [colaboradores, setColaboradores] = useState<ColaboradorLinha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogoImportarAberto, setDialogoImportarAberto] = useState(false);
  const [dialogoCadastroAberto, setDialogoCadastroAberto] = useState(false);
  const [colaboradorDetalhe, setColaboradorDetalhe] = useState<ColaboradorLinha | null>(null);
  const [linhasImportadas, setLinhasImportadas] = useState<LinhaImportada[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const [salvandoImportacao, setSalvandoImportacao] = useState(false);
  const [relatorioImportacao, setRelatorioImportacao] = useState<RelatorioImportacao | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  function mapearBancoParaLinha(item: Record<string, string | null>): ColaboradorLinha {
    const dadosPlanilha: Record<string, string> = {
      ID: item.id_planilha ?? "",
      Nome: item.nome ?? "",
      "Nome Completo": item.nome_completo ?? item.nome ?? "",
      Matricula: item.matricula ?? "",
      Email: item.email ?? "",
      CPF: item.cpf ?? "",
      Cargo: item.cargo ?? "",
      "Cargo Visível ( editável )": item.cargo_visivel ?? "",
      Unidade: item.unidade ?? "",
      Departamento: item.departamento ?? "",
      Grupos: item.grupos ?? "",
      Papel: item.papel ?? "",
      "Gestor Direto": item.gestor_direto ?? "",
      Etnia: item.etnia ?? "",
      Sexo: item.sexo ?? "",
      Gênero: item.genero ?? "",
      "Data de Nascimento": item.data_nascimento ?? "",
      "Data de Admissão": item.data_admissao ?? "",
      "Data de Cadastro": item.data_cadastro ?? "",
      Situação: item.situacao ?? "",
      "Ultimo Acesso": item.ultimo_acesso ?? "",
      "Origem do Cadastro": item.origem_cadastro ?? "",
      "Gestor Direto - E-mail": item.gestor_direto_email ?? "",
      "Participa gamificação": item.participa_gamificacao ?? "",
      Desligamento: item.desligamento ?? "",
      "Ultimo dia trabalhado": item.ultimo_dia_trabalhado ?? "",
      Biografia: item.biografia ?? "",
      Idioma: item.idioma ?? "",
    };
    const nome = item.nome_completo || item.nome || TEXTO_NAO_INFORMADO;
    const gestorNome = item.gestor_direto || "";
    return {
      id: String(item.id ?? dadosPlanilha["ID"]),
      nome,
      fotoUrl: item.foto_url ?? "",
      setor: item.departamento || TEXTO_NAO_INFORMADO,
      gestorDireto: gestorNome || TEXTO_NAO_INFORMADO,
      gestorDiretoFotoUrl: "",
      unidade: item.unidade || TEXTO_NAO_INFORMADO,
      email: item.email ?? "",
      cargo: item.cargo ?? "",
      cargoVisivel: item.cargo_visivel ?? "",
      dadosPlanilha,
    };
  }

  const carregarColaboradores = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("colaboradores_importados")
      .select(
        "id, id_planilha, nome, nome_completo, matricula, email, cpf, cargo, cargo_visivel, unidade, departamento, grupos, papel, gestor_direto, etnia, sexo, genero, data_nascimento, data_admissao, data_cadastro, situacao, ultimo_acesso, origem_cadastro, gestor_direto_email, participa_gamificacao, desligamento, ultimo_dia_trabalhado, biografia, idioma, foto_url",
      )
      .order("nome", { ascending: true });

    if (error) {
      if (error.code === "42P01") {
        toast.error("Tabela ainda não criada. Rode a migration 20261007000000.");
      } else {
        toast.error("Não foi possível carregar os colaboradores.");
      }
      setColaboradores([]);
      setCarregando(false);
      return;
    }

    const linhas = (data ?? []).map((item) =>
      mapearBancoParaLinha(item as unknown as Record<string, string | null>),
    );
    const fotosPorNome = new Map<string, string>();
    for (const linha of linhas) {
      const chave = linha.nome.trim().toLowerCase();
      if (chave && linha.fotoUrl) fotosPorNome.set(chave, linha.fotoUrl);
      const emailChave = linha.email.trim().toLowerCase();
      if (emailChave && linha.fotoUrl) fotosPorNome.set(emailChave, linha.fotoUrl);
    }
    for (const linha of linhas) {
      const chaveGestor = linha.gestorDireto.trim().toLowerCase();
      if (chaveGestor && chaveGestor !== "—") {
        linha.gestorDiretoFotoUrl = fotosPorNome.get(chaveGestor) ?? "";
      }
    }
    setColaboradores(linhas);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarColaboradores();
  }, [carregarColaboradores]);

  const colaboradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return colaboradores;
    return colaboradores.filter(
      (colaborador) =>
        colaborador.nome.toLowerCase().includes(termo) ||
        colaborador.setor.toLowerCase().includes(termo) ||
        colaborador.gestorDireto.toLowerCase().includes(termo) ||
        colaborador.unidade.toLowerCase().includes(termo),
    );
  }, [busca, colaboradores]);

  const linhasValidas = useMemo(
    () => linhasImportadas.filter((linha) => !linha.erro),
    [linhasImportadas],
  );

  function abrirImportacao() {
    setLinhasImportadas([]);
    setNomeArquivo("");
    setRelatorioImportacao(null);
    setDialogoImportarAberto(true);
  }

  async function aoSelecionarArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    const extensaoValida = /\.(xlsx|xls|csv)$/i.test(arquivo.name);
    if (!extensaoValida) {
      toast.error("Selecione uma planilha do Excel (.xlsx, .xls ou .csv).");
      return;
    }
    setLendoArquivo(true);
    try {
      const linhas = await lerPlanilha(arquivo);
      if (linhas.length === 0) {
        toast.error("A planilha está vazia.");
        setLinhasImportadas([]);
        setNomeArquivo("");
        return;
      }
      setLinhasImportadas(linhas);
      setNomeArquivo(arquivo.name);
      const invalidas = linhas.filter((linha) => linha.erro).length;
      if (invalidas > 0) {
        toast.warning(`${invalidas} linha(s) sem nome serão ignoradas.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ler a planilha.");
      setLinhasImportadas([]);
      setNomeArquivo("");
    } finally {
      setLendoArquivo(false);
    }
  }

  async function confirmarImportacao() {
    if (linhasValidas.length === 0) {
      toast.error("Nenhuma linha válida para importar.");
      return;
    }
    setSalvandoImportacao(true);
    setRelatorioImportacao(null);
    try {
      // Regra: quem já está no banco prevalece. Duplicado por ID, E-mail ou CPF é ignorado
      // (sem criar registro novo). Dentro da própria planilha vale a primeira ocorrência.
      const existentes = await buscarChavesExistentes();
      const idsVistos = new Set(existentes.map((item) => item.id_planilha.trim()));
      const emailsVistos = new Set(existentes.map((item) => item.email.trim().toLowerCase()));
      const cpfsVistos = new Set(existentes.map((item) => item.cpf.trim()).filter(Boolean));

      const relatorio: RelatorioImportacao = { salvos: 0, duplicados: [], falhas: [] };

      // Cada linha é gravada separadamente: um erro não interrompe as demais.
      for (const linha of linhasImportadas) {
        const nome = linha.nome || "(sem nome)";
        const identificador = linha.dados["ID"] || linha.dados["Email"] || "(sem ID)";
        if (linha.erro) {
          relatorio.falhas.push({ nome, identificador, motivo: linha.erro });
          continue;
        }

        const id = linha.dados["ID"].trim();
        const email = linha.dados["Email"].trim().toLowerCase();
        const cpf = linha.dados["CPF"].trim();

        const motivoDuplicado = idsVistos.has(id)
          ? "ID já cadastrado"
          : emailsVistos.has(email)
            ? "E-mail já cadastrado"
            : cpf && cpfsVistos.has(cpf)
              ? "CPF já cadastrado"
              : null;
        if (motivoDuplicado) {
          relatorio.duplicados.push({ nome, identificador, motivo: motivoDuplicado });
          continue;
        }

        const registro = {
          id_planilha: linha.dados["ID"],
          nome: linha.dados["Nome"] || linha.nome,
          nome_completo: linha.nome,
          matricula: linha.dados["Matricula"],
          email: linha.dados["Email"],
          cpf: linha.dados["CPF"],
          cargo: linha.dados["Cargo"],
          cargo_visivel: linha.dados["Cargo Visível ( editável )"],
          unidade: linha.dados["Unidade"],
          departamento: linha.dados["Departamento"],
          grupos: linha.dados["Grupos"],
          papel: linha.dados["Papel"],
          gestor_direto: linha.dados["Gestor Direto"],
          etnia: linha.dados["Etnia"],
          sexo: linha.dados["Sexo"],
          genero: linha.dados["Gênero"],
          data_nascimento: linha.dados["Data de Nascimento"],
          data_admissao: linha.dados["Data de Admissão"],
          data_cadastro: linha.dados["Data de Cadastro"],
          situacao: linha.dados["Situação"],
          ultimo_acesso: linha.dados["Ultimo Acesso"],
          origem_cadastro: linha.dados["Origem do Cadastro"],
          gestor_direto_email: linha.dados["Gestor Direto - E-mail"],
          participa_gamificacao: linha.dados["Participa gamificação"],
          desligamento: linha.dados["Desligamento"],
          ultimo_dia_trabalhado: linha.dados["Ultimo dia trabalhado"],
          biografia: linha.dados["Biografia"],
          idioma: linha.dados["Idioma"],
        };

        const { error } = await supabase.from("colaboradores_importados").insert(registro);
        if (error) {
          relatorio.falhas.push({ nome, identificador, motivo: error.message });
          continue;
        }

        idsVistos.add(id);
        emailsVistos.add(email);
        if (cpf) cpfsVistos.add(cpf);
        relatorio.salvos += 1;
      }

      setRelatorioImportacao(relatorio);
      setLinhasImportadas([]);
      setNomeArquivo("");
      const resumo = `${relatorio.salvos} salvo(s), ${relatorio.duplicados.length} duplicado(s) ignorado(s), ${relatorio.falhas.length} com erro.`;
      if (relatorio.falhas.length > 0) {
        toast.warning(resumo);
      } else {
        toast.success(resumo);
      }
      await carregarColaboradores();
    } catch (error) {
      console.error("Erro na importação de colaboradores:", error);
      const erroBanco = error as { code?: string; message?: string; details?: string };
      if (erroBanco?.code === "42P01") {
        toast.error("Tabela ainda não criada. Rode a migration 20261007000000.");
      } else {
        const detalhe = [erroBanco?.code, erroBanco?.message, erroBanco?.details]
          .filter(Boolean)
          .join(" | ");
        toast.error(
          `Não foi possível consultar os cadastros existentes. Nada foi importado.${detalhe ? ` Detalhe: ${detalhe}` : ""}`,
        );
      }
    } finally {
      setSalvandoImportacao(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end">
          <PerfilFlutuante />
        </div>
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  Cadastro e Desligamento
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Consulte os colaboradores com setor, gestor direto e unidade.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={abrirImportacao}>
                  <FileSpreadsheet className="size-4" aria-hidden />
                  Importar Colaboradores (Planilha)
                </Button>
                <Button type="button" onClick={() => setDialogoCadastroAberto(true)}>
                  <Plus className="size-4" aria-hidden />
                  Cadastrar colaborador
                </Button>
              </div>
            </header>
            <div className="relative mb-6 max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome, setor, gestor ou unidade"
                aria-label="Buscar colaborador"
                className="pl-9"
              />
            </div>
            {carregando ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Carregando colaboradores…
              </p>
            ) : colaboradoresFiltrados.length === 0 ? (
              <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-6 grid size-36 place-items-center rounded-[2rem] bg-primary/5 text-primary/75 sm:size-44">
                  <UsersRound className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Nenhum colaborador encontrado
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Os colaboradores cadastrados aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Gestor Direto</TableHead>
                      <TableHead>Unidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaboradoresFiltrados.map((colaborador) => (
                      <TableRow
                        key={colaborador.id}
                        className="cursor-pointer"
                        onClick={() => setColaboradorDetalhe(colaborador)}
                      >
                        <TableCell
                          className={
                            colaborador.nome.trim().toLowerCase() === "ti maracas"
                              ? "font-medium text-red-600"
                              : "font-medium"
                          }
                        >
                          <span className="flex items-center gap-3">
                            <FotoPessoa nome={colaborador.nome} fotoUrl={colaborador.fotoUrl} />
                            <span>{colaborador.nome}</span>
                          </span>
                        </TableCell>
                        <TableCell>{colaborador.cargoVisivel || TEXTO_NAO_INFORMADO}</TableCell>
                        <TableCell>{colaborador.setor}</TableCell>
                        <TableCell>
                          {colaborador.gestorDireto === TEXTO_NAO_INFORMADO ? (
                            TEXTO_NAO_INFORMADO
                          ) : (
                            <span className="flex items-center gap-3">
                              <FotoPessoa
                                nome={colaborador.gestorDireto}
                                fotoUrl={colaborador.gestorDiretoFotoUrl}
                              />
                              <span>{colaborador.gestorDireto}</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{colaborador.unidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={dialogoImportarAberto} onOpenChange={setDialogoImportarAberto}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Importar Colaboradores (Planilha)</DialogTitle>
              <DialogDescription>
                Envie uma planilha do Excel (.xlsx, .xls ou .csv) com a primeira linha de
                cabeçalho. As colunas são reconhecidas pelo nome, em qualquer ordem, e as vazias
                podem ser omitidas. Obrigatórias: ID, Nome (ou Nome Completo) e Email. Colunas
                do modelo: {COLUNAS_MODELO.join(", ")}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={aoSelecionarArquivo}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={lendoArquivo}
                  onClick={() => inputArquivoRef.current?.click()}
                >
                  {lendoArquivo ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <FileSpreadsheet className="size-4" aria-hidden />
                  )}
                  {lendoArquivo ? "Lendo planilha..." : "Selecionar planilha"}
                </Button>
                <Button type="button" variant="ghost" onClick={baixarModelo}>
                  <Download className="size-4" aria-hidden />
                  Baixar modelo
                </Button>
                {nomeArquivo ? (
                  <p className="text-sm text-muted-foreground">Arquivo: {nomeArquivo}</p>
                ) : null}
              </div>
              {relatorioImportacao ? (
                <div className="grid gap-3 rounded-xl border border-border p-4 text-sm">
                  <p className="font-medium text-foreground">
                    {relatorioImportacao.salvos} salvo(s) · {relatorioImportacao.duplicados.length}{" "}
                    duplicado(s) ignorado(s) · {relatorioImportacao.falhas.length} com erro
                  </p>
                  {relatorioImportacao.falhas.length > 0 ? (
                    <div>
                      <p className="mb-1 font-medium text-destructive">Com erro (corrija e envie de novo):</p>
                      <ul className="grid gap-1 text-muted-foreground">
                        {relatorioImportacao.falhas.map((item, indice) => (
                          <li key={`falha-${indice}`}>
                            {item.nome} ({item.identificador}): {item.motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {relatorioImportacao.duplicados.length > 0 ? (
                    <div>
                      <p className="mb-1 font-medium text-foreground">
                        Duplicados (mantido o cadastro anterior):
                      </p>
                      <ul className="grid gap-1 text-muted-foreground">
                        {relatorioImportacao.duplicados.map((item, indice) => (
                          <li key={`duplicado-${indice}`}>
                            {item.nome} ({item.identificador}): {item.motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {linhasImportadas.length > 0 ? (
                <div className="max-h-72 overflow-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Gestor Direto</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linhasImportadas.map((linha, indice) => (
                        <TableRow key={`${linha.nome}-${indice}`}>
                          <TableCell className="font-medium">
                            {linha.nome || TEXTO_NAO_INFORMADO}
                          </TableCell>
                          <TableCell>
                            {linha.dados["Cargo Visível ( editável )"] || TEXTO_NAO_INFORMADO}
                          </TableCell>
                          <TableCell>{linha.setor || TEXTO_NAO_INFORMADO}</TableCell>
                          <TableCell>{linha.gestorDireto || TEXTO_NAO_INFORMADO}</TableCell>
                          <TableCell>{linha.unidade || TEXTO_NAO_INFORMADO}</TableCell>
                          <TableCell>
                            {linha.erro ? (
                              <span className="text-sm font-medium text-destructive">
                                {linha.erro}
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-emerald-600">
                                Pronta para importar
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : relatorioImportacao ? null : (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma planilha selecionada. Escolha um arquivo para ver o preview aqui.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {linhasValidas.length} de {linhasImportadas.length} linha(s) válida(s). Linhas
                sem ID, Email ou Nome são marcadas com erro. Duplicados por ID, E-mail ou CPF já
                cadastrados são ignorados (vale o cadastro anterior).
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogoImportarAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={linhasValidas.length === 0 || salvandoImportacao}
                onClick={confirmarImportacao}
              >
                {salvandoImportacao ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                {salvandoImportacao
                  ? "Salvando no banco..."
                  : `Importar ${linhasValidas.length} colaborador(es)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <CadastrarColaboradorDialog
          aberto={dialogoCadastroAberto}
          aoFechar={() => setDialogoCadastroAberto(false)}
          aoSalvar={carregarColaboradores}
        />
        <DetalhesColaboradorDialog
          colaborador={colaboradorDetalhe}
          aoFechar={() => setColaboradorDetalhe(null)}
        />
      </main>
    </div>
  );
}

