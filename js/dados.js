// Camada de dados da Doces & Companhia.
// Versão 1: os dados ficam no localStorage do navegador.
// Para passar para o Firebase, só este ficheiro tem de mudar.

const CHAVE_PRODUTOS = 'dc.produtos';

// Catálogo inicial. A empresa é fictícia, por isso os produtos e os preços também.
const PRODUTOS_INICIAIS = [
  {
    id: 'aniversario',
    nome: 'Bolo de aniversário',
    descricao: 'Pão de ló com recheio de natas e decoração à escolha. Diga-nos o nome e a idade.',
    preco: 32,
    custo: 12.5,
    disponivel: true,
    etiqueta: 'Mais pedido',
    foto: 'img/aniversario.webp',
    ingredientes: [
      { nome: 'Farinha', quantidade: 0.4, unidade: 'kg' },
      { nome: 'Ovos', quantidade: 8, unidade: 'un' },
      { nome: 'Açúcar', quantidade: 0.35, unidade: 'kg' },
      { nome: 'Natas', quantidade: 0.5, unidade: 'L' },
    ],
  },
  {
    id: 'chocolate',
    nome: 'Bolo de chocolate',
    descricao: 'Húmido, com cobertura de ganache de chocolate negro.',
    preco: 22,
    custo: 8,
    disponivel: true,
    foto: 'img/chocolate.webp',
    ingredientes: [
      { nome: 'Farinha', quantidade: 0.3, unidade: 'kg' },
      { nome: 'Ovos', quantidade: 6, unidade: 'un' },
      { nome: 'Açúcar', quantidade: 0.3, unidade: 'kg' },
      { nome: 'Chocolate negro', quantidade: 0.25, unidade: 'kg' },
    ],
  },
  {
    id: 'frutos-vermelhos',
    nome: 'Bolo de frutos vermelhos',
    descricao: 'Bolo de baunilha com framboesas, amoras e morangos frescos.',
    preco: 24,
    custo: 9.5,
    disponivel: true,
    foto: 'img/frutos-vermelhos.webp',
    ingredientes: [
      { nome: 'Farinha', quantidade: 0.3, unidade: 'kg' },
      { nome: 'Ovos', quantidade: 5, unidade: 'un' },
      { nome: 'Açúcar', quantidade: 0.25, unidade: 'kg' },
      { nome: 'Frutos vermelhos', quantidade: 0.4, unidade: 'kg' },
    ],
  },
  {
    id: 'morango-natas',
    nome: 'Bolo de morango e natas',
    descricao: 'Duas camadas de pão de ló, natas batidas e morangos.',
    preco: 20,
    custo: 7.5,
    disponivel: true,
    foto: 'img/morango-natas.webp',
    ingredientes: [
      { nome: 'Farinha', quantidade: 0.25, unidade: 'kg' },
      { nome: 'Ovos', quantidade: 6, unidade: 'un' },
      { nome: 'Natas', quantidade: 0.4, unidade: 'L' },
      { nome: 'Morangos', quantidade: 0.3, unidade: 'kg' },
    ],
  },
  {
    id: 'torta-morango',
    nome: 'Torta de morango',
    descricao: 'Torta enrolada com creme de natas e pedaços de morango.',
    preco: 15,
    custo: 5.5,
    disponivel: false,
    foto: 'img/torta-morango.webp',
    ingredientes: [
      { nome: 'Ovos', quantidade: 6, unidade: 'un' },
      { nome: 'Açúcar', quantidade: 0.2, unidade: 'kg' },
      { nome: 'Natas', quantidade: 0.3, unidade: 'L' },
      { nome: 'Morangos', quantidade: 0.25, unidade: 'kg' },
    ],
  },
  {
    id: 'pasteis-nata',
    nome: 'Pastéis de nata (caixa de 6)',
    descricao: 'Massa folhada estaladiça e creme de ovos, saídos do forno.',
    preco: 7.5,
    custo: 2.4,
    disponivel: true,
    foto: 'img/pasteis-nata.webp',
    ingredientes: [
      { nome: 'Massa folhada', quantidade: 0.3, unidade: 'kg' },
      { nome: 'Gemas', quantidade: 6, unidade: 'un' },
      { nome: 'Leite', quantidade: 0.4, unidade: 'L' },
      { nome: 'Açúcar', quantidade: 0.15, unidade: 'kg' },
    ],
  },
];

const CHAVE_ENCOMENDAS = 'dc.encomendas';

// Estados do Guião: pendente → em produção → concluída → entregue / não entregue.
const ESTADOS = {
  pendente: 'Pendente',
  'em-producao': 'Em produção',
  concluida: 'Concluída',
  entregue: 'Entregue',
  'nao-entregue': 'Não entregue',
};

const MOMENTOS_PAGAMENTO = {
  antecipado: 'Antecipadamente',
  entrega: 'Na entrega',
  'no-ato': 'No ato',
};

const METODOS_PAGAMENTO = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  mbway: 'MB WAY',
  transferencia: 'Transferência',
};

function lerDados(chave, valorInicial) {
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

function listarProdutos() {
  return lerDados(CHAVE_PRODUTOS, PRODUTOS_INICIAIS);
}

function obterProduto(id) {
  return listarProdutos().find((produto) => produto.id === id) ?? null;
}

function listarEncomendas() {
  return lerDados(CHAVE_ENCOMENDAS, []);
}

// dados: canal, registadaPor, cliente, linhas, pedidoEspecial, entrega, pagamento.
function criarEncomenda(dados) {
  const encomendas = listarEncomendas();
  const agora = new Date().toISOString();
  const encomenda = {
    numero: encomendas.reduce((maior, e) => Math.max(maior, e.numero), 1000) + 1,
    criadaEm: agora,
    canal: dados.canal,
    cliente: dados.cliente,
    linhas: dados.linhas,
    pedidoEspecial: dados.pedidoEspecial,
    entrega: dados.entrega,
    pagamento: { ...dados.pagamento, pago: false },
    estado: 'pendente',
    historico: [{ estado: 'pendente', em: agora, por: dados.registadaPor }],
  };

  encomendas.push(encomenda);
  gravarDados(CHAVE_ENCOMENDAS, encomendas);
  return encomenda;
}

// O cliente só vê a encomenda se souber o número e o telemóvel.
function procurarEncomenda(numero, telefone) {
  const procurado = normalizarTelefone(telefone);
  return listarEncomendas().find((e) =>
    e.numero === Number(numero) && normalizarTelefone(e.cliente.telefone) === procurado,
  ) ?? null;
}

function totalEncomenda(encomenda) {
  return encomenda.linhas.reduce((soma, linha) => soma + linha.preco * linha.quantidade, 0);
}

// "+351 912 345 678" e "912345678" são o mesmo número.
function normalizarTelefone(telefone) {
  return telefone.replace(/\D/g, '').replace(/^351(?=\d{9}$)/, '');
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
}
