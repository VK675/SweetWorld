// Página da Produção (Susana): as encomendas por fazer, os botões «Começar» e
// «Está pronta», a etiqueta para a caixa e o resumo do dia (que o Gerente vê sozinho).

protegerPagina('producao');

document.querySelector('#hoje').textContent = formatarDia(hoje());

const producao = document.querySelector('.producao');
const modeloPedido = document.querySelector('#modelo-pedido');
const dialogoPronta = document.querySelector('#dialogo-pronta');
const erroProducao = document.querySelector('#erro-producao');

const momentoDaEntrega = (encomenda) => `${encomenda.entrega.data} ${encomenda.entrega.hora}`;
const porPrazo = (a, b) => momentoDaEntrega(a).localeCompare(momentoDaEntrega(b));

// "Hoje · 16:00", "Amanhã · 10:00" ou "seg., 16/11 · 10:00".
function descreverPrazo({ data, hora }) {
  if (data < hoje()) return `Atrasada · ${formatarDiaCurto(data)} · ${hora}`;
  if (data === hoje()) return `Hoje · ${hora}`;
  if (data === somarDias(hoje(), 1)) return `Amanhã · ${hora}`;
  return `${formatarDiaCurto(data)} · ${hora}`;
}

// "Começou: Susana, 09:14" (com o dia, se não foi hoje).
function descreverInicio(encomenda) {
  const inicio = registoDoEstado(encomenda, 'em-producao');
  if (!inicio) return '';
  const quando = dataLocal(new Date(inicio.em)) === hoje() ? formatarHora(inicio.em) : formatarMomento(inicio.em);
  return `Começou: ${inicio.por}, ${quando}`;
}

function cartaoPedido(encomenda) {
  const cartao = modeloPedido.content.firstElementChild.cloneNode(true);
  const linha = encomenda.linhas[0];
  const produto = obterProduto(linha.produtoId);
  const { texto, velas, notas } = encomenda.personalizacao;
  const pendente = encomenda.estado === 'pendente';
  const prazo = cartao.querySelector('.pedido__prazo');
  const foto = cartao.querySelector('.pedido__foto');
  const quem = cartao.querySelector('.pedido__quem');
  const botao = cartao.querySelector('button');

  cartao.dataset.numero = encomenda.numero;
  prazo.textContent = descreverPrazo(encomenda.entrega);
  prazo.classList.toggle('pedido__prazo--hoje', encomenda.entrega.data === hoje());
  prazo.classList.toggle('pedido__prazo--atrasada', encomenda.entrega.data < hoje());
  cartao.querySelector('.pedido__numero').textContent = `N.º ${encomenda.numero}`;
  if (produto) foto.src = produto.foto;
  else foto.remove();
  cartao.querySelector('.pedido__categoria').textContent = CATEGORIAS[linha.categoria];
  cartao.querySelector('.pedido__nome').textContent = descreverLinhas(encomenda);
  preencherDetalhes(cartao.querySelector('.pedido__extra'), [
    ['Texto', texto && `«${texto}»`],
    ['Velas', velas],
    ['Nota', notas],
  ]);
  quem.textContent = pendente ? '' : descreverInicio(encomenda);
  quem.hidden = quem.textContent === '';
  botao.textContent = pendente ? 'Começar' : 'Está pronta';
  botao.dataset.acao = pendente ? 'comecar' : 'pronta';
  return cartao;
}

// Uma coluna: os cartões, o número no título e a frase quando está vazia.
function preencherLista(id, encomendas) {
  document.querySelector(`#${id}`).replaceChildren(...encomendas.map(cartaoPedido));
}

function desenhar() {
  const encomendas = listarEncomendas();
  const pendentes = encomendas.filter((e) => e.estado === 'pendente').sort(porPrazo);
  const fazendo = encomendas.filter((e) => e.estado === 'em-producao').sort(porPrazo);
  const prontas = prontasNoDia();

  // À vista: as de hoje (e atrasadas) e as do próximo dia de trabalho. As outras ficam fechadas.
  const limite = somarDiasUteis(hoje(), 1);
  const jaFazer = pendentes.filter((e) => e.entrega.data <= limite);
  const maisTarde = pendentes.filter((e) => e.entrega.data > limite);

  preencherLista('fazer', jaFazer);
  preencherLista('fazer-mais-tarde', maisTarde);
  preencherLista('fazendo', fazendo);
  document.querySelector('#mais-tarde').hidden = maisTarde.length === 0;
  document.querySelector('#conta-mais-tarde').textContent = maisTarde.length;
  document.querySelector('#conta-fazer').textContent = pendentes.length;
  document.querySelector('#conta-fazendo').textContent = fazendo.length;
  document.querySelector('#conta-prontas').textContent = prontas.length;

  const vaziaFazer = document.querySelector('#vazia-fazer');
  vaziaFazer.hidden = jaFazer.length > 0;
  vaziaFazer.textContent = pendentes.length === 0
    ? 'Não há encomendas por fazer.'
    : 'Nada para já. As próximas estão em «Mais tarde».';
  document.querySelector('#vazia-fazendo').hidden = fazendo.length > 0;
  document.querySelector('#vazia-prontas').hidden = prontas.length > 0;

  document.querySelector('#prontas').replaceChildren(...prontas.map(({ encomenda, registo }) =>
    criarElemento('li', { className: 'pronta', 'data-numero': encomenda.numero },
      criarElemento('div', {},
        criarElemento('strong', { textContent: `N.º ${encomenda.numero} · ${encomenda.cliente.nome}` }),
        criarElemento('span', { textContent: descreverLinhas(encomenda) }),
        criarElemento('small', { textContent: `${formatarHora(registo.em)} · ${registo.por}` }),
      ),
      criarElemento('button', {
        className: 'botao botao--secundario botao--pequeno',
        type: 'button',
        textContent: 'Etiqueta',
        'data-acao': 'etiqueta',
        'aria-label': `Imprimir a etiqueta da encomenda n.º ${encomenda.numero}`,
      }),
    )));
}

/* ---------- Etiqueta ---------- */

// Vai colada na caixa: o n.º de série (é o número da encomenda), o cliente e a data.
// Leva também o produto e quem o fez, para não se trocar um bolo por outro.
function criarEtiqueta(encomenda) {
  const pronta = registoDoEstado(encomenda, 'pronta');
  const { texto, velas } = encomenda.personalizacao;
  const extra = [texto && `«${texto}»`, velas && `velas ${velas}`].filter(Boolean).join(' · ');

  const etiqueta = criarElemento('section', { className: 'rotulo' },
    criarElemento('p', { className: 'rotulo__empresa', textContent: 'Doces & Companhia' }),
    criarElemento('p', { className: 'rotulo__legenda', textContent: 'N.º de série' }),
    criarElemento('p', { className: 'rotulo__numero', textContent: encomenda.numero }),
    criarElemento('p', { className: 'rotulo__cliente', textContent: encomenda.cliente.nome }),
    criarElemento('p', { textContent: descreverLinhas(encomenda) }),
  );
  if (extra) etiqueta.append(criarElemento('p', { textContent: extra }));
  etiqueta.append(
    criarElemento('p', { textContent: `Entrega: ${formatarEntregaCurta(encomenda.entrega)}` }),
    criarElemento('p', { className: 'rotulo__feito', textContent: `Feita a ${formatarDataCompleta(pronta.em)} por ${pronta.por}` }),
  );
  return etiqueta;
}

function mostrarPronta(encomenda) {
  dialogoPronta.querySelector('[data-campo="previa"]').replaceChildren(criarEtiqueta(encomenda));
  dialogoPronta.querySelector('#imprimir-etiqueta').onclick = () => imprimir(criarEtiqueta(encomenda));
  dialogoPronta.showModal();
}

document.querySelector('#fechar-pronta').addEventListener('click', () => dialogoPronta.close());

/* ---------- Botões ---------- */

producao.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;
  const numero = Number(botao.closest('[data-numero]').dataset.numero);
  erroProducao.hidden = true;

  try {
    if (botao.dataset.acao === 'comecar') {
      iniciarProducao(numero);
      desenhar();
      // O cartão passa para «Em produção»: fica a brilhar um momento, sem a página saltar.
      const movido = producao.querySelector(`.pedido[data-numero="${numero}"]`);
      movido?.classList.add('pedido--movido');
      movido?.querySelector('button').focus({ preventScroll: true });
    } else if (botao.dataset.acao === 'pronta') {
      const encomenda = concluirProducao(numero);
      desenhar();
      mostrarPronta(encomenda);
    } else {
      imprimir(criarEtiqueta(obterEncomenda(numero)));
    }
  } catch (falha) {
    // Por exemplo: alguém já tinha carregado no mesmo botão noutra aba.
    erroProducao.textContent = mensagemDeErro(falha);
    erroProducao.hidden = false;
    desenhar();
  }
});

// Uma encomenda nova no site aparece aqui sem recarregar a página.
aoMudarDados(desenhar);
desenhar();
