import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dataHoje } from "@/components/pesquisa-builder";

const MODOS = [
  { id: "anonima", rotulo: "Anônima", descricao: "Não serão identificados os colaboradores." },
  { id: "identificada", rotulo: "Identificada", descricao: "Os colaboradores serão identificados nas respostas." },
];

export function CardDetalhesPesquisa({ nome, exemplo }: { nome: string; exemplo: string }) {
  const [titulo, setTitulo] = useState("");
  const [info, setInfo] = useState("");
  const [enc, setEnc] = useState("");
  const [modo, setModo] = useState("");
  const [voltar, setVoltar] = useState("");
  const sel = MODOS.find((m) => m.id === modo);
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4"><CardTitle className="font-display text-xl">Detalhes da Pesquisa</CardTitle><p className="text-sm text-muted-foreground">Descreva o tema, o contexto e as regras de encerramento da {nome}.</p></CardHeader>
      <CardContent className="space-y-5">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Título da Pesquisa<Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={5000} placeholder={exemplo} className="bg-background font-normal text-foreground" /><span className="text-right font-normal">{titulo.length.toLocaleString("pt-BR")} / 5.000 caracteres</span></label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Informações sobre a pesquisa<Textarea value={info} onChange={(e) => setInfo(e.target.value)} maxLength={20000} rows={6} placeholder="Explique o objetivo e as orientações para participação." className="bg-background font-normal text-foreground" /><span className="text-right font-normal">{info.length.toLocaleString("pt-BR")} / 20.000 caracteres</span></label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Data de Encerramento<Input type="date" value={enc} min={dataHoje()} onChange={(e) => setEnc(e.target.value)} className="bg-background font-normal text-foreground" /></label>
          <div className="grid gap-1.5"><span className="text-xs font-medium text-muted-foreground">Tipo de Pesquisa</span><Select value={modo} onValueChange={setModo}><SelectTrigger className="w-full bg-background font-normal text-foreground"><SelectValue placeholder="Selecione o tipo de pesquisa" /></SelectTrigger><SelectContent>{MODOS.map((m) => <SelectItem key={m.id} value={m.id}>{m.rotulo}</SelectItem>)}</SelectContent></Select>{sel ? <span className="text-xs font-normal text-muted-foreground">{sel.rotulo} ({sel.descricao.charAt(0).toLowerCase()}{sel.descricao.slice(1)})</span> : null}</div>
          <div className="grid gap-1.5"><span className="text-xs font-medium text-muted-foreground">Habilitar botão de voltar?</span><Select value={voltar} onValueChange={setVoltar}><SelectTrigger className="w-full bg-background font-normal text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
        </div>
      </CardContent>
    </Card>
  );
}
