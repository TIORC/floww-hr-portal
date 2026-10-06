import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Sidebar } from "@/routes/painel";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export function dataHoje() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export type Campo = { id: string; rotulo: string; placeholder: string; opcoes: string[] };

export const CAMPOS_PARTICIPANTES: Campo[] = [
  { id: "papel", rotulo: "Papel", placeholder: "Selecione o papel", opcoes: [] },
  { id: "unidades", rotulo: "Unidades", placeholder: "Selecione as unidades", opcoes: [] },
  { id: "departamento", rotulo: "Departamento", placeholder: "Selecione o departamento", opcoes: [] },
  { id: "grupos", rotulo: "Grupos", placeholder: "Selecione os grupos", opcoes: [] },
  { id: "liderancas", rotulo: "Lideranças", placeholder: "Selecione as lideranças", opcoes: [] },
  { id: "colaboradores", rotulo: "Colaboradores", placeholder: "Selecione os colaboradores", opcoes: [] },
];

export function Selecao({ campo, valor, onChange }: { campo: Campo; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {campo.rotulo}
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger aria-label={campo.rotulo} className="w-full bg-background font-normal text-foreground">
          <SelectValue placeholder={campo.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {campo.opcoes.length ? campo.opcoes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>) : <SelectItem value="sem-opcoes" disabled>Nenhuma opção disponível</SelectItem>}
        </SelectContent>
      </Select>
    </label>
  );
}

export function CardParticipantes({ nome }: { nome: string }) {
  const [sel, setSel] = useState<Record<string, string>>({});
  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [dir, setDir] = useState(false);
  const [ind, setInd] = useState(false);
  const campo = (id: string) => CAMPOS_PARTICIPANTES.find((c) => c.id === id) as Campo;
  const upd = (id: string) => (v: string) => setSel((a) => ({ ...a, [id]: v }));
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-4"><CardTitle className="font-display text-xl">Participantes</CardTitle><p className="text-sm text-muted-foreground">Selecione os colaboradores que irão receber a {nome}</p></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(["papel", "unidades", "departamento", "grupos"] as const).map((id) => <Selecao key={id} campo={campo(id)} valor={sel[id] ?? ""} onChange={upd(id)} />)}
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Data admissão inicial<Input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="bg-background font-normal text-foreground" /></label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Data admissão final<Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="bg-background font-normal text-foreground" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Selecao campo={campo("liderancas")} valor={sel.liderancas ?? ""} onChange={upd("liderancas")} /></div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={dir} onCheckedChange={(c) => setDir(c === true)} />Liderados diretos</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={ind} onCheckedChange={(c) => setInd(c === true)} />Liderados indiretos</label>
        </div>
        <div className="space-y-3 border-t border-border pt-5"><h3 className="text-sm font-semibold">Outros Participantes</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Selecao campo={campo("colaboradores")} valor={sel.colaboradores ?? ""} onChange={upd("colaboradores")} /></div></div>
      </CardContent>
    </Card>
  );
}
