export const LOADING_MESSAGES: string[] = [
  "Grandes equipes são construídas quando pessoas são valorizadas, desenvolvidas e ouvidas.",
  "Liderar é transformar potencial em resultado por meio de pessoas.",
  "Uma empresa cresce quando seus colaboradores crescem junto com ela.",
  "Reconhecer talentos é investir no futuro da organização.",
  "Pessoas motivadas constroem resultados que números sozinhos não conseguem explicar.",
  "Desenvolver pessoas é uma das formas mais inteligentes de desenvolver a empresa.",
  "Uma boa gestão começa quando entendemos que cada pessoa faz parte do resultado.",
  "Respeito, confiança e desenvolvimento formam equipes mais fortes.",
  "Valorizar pessoas não é apenas uma escolha de gestão, é uma estratégia de crescimento.",
  "Quando talentos encontram oportunidades, resultados acontecem.",

  "Excelência não acontece por acaso. Ela é construída todos os dias.",
  "Seu desempenho de hoje constrói as oportunidades de amanhã.",
  "Pequenas melhorias todos os dias produzem grandes resultados ao longo do tempo.",
  "Faça o melhor que puder com aquilo que está sob seu controle.",
  "Resultado é consequência de consistência, disciplina e dedicação.",
  "Não espere a motivação chegar. Comece, mantenha o ritmo e deixe o resultado falar.",
  "Seu potencial cresce quando você decide sair do automático.",
  "Trabalhar com propósito transforma esforço em realização.",
  "A diferença entre intenção e resultado está na execução.",
  "Quem busca evolução não precisa ser perfeito, precisa continuar avançando.",

  "Tenha fé no caminho, coragem para continuar e humildade para aprender.",
  "Quando a caminhada parecer difícil, lembre-se de por que você começou.",
  "A fé fortalece o coração para enfrentar aquilo que ainda não podemos enxergar.",
  "Faça sua parte com dedicação e confie que cada passo tem seu propósito.",
  "Nem todo processo é fácil, mas todo processo pode ensinar algo.",
  "Acredite, persista e continue fazendo sua parte.",
  "Dias difíceis também fazem parte da construção de grandes histórias.",
  "Tenha fé para começar, coragem para continuar e gratidão para reconhecer cada conquista.",
  "O que hoje parece pequeno pode ser parte de algo muito maior.",
  "Confie no processo, mantenha seus valores e continue caminhando.",

  "Cada conquista começou com uma decisão de não desistir.",
  "Celebre cada avanço. Grandes resultados são feitos de pequenas vitórias.",
  "Você chegou até aqui porque escolheu continuar.",
  "Toda meta alcançada prova que esforço e persistência produzem resultados.",
  "Reconheça sua evolução. Você não está no mesmo lugar de onde começou.",
  "Conquistas merecem ser celebradas, mas também lembram do que somos capazes de alcançar.",
  "O resultado é importante, mas a pessoa que você se tornou durante o caminho também é.",
  "Cada desafio superado aumenta a confiança para enfrentar o próximo.",
  "Não diminua suas conquistas. Elas representam esforço, aprendizado e dedicação.",
  "Uma vitória pode parecer pequena para quem observa de fora, mas pode representar uma grande história para quem a viveu.",

  "Foco é escolher onde colocar sua energia e não desperdiçá-la com o que não importa.",
  "Defina seu objetivo, organize suas prioridades e avance um passo de cada vez.",
  "Concentre-se no que precisa ser feito, não apenas no que precisa ser pensado.",
  "Prioridade clara transforma esforço disperso em resultado.",
  "Menos distração, mais propósito.",
  "Seu tempo é um recurso limitado. Use-o naquilo que realmente gera valor.",
  "Disciplina é continuar fazendo o necessário mesmo quando a motivação diminui.",
  "Mantenha os olhos no objetivo e os pés no próximo passo.",
  "Foco não significa fazer tudo. Significa saber o que merece sua atenção.",
  "Trabalhar com propósito, mantenha o foco e deixe a consistência construir o resultado.",
];

export function pickRandomMessages(count: number): string[] {
  const pool = [...LOADING_MESSAGES];
  const picked: string[] = [];
  const total = Math.min(count, pool.length);

  for (let n = 0; n < total; n++) {
    const i = Math.floor(Math.random() * pool.length);
    const [removed] = pool.splice(i, 1);
    if (removed !== undefined) picked.push(removed);
  }

  return picked;
}
