// Página "Fazer encomenda": formulário do cliente, resumo ao vivo e confirmação.

const formulario = document.querySelector('#form-encomenda');
const campos = formulario.elements;

// Só os produtos que se vendem por encomenda.
for (const produto of listarProdutos().filter((p) => p.ativo && p.porEncomenda)) {
  campos.produto.add(new Option(`${produto.nome} · ${formatarPreco(produto.preco)}`, produto.id));
}
for (const concelho of CONCELHOS) campos.concelho.add(new Option(concelho));

// Vindo do catálogo: encomendar.html?produto=chocolate
const produtoPedido = new URLSearchParams(location.search).get('produto');
if ([...campos.produto.options].some((opcao) => opcao.value === produtoPedido)) campos.produto.value = produtoPedido;

// Entregas a partir de amanhã e só de segunda a sábado.
campos.data.min = somarDias(hoje(), 1);

function verificarDia() {
  const domingo = campos.data.value !== '' && new Date(`${campos.data.value}T12:00`).getDay() === 0;
  campos.data.setCustomValidity(domingo ? 'Domingo' : '');
}

function atualizarResumo() {
  const produto = obterProduto(campos.produto.value);
  const quantidade = Number(campos.quantidade.value);
  const quantidadeValida = Number.isInteger(quantidade) && quantidade >= 1 && quantidade <= 10;
  const foto = document.querySelector('#resumo-foto');

  foto.hidden = produto === null;
  if (produto) {
    foto.src = produto.foto;
    foto.alt = produto.nome;
  }
  document.querySelector('#resumo-produto').textContent = produto?.nome ?? 'Ainda não escolheu o produto.';
  document.querySelector('#resumo-preco').textContent = produto ? formatarPreco(produto.preco) : '—';
  document.querySelector('#resumo-quantidade').textContent = quantidadeValida ? quantidade : '—';
  document.querySelector('#resumo-total').textContent =
    produto && quantidadeValida ? formatarPreco(produto.preco * quantidade) : '—';
  document.querySelector('#resumo-entrega').textContent =
    campos.data.value && campos.hora.value
      ? formatarEntrega({ data: campos.data.value, hora: campos.hora.value })
      : '—';
}

function mostrarConfirmacao(encomenda) {
  const confirmacao = document.querySelector('#confirmacao');

  confirmacao.querySelector('[data-campo="nome"]').textContent = encomenda.cliente.nome.split(' ')[0];
  confirmacao.querySelector('[data-campo="numero"]').textContent = encomenda.numero;
  preencherDetalhes(confirmacao.querySelector('.detalhes'), detalhesDaEncomenda(encomenda));
  confirmacao.querySelector('#link-acompanhar').href = `acompanhar.html?numero=${encomenda.numero}`;

  document.querySelector('#area-encomenda').hidden = true;
  confirmacao.hidden = false;
  window.scrollTo(0, 0);
  confirmacao.focus();
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  verificarDia();
  if (!validarFormulario(formulario)) return;

  const erro = document.querySelector('#erro-gravar');
  let encomenda;
  try {
    encomenda = criarEncomenda({
      cliente: { nome: campos.nome.value, telefone: campos.telefone.value },
      linhas: [{ produtoId: campos.produto.value, quantidade: Number(campos.quantidade.value) }],
      personalizacao: { notas: campos.pedido.value },
      entrega: {
        morada: campos.morada.value,
        indicacoes: campos.indicacoes.value,
        codigoPostal: campos.codigoPostal.value,
        concelho: campos.concelho.value,
        data: campos.data.value,
        hora: campos.hora.value,
      },
      pagamento: { metodo: 'mbway', telefone: campos.telefone.value },
    });
  } catch (falha) {
    // As regras (dia cheio, região de Lisboa…) vêm do dados.js com a mensagem pronta.
    erro.textContent = falha.message;
    erro.hidden = false;
    return;
  }
  erro.hidden = true;
  mostrarConfirmacao(encomenda);
});

campos.data.addEventListener('input', verificarDia);
formulario.addEventListener('input', atualizarResumo);
formulario.addEventListener('change', atualizarResumo);
limparErrosAoCorrigir(formulario);
atualizarResumo();
