// Página do Gerente (Cassie): relatórios do mês com gráficos, o resumo de cada dia,
// os produtos de hoje e o catálogo, todas as encomendas com o histórico e os SMS.

protegerPagina('gerente');

document.querySelector('#hoje').textContent = formatarDia(hoje());
ligarSeparadores(document.querySelector('.separadores'));

/* ---------- Relatórios do mês ---------- */

// As cores vêm do style.css (--grafico-1 e --grafico-2), validadas para daltonismo e contraste.
const CANAIS = [
  { nome: 'Encomendas', cor: 'var(--grafico-1)' },
  { nome: 'Loja', cor: 'var(--grafico-2)' },
];

const seletorMes = document.querySelector('#mes');
const eurosNoEixo = (valor) => `${valor.toLocaleString('pt-PT')} €`;
const unidades = (valor) => `${valor} un.`;

// '2026-11' → 'novembro de 2026'
function nomeDoMes(mes) {
  return new Date(`${mes}-15T12:00`).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
}

function preencherMeses() {
  const escolhido = seletorMes.value;
  const meses = mesesComVendas();
  seletorMes.replaceChildren(...meses.map((mes) => new Option(nomeDoMes(mes), mes)));
  seletorMes.value = meses.includes(escolhido) ? escolhido : meses[0];
}

function indicador(rotulo, valor, detalhe, principal = false) {
  return criarElemento('div', { className: `indicador${principal ? ' indicador--principal' : ''}` },
    criarElemento('p', { className: 'indicador__rotulo', textContent: rotulo }),
    criarElemento('p', { className: 'indicador__valor', textContent: valor }),
    criarElemento('p', { className: 'indicador__detalhe', textContent: detalhe }),
  );
}

function desenharRelatorio() {
  const mes = seletorMes.value;
  const relatorio = relatorioDoMes(mes);
  const vazio = relatorio.encomendas + relatorio.vendas === 0;
  document.querySelector('#sem-vendas').hidden = !vazio;
  document.querySelector('#indicadores').hidden = vazio;
  document.querySelector('.graficos').hidden = vazio;
  if (vazio) return;

  // Os números principais.
  const parteDosCustos = Math.round((relatorio.custo / relatorio.receita) * 100);
  document.querySelector('#indicadores').replaceChildren(
    indicador('Rendimento líquido', formatarPreco(relatorio.liquido), 'Receita menos custos de produção', true),
    indicador('Receita', formatarPreco(relatorio.receita), `${relatorio.encomendas} encomendas e ${relatorio.vendas} vendas na loja`),
    indicador('Custos de produção', formatarPreco(relatorio.custo), `${parteDosCustos}% da receita`),
  );

  // Vendas por categoria: duas séries (encomendas e loja) em cada barra.
  const categorias = Object.entries(relatorio.categorias)
    .map(([id, valores]) => ({ nome: CATEGORIAS[id], valores: [valores.encomendas, valores.loja] }))
    .sort((a, b) => somar(b.valores) - somar(a.valores));
  document.querySelector('#legenda-categorias').replaceChildren(criarLegenda(CANAIS));
  desenharBarras(document.querySelector('#grafico-categorias'), { series: CANAIS, linhas: categorias, formatar: formatarPreco });
  document.querySelector('#tabela-categorias').replaceChildren(criarTabela(
    ['Categoria', 'Encomendas', 'Loja', 'Total'],
    categorias.map((c) => [c.nome, ...c.valores.map(formatarPreco), formatarPreco(somar(c.valores))]),
  ));

  // Produtos mais vendidos: uma só série, uma só cor.
  const produtos = Object.values(relatorio.produtos).sort((a, b) => b.unidades - a.unidades || b.receita - a.receita);
  desenharBarras(document.querySelector('#grafico-produtos'), {
    series: [{ nome: 'Unidades vendidas', cor: 'var(--grafico-1)' }],
    linhas: produtos.map((p) => ({ nome: p.nome, valores: [p.unidades] })),
    formatar: unidades,
  });
  document.querySelector('#tabela-produtos').replaceChildren(criarTabela(
    ['Produto', 'Unidades', 'Receita'],
    produtos.map((p) => [p.nome, String(p.unidades), formatarPreco(p.receita)]),
  ));

  // Rendimento líquido de cada dia do mês.
  const [ano, numeroDoMes] = mes.split('-').map(Number);
  const dias = Array.from({ length: new Date(ano, numeroDoMes, 0).getDate() },
    (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);
  const semVendas = { receita: 0, custo: 0, liquido: 0 };
  desenharColunas(document.querySelector('#grafico-liquido'), {
    cor: 'var(--grafico-1)',
    formatarEixo: eurosNoEixo,
    pontos: dias.map((data) => {
      const dia = relatorio.dias[data] ?? semVendas;
      const numero = Number(data.slice(8));
      return {
        valor: dia.liquido,
        rotulo: numero === 1 || numero % 5 === 0 ? String(numero) : '',
        descricao: `${formatarDia(data)}: rendimento líquido ${formatarPreco(dia.liquido)}`,
        dica: {
          titulo: formatarDia(data),
          linhas: [
            { cor: 'var(--grafico-1)', valor: formatarPreco(dia.liquido), nome: 'Rendimento líquido' },
            { valor: formatarPreco(dia.receita), nome: 'Receita' },
            { valor: formatarPreco(dia.custo), nome: 'Custos' },
          ],
        },
      };
    }),
  });
  document.querySelector('#tabela-liquido').replaceChildren(criarTabela(
    ['Dia', 'Receita', 'Custos', 'Líquido'],
    dias.filter((data) => relatorio.dias[data]).map((data) => {
      const dia = relatorio.dias[data];
      return [formatarDiaCurto(data), formatarPreco(dia.receita), formatarPreco(dia.custo), formatarPreco(dia.liquido)];
    }),
  ));
}

seletorMes.addEventListener('change', desenharRelatorio);

/* ---------- Resumo do dia ---------- */

const campoDia = document.querySelector('#dia');
campoDia.value = hoje();
campoDia.max = hoje();

function itemResumo(titulo, texto, rodape, estado = '') {
  const item = criarElemento('li', { className: 'resumo-dia__item' },
    criarElemento('div', {},
      criarElemento('strong', { textContent: titulo }),
      criarElemento('span', { textContent: texto }),
      criarElemento('small', { textContent: rodape }),
    ));
  if (estado) item.append(criarElemento('span', { className: 'etiqueta', 'data-estado': estado, textContent: RESULTADOS_ENTREGA[estado] }));
  return item;
}

const RESULTADOS_ENTREGA = { entregue: 'Entregue', 'no-armazem': 'Armazém', remarcada: 'Remarcada' };

function desenharDia() {
  const dia = campoDia.value || hoje();

  // Produção: o relatório que a Susana escrevia à mão.
  const prontas = prontasNoDia(dia);
  document.querySelector('#numeros-producao').textContent =
    prontas.length === 1 ? '1 encomenda pronta' : `${prontas.length} encomendas prontas`;
  document.querySelector('#dia-producao').replaceChildren(...prontas.map(({ encomenda, registo }) =>
    itemResumo(`N.º ${encomenda.numero} · ${encomenda.cliente.nome}`, descreverLinhas(encomenda),
      `${formatarHora(registo.em)} · ${registo.por}`)));

  // Entregas: o que o Michael passava para o Excel.
  const entregas = entregasNoDia(dia);
  const contar = (estado) => entregas.filter(({ registo }) => registo.estado === estado).length;
  document.querySelector('#numeros-entregas').textContent =
    `${contar('entregue')} entregues · ${contar('no-armazem')} no armazém · ${contar('remarcada')} remarcadas`;
  document.querySelector('#dia-entregas').replaceChildren(...entregas.map(({ encomenda, registo }) =>
    itemResumo(`N.º ${encomenda.numero} · ${encomenda.cliente.nome}`, registo.nota ?? '',
      `${formatarHora(registo.em)} · ${registo.por}`, registo.estado)));

  // Loja: vendas do dia e o que sobrou dos produtos do dia.
  const vendas = listarVendas().filter((venda) => dataLocal(new Date(venda.em)) === dia);
  const stock = produtosDoDia(dia);
  document.querySelector('#numeros-loja').textContent =
    `${vendas.length} vendas · ${formatarPreco(somar(vendas.map(totalDe)))}`;
  document.querySelector('#dia-loja').replaceChildren(stock.length === 0
    ? criarElemento('p', { className: 'coluna__vazia', textContent: 'Não houve produtos do dia.' })
    : criarTabela(['Produto', 'Feitos', 'Vendidos', 'Sobraram'],
      stock.map((s) => [s.produto.nome, String(s.quantidade), String(s.vendido), String(s.restante)])));
}

campoDia.addEventListener('change', desenharDia);

/* ---------- Produtos de hoje ---------- */

const formDia = document.querySelector('#form-dia');
const avisoDia = document.querySelector('#aviso-dia');
// Enquanto a Cassie escreve, as mudanças de outras abas não apagam o que ela pôs.
let formDiaAlterado = false;

function desenharQuantidades() {
  if (formDiaAlterado) return;
  const doDia = Object.fromEntries(produtosDoDia().map((s) => [s.produto.id, s]));

  document.querySelector('#quantidades').replaceChildren(...listarProdutos()
    .filter((produto) => produto.ativo && produto.naLoja)
    .map((produto) => {
      const vendidos = doDia[produto.id]?.vendido ?? 0;
      return criarElemento('label', { className: 'quantidade' },
        criarElemento('img', { src: produto.foto, alt: '', width: 900, height: 600, loading: 'lazy' }),
        criarElemento('span', {},
          criarElemento('span', { className: 'quantidade__nome', textContent: produto.nome }),
          criarElemento('small', { textContent: vendidos ? `Vendidos hoje: ${vendidos}` : 'Sem vendas hoje' }),
        ),
        criarElemento('input', {
          type: 'number',
          name: produto.id,
          min: vendidos,
          step: 1,
          inputMode: 'numeric',
          value: doDia[produto.id]?.quantidade ?? 0,
        }),
      );
    }));
}

formDia.addEventListener('input', () => {
  formDiaAlterado = true;
});

formDia.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const quantidades = Object.fromEntries([...formDia.querySelectorAll('input')]
    .map((campo) => [campo.name, campo.value === '' ? 0 : Number(campo.value)]));
  try {
    definirProdutosDoDia(quantidades);
    formDiaAlterado = false;
    avisoDia.className = 'aviso aviso--sucesso';
    avisoDia.textContent = 'Guardado. O Balcão já vê os produtos de hoje.';
    desenharQuantidades();
    desenharDia();
  } catch (falha) {
    avisoDia.className = 'aviso aviso--erro';
    avisoDia.textContent = mensagemDeErro(falha);
  }
  avisoDia.hidden = false;
});

/* ---------- Catálogo ---------- */

const dialogoProduto = document.querySelector('#dialogo-produto');
const formProduto = dialogoProduto.querySelector('form');
const camposProduto = formProduto.elements;
const NOVO_PRODUTO = {
  nome: '', categoria: 'bolos', descricao: '', preco: '', custo: '', peso: '', foto: PRODUTOS_INICIAIS[0].foto,
  porEncomenda: true, naLoja: false, personalizavel: false, ativo: true,
};
let produtoAberto = null;

for (const [id, nome] of Object.entries(CATEGORIAS)) camposProduto.categoria.add(new Option(nome, id));
// Não há envio de fotos no protótipo: escolhe-se uma das que já existem.
for (const produto of PRODUTOS_INICIAIS) camposProduto.foto.add(new Option(produto.nome, produto.foto));

function desenharCatalogo() {
  document.querySelector('#catalogo').replaceChildren(...listarProdutos().map((produto) => {
    const onde = [produto.porEncomenda && 'por encomenda', produto.naLoja && 'na loja'].filter(Boolean).join(' e ');
    return criarElemento('div', { className: `produto-linha${produto.ativo ? '' : ' produto-linha--inativo'}` },
      criarElemento('img', { src: produto.foto, alt: '', width: 900, height: 600, loading: 'lazy' }),
      criarElemento('div', {},
        criarElemento('p', { className: 'produto-linha__nome', textContent: produto.ativo ? produto.nome : `${produto.nome} (fora de venda)` }),
        criarElemento('p', {
          className: 'produto-linha__info',
          textContent: `${CATEGORIAS[produto.categoria]} · ${formatarPreco(produto.preco)} (custo ${formatarPreco(produto.custo)}) · ${formatarPeso(produto.peso)} · ${onde}`,
        }),
      ),
      criarElemento('button', {
        className: 'botao botao--secundario botao--pequeno',
        type: 'button',
        textContent: 'Editar',
        'data-produto': produto.id,
        'aria-label': `Editar ${produto.nome}`,
      }),
    );
  }));
}

function abrirProduto(produto) {
  const valores = produto ?? NOVO_PRODUTO;
  produtoAberto = produto?.id ?? null;
  dialogoProduto.querySelector('h2').textContent = produto ? 'Editar produto' : 'Novo produto';
  for (const nome of ['nome', 'categoria', 'descricao', 'preco', 'custo', 'peso', 'foto']) camposProduto[nome].value = valores[nome];
  for (const nome of ['porEncomenda', 'naLoja', 'personalizavel', 'ativo']) camposProduto[nome].checked = valores[nome];
  limparErros(formProduto);
  dialogoProduto.querySelector('[data-campo="erro"]').hidden = true;
  dialogoProduto.showModal();
}

formProduto.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!validarFormulario(formProduto)) return;
  try {
    const produto = guardarProduto({
      id: produtoAberto,
      nome: camposProduto.nome.value,
      categoria: camposProduto.categoria.value,
      descricao: camposProduto.descricao.value,
      preco: camposProduto.preco.value,
      custo: camposProduto.custo.value,
      peso: camposProduto.peso.value,
      foto: camposProduto.foto.value,
      porEncomenda: camposProduto.porEncomenda.checked,
      naLoja: camposProduto.naLoja.checked,
      personalizavel: camposProduto.personalizavel.checked,
      ativo: camposProduto.ativo.checked,
    });
    dialogoProduto.close();
    desenharCatalogo();
    desenharQuantidades();
    mostrarMensagem(`«${produto.nome}» guardado.`);
  } catch (falha) {
    const erro = dialogoProduto.querySelector('[data-campo="erro"]');
    erro.textContent = mensagemDeErro(falha);
    erro.hidden = false;
  }
});

document.querySelector('#novo-produto').addEventListener('click', () => abrirProduto(null));
document.querySelector('#catalogo').addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-produto]');
  if (botao) abrirProduto(obterProduto(botao.dataset.produto));
});
dialogoProduto.querySelector('[data-acao="cancelar"]').addEventListener('click', () => dialogoProduto.close());
limparErrosAoCorrigir(formProduto);

/* ---------- Encomendas com histórico ---------- */

const procura = document.querySelector('#procura');
const filtroEstado = document.querySelector('#filtro-estado');
const registos = document.querySelector('#registos');
for (const [id, nome] of Object.entries(ESTADOS)) filtroEstado.add(new Option(nome, id));

// António: "ninguém sabia quem tinha feito o erro". Aqui vê-se cada passo, quem o deu e quando.
function linhaDoHistorico(registo) {
  const passo = registo.estado ? ESTADOS[registo.estado] : 'Dia da entrega mudado';
  return criarElemento('li', {},
    criarElemento('p', {},
      criarElemento('strong', { textContent: passo }),
      ` · ${registo.por} (${PAPEIS[registo.papel] ?? 'Cliente'})`,
    ),
    criarElemento('p', { className: 'historico__quando', textContent: formatarMomento(registo.em) + (registo.nota ? ` — ${registo.nota}` : '') }),
  );
}

function registoEncomenda(encomenda, aberto) {
  const detalhes = criarElemento('dl', { className: 'detalhes' });
  preencherDetalhes(detalhes, [
    ['Telemóvel', formatarTelefone(encomenda.cliente.telefone)],
    ['Morada', formatarMorada(encomenda.entrega)],
    ['Personalização', descreverPersonalizacao(encomenda.personalizacao)],
    ['Pago', `${formatarPreco(totalDe(encomenda))} (${METODOS_PAGAMENTO[encomenda.pagamento.metodo]}) a ${formatarMomento(encomenda.pagamento.em)}`],
    ['Recebida por', encomenda.recebidaPor ?? ''],
    ['Levantar até', encomenda.estado === 'no-armazem' ? formatarDiaCurto(encomenda.levantarAte) : ''],
  ]);

  return criarElemento('details', { className: 'registo', open: aberto, 'data-numero': encomenda.numero },
    criarElemento('summary', {},
      criarElemento('span', { className: 'registo__numero', textContent: `N.º ${encomenda.numero}` }),
      criarElemento('span', { className: 'registo__cliente', textContent: encomenda.cliente.nome }),
      criarElemento('span', { className: 'registo__produto', textContent: descreverLinhas(encomenda) }),
      criarElemento('span', { className: 'registo__entrega', textContent: formatarEntregaCurta(encomenda.entrega) }),
      criarElemento('span', { className: 'etiqueta', 'data-estado': encomenda.estado, textContent: ESTADOS[encomenda.estado] }),
    ),
    criarElemento('div', { className: 'registo__corpo' },
      criarElemento('div', {}, criarElemento('h3', { textContent: 'Detalhes' }), detalhes),
      criarElemento('div', {},
        criarElemento('h3', { textContent: 'Histórico' }),
        criarElemento('ol', { className: 'historico' }, ...encomenda.historico.map(linhaDoHistorico)),
      ),
    ),
  );
}

function desenharEncomendas() {
  // As que estavam abertas continuam abertas depois de redesenhar.
  const abertas = new Set([...registos.querySelectorAll('details[open]')].map((d) => d.dataset.numero));
  const texto = procura.value.trim();
  const encomendas = (texto ? pesquisarEncomendas(texto) : listarEncomendas())
    .filter((e) => filtroEstado.value === '' || e.estado === filtroEstado.value)
    .sort((a, b) => b.numero - a.numero);

  document.querySelector('#titulo-encomendas').textContent =
    encomendas.length === 0 ? 'Nenhuma encomenda encontrada' : `${encomendas.length} encomendas`;
  registos.replaceChildren(...encomendas.map((e) => registoEncomenda(e, abertas.has(String(e.numero)))));
}

procura.addEventListener('input', desenharEncomendas);
filtroEstado.addEventListener('change', desenharEncomendas);

/* ---------- SMS ---------- */

function desenharSms() {
  const sms = [...listarSms()].reverse();
  document.querySelector('#titulo-sms').textContent = sms.length === 1 ? '1 SMS' : `${sms.length} SMS`;
  document.querySelector('#lista-sms').replaceChildren(...sms.map((mensagemSms) => {
    const armazem = mensagemSms.tipo === 'armazem';
    return criarElemento('li', { className: 'sms__item' },
      criarElemento('p', { className: 'sms__topo' },
        criarElemento('span', { className: 'etiqueta', 'data-estado': armazem ? 'no-armazem' : 'pronta', textContent: armazem ? 'Armazém' : 'Lembrete' }),
        `${formatarTelefone(mensagemSms.telefone)} · n.º ${mensagemSms.encomenda} · ${formatarMomento(mensagemSms.em)}`,
      ),
      criarElemento('p', { className: 'sms__texto', textContent: mensagemSms.texto }),
    );
  }));
}

/* ---------- Tudo ---------- */

function desenharTudo() {
  preencherMeses();
  desenharRelatorio();
  desenharDia();
  desenharQuantidades();
  desenharCatalogo();
  desenharEncomendas();
  desenharSms();
}

document.querySelector('#repor').addEventListener('click', () => {
  if (!confirm('Apagar tudo o que foi feito neste navegador e voltar aos dados de demonstração?')) return;
  try {
    reporDadosDemo();
    formDiaAlterado = false;
    desenharTudo();
    mostrarMensagem('Dados de demonstração repostos.');
  } catch (falha) {
    mostrarMensagem(mensagemDeErro(falha));
  }
});

// Vendas no Balcão, encomendas prontas, entregas… noutras abas: os números acompanham.
aoMudarDados(desenharTudo);
desenharTudo();
