export type PessoaOrganograma = {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  email: string;
  gestorEmail: string;
  papel: string;
  fotoUrl: string | null;
};

// Gestor (líder de setor) é quem está cadastrado com esse papel na planilha.
const REGRA_GESTOR = /gestor|l[ií]der de setor/i;

export function ehGestor(pessoa: Pick<PessoaOrganograma, "papel">) {
  return REGRA_GESTOR.test(pessoa.papel);
}

export type NoOrganograma = PessoaOrganograma & {
  subordinados: NoOrganograma[];
};

function normalizarEmail(valor: string) {
  return valor.trim().toLowerCase();
}

// Monta a árvore de liderança pelo e-mail do gestor direto.
// Quem não tem gestor cadastrado (ou cujo gestor não está na lista) vira raiz.
export function montarArvoreOrganograma(pessoas: PessoaOrganograma[]): NoOrganograma[] {
  const nosPorEmail = new Map<string, NoOrganograma>();

  pessoas.forEach((pessoa) => {
    nosPorEmail.set(normalizarEmail(pessoa.email), { ...pessoa, subordinados: [] });
  });

  const raizes: NoOrganograma[] = [];

  nosPorEmail.forEach((no) => {
    const gestor = no.gestorEmail ? nosPorEmail.get(normalizarEmail(no.gestorEmail)) : undefined;
    // Ignora autoliderança, que causaria um ciclo.
    if (gestor && gestor !== no) {
      gestor.subordinados.push(no);
    } else {
      raizes.push(no);
    }
  });

  const ordenar = (nos: NoOrganograma[]) => {
    nos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    nos.forEach((no) => ordenar(no.subordinados));
  };
  ordenar(raizes);

  return raizes;
}
