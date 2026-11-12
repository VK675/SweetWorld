// Página "Fazer encomenda": escolha do produto, calendário com os dias livres,
// resumo ao vivo, pagamento por MB WAY (simulado) e confirmação.

const formulario = document.querySelector('#form-encomenda');
const campos = formulario.elements;
const calendario = document.querySelector('#calendario');
const erroEncomenda = document.querySelector('#erro-encomenda');
const dialogoMbway = document.querySelector('#dialogo-mbway');
const produtosAVenda = listarProdutos().filter((p) => p.ativo && p.porEncomenda);

/* ---------- Preparar o formulário ---------- */

// Os produtos aparecem por categoria. Cada um é um botão de rádio com foto.
const escolhas = document.querySelector('#escolhas');
const modeloEscolha = document.querySelector('#modelo-escolha');

for (const [categoria, nome] of Object.entries(CATEGORIAS)) {
  const daCategoria = produtosAVenda.filter((p) => p.categoria === categoria);
  if (daCategoria.length === 0) continue;

  const grelha = criarElemento('div', { className: 'escolhas__grelha' });
  for (const produto of daCategoria) {
    const escolha = modeloEscolha.content.cloneNode(true);
    escolha.querySelector('input').value = produto.id;
    escolha.querySelector('img').src = produto.foto;
    escolha.querySelector('.escolha__nome').textContent = produto.nome;
    escolha.querySelector('.escolha__preco').textContent = formatarPreco(produto.preco);
    grelha.append(escolha);
  }
  escolhas.append(criarElemento('p', { className: 'escolhas__categoria', textContent: nome }), grelha);
}

for (const concelho of CONCELHOS) campos.concelho.add(new Option(concelho));
for (const hora of HORAS_ENTREGA) campos.hora.add(new Option(hora));

// Vindo do catálogo: encomendar.html?produto=chocolate
const produtoPedido = new URLSearchParams(location.search).get('produto');
for (const radio of formulario.querySelectorAll('input[name="produto"]')) {
  radio.checked = radio.value === produtoPedido;
}

/* ---------- O que o cliente escolheu ---------- */

function produtoEscolhido() {
  return produtosAVenda.find((p) => p.id === campos.produto.value) ?? null;
}

function quantidadeEscolhida() {
  return campos.quantidade.checkValidity() ? Number(campos.quantidade.value) : 0;
}

function pesoEscolhido() {
  const produto = produtoEscolhido();
  return produto ? arredondar(produto.peso * quantidadeEscolhida()) : 0;
}

function lerFormulario() {
  return {
    cliente: { nome: campos.nome.value, telefone: campos.telefone.value },
    linhas: [{ produtoId: campos.produto.value, quantidade: Number(campos.quantidade.value) }],
    personalizacao: { texto: campos.texto.value, velas: campos.velas.value, notas: campos.notas.value },
    entrega: {
      morada: campos.morada.value,
      indicacoes: campos.indicacoes.value,
      codigoPostal: campos.codigoPostal.value.trim(),
      concelho: campos.concelho.value,
      data: campos.data.value,
      hora: campos.hora.value,
    },
    pagamento: { metodo: 'mbway', telefone: campos.telefoneMbway.value },
  };
}

/* ---------- Manter a página a par das escolhas ---------- */

// O máximo depende do peso: uma encomenda não pode passar dos 10 kg.
function atualizarQuantidade() {
  const produto = produtoEscolhido();
  const maximo = produto ? Math.min(10, Math.floor(MAX_KG_DIA / produto.peso + 0.001)) : 10;
  campos.quantidade.max = maximo;
  if (Number(campos.quantidade.value) > maximo) campos.quantidade.value = maximo;
  document.querySelector('#ajuda-quantidade').textContent = produto
    ? `${formatarPeso(produto.peso)} cada. Pode encomendar até ${maximo}.`
    : '';
}

// Só os bolos levam texto e velas.
function atualizarPersonalizacao() {
  const personalizavel = produtoEscolhido()?.personalizavel ?? false;
  document.querySelector('#personalizar').hidden = !personalizavel;
  campos.texto.disabled = !personalizavel;
  campos.velas.disabled = !personalizavel;
}

// Os dias livres dependem do peso da encomenda, por isso o calendário
// é redesenhado quando o produto ou a quantidade mudam.
let pesoNoCalendario = null;

function atualizarCalendario() {
  const kg = pesoEscolhido();
  if (kg === pesoNoCalendario) return;
  pesoNoCalendario = kg;

  const escolhido = campos.data?.value ?? '';
  desenharCalendario(calendario, { kg, escolhido });

  if (escolhido !== '' && campos.data.value === '') {
    const caixa = calendario.closest('.campo');
    caixa.classList.add('campo--erro');
    caixa.querySelector('.campo__erro').textContent =
      'O dia que tinha escolhido já não tem lugar para esta quantidade. Escolha outro.';
  }
}

function atualizarRegiao() {
  const codigoPostal = campos.codigoPostal.value.trim();
  const preenchidos = campos.codigoPostal.checkValidity() && campos.concelho.value !== '';
  document.querySelector('#fora-da-regiao').hidden = !preenchidos || entregamosEm(codigoPostal, campos.concelho.value);
}

function atualizarResumo() {
  const produto = produtoEscolhido();
  const quantidade = quantidadeEscolhida();
  const total = produto && quantidade ? produto.preco * quantidade : null;
  const foto = document.querySelector('#resumo-foto');

  foto.hidden = produto === null;
  if (produto) {
    foto.src = produto.foto;
    foto.alt = produto.nome;
  }
  document.querySelector('#resumo-produto').textContent = produto?.nome ?? 'Ainda não escolheu o produto.';
  document.querySelector('#resumo-preco').textContent = produto ? formatarPreco(produto.preco) : '—';
  document.querySelector('#resumo-quantidade').textContent = quantidade || '—';
  document.querySelector('#resumo-total').textContent = total === null ? '—' : formatarPreco(total);
  document.querySelector('#resumo-entrega').textContent =
    campos.data.value && campos.hora.value
      ? formatarEntrega({ data: campos.data.value, hora: campos.hora.value })
      : '—';
  document.querySelector('.resumo .botao').textContent =
    total === null ? 'Pagar com MB WAY' : `Pagar ${formatarPreco(total)} com MB WAY`;
}

function atualizarTudo() {
  atualizarQuantidade();
  atualizarPersonalizacao();
  atualizarCalendario();
  atualizarRegiao();
  atualizarResumo();
}

// Botões − e + da quantidade.
for (const botao of formulario.querySelectorAll('.contador button')) {
  botao.addEventListener('click', () => {
    const atual = Number(campos.quantidade.value) || 1;
    const nova = atual + Number(botao.dataset.passo);
    campos.quantidade.value = Math.min(Number(campos.quantidade.max), Math.max(1, nova));
    campos.quantidade.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// O telemóvel do MB WAY é o de contacto, até o cliente escrever outro.
let mbwayEditado = false;
campos.telefoneMbway.addEventListener('input', () => {
  mbwayEditado = true;
});
campos.telefone.addEventListener('input', () => {
  if (mbwayEditado) return;
  campos.telefoneMbway.value = campos.telefone.value;
  const caixaComErro = campos.telefoneMbway.closest('.campo--erro');
  if (caixaComErro) validarCampo(caixaComErro);
});

/* ---------- Pagar e confirmar ---------- */

function mostrarErro(falha) {
  // Um erro do navegador (DOMException) quer dizer que não deixou guardar os dados.
  erroEncomenda.textContent = falha instanceof DOMException
    ? 'Não foi possível guardar a encomenda neste navegador. Saia do modo privado e tente de novo.'
    : falha.message;
  erroEncomenda.hidden = false;
  erroEncomenda.scrollIntoView({ block: 'center' });

  // Se outro cliente ficou com o último lugar do dia, o calendário mostra-o já.
  pesoNoCalendario = null;
  atualizarCalendario();
  atualizarResumo();
}

function mostrarConfirmacao(encomenda) {
  const confirmacao = document.querySelector('#confirmacao');

  confirmacao.querySelector('[data-campo="nome"]').textContent = encomenda.cliente.nome.split(' ')[0];
  confirmacao.querySelector('[data-campo="numero"]').textContent = encomenda.numero;
  preencherDetalhes(confirmacao.querySelector('.detalhes'), detalhesDaEncomenda(encomenda));
  confirmacao.querySelector('#link-acompanhar').href = `acompanhar.html?numero=${encomenda.numero}`;
  confirmacao.querySelector('#botao-recibo').onclick = () => imprimir(criarRecibo(encomenda));

  document.querySelector('#area-encomenda').hidden = true;
  confirmacao.hidden = false;
  window.scrollTo(0, 0);
  confirmacao.focus();
}

// Simulação do MB WAY: o pedido "é aceite" ao fim de uns segundos
// e só então a encomenda é criada, já paga.
let esperaDoPagamento = null;

function pedirPagamento(dados) {
  const produto = produtoEscolhido();
  dialogoMbway.querySelector('[data-campo="total"]').textContent =
    formatarPreco(produto.preco * dados.linhas[0].quantidade);
  dialogoMbway.querySelector('[data-campo="telefone"]').textContent = formatarTelefone(dados.pagamento.telefone);
  dialogoMbway.showModal();

  esperaDoPagamento = setTimeout(() => {
    dialogoMbway.close();
    try {
      mostrarConfirmacao(criarEncomenda(dados));
    } catch (falha) {
      mostrarErro(falha);
    }
  }, 2500);
}

// Cancelar (pelo botão ou pela tecla Esc): não se cria nenhuma encomenda.
dialogoMbway.addEventListener('close', () => clearTimeout(esperaDoPagamento));
document.querySelector('#cancelar-mbway').addEventListener('click', () => dialogoMbway.close());

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!validarFormulario(formulario)) return;

  // As regras (dia cheio, região de Lisboa…) são confirmadas antes de pedir o pagamento.
  const dados = lerFormulario();
  try {
    validarEncomenda(dados);
  } catch (falha) {
    mostrarErro(falha);
    return;
  }
  erroEncomenda.hidden = true;
  pedirPagamento(dados);
});

formulario.addEventListener('input', atualizarTudo);
formulario.addEventListener('change', atualizarTudo);
limparErrosAoCorrigir(formulario);

// Se outra aba marcar uma encomenda, os dias livres podem mudar.
aoMudarDados(() => {
  pesoNoCalendario = null;
  atualizarCalendario();
});

atualizarTudo();
