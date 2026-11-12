// Página "Acompanhar encomenda": procura pelo número e telemóvel e mostra o estado.

const formulario = document.querySelector('#form-procurar');
const campos = formulario.elements;
const resultado = document.querySelector('#resultado');
const naoEncontrada = document.querySelector('#nao-encontrada');

// Ordem da barra de progresso. As não entregues ficam em "Pronta", com um aviso.
const ETAPAS = ['pendente', 'em-producao', 'pronta', 'entregue'];

function preencher(campo, texto) {
  const elemento = resultado.querySelector(`[data-campo="${campo}"]`);
  elemento.textContent = texto;
  elemento.hidden = texto === '';
}

// O que dizer ao cliente quando a entrega falhou.
function avisoNaoEntregue(encomenda) {
  if (encomenda.estado === 'remarcada') {
    return `Não conseguimos entregar. A nova entrega está marcada para ${formatarEntrega(encomenda.entrega)}.`;
  }
  if (prazoTerminado(encomenda)) {
    return `O prazo para levantar a encomenda no armazém terminou a ${formatarDia(encomenda.levantarAte)}. Ligue-nos: 912 345 678.`;
  }
  if (encomenda.estado === 'no-armazem') {
    return `Não conseguimos entregar. A encomenda está no nosso armazém e pode levantá-la até ${formatarDia(encomenda.levantarAte)}.`;
  }
  return '';
}

function mostrarEstado(encomenda) {
  const naoEntregue = ['no-armazem', 'remarcada'].includes(encomenda.estado);
  const etapaAtual = ETAPAS.indexOf(naoEntregue ? 'pronta' : encomenda.estado);

  preencher('numero', String(encomenda.numero));
  preencher('estado', ESTADOS[encomenda.estado]);
  resultado.querySelector('[data-campo="estado"]').dataset.estado = encomenda.estado;

  resultado.querySelectorAll('.progresso li').forEach((etapa, indice) => {
    etapa.classList.toggle('feito', indice <= etapaAtual);
    if (indice === etapaAtual) etapa.setAttribute('aria-current', 'step');
    else etapa.removeAttribute('aria-current');
  });

  preencher('nota', avisoNaoEntregue(encomenda));
  preencherDetalhes(resultado.querySelector('.detalhes'), detalhesDaEncomenda(encomenda));
  preencher('atualizado', `Última atualização: ${formatarMomento(encomenda.historico.at(-1).em)}`);

  // Ler offsetWidth com o cartão escondido faz as animações recomeçarem a cada procura.
  resultado.hidden = true;
  void resultado.offsetWidth;
  resultado.hidden = false;
  resultado.focus();
}

// Vindo da confirmação: acompanhar.html?numero=1001
const numeroPedido = new URLSearchParams(location.search).get('numero');
if (numeroPedido) campos.numero.value = numeroPedido;

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  resultado.hidden = true;
  naoEncontrada.hidden = true;
  if (!validarFormulario(formulario)) return;

  const encomenda = procurarEncomenda(campos.numero.value.trim(), campos.telefone.value);
  if (encomenda) mostrarEstado(encomenda);
  else naoEncontrada.hidden = false;
});

limparErrosAoCorrigir(formulario);
