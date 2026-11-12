// Página inicial: mostra o catálogo a partir da camada de dados.

const lista = document.querySelector('#lista-produtos');
const modelo = document.querySelector('#modelo-produto');

for (const produto of listarProdutos().filter((p) => p.ativo)) {
  const cartao = modelo.content.cloneNode(true);
  const foto = cartao.querySelector('.produto__foto');

  foto.src = produto.foto;
  foto.alt = produto.nome;
  cartao.querySelector('.produto__nome').textContent = produto.nome;
  cartao.querySelector('.produto__descricao').textContent = produto.descricao;
  cartao.querySelector('.produto__preco').textContent = formatarPreco(produto.preco);

  const selo = cartao.querySelector('.produto__selo');
  if (produto.etiqueta) {
    selo.textContent = produto.etiqueta;
    selo.classList.add('produto__selo--destaque');
  }
  selo.hidden = selo.textContent === '';

  const botao = cartao.querySelector('.produto__botao');
  if (produto.porEncomenda) {
    botao.href = `encomendar.html?produto=${encodeURIComponent(produto.id)}`;
  } else {
    botao.replaceWith(Object.assign(document.createElement('span'), {
      className: 'produto__indisponivel',
      textContent: 'Só na loja',
    }));
  }

  lista.append(cartao);
}
