// Gráficos simples em HTML, sem bibliotecas, para os relatórios do Gerente.
// Regras seguidas: barras finas (no máximo 24 px) com a ponta arredondada e a base direita,
// 2 px de intervalo entre as partes de uma barra, uma só cor quando há uma só série e
// legenda quando há duas, o valor na ponta, uma dica ao passar o rato ou com o teclado
// e, por baixo de cada gráfico, uma tabela com os mesmos números.

const somar = (valores) => valores.reduce((soma, valor) => soma + valor, 0);

/* ---------- Dica (aparece ao passar o rato ou ao chegar com o Tab) ---------- */

const dica = criarElemento('div', { className: 'dica' });
dica.setAttribute('role', 'tooltip');
dica.hidden = true;
document.body.append(dica);

// Cada marca com dica tem data-dica e a propriedade conteudoDica:
// { titulo, linhas: [{ cor, valor, nome }] }. O valor vem primeiro, em destaque.
function mostrarDica(alvo, x, y) {
  const { titulo, linhas } = alvo.conteudoDica;
  dica.replaceChildren(
    criarElemento('p', { className: 'dica__titulo', textContent: titulo }),
    ...linhas.map(({ cor, valor, nome }) => criarElemento('p', { className: 'dica__linha' },
      criarElemento('span', { className: 'dica__chave', style: `--cor: ${cor ?? 'transparent'}` }),
      criarElemento('strong', { textContent: valor }),
      criarElemento('span', { textContent: nome }),
    )),
  );
  dica.hidden = false;
  // Por cima do ponto indicado; por baixo, se não couber; sempre dentro do ecrã.
  const largura = dica.offsetWidth;
  const altura = dica.offsetHeight;
  dica.style.left = `${Math.min(Math.max(8, x - largura / 2), innerWidth - largura - 8)}px`;
  dica.style.top = `${y - altura - 14 < 8 ? y + 18 : y - altura - 14}px`;
}

function esconderDica() {
  dica.hidden = true;
}

function seguirPonteiro(evento) {
  const alvo = evento.target.closest?.('[data-dica]');
  if (alvo) mostrarDica(alvo, evento.clientX, evento.clientY);
  else esconderDica();
}

document.addEventListener('pointermove', seguirPonteiro);
document.addEventListener('pointerdown', seguirPonteiro);
document.addEventListener('focusin', (evento) => {
  const alvo = evento.target.closest('[data-dica]');
  if (!alvo) return;
  const caixa = alvo.getBoundingClientRect();
  mostrarDica(alvo, caixa.left + caixa.width / 2, caixa.top);
});
document.addEventListener('focusout', esconderDica);
window.addEventListener('scroll', esconderDica, { passive: true });

/* ---------- Barras horizontais ---------- */

// Uma barra por linha (quem chama ordena-as, da maior para a menor).
// series: [{ nome, cor }]; linhas: [{ nome, valores: [um por série] }];
// formatar: número → texto (por exemplo formatarPreco).
function desenharBarras(contentor, { series, linhas, formatar }) {
  const maximo = Math.max(0, ...linhas.map((linha) => somar(linha.valores)));

  contentor.replaceChildren(...linhas.map((linha) => {
    const total = somar(linha.valores);
    const partes = series.map((serie, i) => ({ ...serie, valor: linha.valores[i] }));
    const barra = criarElemento('div', {
      className: 'barra',
      tabIndex: 0,
      'data-dica': '',
      'aria-label': `${linha.nome}: ${partes.length > 1
        ? `${partes.map((p) => `${p.nome} ${formatar(p.valor)}`).join(', ')}; total ${formatar(total)}`
        : formatar(total)}`,
    },
      criarElemento('span', { className: 'barra__nome', textContent: linha.nome }),
      criarElemento('span', { className: 'barra__pista' },
        criarElemento('span', { className: 'barra__partes', style: `--fracao: ${maximo ? total / maximo : 0}` },
          ...partes.filter((p) => p.valor > 0).map((p) =>
            criarElemento('span', { className: 'barra__parte', style: `flex-grow: ${p.valor}; --cor: ${p.cor}` }))),
        criarElemento('span', { className: 'barra__valor', textContent: formatar(total) }),
      ),
    );
    barra.conteudoDica = {
      titulo: linha.nome,
      linhas: partes.length > 1
        ? [...partes.map((p) => ({ cor: p.cor, valor: formatar(p.valor), nome: p.nome })), { valor: formatar(total), nome: 'Total' }]
        : [{ cor: partes[0].cor, valor: formatar(total), nome: partes[0].nome }],
    };
    return barra;
  }));
}

/* ---------- Colunas (por exemplo, um valor por dia) ---------- */

// Eixo com números redondos: para um máximo de 437 → passo 200, topo 600.
function escalaRedonda(maximo) {
  if (maximo <= 0) return { passo: 1, topo: 1 };
  const bruto = maximo / 3;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= bruto);
  return { passo, topo: Math.ceil(maximo / passo) * passo };
}

// pontos: [{ valor, rotulo (texto por baixo, '' para nenhum), descricao, dica }].
function desenharColunas(contentor, { cor, pontos, formatarEixo }) {
  const { passo, topo } = escalaRedonda(Math.max(0, ...pontos.map((p) => p.valor)));
  const marcas = [];
  for (let valor = 0; valor <= topo + passo / 2; valor += passo) marcas.push(valor);
  const altura = (valor) => `${(valor / topo) * 100}%`;

  const colunas = pontos.map((ponto) => {
    const coluna = criarElemento('span', { className: 'coluna-grafico', tabIndex: 0, 'data-dica': '', 'aria-label': ponto.descricao },
      criarElemento('span', { className: 'coluna-grafico__barra', style: `height: ${altura(ponto.valor)}; --cor: ${cor}` }));
    coluna.conteudoDica = ponto.dica;
    return coluna;
  });

  contentor.replaceChildren(criarElemento('div', { className: 'colunas' },
    criarElemento('div', { className: 'colunas__eixo', 'aria-hidden': 'true' },
      ...marcas.map((valor) => criarElemento('span', { style: `bottom: ${altura(valor)}`, textContent: formatarEixo(valor) }))),
    criarElemento('div', { className: 'colunas__area' },
      ...marcas.map((valor) => criarElemento('span', { className: 'colunas__grelha', style: `bottom: ${altura(valor)}` })),
      criarElemento('div', { className: 'colunas__barras' }, ...colunas)),
    criarElemento('span'),
    criarElemento('div', { className: 'colunas__rotulos', 'aria-hidden': 'true' },
      ...pontos.map((ponto) => criarElemento('span', { textContent: ponto.rotulo }))),
  ));
}

/* ---------- Legenda e tabela ---------- */

// Só faz falta com duas ou mais séries; com uma, o título do gráfico já diz o que é.
function criarLegenda(series) {
  return criarElemento('ul', { className: 'legenda' }, ...series.map((serie) =>
    criarElemento('li', {},
      criarElemento('span', { className: 'legenda__cor', style: `--cor: ${serie.cor}` }),
      serie.nome,
    )));
}

// Os mesmos números do gráfico, para quem não o vê ou quer o valor exato.
function criarTabela(cabecalhos, linhas) {
  return criarElemento('table', { className: 'tabela' },
    criarElemento('thead', {},
      criarElemento('tr', {}, ...cabecalhos.map((texto) => criarElemento('th', { scope: 'col', textContent: texto })))),
    criarElemento('tbody', {}, ...linhas.map(([primeira, ...resto]) =>
      criarElemento('tr', {},
        criarElemento('th', { scope: 'row', textContent: primeira }),
        ...resto.map((texto) => criarElemento('td', { textContent: texto })),
      ))),
  );
}
