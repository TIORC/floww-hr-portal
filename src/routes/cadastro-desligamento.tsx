import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Plus, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { CadastrarColaboradorDialog } from "@/components/cadastrar-colaborador-dialog";
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

function normalizarTexto(valor: unknown) {
  if (valor instanceof Date) return valor.toLocaleDateString("pt-BR");
  return String(valor ?? "").trim();
}

function normalizarCabecalho(valor: unknown) {
  return normalizarTexto(valor).toLowerCase().replace(/\s+/g, " ").trim();
}

function ehLinhaVazia(valores: unknown[]) {
  return valores.every((valor) => normalizarTexto(valor) === "");
}

function validarCabecalho(valores: unknown[]) {
  if (valores.length < COLUNAS_MODELO.length) {
    return `O cabeçalho precisa ter as ${COLUNAS_MODELO.length} colunas nessa ordem.`;
  }
  for (let indice = 0; indice < COLUNAS_MODELO.length; indice += 1) {
    const esperado = normalizarCabecalho(COLUNAS_MODELO[indice]);
    const recebido = normalizarCabecalho(valores[indice]);
    if (recebido !== esperado) {
      return `Coluna ${indice + 1} deve ser "${COLUNAS_MODELO[indice]}".`;
    }
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
        // Lê por posição: a planilha sempre vem com cabeçalho nas 28 colunas em ordem.
        const matriz = XLSX.utils.sheet_to_json<unknown[]>(planilha, {
          header: 1,
          defval: "",
          blankrows: false,
        });
        const linhasMatriz = matriz.filter((linha) => Array.isArray(linha) && !ehLinhaVazia(linha));
        if (linhasMatriz.length === 0) {
          resolve([]);
          return;
        }
        const erroCabecalho = validarCabecalho(linhasMatriz[0]);
        if (erroCabecalho) {
          reject(new Error(erroCabecalho));
          return;
        }
        const linhasDados = linhasMatriz.slice(1);
        const normalizadas: LinhaImportada[] = linhasDados.map((valores) => {
          const dadosLinha: Record<string, string> = {};
          COLUNAS_MODELO.forEach((coluna, indice) => {
            dadosLinha[coluna] = normalizarTexto(valores[indice]);
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
  const [linhasImportadas, setLinhasImportadas] = useState<LinhaImportada[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const [salvandoImportacao, setSalvandoImportacao] = useState(false);
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
    try {
      const registros = linhasValidas.map((linha) => ({
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
      }));

      // Duplicado considera ID e E-mail: tenta por ID, se conflitar atualiza pelo email.
      let salvos = 0;
      let atualizados = 0;
      for (const registro of registros) {
        const { error } = await supabase
          .from("colaboradores_importados")
          .upsert(registro, { onConflict: "id_planilha" });
        if (!error) {
          salvos += 1;
          continue;
        }
        if (error.code === "23505") {
          const { error: erroEmail } = await supabase
            .from("colaboradores_importados")
            .update({ ...registro, atualizado_em: new Date().toISOString() })
            .eq("email", registro.email);
          if (!erroEmail) {
            atualizados += 1;
            continue;
          }
        }
        throw error;
      }

      toast.success(
        `${salvos + atualizados} colaborador(es) salvo(s) no banco.` +
          (atualizados > 0 ? ` ${atualizados} atualizado(s) por E-mail duplicado.` : ""),
      );
      setDialogoImportarAberto(false);
      setLinhasImportadas([]);
      setNomeArquivo("");
      await carregarColaboradores();
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "42P01") {
        toast.error("Tabela ainda não criada. Rode a migration 20261007000000.");
      } else {
        toast.error("Não foi possível salvar a importação no banco.");
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
                      <TableRow key={colaborador.id}>
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
                Envie uma planilha do Excel (.xlsx, .xls ou .csv) com as 28 colunas nesta
                ordem: {COLUNAS_MODELO.join(", ")}.
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
              ) : (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma planilha selecionada. Escolha um arquivo para ver o preview aqui.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {linhasValidas.length} de {linhasImportadas.length} linha(s) válida(s). Linhas
                sem ID, Email ou Nome, e duplicadas por ID/E-mail, são ignoradas.
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
      </main>
    </div>
  );
}

