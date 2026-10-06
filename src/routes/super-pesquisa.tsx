import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Sidebar } from "@/routes/painel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/super-pesquisa")({ component: SuperPesquisaPage });

function dataHoje() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

type CampoParticipantes = {
  id: string;
  rotulo: string;
  placeholder: string;
  opcoes: string[];
};

// Opções vazias por enquanto: serão alimentadas pelas bases de papel, unidade, departamento, grupo e liderança.
const CAMPOS_PARTICIPANTES: CampoParticipantes[] = [
  { id: "papel", rotulo: "Papel", placeholder: "Selecione o papel", opcoes: [] },
  { id: "unidades", rotulo: "Unidades", placeholder: "Selecione as unidades", opcoes: [] },
  { id: "departamento", rotulo: "Departamento", placeholder: "Selecione o departamento", opcoes: [] },
  { id: "grupos", rotulo: "Grupos", placeholder: "Selecione os grupos", opcoes: [] },
  { id: "liderancas", rotulo: "Lideranças", placeholder: "Selecione as lideranças", opcoes: [] },
  { id: "colaboradores", rotulo: "Colaboradores", placeholder: "Selecione os colaboradores", opcoes: [] },
];

function SelecaoParticipantes({ campo, valor, onChange }: {
  campo: CampoParticipantes;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {campo.rotulo}
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger aria-label={campo.rotulo} className="w-full bg-background font-normal text-foreground">
          <SelectValue placeholder={campo.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {campo.opcoes.length
            ? campo.opcoes.map((opcao) => <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>)
            : <SelectItem value="sem-opcoes" disabled>Nenhuma opção disponível</SelectItem>}
        </SelectContent>
      </Select>
    </label>
  );
}

function CardParticipantes() {
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});
  const [dataAdmissaoInicial, setDataAdmissaoInicial] = useState("");
  const [dataAdmissaoFinal, setDataAdmissaoFinal] = useState("");
  const [lideradosDiretos, setLideradosDiretos] = useState(false);
  const [lideradosIndiretos, setLideradosIndiretos] = useState(false);

  const campo = (id: string) => CAMPOS_PARTICIPANTES.find((item) => item.id === id) as CampoParticipantes;
  const atualizarSelecao = (id: string) => (valor: string) => setSelecoes((atual) => ({ ...atual, [id]: valor }));

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-xl">Participantes</CardTitle>
        <p className="text-sm text-muted-foreground">Selecione os colaboradores que irão receber a Super Pesquisa</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(["papel", "unidades", "departamento", "grupos"] as const).map((id) => (
            <SelecaoParticipantes key={id} campo={campo(id)} valor={selecoes[id] ?? ""} onChange={atualizarSelecao(id)} />
          ))}
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Data admissão inicial
            <Input type="date" value={dataAdmissaoInicial} onChange={(event) => setDataAdmissaoInicial(event.target.value)} aria-label="Data admissão inicial" className="bg-background font-normal text-foreground" />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Data admissão final
            <Input type="date" value={dataAdmissaoFinal} onChange={(event) => setDataAdmissaoFinal(event.target.value)} aria-label="Data admissão final" className="bg-background font-normal text-foreground" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelecaoParticipantes campo={campo("liderancas")} valor={selecoes.liderancas ?? ""} onChange={atualizarSelecao("liderancas")} />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={lideradosDiretos} onCheckedChange={(checked) => setLideradosDiretos(checked === true)} />
            Liderados diretos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={lideradosIndiretos} onCheckedChange={(checked) => setLideradosIndiretos(checked === true)} />
            Liderados indiretos
          </label>
        </div>
        <div className="space-y-3 border-t border-border pt-5">
          <h3 className="text-sm font-semibold">Outros Participantes</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelecaoParticipantes campo={campo("colaboradores")} valor={selecoes.colaboradores ?? ""} onChange={atualizarSelecao("colaboradores")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const MODOS_IDENTIFICACAO = [
  { id: "anonima", rotulo: "Anônima", descricao: "Não serão identificados os colaboradores." },
  { id: "identificada", rotulo: "Identificada", descricao: "Os colaboradores serão identificados nas respostas." },
];

function CardDetalhesPesquisa() {
  const [titulo, setTitulo] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [modoIdentificacao, setModoIdentificacao] = useState("");
  const [botaoVoltar, setBotaoVoltar] = useState("");
  const modoSelecionado = MODOS_IDENTIFICACAO.find((modo) => modo.id === modoIdentificacao);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-xl">Detalhes da Pesquisa</CardTitle>
        <p className="text-sm text-muted-foreground">Descreva o tema, o contexto e as regras de encerramento da Super Pesquisa.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Título da Pesquisa
          <Input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            maxLength={5000}
            placeholder="Ex.: Pesquisa de fim de ano"
            aria-label="Título da Pesquisa"
            className="bg-background font-normal text-foreground"
          />
          <span className="text-right text-xs font-normal text-muted-foreground">{titulo.length.toLocaleString("pt-BR")} / 5.000 caracteres</span>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Informações sobre a pesquisa
          <span className="text-xs font-normal text-muted-foreground">Ex.: a ideia desta pesquisa é entendermos como podemos fazer a melhor festa de final de ano!</span>
          <Textarea
            value={informacoes}
            onChange={(event) => setInformacoes(event.target.value)}
            maxLength={20000}
            rows={6}
            placeholder="Explique o objetivo da pesquisa e inclua as orientações para participação."
            aria-label="Informações sobre a pesquisa"
            className="bg-background font-normal text-foreground"
          />
          <span className="text-right text-xs font-normal text-muted-foreground">{informacoes.length.toLocaleString("pt-BR")} / 20.000 caracteres</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
            Data de Encerramento
            <Input type="date" value={dataEncerramento} min={dataHoje()} onChange={(event) => setDataEncerramento(event.target.value)} aria-label="Data de Encerramento" className="bg-background font-normal text-foreground" />
          </label>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo de Pesquisa</span>
            <Select value={modoIdentificacao} onValueChange={setModoIdentificacao}>
              <SelectTrigger aria-label="Tipo de Pesquisa" className="w-full bg-background font-normal text-foreground">
                <SelectValue placeholder="Selecione o tipo de pesquisa" />
              </SelectTrigger>
              <SelectContent>
                {MODOS_IDENTIFICACAO.map((modo) => <SelectItem key={modo.id} value={modo.id}>{modo.rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
            {modoSelecionado ? <span className="text-xs font-normal text-muted-foreground">{modoSelecionado.rotulo} ({modoSelecionado.descricao.charAt(0).toLowerCase()}{modoSelecionado.descricao.slice(1)})</span> : null}
          </div>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Habilitar botão de voltar?</span>
            <Select value={botaoVoltar} onValueChange={setBotaoVoltar}>
              <SelectTrigger aria-label="Habilitar botão de voltar?" className="w-full bg-background font-normal text-foreground">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs font-normal text-muted-foreground">Ex.: Sim — o colaborador poderá voltar e alterar suas respostas.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TIPOS_RESPOSTA = [
  "Textos Curtos",
  "Textos Longos",
  "Alternativas escolha única",
  "Alternativas múltipla escolha",
  "Lista suspensa",
  "Escala numérica (0 a 10)",
  "Avaliação por estrelas",
  "Números",
  "Ranking",
];

const CAMPO_DIMENSAO: CampoParticipantes = { id: "dimensao", rotulo: "Dimensão", placeholder: "Selecione a dimensão", opcoes: [] };

type Pergunta = { id: number; dimensao: string; tipoResposta: string };

function CardPerguntas() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([{ id: 1, dimensao: "", tipoResposta: "" }]);

  function atualizarPergunta(id: number, campo: "dimensao" | "tipoResposta", valor: string) {
    setPerguntas((atual) => atual.map((pergunta) => (pergunta.id === id ? { ...pergunta, [campo]: valor } : pergunta)));
  }

  function adicionarPergunta() {
    setPerguntas((atual) => [...atual, { id: atual.length + 1, dimensao: "", tipoResposta: "" }]);
  }

  function removerPergunta(id: number) {
    setPerguntas((atual) => atual.filter((pergunta) => pergunta.id !== id).map((pergunta, indice) => ({ ...pergunta, id: indice + 1 })));
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-xl">Perguntas</CardTitle>
        <p className="text-sm text-muted-foreground">Vincule cada pergunta a uma dimensão e defina o tipo de resposta esperado.</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Dimensão</TableHead>
              <TableHead className="w-28">Pergunta #</TableHead>
              <TableHead>Tipo de Resposta</TableHead>
              <TableHead className="w-12"><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perguntas.map((pergunta) => (
              <TableRow key={pergunta.id}>
                <TableCell>
                  <SelecaoParticipantes
                    campo={CAMPO_DIMENSAO}
                    valor={pergunta.dimensao}
                    onChange={(valor) => atualizarPergunta(pergunta.id, "dimensao", valor)}
                  />
                </TableCell>
                <TableCell className="align-middle font-display text-lg font-semibold">{pergunta.id}</TableCell>
                <TableCell className="align-middle">
                  <Select value={pergunta.tipoResposta} onValueChange={(valor) => atualizarPergunta(pergunta.id, "tipoResposta", valor)}>
                    <SelectTrigger aria-label={`Tipo de Resposta da pergunta ${pergunta.id}`} className="w-full bg-background font-normal text-foreground">
                      <SelectValue placeholder="Selecione o tipo de resposta" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_RESPOSTA.map((tipo) => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="align-middle">
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remover pergunta ${pergunta.id}`} disabled={perguntas.length === 1} onClick={() => removerPergunta(pergunta.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button type="button" variant="outline" className="mt-4" onClick={adicionarPergunta}>
          <Plus className="mr-2 size-4" />Adicionar pergunta
        </Button>
      </CardContent>
    </Card>
  );
}

function SuperPesquisaPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="min-w-0 bg-background p-5 sm:p-8">
        <div className="mb-5 flex justify-end"><PerfilFlutuante /></div>
        <Card className="min-h-[34rem] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Super Pesquisa</CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Combine várias dimensões em uma única pesquisa e defina quem vai participar.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <CardParticipantes />

            <CardDetalhesPesquisa />

            <CardPerguntas />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}