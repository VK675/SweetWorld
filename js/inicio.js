// Página inicial: catálogo por categorias, a partir da camada de dados.

const lista = document.querySelector('#lista-produtos');
const filtros = document.querySelector('#filtros');
const modelo = document.querySelector('#modelo-produto');

for (const produto of listarProdutos().filter((p) => p.ativo)) {
  const cartao = modelo.content.cloneNode(true);
  const foto = cartao.querySelector('.produto__foto');

  cartao.querySelector('.produto').dataset.categoria = produto.categoria;
  foto.src = produto.foto;
  foto.alt = produto.nome;
  cartao.querySelector('.produto__categoria').textContent = CATEGORIAS[produto.categoria];
  cartao.querySelector('.produto__nome').textContent = produto.nome;
  cartao.querySelector('.produto__descricao').textContent = produto.descricao;
  cartao.querySelector('.produto__preco span').textContent = formatarPreco(produto.preco);
  cartao.querySelector('.produto__preco small').textContent = formatarPeso(produto.peso);

  const selo = cartao.querySelector('.produto__selo');
  selo.textContent = produto.etiqueta ?? '';
  selo.hidden = selo.textContent === '';

  // Os produtos que só se vendem prontos na loja não têm botão de encomenda.
  const botao = cartao.querySelector('.produto__botao');
  if (produto.porEncomenda) {
    botao.href = `encomendar.html?produto=${encodeURIComponent(produto.id)}`;
  } else {
    botao.replaceWith(Object.assign(document.createElement('span'), {
      className: 'produto__loja',
      textContent: 'Só na loja',
    }));
  }

  lista.append(cartao);
}

// Filtros: "Todos" e um botão por categoria.
function mostrarCategoria(categoria) {
  for (const botao of filtros.children) {
    botao.setAttribute('aria-pressed', String(botao.dataset.categoria === categoria));
  }
  for (const cartao of lista.children) {
    cartao.hidden = categoria !== '' && cartao.dataset.categoria !== categoria;
  }
}

for (const [categoria, nome] of [['', 'Todos'], ...Object.entries(CATEGORIAS)]) {
  const botao = Object.assign(document.createElement('button'), {
    type: 'button',
    className: 'filtro',
    textContent: nome,
  });
  botao.dataset.categoria = categoria;
  botao.addEventListener('click', () => mostrarCategoria(categoria));
  filtros.append(botao);
}
mostrarCategoria('');
