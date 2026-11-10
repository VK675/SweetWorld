// Página "Fazer encomenda": formulário do cliente, resumo ao vivo e confirmação.

const formulario = document.querySelector('#form-encomenda');
const campos = formulario.elements;

// Bolos no menu. Os esgotados aparecem, mas não se podem escolher.
for (const produto of listarProdutos()) {
  const texto = produto.disponivel
    ? `${produto.nome} · ${formatarPreco(produto.preco)}`
    : `${produto.nome} (esgotado)`;
  const opcao = new Option(texto, produto.id);
  opcao.disabled = !produto.disponivel;
  campos.produto.add(opcao);
}

// Vindo do catálogo: encomendar.html?produto=chocolate
const produtoPedido = new URLSearchParams(location.search).get('produto');
if (obterProduto(produtoPedido)?.disponivel) campos.produto.value = produtoPedido;

// Entregas a partir de amanhã e só de segunda a sábado.
const amanha = new Date();
amanha.setDate(amanha.getDate() + 1);
campos.data.min = dataLocal(amanha);

function verificarDia() {
  const domingo = campos.data.value !== '' && new Date(`${campos.data.value}T12:00`).getDay() === 0;
  campos.data.setCustomValidity(domingo ? 'Domingo' : '');
}

// Antecipadamente: MB WAY ou transferência. Na entrega: dinheiro, cartão ou MB WAY.
function atualizarMetodos() {
  const quando = campos.quando.value;
  for (const opcao of formulario.querySelectorAll('[data-quando]')) {
    const serve = quando === '' || opcao.dataset.quando.split(' ').includes(quando);
    const radio = opcao.querySelector('input');
    opcao.hidden = !serve;
    radio.disabled = !serve;
    if (!serve) radio.checked = false;
  }
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
  document.querySelector('#resumo-produto').textContent = produto?.nome ?? 'Ainda não escolheu o bolo.';
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
  const instrucoes = confirmacao.querySelector('[data-campo="instrucoes"]');

  confirmacao.querySelector('[data-campo="nome"]').textContent = encomenda.cliente.nome.split(' ')[0];
  confirmacao.querySelector('[data-campo="numero"]').textContent = encomenda.numero;
  preencherDetalhes(confirmacao.querySelector('.detalhes'), encomenda);
  instrucoes.textContent = instrucoesPagamento(encomenda);
  instrucoes.hidden = instrucoes.textContent === '';
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

  const produto = obterProduto(campos.produto.value);
  let encomenda;
  try {
    encomenda = criarEncomenda({
      canal: 'site',
      registadaPor: 'Cliente (site)',
      cliente: {
        nome: campos.nome.value.trim(),
        telefone: campos.telefone.value.trim(),
      },
      linhas: [{
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: Number(campos.quantidade.value),
      }],
      pedidoEspecial: campos.pedido.value.trim(),
      entrega: {
        morada: campos.morada.value.trim(),
        indicacoes: campos.indicacoes.value.trim(),
        codigoPostal: campos.codigoPostal.value.trim(),
        localidade: campos.localidade.value.trim(),
        data: campos.data.value,
        hora: campos.hora.value,
      },
      pagamento: {
        quando: campos.quando.value,
        metodo: campos.metodo.value,
      },
    });
  } catch {
    document.querySelector('#erro-gravar').hidden = false;
    return;
  }
  mostrarConfirmacao(encomenda);
});

campos.data.addEventListener('input', verificarDia);
for (const radio of campos.quando) radio.addEventListener('change', atualizarMetodos);
formulario.addEventListener('input', atualizarResumo);
formulario.addEventListener('change', atualizarResumo);
limparErrosAoCorrigir(formulario);
atualizarResumo();
