import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Selecao, type Campo } from "@/components/pesquisa-builder";

const TIPOS = ["Textos Curtos", "Textos Longos", "Alternativas escolha única", "Alternativas múltipla escolha", "Lista suspensa", "Escala numérica (0 a 10)", "Avaliação por estrelas", "Números", "Ranking"];
const CAMPO_DIM: Campo = { id: "dimensao", rotulo: "Dimensão", placeholder: "Selecione a dimensão", opcoes: [] };
type Pergunta = { id: number; dimensao: string; tipo: string };

export function CardPerguntas() {
  const [lista, setLista] = useState<Pergunta[]>([{ id: 1, dimensao: "", tipo: "" }]);
  const upd = (id: number, c: "dimensao" | "tipo", v: string) => setLista((a) => a.map((p) => (p.id === id ? { ...p, [c]: v } : p)));
  const remover = (id: number) => setLista((a) => a.filter((x) => x.id !== id).map((x, i) => ({ ...x, id: i + 1 })));
  const adicionar = () => setLista((a) => [...a, { id: a.length + 1, dimensao: "", tipo: "" }]);
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4"><CardTitle className="font-display text-xl">Perguntas</CardTitle><p className="text-sm text-muted-foreground">Vincule cada pergunta a uma dimensão e defina o tipo de resposta esperado.</p></CardHeader>
      <CardContent>
        <Table><TableHeader><TableRow><TableHead className="w-40">Dimensão</TableHead><TableHead className="w-28">Pergunta #</TableHead><TableHead>Tipo de Resposta</TableHead><TableHead className="w-12"><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
          <TableBody>{lista.map((p) => (
            <TableRow key={p.id}><TableCell><Selecao campo={CAMPO_DIM} valor={p.dimensao} onChange={(v) => upd(p.id, "dimensao", v)} /></TableCell><TableCell className="align-middle font-display text-lg font-semibold">{p.id}</TableCell>
              <TableCell className="align-middle"><Select value={p.tipo} onValueChange={(v) => upd(p.id, "tipo", v)}><SelectTrigger className="w-full bg-background font-normal text-foreground"><SelectValue placeholder="Selecione o tipo de resposta" /></SelectTrigger><SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></TableCell>
              <TableCell className="align-middle"><Button type="button" variant="ghost" size="icon" disabled={lista.length === 1} onClick={() => remover(p.id)}><Trash2 className="size-4" /></Button></TableCell></TableRow>))}
          </TableBody></Table>
        <Button type="button" variant="outline" className="mt-4" onClick={adicionar}><Plus className="mr-2 size-4" />Adicionar pergunta</Button>
      </CardContent>
    </Card>
  );
}
