// Página do Entregador (Michael), feita para o telemóvel. Substitui a lista que chegava
// pelo WhatsApp (nome, telemóvel, morada com mapa, tipo de encomenda), a fatura assinada
// (fica o nome de quem recebeu) e o Excel do fim do dia (a lista «Feitas hoje»).

protegerPagina('entregador');

document.querySelector('#hoje').textContent = formatarDia(hoje());

const modeloEntrega = document.querySelector('#modelo-entrega');
const dialogoRecebida = document.querySelector('#dialogo-recebida');
const formRecebida = dialogoRecebida.querySelector('form');
const dialogoFalhou = document.querySelector('#dialogo-falhou');

/* ---------- Listas ---------- */

// opcoes: prazo (texto da etiqueta), estilo ('hoje' ou 'atrasada'), nota,
//         mapa (mostrar a morada) e botoes [[ação, texto, secundário?]].
function cartaoEntrega(encomenda, opcoes) {
  const { prazo, estilo = '', nota = '', mapa = true, botoes = [] } = opcoes;
  const cartao = modeloEntrega.content.firstElementChild.cloneNode(true);
  const { cliente, entrega } = encomenda;
  const telefone = cartao.querySelector('[data-campo="telefone"]');
  const ligacaoMapa = cartao.querySelector('[data-campo="mapa"]');
  const etiquetaPrazo = cartao.querySelector('.prazo');
  const textoNota = cartao.querySelector('.entrega__nota');

  cartao.dataset.numero = encomenda.numero;
  cartao.classList.toggle('entrega--espera', botoes.length === 0);
  etiquetaPrazo.textContent = prazo;
  if (estilo) etiquetaPrazo.classList.add(`prazo--${estilo}`);
  cartao.querySelector('.entrega__numero').textContent = `N.º ${encomenda.numero}`;
  cartao.querySelector('.entrega__cliente').textContent = cliente.nome;
  cartao.querySelector('.entrega__produto').textContent =
    `${descreverLinhas(encomenda)} · ${CATEGORIAS[encomenda.linhas[0].categoria]}`;

  telefone.href = `tel:+351${normalizarTelefone(cliente.telefone)}`;
  telefone.querySelector('[data-campo="texto"]').textContent = formatarTelefone(cliente.telefone);
  if (mapa) {
    const morada = formatarMorada(entrega);
    ligacaoMapa.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${morada}, Portugal`)}`;
    ligacaoMapa.querySelector('[data-campo="texto"]').textContent = morada;
  } else {
    ligacaoMapa.remove();
  }

  textoNota.textContent = nota;
  textoNota.hidden = nota === '';
  cartao.querySelector('.entrega__acoes').append(...botoes.map(([acao, texto, secundario]) =>
    criarElemento('button', {
      type: 'button',
      className: `botao botao--grande${secundario ? ' botao--secundario' : ''}`,
      textContent: texto,
      'data-acao': acao,
    })));
  return cartao;
}

// As de hoje (e as que ficaram para trás). As que ainda estão na cozinha aparecem, sem botões.
function cartaoPorEntregar(encomenda) {
  const atrasada = encomenda.entrega.data < hoje();
  const prazo = atrasada
    ? `Atrasada · ${formatarDiaCurto(encomenda.entrega.data)} · ${encomenda.entrega.hora}`
    : `Hoje · ${encomenda.entrega.hora}`;

  if (['pendente', 'em-producao'].includes(encomenda.estado)) {
    return cartaoEntrega(encomenda, {
      prazo,
      estilo: atrasada ? 'atrasada' : '',
      nota: `Ainda na cozinha (${ESTADOS[encomenda.estado].toLowerCase()}).`,
    });
  }
  return cartaoEntrega(encomenda, {
    prazo,
    estilo: atrasada ? 'atrasada' : 'hoje',
    nota: encomenda.estado === 'remarcada' ? 'Entrega remarcada: o cliente já falhou uma vez.' : '',
    botoes: [['entregue', 'Entregue'], ['nao-entregue', 'Não entregue', true]],
  });
}

function cartaoNoArmazem(encomenda) {
  const terminou = prazoTerminado(encomenda);
  return cartaoEntrega(encomenda, {
    prazo: `${terminou ? 'Prazo terminou' : 'Levantar até'} · ${formatarDiaCurto(encomenda.levantarAte)}`,
    estilo: terminou ? 'atrasada' : '',
    mapa: false,
    botoes: [['levantada', 'Levantada']],
  });
}

function itemFeito({ encomenda, registo }) {
  return itemResumo(`N.º ${encomenda.numero} · ${encomenda.cliente.nome}`, registo.nota ?? '',
    `${formatarHora(registo.em)} · ${registo.por}`, registo.estado);
}

function preencher(nome, itens) {
  document.querySelector(`#lista-${nome}`).replaceChildren(...itens);
  document.querySelector(`#conta-${nome}`).textContent = itens.length;
  document.querySelector(`#vazia-${nome}`).hidden = itens.length > 0;
}

function desenhar() {
  const encomendas = listarEncomendas();
  const porEntregar = encomendas
    .filter((e) => ESTADOS_POR_ENTREGAR.includes(e.estado) && e.entrega.data <= hoje())
    .sort((a, b) => momentoDaEntrega(a).localeCompare(momentoDaEntrega(b)));
  const noArmazem = encomendas
    .filter((e) => e.estado === 'no-armazem')
    .sort((a, b) => a.levantarAte.localeCompare(b.levantarAte));

  preencher('entregar', porEntregar.map(cartaoPorEntregar));
  preencher('armazem', noArmazem.map(cartaoNoArmazem));
  preencher('feitas', entregasNoDia().map(itemFeito));
}

/* ---------- Ações nas janelas ---------- */

// Faz a ação da janela: se correr bem, fecha-a e avisa; se não, mostra o erro lá dentro.
function tentar(dialogo, acao) {
  const erro = dialogo.querySelector('[data-campo="erro"]');
  try {
    const texto = acao();
    dialogo.close();
    desenhar();
    mostrarMensagem(texto);
  } catch (falha) {
    erro.textContent = mensagemDeErro(falha);
    erro.hidden = false;
  }
}

/* ---------- Entregue, levantada e não entregue ---------- */

// A encomenda da janela que está aberta.
let encomendaAberta = null;

// O nome vem preenchido com o do cliente: muitas vezes é ele que recebe.
function abrirRecebida(encomenda, levantada) {
  encomendaAberta = encomenda;
  dialogoRecebida.querySelector('[data-campo="numero"]').textContent = encomenda.numero;
  dialogoRecebida.querySelector('h2').textContent = levantada ? 'Quem a levantou?' : 'Quem a recebeu?';
  dialogoRecebida.querySelector('[data-campo="erro"]').hidden = true;
  limparErros(formRecebida);
  formRecebida.elements.recebidaPor.value = encomenda.cliente.nome;
  dialogoRecebida.showModal();
  formRecebida.elements.recebidaPor.select();
}

formRecebida.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!validarFormulario(formRecebida)) return;
  tentar(dialogoRecebida, () => {
    const levantada = encomendaAberta.estado === 'no-armazem';
    const entregue = registarEntrega(encomendaAberta.numero, formRecebida.elements.recebidaPor.value);
    return `N.º ${entregue.numero}: ${levantada ? 'levantada' : 'entregue'}. Recebeu: ${entregue.recebidaPor}.`;
  });
});

function abrirFalhou(encomenda) {
  encomendaAberta = encomenda;
  dialogoFalhou.querySelector('[data-campo="numero"]').textContent = encomenda.numero;
  dialogoFalhou.querySelector('[data-campo="ate"]').textContent = formatarDia(somarDiasUteis(hoje(), DIAS_ARMAZEM));
  dialogoFalhou.querySelector('[data-campo="erro"]').hidden = true;
  dialogoFalhou.showModal();
}

// O SMS para o cliente sai sozinho (fica no registo de SMS que o Gerente vê).
dialogoFalhou.querySelector('[data-acao="armazem"]').addEventListener('click', () => {
  tentar(dialogoFalhou, () => {
    const encomenda = deixarNoArmazem(encomendaAberta.numero);
    return `N.º ${encomenda.numero}: fica no armazém até ${formatarDiaCurto(encomenda.levantarAte)}. O cliente recebeu um SMS.`;
  });
});

// Remarcar: a mesma janela de dias livres do Balcão.
dialogoFalhou.querySelector('[data-acao="remarcar"]').addEventListener('click', () => {
  dialogoFalhou.close();
  escolherOutroDia(encomendaAberta, (data, hora) => {
    const encomenda = remarcarEntrega(encomendaAberta.numero, data, hora);
    desenhar();
    mostrarMensagem(`N.º ${encomenda.numero}: remarcada para ${formatarEntregaCurta(encomenda.entrega)}.`);
  });
});

for (const dialogo of [dialogoRecebida, dialogoFalhou]) {
  dialogo.querySelector('[data-acao="cancelar"]').addEventListener('click', () => dialogo.close());
}

document.querySelector('main').addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  if (!botao) return;
  const encomenda = obterEncomenda(botao.closest('.entrega').dataset.numero);
  if (botao.dataset.acao === 'nao-entregue') abrirFalhou(encomenda);
  else abrirRecebida(encomenda, botao.dataset.acao === 'levantada');
});

limparErrosAoCorrigir(formRecebida);

// A Produção acabou uma encomenda noutra aba: o botão «Entregue» aparece sozinho.
aoMudarDados(desenhar);
desenhar();
