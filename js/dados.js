// Camada de dados da Doces & Companhia.
// Versão 1: os dados ficam no localStorage do navegador.
// Para passar para o Firebase, só este ficheiro tem de mudar:
// as páginas nunca mexem no localStorage, usam as funções daqui.

/* ---------- Regras do negócio (vêm das entrevistas) ---------- */

const CATEGORIAS = {
  bolos: 'Bolos',
  bolachas: 'Bolachas',
  pastelaria: 'Pastelaria',
};

// Percurso de uma encomenda: pendente → em produção → pronta → entregue.
// Se a entrega falhar, fica no armazém (o cliente levanta) ou é remarcada.
const ESTADOS = {
  pendente: 'Pendente',
  'em-producao': 'Em produção',
  pronta: 'Pronta',
  entregue: 'Entregue',
  'no-armazem': 'Não entregue · no armazém',
  remarcada: 'Não entregue · remarcada',
};

// Quem pode pôr cada estado, e a partir de quais.
const TRANSICOES = {
  'em-producao': { papel: 'producao', de: ['pendente'] },
  pronta: { papel: 'producao', de: ['em-producao'] },
  entregue: { papel: 'entregador', de: ['pronta', 'remarcada', 'no-armazem'] },
  'no-armazem': { papel: 'entregador', de: ['pronta', 'remarcada'] },
  remarcada: { papel: 'entregador', de: ['pronta', 'remarcada'] },
};

// Estados em que a encomenda ainda vai ser levada ao cliente.
const ESTADOS_POR_ENTREGAR = ['pendente', 'em-producao', 'pronta', 'remarcada'];

const PAPEIS = {
  balcao: 'Balcão',
  producao: 'Produção',
  entregador: 'Entregador',
  gerente: 'Gerente',
};

// O pagamento é sempre no momento: no site só MB WAY, na loja também dinheiro.
const METODOS_PAGAMENTO = {
  mbway: 'MB WAY',
  dinheiro: 'Dinheiro',
};

// Filipe: "Não faço mais de 10 encomendas por dia [...] tentamos não ultrapassar os 10 kg."
const MAX_ENCOMENDAS_DIA = 10;
const MAX_KG_DIA = 10;

// Entregas de segunda a sábado, a partir do dia seguinte ao da encomenda.
const HORAS_ENTREGA = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

// Filipe: "As encomendas são processadas apenas na região de Lisboa."
const CONCELHOS = [
  'Lisboa',
  'Amadora',
  'Cascais',
  'Loures',
  'Mafra',
  'Odivelas',
  'Oeiras',
  'Sintra',
  'Vila Franca de Xira',
];

// Michael: a encomenda que não foi entregue espera 3 dias no armazém.
const DIAS_ARMAZEM = 3;

// António: quer um aviso por SMS "com um ou dois dias de antecedência".
const DIAS_LEMBRETE = 2;

const MOTIVOS_DIA = {
  passado: 'As entregas marcam-se a partir de amanhã.',
  domingo: 'Não fazemos entregas ao domingo.',
  cheio: 'Este dia já está cheio.',
  peso: 'Neste dia já não cabe uma encomenda com este peso.',
};

/* ---------- Catálogo inicial ---------- */

// A empresa é fictícia, por isso os produtos, os preços e os custos também.
// peso: quilos por unidade (conta para o limite diário).
// porEncomenda: pode ser encomendado no site. naLoja: vende-se pronto ao balcão.
const PRODUTOS_INICIAIS = [
  {
    id: 'aniversario',
    nome: 'Bolo de aniversário',
    categoria: 'bolos',
    descricao: 'Pão de ló com recheio de natas e decoração à escolha. Diga-nos o nome e a idade.',
    preco: 32,
    custo: 12.5,
    peso: 1.5,
    porEncomenda: true,
    naLoja: false,
    personalizavel: true,
    etiqueta: 'Mais pedido',
    foto: 'img/aniversario.webp',
    ativo: true,
  },
  {
    id: 'chocolate',
    nome: 'Bolo de chocolate',
    categoria: 'bolos',
    descricao: 'Húmido, com cobertura de ganache de chocolate negro.',
    preco: 22,
    custo: 8,
    peso: 1.2,
    porEncomenda: true,
    naLoja: false,
    personalizavel: true,
    foto: 'img/chocolate.webp',
    ativo: true,
  },
  {
    id: 'frutos-vermelhos',
    nome: 'Bolo de frutos vermelhos',
    categoria: 'bolos',
    descricao: 'Bolo de baunilha com framboesas, amoras e morangos frescos.',
    preco: 24,
    custo: 9.5,
    peso: 1.3,
    porEncomenda: true,
    naLoja: false,
    personalizavel: true,
    foto: 'img/frutos-vermelhos.webp',
    ativo: true,
  },
  {
    id: 'morango-natas',
    nome: 'Bolo de morango e natas',
    categoria: 'bolos',
    descricao: 'Duas camadas de pão de ló, natas batidas e morangos.',
    preco: 20,
    custo: 7.5,
    peso: 1.2,
    porEncomenda: true,
    naLoja: false,
    personalizavel: true,
    foto: 'img/morango-natas.webp',
    ativo: true,
  },
  {
    id: 'torta-morango',
    nome: 'Torta de morango',
    categoria: 'bolos',
    descricao: 'Torta enrolada com creme de natas e pedaços de morango.',
    preco: 15,
    custo: 5.5,
    peso: 0.8,
    porEncomenda: true,
    naLoja: true,
    personalizavel: false,
    foto: 'img/torta-morango.webp',
    ativo: true,
  },
  {
    id: 'pasteis-nata',
    nome: 'Pastéis de nata (caixa de 6)',
    categoria: 'pastelaria',
    descricao: 'Massa folhada estaladiça e creme de ovos, saídos do forno.',
    preco: 7.5,
    custo: 2.4,
    peso: 0.4,
    porEncomenda: true,
    naLoja: true,
    personalizavel: false,
    foto: 'img/pasteis-nata.webp',
    ativo: true,
  },
  {
    id: 'croissant',
    nome: 'Croissant de manteiga',
    categoria: 'pastelaria',
    descricao: 'Folhado e dourado, feito todas as manhãs.',
    preco: 1.6,
    custo: 0.55,
    peso: 0.08,
    porEncomenda: false,
    naLoja: true,
    personalizavel: false,
    foto: 'img/croissant.webp',
    ativo: true,
  },
  {
    id: 'queque',
    nome: 'Queque de mirtilo',
    categoria: 'pastelaria',
    descricao: 'Fofo, com mirtilos inteiros e cobertura estaladiça.',
    preco: 1.9,
    custo: 0.6,
    peso: 0.1,
    porEncomenda: false,
    naLoja: true,
    personalizavel: false,
    foto: 'img/queque.webp',
    ativo: true,
  },
  {
    id: 'macarons',
    nome: 'Macarons (caixa de 6)',
    categoria: 'pastelaria',
    descricao: 'Sabores variados: framboesa, limão, baunilha e caramelo.',
    preco: 9,
    custo: 3.2,
    peso: 0.15,
    porEncomenda: true,
    naLoja: true,
    personalizavel: false,
    etiqueta: 'Novo',
    foto: 'img/macarons.webp',
    ativo: true,
  },
  {
    id: 'bolachas-manteiga',
    nome: 'Bolachas de manteiga (250 g)',
    categoria: 'bolachas',
    descricao: 'Receita clássica: estaladiças e a saber a manteiga.',
    preco: 6.5,
    custo: 2.2,
    peso: 0.25,
    porEncomenda: true,
    naLoja: true,
    personalizavel: false,
    foto: 'img/bolachas-manteiga.webp',
    ativo: true,
  },
  {
    id: 'bolachas-chocolate',
    nome: 'Bolachas com pepitas de chocolate (250 g)',
    categoria: 'bolachas',
    descricao: 'Macias por dentro, com pedaços de chocolate negro.',
    preco: 7,
    custo: 2.6,
    peso: 0.25,
    porEncomenda: true,
    naLoja: true,
    personalizavel: false,
    foto: 'img/bolachas-chocolate.webp',
    ativo: true,
  },
  {
    id: 'bolachas-gengibre',
    nome: 'Bolachas de gengibre (250 g)',
    categoria: 'bolachas',
    descricao: 'Com canela e gengibre, decoradas à mão.',
    preco: 6.9,
    custo: 2.4,
    peso: 0.25,
    porEncomenda: true,
    naLoja: true,
    personalizavel: false,
    foto: 'img/bolachas-gengibre.webp',
    ativo: true,
  },
];

/* ---------- Armazenamento ---------- */

// Quando o formato dos dados muda, sobe-se a versão e os dados antigos são substituídos.
const VERSAO_DADOS = '2';

const CHAVES = {
  versao: 'dc.versao',
  produtos: 'dc.produtos',
  encomendas: 'dc.encomendas',
  vendas: 'dc.vendas',
  stock: 'dc.stock',
  sms: 'dc.sms',
  sessao: 'dc.sessao',
};

let dadosPreparados = false;

// Na primeira leitura de cada página: cria os dados de demonstração (se ainda não
// existirem) e envia os lembretes por SMS que estiverem em falta.
function prepararDados() {
  if (dadosPreparados) return;
  dadosPreparados = true;
  try {
    if (localStorage.getItem(CHAVES.versao) !== VERSAO_DADOS) criarDadosDemo();
    enviarLembretes();
  } catch {
    // localStorage bloqueado (modo privado): o site mostra o catálogo, mas não guarda nada.
  }
}

function lerDados(chave, valorInicial) {
  prepararDados();
  try {
    const texto = localStorage.getItem(chave);
    if (texto !== null) return JSON.parse(texto);
  } catch {
    // localStorage bloqueado ou dados estragados: usa os dados iniciais.
  }
  return structuredClone(valorInicial);
}

// Lança um erro se o navegador não deixar gravar (por exemplo, no modo privado).
function gravarDados(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

// O gerarDadosDemo está em dados-demo.js.
function criarDadosDemo() {
  const demo = typeof gerarDadosDemo === 'function'
    ? gerarDadosDemo()
    : { encomendas: [], vendas: [], stock: {}, sms: [] };

  gravarDados(CHAVES.produtos, PRODUTOS_INICIAIS);
  gravarDados(CHAVES.encomendas, demo.encomendas);
  gravarDados(CHAVES.vendas, demo.vendas);
  gravarDados(CHAVES.stock, demo.stock);
  gravarDados(CHAVES.sms, demo.sms);
  localStorage.setItem(CHAVES.versao, VERSAO_DADOS);
}

// Gerente: apaga tudo e volta aos dados de demonstração.
function reporDadosDemo() {
  exigirSessao('gerente');
  criarDadosDemo();
  enviarLembretes();
}

// Outra aba (por exemplo, a da Produção) alterou os dados: a página pode redesenhar-se.
function aoMudarDados(reagir) {
  window.addEventListener('storage', (evento) => {
    if (evento.storageArea === localStorage && (evento.key === null || evento.key.startsWith('dc.'))) reagir();
  });
}

/* ---------- Datas e formatos ---------- */

// Data no formato AAAA-MM-DD, na hora local (o toISOString usa a hora UTC).
function dataLocal(momento = new Date()) {
  const doisDigitos = (n) => String(n).padStart(2, '0');
  return `${momento.getFullYear()}-${doisDigitos(momento.getMonth() + 1)}-${doisDigitos(momento.getDate())}`;
}

function hoje() {
  return dataLocal();
}

// somarDias('2026-11-12', 3) → '2026-11-15'
function somarDias(data, dias) {
  const dia = new Date(`${data}T12:00`);
  dia.setDate(dia.getDate() + dias);
  return dataLocal(dia);
}

// Quantos dias vão de uma data até outra (negativo se a segunda for anterior).
function diasEntre(de, ate) {
  return Math.round((new Date(`${ate}T12:00`) - new Date(`${de}T12:00`)) / 86400000);
}

// "sexta-feira, 13 de novembro"
function formatarDia(data) {
  return new Date(`${data}T12:00`).toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// "sex., 13/11"
function formatarDiaCurto(data) {
  return new Date(`${data}T12:00`).toLocaleDateString('pt-PT', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

// "sexta-feira, 13 de novembro, às 15:00"
function formatarEntrega({ data, hora }) {
  return `${formatarDia(data)}, às ${hora}`;
}

// "sex., 13/11 às 15:00"
function formatarEntregaCurta({ data, hora }) {
  return `${formatarDiaCurto(data)} às ${hora}`;
}

// Momento guardado (ISO) → "12/11, 09:14"
function formatarMomento(iso) {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Momento guardado (ISO) → "12/11/2026, 09:14" (para os recibos)
function formatarDataCompleta(iso) {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Momento guardado (ISO) → "09:14"
function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}

// "1,5 kg" ou "250 g"
function formatarPeso(kg) {
  if (kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${kg.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} kg`;
}

function formatarMorada(entrega) {
  const rua = [entrega.morada, entrega.indicacoes].filter(Boolean).join(', ');
  return `${rua}, ${entrega.codigoPostal} ${entrega.concelho}`;
}

// "+351 912 345 678" e "912345678" são o mesmo número.
function normalizarTelefone(telefone) {
  return telefone.replace(/\D/g, '').replace(/^351(?=\d{9}$)/, '');
}

// "912345678" → "912 345 678"
function formatarTelefone(telefone) {
  return normalizarTelefone(telefone).replace(/(\d{3})(?=\d)/g, '$1 ');
}

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

// Tira espaços a mais: "  Ana   Silva " → "Ana Silva"
function limparTexto(texto) {
  return String(texto ?? '').trim().replace(/\s+/g, ' ');
}

// Para procurar sem ligar a maiúsculas nem a acentos: "António" → "antonio"
function simplificarTexto(texto) {
  return limparTexto(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ---------- Sessão dos funcionários ---------- */

// Protótipo: o funcionário escolhe a função e escreve o nome, sem palavra-passe.
// A sessão fica no sessionStorage, por isso cada aba pode ter um funcionário diferente.
function iniciarSessao(papel, nome) {
  if (!(papel in PAPEIS)) throw new Error('Escolha a sua função.');
  const nomeLimpo = limparTexto(nome);
  if (nomeLimpo.length < 2) throw new Error('Escreva o seu nome.');
  sessionStorage.setItem(CHAVES.sessao, JSON.stringify({ papel, nome: nomeLimpo }));
}

// { papel, nome } ou null se ninguém entrou.
function obterSessao() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVES.sessao));
  } catch {
    return null;
  }
}

function terminarSessao() {
  sessionStorage.removeItem(CHAVES.sessao);
}

// Cada ação dos funcionários começa aqui: confirma a função e devolve quem a fez.
function exigirSessao(papel) {
  const sessao = obterSessao();
  if (sessao?.papel !== papel) throw new Error(`Esta ação é só para: ${PAPEIS[papel]}.`);
  return sessao;
}

/* ---------- Produtos ---------- */

// Todos os produtos, incluindo os que o Gerente desativou (ativo: false).
function listarProdutos() {
  return lerDados(CHAVES.produtos, PRODUTOS_INICIAIS);
}

function obterProduto(id) {
  return listarProdutos().find((produto) => produto.id === id) ?? null;
}

// Gerente: cria um produto (sem id) ou altera um que já existe.
function guardarProduto(dados) {
  exigirSessao('gerente');
  const produtos = listarProdutos();
  const antigo = produtos.find((p) => p.id === dados.id);

  const produto = {
    ...antigo,
    nome: limparTexto(dados.nome),
    categoria: dados.categoria,
    descricao: limparTexto(dados.descricao),
    preco: Number(dados.preco),
    custo: Number(dados.custo),
    peso: Number(dados.peso),
    porEncomenda: Boolean(dados.porEncomenda),
    naLoja: Boolean(dados.naLoja),
    personalizavel: Boolean(dados.personalizavel),
    foto: dados.foto,
    ativo: Boolean(dados.ativo),
  };

  if (produto.nome.length < 2) throw new Error('Escreva o nome do produto.');
  if (!(produto.categoria in CATEGORIAS)) throw new Error('Escolha a categoria.');
  if (!(produto.preco > 0)) throw new Error('O preço tem de ser maior do que zero.');
  if (!(produto.custo >= 0)) throw new Error('Escreva o custo de produção.');
  if (!(produto.peso > 0)) throw new Error('Escreva o peso em quilos.');
  if (!produto.porEncomenda && !produto.naLoja) {
    throw new Error('Escolha onde se vende: por encomenda, na loja ou nos dois.');
  }

  if (antigo) {
    produtos[produtos.indexOf(antigo)] = produto;
  } else {
    // Id a partir do nome: "Bolo de laranja" → "bolo-de-laranja" (com um número, se já existir).
    const base = simplificarTexto(produto.nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'produto';
    let id = base;
    for (let n = 2; produtos.some((p) => p.id === id); n += 1) id = `${base}-${n}`;
    produto.id = id;
    produtos.push(produto);
  }

  gravarDados(CHAVES.produtos, produtos);
  return produto;
}

// Uma linha de encomenda ou de venda guarda o nome, o preço e o custo do momento:
// se o Gerente mudar o catálogo, os relatórios antigos não mudam.
function criarLinha(produto, quantidade) {
  return {
    produtoId: produto.id,
    nome: produto.nome,
    categoria: produto.categoria,
    preco: produto.preco,
    custo: produto.custo,
    peso: produto.peso,
    quantidade,
  };
}

// Servem para encomendas e para vendas ao balcão (as duas têm "linhas").
function totalDe(registo) {
  return arredondar(registo.linhas.reduce((soma, linha) => soma + linha.preco * linha.quantidade, 0));
}

function custoDe(registo) {
  return arredondar(registo.linhas.reduce((soma, linha) => soma + linha.custo * linha.quantidade, 0));
}

function pesoDe(registo) {
  return arredondar(registo.linhas.reduce((soma, linha) => soma + linha.peso * linha.quantidade, 0));
}

/* ---------- Agenda de entregas ---------- */

// A região de Lisboa: um dos concelhos da lista e um código postal 1000–1999 ou 2600–2799.
function entregamosEm(codigoPostal, concelho) {
  if (!/^\d{4}-\d{3}$/.test(codigoPostal)) return false;
  const inicio = Number(codigoPostal.slice(0, 4));
  const naRegiao = (inicio >= 1000 && inicio <= 1999) || (inicio >= 2600 && inicio <= 2799);
  return naRegiao && CONCELHOS.includes(concelho);
}

// Encomendas e quilos já marcados em cada dia.
// "ignorar" é o número da encomenda que está a mudar de dia.
function ocupacaoPorDia(ignorar = null) {
  const dias = new Map();
  for (const encomenda of listarEncomendas()) {
    if (encomenda.numero === ignorar) continue;
    const dia = dias.get(encomenda.entrega.data) ?? { encomendas: 0, kg: 0 };
    dia.encomendas += 1;
    dia.kg = arredondar(dia.kg + pesoDe(encomenda));
    dias.set(encomenda.entrega.data, dia);
  }
  return dias;
}

// Porque é que não se pode marcar neste dia uma entrega com este peso ('' se pode).
function motivoDia(data, kg, ocupacao) {
  if (data <= hoje()) return 'passado';
  if (new Date(`${data}T12:00`).getDay() === 0) return 'domingo';
  if (ocupacao.encomendas >= MAX_ENCOMENDAS_DIA || ocupacao.kg >= MAX_KG_DIA) return 'cheio';
  if (ocupacao.kg + kg > MAX_KG_DIA + 0.001) return 'peso';
  return '';
}

// Os próximos dias, cada um com a ocupação e o motivo por que não pode ser escolhido.
// kg: peso da encomenda que se quer marcar.
function agendaDeEntregas({ kg = 0, ignorar = null, dias = 28 } = {}) {
  const ocupacao = ocupacaoPorDia(ignorar);
  return Array.from({ length: dias }, (_, i) => {
    const data = somarDias(hoje(), i + 1);
    const dia = ocupacao.get(data) ?? { encomendas: 0, kg: 0 };
    return { data, ...dia, motivo: motivoDia(data, kg, dia) };
  });
}

function validarDiaEHora(data, hora, kg, ignorar = null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data ?? '')) throw new Error('Escolha o dia da entrega.');
  if (!HORAS_ENTREGA.includes(hora)) throw new Error('Escolha a hora da entrega.');
  const ocupacao = ocupacaoPorDia(ignorar).get(data) ?? { encomendas: 0, kg: 0 };
  const motivo = motivoDia(data, kg, ocupacao);
  if (motivo) throw new Error(MOTIVOS_DIA[motivo]);
}

/* ---------- Encomendas ---------- */

function listarEncomendas() {
  return lerDados(CHAVES.encomendas, []);
}

function obterEncomenda(numero) {
  return listarEncomendas().find((e) => e.numero === Number(numero)) ?? null;
}

// O cliente só vê a encomenda se souber o número e o telemóvel.
function procurarEncomenda(numero, telefone) {
  const procurado = normalizarTelefone(telefone);
  return listarEncomendas().find((e) =>
    e.numero === Number(numero) && normalizarTelefone(e.cliente.telefone) === procurado,
  ) ?? null;
}

// Balcão e Gerente: procura pelo número, pelo nome ou pelo telemóvel do cliente.
function pesquisarEncomendas(texto) {
  const termo = simplificarTexto(texto);
  if (termo === '') return [];
  const algarismos = termo.replace(/\D/g, '');
  return listarEncomendas().filter((e) =>
    String(e.numero) === termo
    || simplificarTexto(e.cliente.nome).includes(termo)
    || (algarismos.length >= 3 && normalizarTelefone(e.cliente.telefone).includes(algarismos)),
  );
}

// Confirma as regras e devolve a encomenda arrumada (ainda sem número nem pagamento).
// A página chama-a antes de pedir o pagamento, para não cobrar uma encomenda impossível.
// dados: cliente { nome, telefone }, linhas [{ produtoId, quantidade }],
//        personalizacao { texto, velas, notas },
//        entrega { morada, indicacoes, codigoPostal, concelho, data, hora },
//        pagamento { metodo, telefone }.
function validarEncomenda(dados) {
  const nome = limparTexto(dados.cliente.nome);
  if (!nome.includes(' ')) throw new Error('Escreva o nome e o apelido.');
  if (!/^[29]\d{8}$/.test(normalizarTelefone(dados.cliente.telefone))) {
    throw new Error('O telemóvel tem de ter 9 algarismos.');
  }

  const produtos = listarProdutos();
  let personalizavel = false;
  const linhas = dados.linhas.map(({ produtoId, quantidade }) => {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto?.ativo || !produto.porEncomenda) throw new Error('Este produto não se vende por encomenda.');
    if (!Number.isInteger(quantidade) || quantidade < 1) throw new Error('Escolha a quantidade.');
    personalizavel ||= produto.personalizavel;
    return criarLinha(produto, quantidade);
  });
  if (linhas.length === 0) throw new Error('Escolha um produto.');

  const kg = pesoDe({ linhas });
  if (kg > MAX_KG_DIA) throw new Error(`Uma encomenda não pode passar dos ${MAX_KG_DIA} kg.`);

  const entrega = {
    morada: limparTexto(dados.entrega.morada),
    indicacoes: limparTexto(dados.entrega.indicacoes),
    codigoPostal: limparTexto(dados.entrega.codigoPostal),
    concelho: dados.entrega.concelho,
    data: dados.entrega.data,
    hora: dados.entrega.hora,
  };
  if (entrega.morada.length < 5) throw new Error('Escreva a rua e o número da porta.');
  if (!entregamosEm(entrega.codigoPostal, entrega.concelho)) {
    throw new Error('Só fazemos entregas na região de Lisboa.');
  }
  validarDiaEHora(entrega.data, entrega.hora, kg);

  const velas = limparTexto(dados.personalizacao?.velas);
  if (!/^\d{0,3}$/.test(velas)) throw new Error('As velas são um número, por exemplo 8 ou 30.');
  if (dados.pagamento.metodo !== 'mbway') throw new Error('No site o pagamento é por MB WAY.');

  if (!/^[29]\d{8}$/.test(normalizarTelefone(dados.pagamento.telefone))) {
    throw new Error('O telemóvel do MB WAY tem de ter 9 algarismos.');
  }

  return {
    cliente: { nome, telefone: formatarTelefone(dados.cliente.telefone) },
    linhas,
    // Só os bolos levam texto e velas; as notas servem para qualquer produto.
    personalizacao: {
      texto: personalizavel ? limparTexto(dados.personalizacao?.texto).slice(0, 40) : '',
      velas: personalizavel ? velas : '',
      notas: limparTexto(dados.personalizacao?.notas).slice(0, 200),
    },
    entrega,
  };
}

// O cliente encomenda no site e paga logo por MB WAY (o pagamento é simulado).
function criarEncomenda(dados) {
  const validada = validarEncomenda(dados);
  const encomendas = listarEncomendas();
  const agora = new Date().toISOString();
  const encomenda = {
    numero: encomendas.reduce((maior, e) => Math.max(maior, e.numero), 1000) + 1,
    criadaEm: agora,
    ...validada,
    pagamento: { metodo: 'mbway', telefone: formatarTelefone(dados.pagamento.telefone), em: agora },
    estado: 'pendente',
    historico: [{
      em: agora,
      estado: 'pendente',
      por: validada.cliente.nome,
      papel: 'cliente',
      nota: 'Encomenda feita no site e paga por MB WAY',
    }],
  };

  encomendas.push(encomenda);
  gravarDados(CHAVES.encomendas, encomendas);
  enviarLembretes();
  return encomenda;
}

// Lê a encomenda, aplica a alteração e grava, com o nome de quem a fez e a hora.
// António: "ninguém sabia quem tinha feito o erro" → agora fica sempre registado.
// "alterar" recebe a encomenda e devolve o que se junta ao registo do histórico.
function alterarEncomenda(numero, papel, alterar) {
  const sessao = exigirSessao(papel);
  const encomendas = listarEncomendas();
  const encomenda = encomendas.find((e) => e.numero === Number(numero));
  if (!encomenda) throw new Error(`A encomenda n.º ${numero} não existe.`);

  const registo = alterar(encomenda);
  encomenda.historico.push({
    em: new Date().toISOString(),
    por: sessao.nome,
    papel: sessao.papel,
    ...registo,
  });
  gravarDados(CHAVES.encomendas, encomendas);
  return encomenda;
}

function mudarEstado(numero, estado, alterar = () => ({})) {
  const regra = TRANSICOES[estado];
  return alterarEncomenda(numero, regra.papel, (encomenda) => {
    if (!regra.de.includes(encomenda.estado)) {
      throw new Error(`A encomenda n.º ${numero} está «${ESTADOS[encomenda.estado]}» e não pode passar a «${ESTADOS[estado]}».`);
    }
    const registo = alterar(encomenda);
    encomenda.estado = estado;
    return { estado, ...registo };
  });
}

// Muda o dia e a hora da entrega para um dia livre e devolve a nota para o histórico.
function mudarDataDeEntrega(encomenda, data, hora) {
  const antes = { data: encomenda.entrega.data, hora: encomenda.entrega.hora };
  if (antes.data === data && antes.hora === hora) throw new Error('Escolha um dia ou uma hora diferente.');
  validarDiaEHora(data, hora, pesoDe(encomenda), encomenda.numero);
  encomenda.entrega.data = data;
  encomenda.entrega.hora = hora;
  return `Entrega passou de ${formatarEntregaCurta(antes)} para ${formatarEntregaCurta({ data, hora })}`;
}

// Produção: pendente → em produção.
function iniciarProducao(numero) {
  return mudarEstado(numero, 'em-producao');
}

// Produção: em produção → pronta (é aqui que se imprime a etiqueta).
function concluirProducao(numero) {
  return mudarEstado(numero, 'pronta');
}

// Entregador: entregue ao cliente, ou levantada pelo cliente no armazém.
// Em vez da assinatura em papel, fica o nome de quem recebeu.
function registarEntrega(numero, recebidaPor) {
  const nome = limparTexto(recebidaPor);
  if (nome.length < 2) throw new Error('Escreva o nome de quem recebeu.');
  return mudarEstado(numero, 'entregue', (encomenda) => {
    const levantada = encomenda.estado === 'no-armazem';
    encomenda.recebidaPor = nome;
    return { nota: levantada ? `Levantada no armazém por ${nome}` : `Recebida por ${nome}` };
  });
}

// Entregador: não entregue, fica no armazém. O cliente é avisado por SMS e tem 3 dias para a levantar.
function deixarNoArmazem(numero) {
  const encomenda = mudarEstado(numero, 'no-armazem', (e) => {
    e.levantarAte = somarDias(hoje(), DIAS_ARMAZEM);
    return { nota: `O cliente pode levantar até ${formatarDia(e.levantarAte)}` };
  });
  juntarSms([smsArmazem(encomenda, new Date().toISOString())]);
  return encomenda;
}

// Entregador: não entregue, o cliente combinou outro dia (só dias livres).
function remarcarEntrega(numero, data, hora) {
  const encomenda = mudarEstado(numero, 'remarcada', (e) => ({ nota: mudarDataDeEntrega(e, data, hora) }));
  enviarLembretes();
  return encomenda;
}

// Balcão: o cliente pediu para mudar o dia. O estado não muda, mas fica no histórico.
function alterarDataEntrega(numero, data, hora) {
  const encomenda = alterarEncomenda(numero, 'balcao', (e) => {
    if (!ESTADOS_POR_ENTREGAR.includes(e.estado)) {
      throw new Error(`A encomenda n.º ${numero} está «${ESTADOS[e.estado]}» e já não pode mudar de dia.`);
    }
    return { nota: mudarDataDeEntrega(e, data, hora) };
  });
  enviarLembretes();
  return encomenda;
}

// No armazém há mais de 3 dias sem ser levantada.
function prazoTerminado(encomenda) {
  return encomenda.estado === 'no-armazem' && encomenda.levantarAte < hoje();
}

/* ---------- Produtos do dia e vendas ao balcão ---------- */

function listarVendas() {
  return lerDados(CHAVES.vendas, []);
}

// O stock de um dia: o que o Gerente mandou fazer, o que já se vendeu e o que resta.
// Devolve [{ produto, quantidade, vendido, restante }].
function produtosDoDia(data = hoje()) {
  const quantidades = lerDados(CHAVES.stock, {})[data] ?? {};
  const vendidos = {};
  for (const venda of listarVendas()) {
    if (dataLocal(new Date(venda.em)) !== data) continue;
    for (const linha of venda.linhas) {
      vendidos[linha.produtoId] = (vendidos[linha.produtoId] ?? 0) + linha.quantidade;
    }
  }

  return listarProdutos()
    .filter((produto) => produto.id in quantidades)
    .map((produto) => {
      const quantidade = quantidades[produto.id];
      const vendido = vendidos[produto.id] ?? 0;
      return { produto, quantidade, vendido, restante: quantidade - vendido };
    });
}

// Gerente: define os produtos de hoje. quantidades = { idDoProduto: unidades feitas }.
// Um produto com 0 sai da lista do dia.
function definirProdutosDoDia(quantidades) {
  exigirSessao('gerente');
  const produtos = listarProdutos();
  const vendidos = Object.fromEntries(produtosDoDia().map((p) => [p.produto.id, p.vendido]));
  const doDia = {};

  for (const [id, valor] of Object.entries(quantidades)) {
    const produto = produtos.find((p) => p.id === id);
    const quantidade = Number(valor);
    if (!produto?.naLoja) throw new Error('Este produto não se vende na loja.');
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      throw new Error(`Escreva quantas unidades há de ${produto.nome}.`);
    }
    if (quantidade < (vendidos[id] ?? 0)) {
      throw new Error(`Já se venderam ${vendidos[id]} × ${produto.nome}: a quantidade não pode ser menor.`);
    }
    if (quantidade > 0) doDia[id] = quantidade;
  }

  const stock = lerDados(CHAVES.stock, {});
  stock[hoje()] = doDia;
  gravarDados(CHAVES.stock, stock);
}

// Balcão: venda de produtos prontos. O stock desce sozinho, porque se calcula a partir das vendas.
// dados: linhas [{ produtoId, quantidade }], metodo ('dinheiro' ou 'mbway'), cliente (nome, opcional).
function registarVenda(dados) {
  const sessao = exigirSessao('balcao');
  if (!(dados.metodo in METODOS_PAGAMENTO)) throw new Error('Escolha como o cliente paga.');
  if (dados.linhas.length === 0) throw new Error('Junte pelo menos um produto à venda.');

  const stock = produtosDoDia();
  const linhas = dados.linhas.map(({ produtoId, quantidade }) => {
    const doDia = stock.find((s) => s.produto.id === produtoId);
    if (!doDia) throw new Error('Este produto não está nos produtos do dia.');
    if (!Number.isInteger(quantidade) || quantidade < 1) throw new Error('Escolha a quantidade.');
    if (quantidade > doDia.restante) {
      throw new Error(doDia.restante === 0
        ? `${doDia.produto.nome}: esgotado.`
        : `${doDia.produto.nome}: só restam ${doDia.restante}.`);
    }
    return criarLinha(doDia.produto, quantidade);
  });

  const vendas = listarVendas();
  const venda = {
    numero: vendas.reduce((maior, v) => Math.max(maior, v.numero), 0) + 1,
    em: new Date().toISOString(),
    por: sessao.nome,
    cliente: limparTexto(dados.cliente),
    metodo: dados.metodo,
    linhas,
  };
  vendas.push(venda);
  gravarDados(CHAVES.vendas, vendas);
  return venda;
}

/* ---------- SMS (simulados) ---------- */

// Não se enviam SMS a sério: ficam neste registo, que o Gerente pode consultar.
function listarSms() {
  return lerDados(CHAVES.sms, []);
}

function juntarSms(novos) {
  if (novos.length === 0) return;
  gravarDados(CHAVES.sms, [...listarSms(), ...novos]);
}

function smsLembrete(encomenda, em) {
  return {
    em,
    telefone: encomenda.cliente.telefone,
    encomenda: encomenda.numero,
    tipo: 'lembrete',
    dataEntrega: encomenda.entrega.data,
    texto: `Doces & Companhia: a sua encomenda n.º ${encomenda.numero} tem entrega marcada para ${formatarEntrega(encomenda.entrega)}.`,
  };
}

function smsArmazem(encomenda, em) {
  return {
    em,
    telefone: encomenda.cliente.telefone,
    encomenda: encomenda.numero,
    tipo: 'armazem',
    texto: `Doces & Companhia: não conseguimos entregar a encomenda n.º ${encomenda.numero}. Fica à sua espera no nosso armazém até ${formatarDia(encomenda.levantarAte)}.`,
  };
}

// Lembrete quando faltam 2 dias (ou 1, se a encomenda foi feita mais tarde).
// Como não há servidor, isto corre sempre que alguém abre o site.
function enviarLembretes() {
  const enviados = new Set(listarSms()
    .filter((sms) => sms.tipo === 'lembrete')
    .map((sms) => `${sms.encomenda}|${sms.dataEntrega}`));
  const agora = new Date().toISOString();

  juntarSms(listarEncomendas()
    .filter((e) => {
      const faltam = diasEntre(hoje(), e.entrega.data);
      return ESTADOS_POR_ENTREGAR.includes(e.estado)
        && faltam >= 1 && faltam <= DIAS_LEMBRETE
        && !enviados.has(`${e.numero}|${e.entrega.data}`);
    })
    .map((e) => smsLembrete(e, agora)));
}
