// Funções partilhadas pelas páginas: datas, textos da encomenda e validação de formulários.

// Data no formato do <input type="date"> (AAAA-MM-DD), na hora local.
function dataLocal(data) {
  const doisDigitos = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

// "quinta-feira, 12 de novembro, às 15:00"
function formatarEntrega({ data, hora }) {
  const dia = new Date(`${data}T12:00`).toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return `${dia}, às ${hora}`;
}

function formatarMorada(entrega) {
  const rua = [entrega.morada, entrega.indicacoes].filter(Boolean).join(', ');
  return `${rua}, ${entrega.codigoPostal} ${entrega.localidade}`;
}

function descreverPagamento({ pago, quando, metodo }) {
  const estado = pago ? 'Pago' : 'Por pagar';
  return `${estado}: ${METODOS_PAGAMENTO[metodo]}, ${MOMENTOS_PAGAMENTO[quando].toLowerCase()}`;
}

function instrucoesPagamento(encomenda) {
  const { pago, quando, metodo } = encomenda.pagamento;
  const total = formatarPreco(totalEncomenda(encomenda));
  if (pago) return '';
  if (quando === 'entrega') return `Paga ${total} ao estafeta quando receber a encomenda.`;
  if (metodo === 'mbway') {
    return `Envie ${total} por MB WAY para o 912 345 678 e escreva «Encomenda ${encomenda.numero}» na mensagem.`;
  }
  return `Transfira ${total} para o IBAN PT50 0000 0000 0000 0000 0000 0 e indique «Encomenda ${encomenda.numero}» no descritivo.`;
}

// Preenche um <dl class="detalhes"> com o resumo da encomenda.
function preencherDetalhes(lista, encomenda) {
  const linhas = [
    ['Bolo', encomenda.linhas.map((l) => `${l.quantidade} × ${l.nome}`).join(', ')],
    ['Pedido especial', encomenda.pedidoEspecial],
    ['Entrega prevista', formatarEntrega(encomenda.entrega)],
    ['Morada', formatarMorada(encomenda.entrega)],
    ['Total', formatarPreco(totalEncomenda(encomenda))],
    ['Pagamento', descreverPagamento(encomenda.pagamento)],
  ];

  lista.replaceChildren(...linhas.filter(([, valor]) => valor).map(([rotulo, valor]) => {
    const linha = document.createElement('div');
    const termo = document.createElement('dt');
    const descricao = document.createElement('dd');
    termo.textContent = rotulo;
    descricao.textContent = valor;
    linha.append(termo, descricao);
    return linha;
  }));
}

// Validação com mensagens próprias. Cada campo fica dentro de um .campo com:
// data-erro="mensagem" e um <p class="campo__erro"> para a mostrar.
function validarCampo(caixa) {
  const campos = [...caixa.querySelectorAll('input, select, textarea')].filter((c) => c.willValidate);
  const invalido = campos.find((campo) => !campo.checkValidity()) ?? null;

  caixa.classList.toggle('campo--erro', invalido !== null);
  caixa.querySelector('.campo__erro').textContent = invalido ? caixa.dataset.erro : '';
  for (const campo of campos) {
    if (campo.type !== 'radio') campo.setAttribute('aria-invalid', String(campo === invalido));
  }
  return invalido;
}

function validarFormulario(formulario) {
  let primeiroErro = null;
  for (const caixa of formulario.querySelectorAll('.campo[data-erro]')) {
    const erro = validarCampo(caixa);
    primeiroErro ??= erro;
  }
  primeiroErro?.focus();
  return primeiroErro === null;
}

// Depois do primeiro erro, a mensagem desaparece assim que o campo fica certo.
function limparErrosAoCorrigir(formulario) {
  formulario.addEventListener('input', atualizar);
  formulario.addEventListener('change', atualizar);

  function atualizar(evento) {
    const caixa = evento.target.closest('.campo--erro');
    if (caixa) validarCampo(caixa);
  }
}
