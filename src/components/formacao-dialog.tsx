import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type DadosFormacao,
  type Formacao,
  type TipoFormacao,
  TIPOS_FORMACAO,
  useSalvarFormacao,
} from "@/hooks/use-formacoes";

type FormacaoDialogProps = {
  formacao: Formacao | null;
  onFechar: () => void;
};

function formularioInicial(formacao: Formacao | null): DadosFormacao {
  if (!formacao) {
    return {
      tipo: "Ensino superior",
      instituicao: "",
      formacao: "",
      area: "",
      data_inicio: "",
      data_termino: "",
      diploma_url: "",
    };
  }

  return {
    tipo: formacao.tipo as TipoFormacao,
    instituicao: formacao.instituicao,
    formacao: formacao.formacao,
    area: formacao.area,
    data_inicio: formacao.data_inicio,
    data_termino: formacao.data_termino,
    diploma_url: formacao.diploma_url,
  };
}

function Campo({
  id,
  rotulo,
  obrigatorio,
  children,
}: {
  id: string;
  rotulo: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {rotulo}
        {obrigatorio && " *"}
      </label>
      {children}
    </div>
  );
}

// Modal de cadastro/edição de uma formação. Montado só quando aberto.
export function FormacaoDialog({ formacao, onFechar }: FormacaoDialogProps) {
  const salvar = useSalvarFormacao();
  const [dados, setDados] = useState<DadosFormacao>(() => formularioInicial(formacao));
  const [erro, setErro] = useState<string | null>(null);

  function atualizar<K extends keyof DadosFormacao>(campo: K, valor: DadosFormacao[K]) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function validar(): string | null {
    if (!dados.instituicao.trim()) return "Informe a instituição de ensino.";
    if (!dados.formacao.trim()) return "Informe a formação ou o curso.";
    if (!dados.data_inicio) return "Informe a data de início.";
    if (!dados.data_termino) return "Informe a data de término ou previsão.";
    if (dados.data_termino < dados.data_inicio) {
      return "A data de término não pode ser anterior à data de início.";
    }
    return null;
  }

  function enviar() {
    const mensagem = validar();
    setErro(mensagem);
    if (mensagem) return;

    salvar.mutate(
      { id: formacao?.id ?? null, dados },
      {
        onSuccess: () => {
          toast.success(formacao ? "Formação atualizada." : "Formação adicionada.");
          onFechar();
        },
        onError: (erroSalvar) => toast.error(erroSalvar.message),
      },
    );
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {formacao ? "Editar cadastro de educação" : "Adicionar cadastro de educação"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <Campo id="formacao-tipo" rotulo="Tipo de formação" obrigatorio>
            <select
              id="formacao-tipo"
              value={dados.tipo}
              onChange={(evento) => atualizar("tipo", evento.target.value as TipoFormacao)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {TIPOS_FORMACAO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="formacao-instituicao" rotulo="Instituição de ensino" obrigatorio>
            <Input
              id="formacao-instituicao"
              value={dados.instituicao}
              onChange={(evento) => atualizar("instituicao", evento.target.value)}
            />
          </Campo>

          <Campo id="formacao-curso" rotulo="Formação/cursos" obrigatorio>
            <Input
              id="formacao-curso"
              value={dados.formacao}
              onChange={(evento) => atualizar("formacao", evento.target.value)}
            />
          </Campo>

          <Campo id="formacao-area" rotulo="Área">
            <Input
              id="formacao-area"
              value={dados.area}
              onChange={(evento) => atualizar("area", evento.target.value)}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="formacao-inicio" rotulo="Data de início" obrigatorio>
              <Input
                id="formacao-inicio"
                type="date"
                value={dados.data_inicio}
                onChange={(evento) => atualizar("data_inicio", evento.target.value)}
              />
            </Campo>
            <Campo id="formacao-termino" rotulo="Data de término (ou previsão)" obrigatorio>
              <Input
                id="formacao-termino"
                type="date"
                value={dados.data_termino}
                onChange={(evento) => atualizar("data_termino", evento.target.value)}
              />
            </Campo>
          </div>

          <Campo id="formacao-diploma" rotulo="Diploma/Certificado">
            <Input
              id="formacao-diploma"
              type="url"
              placeholder="Cole ou insira um link de um arquivo"
              value={dados.diploma_url}
              onChange={(evento) => atualizar("diploma_url", evento.target.value)}
            />
          </Campo>

          {erro && <p className="text-sm font-semibold text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button type="button" onClick={enviar} disabled={salvar.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
