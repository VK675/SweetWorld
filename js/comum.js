// Funções partilhadas pelas páginas: resumo da encomenda e validação de formulários.

// Preenche um <dl class="detalhes"> com pares [rótulo, valor]. Os valores vazios não aparecem.
function preencherDetalhes(lista, pares) {
  lista.replaceChildren(...pares.filter(([, valor]) => valor).map(([rotulo, valor]) => {
    const linha = document.createElement('div');
    const termo = document.createElement('dt');
    const descricao = document.createElement('dd');
    termo.textContent = rotulo;
    descricao.textContent = valor;
    linha.append(termo, descricao);
    return linha;
  }));
}

// O que o cliente vê sobre a sua encomenda.
function detalhesDaEncomenda(encomenda) {
  const { texto, velas, notas } = encomenda.personalizacao;
  return [
    ['Produto', encomenda.linhas.map((l) => `${l.quantidade} × ${l.nome}`).join(', ')],
    ['Texto no bolo', texto],
    ['Velas', velas],
    ['Notas', notas],
    ['Entrega', formatarEntrega(encomenda.entrega)],
    ['Morada', formatarMorada(encomenda.entrega)],
    ['Total', formatarPreco(totalDe(encomenda))],
    ['Pagamento', `Pago por ${METODOS_PAGAMENTO[encomenda.pagamento.metodo]}`],
  ];
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
