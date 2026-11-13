// Página do Balcão (Filipe): vender os produtos do dia, ver o estado das encomendas,
// mudar o dia da entrega quando o cliente pede e ver os dias livres.

protegerPagina('balcao');

document.querySelector('#hoje').textContent = formatarDia(hoje());
ligarSeparadores(document.querySelector('.separadores'));

/* ---------- Vender ---------- */

const formVenda = document.querySelector('#form-venda');
const listaStock = document.querySelector('#stock');
const linhasVenda = document.querySelector('#linhas-venda');
const modeloStock = document.querySelector('#modelo-stock');
const erroVenda = document.querySelector('#erro-venda');
const dialogoVenda = document.querySelector('#dialogo-venda');

// A venda que se está a fazer: id do produto → quantidade.
const venda = new Map();

// Não se junta mais do que resta. Se entretanto o stock mudou (outra aba), a venda encolhe.
function acertarVenda(stock) {
  for (const [id, quantidade] of venda) {
    const restante = stock.find((s) => s.produto.id === id)?.restante ?? 0;
    if (quantidade <= 0 || restante <= 0) venda.delete(id);
    else venda.set(id, Math.min(quantidade, restante));
  }
}

function desenharStock(stock) {
  document.querySelector('#sem-stock').hidden = stock.length > 0;
  listaStock.replaceChildren(...stock.map(({ produto, quantidade, restante }) => {
    const cartao = modeloStock.content.firstElementChild.cloneNode(true);
    const naVenda = venda.get(produto.id) ?? 0;
    const resta = restante === 0 ? 'Esgotado' : `Restam ${restante} de ${quantidade}`;

    cartao.dataset.produto = produto.id;
    cartao.disabled = naVenda >= restante;
    cartao.classList.toggle('stock__produto--esgotado', restante === 0);
    cartao.classList.toggle('stock__produto--poucos', restante > 0 && restante <= 3);
    cartao.setAttribute('aria-label', `Juntar à venda: ${produto.nome}, ${formatarPreco(produto.preco)}. ${resta}.`
      + (naVenda ? ` Na venda: ${naVenda}.` : ''));
    cartao.querySelector('img').src = produto.foto;
    cartao.querySelector('.stock__nome').textContent = produto.nome;
    cartao.querySelector('.stock__preco').textContent = formatarPreco(produto.preco);
    cartao.querySelector('.stock__resta').textContent = resta;
    cartao.querySelector('.stock__na-venda').textContent = naVenda || '';
    return cartao;
  }));
}

function botaoPasso(produto, passo, desativado) {
  return criarElemento('button', {
    type: 'button',
    textContent: passo > 0 ? '+' : '−',
    disabled: desativado,
    'aria-label': `${passo > 0 ? 'Mais um' : 'Menos um'}: ${produto.nome}`,
    'data-produto': produto.id,
    'data-passo': passo,
  });
}

function desenharVenda(stock) {
  let total = 0;
  linhasVenda.replaceChildren(...[...venda].map(([id, quantidade]) => {
    const { produto, restante } = stock.find((s) => s.produto.id === id);
    total += produto.preco * quantidade;
    return criarElemento('li', { className: 'venda__linha' },
      criarElemento('span', { className: 'venda__nome', textContent: produto.nome }),
      criarElemento('span', { className: 'contador contador--pequeno' },
        botaoPasso(produto, -1, false),
        criarElemento('span', { textContent: quantidade }),
        botaoPasso(produto, 1, quantidade >= restante),
      ),
      criarElemento('span', { className: 'venda__preco', textContent: formatarPreco(produto.preco * quantidade) }),
    );
  }));

  document.querySelector('#venda-vazia').hidden = venda.size > 0;
  document.querySelector('#total-venda').textContent = formatarPreco(total);
  const botao = document.querySelector('#registar-venda');
  botao.disabled = venda.size === 0;
  botao.textContent = venda.size === 0 ? 'Registar venda' : `Registar venda · ${formatarPreco(total)}`;
}

function desenharVender() {
  // Se o Gerente tirar um produto de venda a meio do dia, deixa de aparecer aqui.
  const stock = produtosDoDia().filter((s) => s.produto.ativo && s.produto.naLoja);
  acertarVenda(stock);
  desenharStock(stock);
  desenharVenda(stock);
}

// Os botões são desenhados de novo a cada toque, por isso o foco volta ao botão equivalente.
function mudarNaVenda(id, passo, seletor) {
  venda.set(id, (venda.get(id) ?? 0) + passo);
  desenharVender();
  document.querySelector(seletor)?.focus();
}

listaStock.addEventListener('click', (evento) => {
  const cartao = evento.target.closest('.stock__produto');
  if (cartao) mudarNaVenda(cartao.dataset.produto, 1, `.stock__produto[data-produto="${cartao.dataset.produto}"]`);
});

linhasVenda.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-passo]');
  if (!botao) return;
  const { produto, passo } = botao.dataset;
  mudarNaVenda(produto, Number(passo), `#linhas-venda [data-produto="${produto}"][data-passo="${passo}"]`);
});

formVenda.addEventListener('submit', (evento) => {
  evento.preventDefault();
  erroVenda.hidden = true;
  if (!validarFormulario(formVenda)) return;

  let registada;
  try {
    registada = registarVenda({
      linhas: [...venda].map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
      metodo: formVenda.elements.metodo.value,
      cliente: formVenda.elements.cliente.value,
    });
  } catch (falha) {
    erroVenda.textContent = mensagemDeErro(falha);
    erroVenda.hidden = false;
    desenharVender();
    return;
  }

  venda.clear();
  formVenda.reset();
  desenharVender();

  dialogoVenda.querySelector('[data-campo="numero"]').textContent = registada.numero;
  dialogoVenda.querySelector('[data-campo="total"]').textContent = formatarPreco(totalDe(registada));
  dialogoVenda.querySelector('[data-campo="metodo"]').textContent = METODOS_PAGAMENTO[registada.metodo].toLowerCase();
  dialogoVenda.querySelector('#recibo-venda').onclick = () => imprimir(criarRecibo(registada));
  dialogoVenda.showModal();
});

document.querySelector('#nova-venda').addEventListener('click', () => dialogoVenda.close());
limparErrosAoCorrigir(formVenda);

/* ---------- Encomendas ---------- */

const procura = document.querySelector('#procura');
const listaEncomendas = document.querySelector('#lista-encomendas');
const modeloEncomenda = document.querySelector('#modelo-encomenda');
const avisoEncomendas = document.querySelector('#aviso-encomendas');

// Sem pesquisa: as que ainda vão sair (ou esperam no armazém), da mais próxima para a mais distante.
// Com pesquisa: todas as que coincidem, da mais recente para a mais antiga.
function encomendasAMostrar() {
  const texto = procura.value.trim();
  if (texto === '') {
    return listarEncomendas()
      .filter((e) => ESTADOS_POR_ENTREGAR.includes(e.estado) || e.estado === 'no-armazem')
      .sort((a, b) => momentoDaEntrega(a).localeCompare(momentoDaEntrega(b)));
  }
  return pesquisarEncomendas(texto).sort((a, b) => momentoDaEntrega(b).localeCompare(momentoDaEntrega(a)));
}

function cartaoEncomenda(encomenda) {
  const cartao = modeloEncomenda.content.firstElementChild.cloneNode(true);
  const estado = cartao.querySelector('[data-campo="estado"]');
  let levantar = '';
  if (encomenda.estado === 'no-armazem') {
    levantar = formatarDiaCurto(encomenda.levantarAte) + (prazoTerminado(encomenda) ? ' (prazo terminado)' : '');
  }

  cartao.dataset.numero = encomenda.numero;
  cartao.querySelector('[data-campo="numero"]').textContent = encomenda.numero;
  estado.textContent = ESTADOS[encomenda.estado];
  estado.dataset.estado = encomenda.estado;
  preencherDetalhes(cartao.querySelector('.detalhes'), [
    ['Cliente', encomenda.cliente.nome],
    ['Telemóvel', formatarTelefone(encomenda.cliente.telefone)],
    ['Produto', descreverLinhas(encomenda)],
    ['Personalização', descreverPersonalizacao(encomenda.personalizacao)],
    ['Entrega', formatarEntregaCurta(encomenda.entrega)],
    ['Morada', formatarMorada(encomenda.entrega)],
    ['Levantar até', levantar],
    ['Pago', `${formatarPreco(totalDe(encomenda))} (${METODOS_PAGAMENTO[encomenda.pagamento.metodo]})`],
  ]);
  // Depois de entregue (ou enquanto espera no armazém) já não se muda o dia.
  cartao.querySelector('[data-acao="mudar-dia"]').hidden = !ESTADOS_POR_ENTREGAR.includes(encomenda.estado);
  return cartao;
}

function desenharEncomendas() {
  const texto = procura.value.trim();
  const encomendas = encomendasAMostrar();
  let titulo = `Por entregar (${encomendas.length})`;
  if (texto !== '') {
    titulo = encomendas.length === 0
      ? `Nenhuma encomenda encontrada para «${texto}»`
      : `Encontradas para «${texto}» (${encomendas.length})`;
  }
  document.querySelector('#titulo-lista').textContent = titulo;
  listaEncomendas.replaceChildren(...encomendas.map(cartaoEncomenda));
}

// O cliente pediu outro dia: só os dias com lugar para esta encomenda.
function mudarDia(encomenda) {
  escolherOutroDia(encomenda, (data, hora) => {
    const alterada = alterarDataEntrega(encomenda.numero, data, hora);
    avisoEncomendas.textContent = `Encomenda n.º ${alterada.numero}: a entrega passou para ${formatarEntrega(alterada.entrega)}.`;
    avisoEncomendas.hidden = false;
    desenharEncomendas();
    desenharDias();

    const cartao = listaEncomendas.querySelector(`[data-numero="${alterada.numero}"]`);
    cartao?.classList.add('encomenda--alterada');
    cartao?.scrollIntoView({ block: 'center' });
  });
}

listaEncomendas.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const encomenda = obterEncomenda(botao.closest('.encomenda').dataset.numero);
  if (botao.dataset.acao === 'recibo') imprimir(criarRecibo(encomenda));
  else mudarDia(encomenda);
});

procura.addEventListener('input', () => {
  avisoEncomendas.hidden = true;
  desenharEncomendas();
});

/* ---------- Dias livres ---------- */

function desenharDias() {
  desenharCalendario(document.querySelector('#agenda'), { mostrarOcupacao: true, soLeitura: true });
}

/* ---------- Início ---------- */

function desenharTudo() {
  desenharVender();
  desenharEncomendas();
  desenharDias();
}

// O Gerente mudou o stock, a Produção acabou uma encomenda… noutra aba: a página acompanha.
aoMudarDados(desenharTudo);
desenharTudo();
