// Situação é texto livre na planilha; estes termos indicam que a pessoa já saiu da empresa.
const REGRA_SITUACAO_DESLIGADA = /desligad|demitid|inativ|afastad|ex[- ]?colaborador/i;

export type LinhaDesligamento = {
  situacao: string | null;
  desligamento: string | null;
  ultimo_dia_trabalhado: string | null;
};

// Pessoa desligada: tem data de desligamento, último dia trabalhado ou situação de saída.
export function estaDesligado(linha: LinhaDesligamento) {
  return (
    Boolean(linha.desligamento?.trim()) ||
    Boolean(linha.ultimo_dia_trabalhado?.trim()) ||
    REGRA_SITUACAO_DESLIGADA.test(linha.situacao ?? "")
  );
}
