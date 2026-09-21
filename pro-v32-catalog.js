/* V32 progression content: 120 tiered contracts, 120 tiered medals, 80 cosmetic titles.
 * Content tiers are progression goals, not additional combat mechanics.
 * Count only completed local CPU matches; practice, abandoned and online fights do not count.
 */
(() => {
  'use strict';

  const metricDefinitions = {
    matches: { name: 'Partidas concluídas', description: 'Partidas locais contra a CPU concluídas, com vitória ou derrota.', aggregation: 'sum', unit: 'partidas' },
    wins: { name: 'Vitórias', description: 'Partidas locais contra a CPU vencidas.', aggregation: 'sum', unit: 'vitórias' },
    losses: { name: 'Experiência nas derrotas', description: 'Derrotas em partidas locais contra a CPU concluídas. Abandonos não contam.', aggregation: 'sum', unit: 'derrotas' },
    damage: { name: 'Dano causado', description: 'Dano efetivamente retirado da vida adversária pelo jogador.', aggregation: 'sum', unit: 'de dano' },
    hits: { name: 'Golpes conectados', description: 'Acertos do jogador que causaram dano ao adversário.', aggregation: 'sum', unit: 'acertos' },
    punches: { name: 'Socos certeiros', description: 'Socos do jogador que causaram dano.', aggregation: 'sum', unit: 'socos' },
    kicks: { name: 'Chutes certeiros', description: 'Chutes do jogador que causaram dano.', aggregation: 'sum', unit: 'chutes' },
    powers: { name: 'Poderes ativados', description: 'Ativações válidas de poder; apertar uma tecla em recarga não conta.', aggregation: 'sum', unit: 'poderes' },
    supers: { name: 'Supers ativados', description: 'Supers efetivamente ativados com a barra disponível.', aggregation: 'sum', unit: 'Supers' },
    blocks: { name: 'Impactos bloqueados', description: 'Ataques adversários efetivamente recebidos em defesa.', aggregation: 'sum', unit: 'bloqueios' },
    dodges: { name: 'Esquivas realizadas', description: 'Esquivas efetivamente iniciadas durante a luta.', aggregation: 'sum', unit: 'esquivas' },
    jumps: { name: 'Saltos realizados', description: 'Saltos iniciados pelo jogador; permanecer no ar não acrescenta saltos.', aggregation: 'sum', unit: 'saltos' },
    airHits: { name: 'Acertos aéreos', description: 'Golpes que causaram dano enquanto o jogador estava no ar.', aggregation: 'sum', unit: 'acertos aéreos' },
    combo: { name: 'Maior combo', description: 'Maior sequência de acertos registrada. Não soma combos diferentes.', aggregation: 'max', unit: 'acertos no combo' },
    flawless: { name: 'Vitórias perfeitas', description: 'Partidas vencidas sem receber dano em nenhum round.', aggregation: 'sum', unit: 'vitórias perfeitas' },
    comebacks: { name: 'Viradas', description: 'Partidas vencidas após ficar com no máximo 25% de vida e menos vida proporcional que o adversário.', aggregation: 'sum', unit: 'viradas' },
    stages: { name: 'Arenas visitadas', description: 'Arenas diferentes em partidas concluídas.', aggregation: 'unique', unit: 'arenas diferentes' },
    characters: { name: 'Personagens utilizados', description: 'Personagens diferentes usados pelo jogador em partidas concluídas.', aggregation: 'unique', unit: 'personagens diferentes' },
    seconds: { name: 'Tempo de combate', description: 'Segundos ativos em partidas concluídas; menus e pausas não contam.', aggregation: 'sum', unit: 'segundos' },
    rounds: { name: 'Rounds concluídos', description: 'Rounds concluídos dentro de partidas finalizadas.', aggregation: 'sum', unit: 'rounds' }
  };

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const medalRanks = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Lenda'];
  const goldByTier = [45, 70, 105, 150, 210, 290];
  const xpByTier = [35, 55, 80, 115, 160, 220];
  const medalXpByTier = [50, 80, 120, 175, 250, 350];

  // Explicit target curves keep rare feats attainable and ordinary goals long-lived.
  const families = [
    {
      metric: 'matches', contract: 'Chamado da Arena', medal: 'Presença de Combate',
      contracts: [1, 2, 4, 6, 9, 12], medals: [1, 10, 30, 75, 150, 300],
      goal: n => `Conclua ${n} ${n === 1 ? 'partida' : 'partidas'} contra a CPU.`,
      names: ['Primeira convocação', 'Duelo em dobro', 'Agenda de combate', 'Jornada do desafiante', 'Ritmo de veterano', 'Maratona do ringue']
    },
    {
      metric: 'wins', contract: 'Caminho da Vitória', medal: 'Coroa da Arena',
      contracts: [1, 2, 3, 5, 7, 10], medals: [1, 5, 20, 50, 100, 200],
      goal: n => `Vença ${n} ${n === 1 ? 'partida' : 'partidas'} contra a CPU.`,
      names: ['Primeiro triunfo', 'Dobradinha vencedora', 'Tríade de conquistas', 'Rota do pódio', 'Cerco ao topo', 'Dez coroas']
    },
    {
      metric: 'losses', contract: 'Aprender e Retornar', medal: 'Espírito Persistente', rewardScale: 0.45,
      contracts: [1, 2, 3, 4, 6, 8], medals: [1, 5, 15, 35, 70, 140],
      goal: n => `Termine ${n} ${n === 1 ? 'partida que resulte em derrota' : 'partidas que resultem em derrota'}, sem abandonar.`,
      names: ['Lição do primeiro revés', 'Resiliência em construção', 'Caderno de lições', 'A força de continuar', 'Seis novos aprendizados', 'O ringue ensina']
    },
    {
      metric: 'damage', contract: 'Pressão Constante', medal: 'Força de Impacto',
      contracts: [300, 800, 1600, 3000, 5000, 8000], medals: [1000, 6000, 18000, 50000, 120000, 250000],
      goal: n => `Cause ${number(n)} de dano total ao adversário.`,
      names: ['Primeira ruptura', 'Pressão crescente', 'Cerco ofensivo', 'Impacto concentrado', 'Demolidor em ação', 'Tempestade de dano']
    },
    {
      metric: 'hits', contract: 'Mira de Lutador', medal: 'Precisão de Elite',
      contracts: [10, 25, 50, 90, 150, 240], medals: [25, 100, 300, 750, 1800, 4000],
      goal: n => `Conecte ${n} golpes que causem dano.`,
      names: ['Dez bons contatos', 'Ritmo de precisão', 'Ofensiva consistente', 'Acertos calculados', 'Disciplina do impacto', 'Oficina de precisão']
    },
    {
      metric: 'punches', contract: 'Punhos em Ação', medal: 'Punho de Ferro',
      contracts: [5, 12, 25, 45, 75, 120], medals: [10, 50, 150, 400, 900, 2000],
      goal: n => `Acerte ${n} socos que causem dano.`,
      names: ['Guarda avançada', 'Jogo de mãos', 'Linha de frente', 'Punhos sem hesitação', 'Ofensiva de ferro', 'Maestria dos punhos']
    },
    {
      metric: 'kicks', contract: 'Passo de Ataque', medal: 'Pernas de Aço',
      contracts: [5, 12, 25, 45, 75, 120], medals: [10, 50, 150, 400, 900, 2000],
      goal: n => `Acerte ${n} chutes que causem dano.`,
      names: ['Alcance inicial', 'Passada ofensiva', 'Pernas em movimento', 'Precisão do giro', 'Domínio de alcance', 'Maestria dos chutes']
    },
    {
      metric: 'powers', contract: 'Energia Desperta', medal: 'Canalizador de Poder',
      contracts: [4, 10, 20, 35, 60, 90], medals: [10, 40, 120, 300, 700, 1500],
      goal: n => `Ative ${n} poderes durante o combate.`,
      names: ['Centelha ativa', 'Canal aberto', 'Fluxo contínuo', 'Vontade manifesta', 'Núcleo desperto', 'Poder sob domínio']
    },
    {
      metric: 'supers', contract: 'Momento Supremo', medal: 'Explosão Suprema',
      contracts: [1, 2, 4, 6, 10, 16], medals: [1, 10, 30, 75, 150, 300],
      goal: n => `Ative ${n} ${n === 1 ? 'Super' : 'Supers'} com a barra carregada.`,
      names: ['A hora do Super', 'Dois momentos decisivos', 'Energia acumulada', 'Seis grandes entradas', 'Ritmo supremo', 'Sinfonia de Supers']
    },
    {
      metric: 'blocks', contract: 'Guarda Inabalável', medal: 'Muralha Viva',
      contracts: [3, 8, 16, 28, 45, 70], medals: [10, 40, 120, 300, 700, 1500],
      goal: n => `Bloqueie ${n} impactos adversários com a defesa.`,
      names: ['Mãos à guarda', 'Leitura de impacto', 'Escudo paciente', 'Defesa disciplinada', 'Linha impenetrável', 'Bastião do ringue']
    },
    {
      metric: 'dodges', contract: 'Passos Elusivos', medal: 'Sombra Intocável',
      contracts: [4, 10, 20, 35, 55, 85], medals: [10, 50, 150, 400, 900, 1800],
      goal: n => `Realize ${n} esquivas válidas durante a luta.`,
      names: ['Saída rápida', 'Passos laterais', 'Corpo em fuga', 'Movimento calculado', 'Dança evasiva', 'Arte de escapar']
    },
    {
      metric: 'jumps', contract: 'Além do Chão', medal: 'Domínio Vertical',
      contracts: [5, 12, 25, 45, 75, 120], medals: [15, 75, 225, 600, 1400, 3000],
      goal: n => `Realize ${n} saltos durante o combate.`,
      names: ['Primeiros voos', 'Impulso ascendente', 'Passagem pelo céu', 'Ritmo vertical', 'Vento sob os pés', 'Horizonte elevado']
    },
    {
      metric: 'airHits', contract: 'Ataque nas Alturas', medal: 'Predador Aéreo',
      contracts: [2, 5, 10, 18, 30, 50], medals: [5, 25, 75, 180, 400, 850],
      goal: n => `Acerte ${n} golpes com dano enquanto estiver no ar.`,
      names: ['Contato celeste', 'Ataque em suspensão', 'Pressão do alto', 'Caçada aérea', 'Ofensiva das nuvens', 'Soberania dos céus']
    },
    {
      metric: 'combo', contract: 'Sequência Perfeita', medal: 'Mestre das Sequências',
      contracts: [3, 4, 5, 7, 9, 12], medals: [3, 5, 7, 10, 13, 16],
      goal: n => `Faça um combo de pelo menos ${n} acertos em uma única sequência.`,
      names: ['Três batidas', 'Quatro em ritmo', 'Cadência ofensiva', 'Sete elos', 'Corrente extensa', 'Doze sem quebrar']
    },
    {
      metric: 'flawless', contract: 'Vitória Imaculada', medal: 'Luta Sem Marcas',
      contracts: [1, 2, 3, 4, 6, 8], medals: [1, 3, 8, 20, 45, 90],
      goal: n => `Vença ${n} ${n === 1 ? 'partida' : 'partidas'} sem receber dano em nenhum round.`,
      names: ['Guarda perfeita', 'Dupla impecável', 'Três lutas limpas', 'Quatro sem marcas', 'Precisão imaculada', 'Oito obras perfeitas']
    },
    {
      metric: 'comebacks', contract: 'A Última Virada', medal: 'Renascido do Ringue',
      contracts: [1, 2, 3, 4, 6, 8], medals: [1, 3, 10, 25, 60, 120],
      goal: n => `Vença ${n} ${n === 1 ? 'partida' : 'partidas'} após cair a 25% de vida ou menos e ficar em desvantagem de vida.`,
      names: ['Contra o destino', 'Duas reviravoltas', 'Três retornos', 'Ainda de pé', 'Seis últimas chances', 'Oito vidas no ringue']
    },
    {
      metric: 'stages', contract: 'Mapa do Combate', medal: 'Explorador de Arenas',
      contracts: [1, 2, 3, 5, 7, 10], medals: [1, 2, 4, 6, 8, 10],
      goal: n => `Conclua lutas em ${n} ${n === 1 ? 'arena' : 'arenas diferentes'}.`,
      names: ['Ponto de partida', 'Duas fronteiras', 'Rota de três arenas', 'Meio mundo de duelos', 'Sete destinos', 'Atlas completo']
    },
    {
      metric: 'characters', contract: 'Muitas Maneiras de Lutar', medal: 'Conhecedor do Elenco',
      contracts: [1, 2, 3, 5, 7, 10], medals: [1, 3, 6, 10, 15, 20],
      goal: n => `Conclua lutas usando ${n} ${n === 1 ? 'personagem' : 'personagens diferentes'}. Só contam personagens disponíveis na sua conta.`,
      names: ['Assinatura pessoal', 'Segunda perspectiva', 'Três estilos', 'Elenco versátil', 'Sete identidades', 'Dez formas de vencer']
    },
    {
      metric: 'seconds', contract: 'Tempo de Arena', medal: 'Veterano do Ringue',
      contracts: [60, 180, 360, 600, 900, 1500], medals: [300, 1800, 5400, 14400, 36000, 72000],
      goal: n => `Acumule ${number(n / 60)} ${n === 60 ? 'minuto' : 'minutos'} de combate ativo em partidas concluídas.`,
      names: ['Um minuto em ação', 'Foco de três minutos', 'Fôlego constante', 'Dez minutos de arena', 'Resistência em combate', 'Turno do veterano']
    },
    {
      metric: 'rounds', contract: 'Sino Após Sino', medal: 'Ritmo dos Rounds',
      contracts: [2, 5, 10, 18, 30, 50], medals: [5, 25, 75, 180, 400, 900],
      goal: n => `Conclua ${n} rounds em partidas finalizadas.`,
      names: ['Dois sinos', 'Cinco etapas', 'Dez reinícios', 'Ritmo duradouro', 'Trinta disputas', 'Cinquenta histórias']
    }
  ];

  const titleThemes = [
    ['matches', '#9be5ff', [3, 20, 75, 200], ['Recém-chegado ao Ringue', 'Presença Confirmada', 'Veterano das Arenas', 'Parte da História']],
    ['wins', '#ffdc7b', [3, 15, 60, 150], ['Em Busca da Coroa', 'Voz da Vitória', 'Dono do Pódio', 'Coroa Entre Coroas']],
    ['losses', '#b8c6df', [2, 10, 35, 90], ['Aprendiz da Queda', 'Sempre Retorno', 'Nada Me Derruba', 'Vontade Inquebrável']],
    ['damage', '#ff9a82', [2000, 15000, 70000, 180000], ['Primeira Fissura', 'Quebra-Muralhas', 'Força Sísmica', 'Impacto Lendário']],
    ['hits', '#ffbd83', [40, 200, 900, 2500], ['Olho no Alvo', 'Mira de Aço', 'Precisão Cirúrgica', 'Cada Golpe Conta']],
    ['punches', '#f4c895', [20, 100, 500, 1400], ['Punhos Despertos', 'Mãos de Ferro', 'Punho Inabalável', 'Lenda dos Punhos']],
    ['kicks', '#f4afc5', [20, 100, 500, 1400], ['Passo de Impacto', 'Giro de Aço', 'Alcance Absoluto', 'Lenda dos Chutes']],
    ['powers', '#ba9cff', [15, 80, 350, 1000], ['Centelha Interior', 'Condutor Arcano', 'Núcleo Vivo', 'Vontade do Poder']],
    ['supers', '#ef9bff', [3, 20, 90, 220], ['Instante Supremo', 'Barra em Chamas', 'Clímax da Batalha', 'Além do Limite']],
    ['blocks', '#8bc5ff', [15, 80, 350, 1000], ['Guarda Atenta', 'Escudo do Ringue', 'Fortaleza Andante', 'Muralha Eterna']],
    ['dodges', '#9cdbc9', [20, 100, 500, 1200], ['Passo Leve', 'Vulto em Movimento', 'Dança Entre Golpes', 'Sombra Sem Rastro']],
    ['jumps', '#a9eaff', [30, 150, 700, 2000], ['Pés nas Nuvens', 'Vento Ascendente', 'Caminhante do Céu', 'Acima do Horizonte']],
    ['airHits', '#d1c4ff', [10, 50, 220, 600], ['Asa de Combate', 'Caçador das Nuvens', 'Águia da Arena', 'Soberano Celeste']],
    ['combo', '#ffd286', [4, 7, 11, 16], ['Quatro em Harmonia', 'Sete Eloquentes Golpes', 'Onze Sem Interrupção', 'Sinfonia de Dezesseis']],
    ['flawless', '#c8fff3', [1, 5, 25, 65], ['Sem Arranhões', 'Precisão Impecável', 'Vitória Cristalina', 'Intocado Pela Batalha']],
    ['comebacks', '#ffba97', [1, 7, 30, 85], ['Última Centelha', 'Nunca É o Fim', 'Fênix do Ringue', 'Renascido da Derrota']],
    ['stages', '#afd99d', [2, 4, 7, 10], ['Viajante de Arenas', 'Cartógrafo do Duelo', 'Peregrino de Sete Mundos', 'Todos os Horizontes']],
    ['characters', '#dcc4ef', [2, 5, 10, 20], ['Duas Faces do Combate', 'Cinco Estilos', 'Versatilidade Absoluta', 'Mestre de Vinte Vozes']],
    ['seconds', '#d5c8a8', [600, 3600, 18000, 54000], ['Dez Minutos de Fogo', 'Uma Hora de Arena', 'Resistência de Cinco Horas', 'Quinze Horas de História']],
    ['rounds', '#abd1e9', [10, 50, 220, 650], ['Ao Toque do Sino', 'Cinquenta Recomeços', 'Ritmo Incansável', 'O Sino Me Conhece']]
  ];

  function number(value) { return value.toLocaleString('pt-BR'); }
  function id(prefix, index) { return prefix + String(index + 1).padStart(3, '0'); }
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const nested of Object.values(value)) freeze(nested);
      Object.freeze(value);
    }
    return value;
  }

  for (const metric of Object.values(metricDefinitions)) {
    metric.contractProgress = metric.aggregation === 'max' ? 'peakSinceActivation' : metric.aggregation === 'unique' ? 'uniqueSinceActivation' : 'delta';
  }

  const contracts = [], medals = [], titles = [];
  for (const family of families) {
    family.contracts.forEach((target, tier) => {
      contracts.push({
        id: id('c', contracts.length), category: 'contract', tier: tier + 1,
        name: `${family.contract} ${roman[tier]} · ${family.names[tier]}`,
        description: `${family.goal(target)} Progresso contado após ativar este contrato; somente partidas locais contra a CPU concluídas.`,
        metric: family.metric, target,
        reward: { gold: Math.round(goldByTier[tier] * (family.rewardScale || 1)), xp: Math.round(xpByTier[tier] * (family.rewardScale || 1)) }
      });
    });
    family.medals.forEach((target, tier) => {
      medals.push({
        id: id('m', medals.length), category: 'medal', tier: tier + 1,
        name: `${family.medal} · ${medalRanks[tier]}`,
        description: `${family.goal(target)} Meta vitalícia ${roman[tier]} de VI; somente partidas locais contra a CPU concluídas.`,
        metric: family.metric, target, reward: { xp: medalXpByTier[tier] }
      });
    });
  }

  for (const [metric, color, targets, names] of titleThemes) {
    const family = families.find(item => item.metric === metric);
    targets.forEach((target, tier) => {
      titles.push({
        id: id('t', titles.length), category: 'title', name: names[tier], color,
        description: `Título cosmético ${roman[tier]} de IV do tema ${metricDefinitions[metric].name.toLowerCase()}. ${family.goal(target)} Conta o histórico de partidas locais contra a CPU concluídas. Não altera atributos de combate.`,
        requirement: { metric, target }
      });
    });
  }

  window.NiakV32Catalog = freeze({ version: '32.0.0', contracts, medals, titles, metricDefinitions });
})();
