// Página "Acompanhar encomenda": procura pelo número e telemóvel e mostra o estado.

const formulario = document.querySelector('#form-procurar');
const campos = formulario.elements;
const resultado = document.querySelector('#resultado');
const naoEncontrada = document.querySelector('#nao-encontrada');

// Ordem da barra de progresso. "Não entregue" fica em "Concluída", com um aviso.
const ETAPAS = ['pendente', 'em-producao', 'concluida', 'entregue'];

function preencher(campo, texto) {
  const elemento = resultado.querySelector(`[data-campo="${campo}"]`);
  elemento.textContent = texto;
  elemento.hidden = texto === '';
}

function mostrarEstado(encomenda) {
  const ultimaMudanca = encomenda.historico.at(-1);
  const naoEntregue = encomenda.estado === 'nao-entregue';
  const etapaAtual = ETAPAS.indexOf(naoEntregue ? 'concluida' : encomenda.estado);

  preencher('numero', String(encomenda.numero));
  preencher('estado', ESTADOS[encomenda.estado]);
  resultado.querySelector('[data-campo="estado"]').dataset.estado = encomenda.estado;

  resultado.querySelectorAll('.progresso li').forEach((etapa, indice) => {
    etapa.classList.toggle('feito', indice <= etapaAtual);
    if (indice === etapaAtual) etapa.setAttribute('aria-current', 'step');
    else etapa.removeAttribute('aria-current');
  });

  const motivo = ultimaMudanca.nota ? `: ${ultimaMudanca.nota}` : '';
  preencher('nota', naoEntregue
    ? `Não conseguimos entregar${motivo}. Vamos ligar-lhe para combinar uma nova entrega.`
    : '');
  preencherDetalhes(resultado.querySelector('.detalhes'), encomenda);
  preencher('instrucoes', instrucoesPagamento(encomenda));
  preencher('atualizado', `Última atualização: ${new Date(ultimaMudanca.em).toLocaleString('pt-PT', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })}`);

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
