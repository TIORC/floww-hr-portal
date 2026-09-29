import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/candidatura/$vagaId")({ component: CandidaturaPage });

const VAGAS: Record<string, { cargo: string; setor: string }> = {
  "analista-dados": { cargo: "Analista de Dados", setor: "Tecnologia" },
  "designer-produto": { cargo: "Product Designer", setor: "Produto" },
  "analista-rh": { cargo: "Analista de RH", setor: "Pessoas" },
  "dev-frontend": { cargo: "Desenvolvedor Front-end", setor: "Tecnologia" },
};
type Campos = { nome: string; email: string; telefone: string; cidade: string; salario: string };
type Erros = Partial<Record<keyof Campos | "curriculo" | "lgpd", string>>;

function CandidaturaPage() {
  const { vagaId } = Route.useParams();
  const vaga = VAGAS[vagaId] ?? { cargo: "Oportunidade", setor: "" };
  const [campos, setCampos] = useState<Campos>({ nome: "", email: "", telefone: "", cidade: "", salario: "" });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [aceitou, setAceitou] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [enviado, setEnviado] = useState(false);
  const atualizar = (chave: keyof Campos, valor: string) => setCampos(c => ({ ...c, [chave]: valor }));
  const validar = () => {
    const e: Erros = {};
    if (!campos.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!campos.email.trim()) e.email = "Informe seu e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email)) e.email = "Informe um e-mail válido.";
    if (!campos.telefone.trim()) e.telefone = "Informe seu telefone.";
    if (!arquivo) e.curriculo = "Anexe seu currículo em PDF.";
    else if (arquivo.type !== "application/pdf" && !arquivo.name.toLowerCase().endsWith(".pdf")) e.curriculo = "O arquivo precisa estar no formato PDF.";
    if (!aceitou) e.lgpd = "É necessário aceitar o tratamento de dados para continuar.";
    setErros(e);
    return Object.keys(e).length === 0;
  };
  const enviar = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (validar()) setEnviado(true); };
  const campo = (key: keyof Campos, label: string, required = false, type = "text", placeholder = "") => <div className="space-y-2"><label htmlFor={key} className="text-sm font-medium">{label}{required && <span className="ml-1 text-destructive">*</span>}</label><Input id={key} type={type} required={required} placeholder={placeholder} value={campos[key]} aria-invalid={!!erros[key]} onChange={e => { atualizar(key, e.target.value); if (erros[key]) setErros(v => ({ ...v, [key]: undefined })); }}/>{erros[key] && <p className="text-sm text-destructive">{erros[key]}</p>}</div>;

  return <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6"><div className="mx-auto max-w-2xl"><Link to="/processos-seletivos" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>Voltar aos processos</Link>
    <Card className="overflow-hidden rounded-2xl shadow-sm"><div className="bg-[image:var(--gradient-brand)] px-6 py-8 text-white sm:px-9"><div className="mb-5 grid size-11 place-items-center rounded-xl bg-white/15"><BriefcaseBusiness className="size-5"/></div><p className="text-sm text-white/70">Candidatura para</p><h1 className="mt-1 font-display text-2xl font-semibold">{vaga.cargo}</h1><p className="mt-1 text-sm text-white/75">{vaga.setor}</p></div>
      <CardContent className="p-6 sm:p-9">{enviado ? <div className="flex min-h-72 flex-col items-center justify-center text-center"><div className="mb-5 grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-9"/></div><h2 className="font-display text-2xl font-semibold">Candidatura enviada!</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Recebemos seus dados para a vaga de {vaga.cargo}. Obrigado por se candidatar.</p><Button asChild className="mt-6"><Link to="/processos-seletivos">Voltar aos processos</Link></Button></div> : <form onSubmit={enviar} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">{campo("nome", "Nome completo", true, "text", "Seu nome e sobrenome")}{campo("email", "E-mail", true, "email", "voce@email.com")}{campo("telefone", "Telefone", true, "tel", "(00) 00000-0000")}{campo("cidade", "Cidade", false, "text", "Sua cidade")}{campo("salario", "Pretensão salarial", false, "text", "Ex.: R$ 5.000,00")}</div>
        <div className="space-y-2"><label htmlFor="curriculo" className="text-sm font-medium">Currículo em PDF <span className="text-destructive">*</span></label><label htmlFor="curriculo" className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center transition hover:border-primary/50"><UploadCloud className="mb-2 size-6 text-primary"/><span className="text-sm font-medium">{arquivo ? arquivo.name : "Clique para anexar seu currículo"}</span><span className="mt-1 text-xs text-muted-foreground">Somente arquivos PDF</span><input id="curriculo" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e => { setArquivo(e.target.files?.[0] ?? null); if (erros.curriculo) setErros(v => ({ ...v, curriculo: undefined })); }}/></label>{erros.curriculo && <p className="text-sm text-destructive">{erros.curriculo}</p>}</div>
        <div className="space-y-2"><div className="flex items-start gap-3"><Checkbox id="lgpd" checked={aceitou} onCheckedChange={v => { setAceitou(v === true); if (erros.lgpd) setErros(e => ({ ...e, lgpd: undefined })); }}/><label htmlFor="lgpd" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">Autorizo o tratamento dos meus dados pessoais para participação neste processo seletivo, conforme a Lei Geral de Proteção de Dados (LGPD). <span className="text-destructive">*</span></label></div>{erros.lgpd && <p className="text-sm text-destructive">{erros.lgpd}</p>}</div>
        <Button type="submit" size="lg" className="w-full">Enviar candidatura</Button><p className="text-center text-xs text-muted-foreground">Os campos marcados com * são obrigatórios.</p>
      </form>}</CardContent></Card><p className="mt-5 text-center text-xs text-muted-foreground">Processo seletivo • Floww!</p></div></main>;
}
