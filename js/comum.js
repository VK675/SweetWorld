// Funções partilhadas pelas páginas: criar elementos, resumo da encomenda,
// validação de formulários, calendário de entregas e recibo para imprimir.

/* ---------- Criar elementos ---------- */

// criarElemento('p', { className: 'aviso', textContent: 'Olá' }, filho1, filho2)
// Os nomes com hífen ('aria-label', 'data-estado') são postos como atributos.
function criarElemento(etiqueta, propriedades = {}, ...filhos) {
  const elemento = document.createElement(etiqueta);
  for (const [nome, valor] of Object.entries(propriedades)) {
    if (nome.includes('-')) elemento.setAttribute(nome, valor);
    else elemento[nome] = valor;
  }
  elemento.append(...filhos);
  return elemento;
}

/* ---------- Resumo da encomenda ---------- */

// Preenche um <dl class="detalhes"> com pares [rótulo, valor]. Os valores vazios não aparecem.
function preencherDetalhes(lista, pares) {
  lista.replaceChildren(...pares.filter(([, valor]) => valor).map(([rotulo, valor]) =>
    criarElemento('div', {},
      criarElemento('dt', { textContent: rotulo }),
      criarElemento('dd', { textContent: valor }),
    ),
  ));
}

// "2 × Bolo de chocolate"
function descreverLinhas(registo) {
  return registo.linhas.map((linha) => `${linha.quantidade} × ${linha.nome}`).join(', ');
}

// O que o cliente vê sobre a sua encomenda.
function detalhesDaEncomenda(encomenda) {
  const { texto, velas, notas } = encomenda.personalizacao;
  return [
    ['Produto', descreverLinhas(encomenda)],
    ['Texto no bolo', texto],
    ['Velas', velas],
    ['Notas', notas],
    ['Entrega', formatarEntrega(encomenda.entrega)],
    ['Morada', formatarMorada(encomenda.entrega)],
    ['Total', formatarPreco(totalDe(encomenda))],
    ['Pagamento', `Pago por ${METODOS_PAGAMENTO[encomenda.pagamento.metodo]}`],
  ];
}

/* ---------- Validação de formulários ---------- */

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

/* ---------- Calendário de entregas ---------- */

// Desenha os próximos dias numa grelha de segunda a domingo. Cada dia é um botão de rádio,
// por isso o formulário valida-o como qualquer outro campo. Os dias cheios e os domingos
// aparecem, mas não se podem escolher.
// opcoes: nome (do campo), kg (peso da encomenda), ignorar (encomenda que muda de dia),
//         escolhido (data marcada), mostrarOcupacao (os funcionários veem "7/10" e os quilos).
function desenharCalendario(contentor, opcoes = {}) {
  const { nome = 'data', kg = 0, ignorar = null, escolhido = '', mostrarOcupacao = false } = opcoes;
  const agenda = agendaDeEntregas({ kg, ignorar });
  const diaEMes = (data) => new Date(`${data}T12:00`).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
  const grelha = criarElemento('div', { className: 'calendario__grelha' });

  for (const dia of ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']) {
    grelha.append(criarElemento('span', { className: 'calendario__semana', textContent: dia, 'aria-hidden': 'true' }));
  }

  // Casas vazias até ao dia da semana em que a agenda começa (segunda = 0).
  const primeiraCasa = (new Date(`${agenda[0].data}T12:00`).getDay() + 6) % 7;
  for (let i = 0; i < primeiraCasa; i += 1) grelha.append(criarElemento('span'));

  for (const dia of agenda) {
    const livre = dia.motivo === '';
    const fechado = dia.motivo === 'domingo';
    const explicacao = livre ? '' : MOTIVOS_DIA[dia.motivo];
    const ocupacao = `${dia.encomendas} de ${MAX_ENCOMENDAS_DIA} encomendas, ${formatarPeso(dia.kg)}`;

    const casa = criarElemento('label', {
      className: `dia${livre ? '' : ' dia--indisponivel'}${fechado ? ' dia--fechado' : ''}`,
      title: [explicacao, mostrarOcupacao && !fechado ? ocupacao : ''].filter(Boolean).join(' '),
    },
      criarElemento('input', {
        type: 'radio',
        name: nome,
        value: dia.data,
        required: true,
        disabled: !livre,
        checked: livre && dia.data === escolhido,
        'aria-label': [formatarDia(dia.data), explicacao, mostrarOcupacao && !fechado ? ocupacao : ''].filter(Boolean).join('. '),
      }),
      criarElemento('span', { className: 'dia__numero', textContent: Number(dia.data.slice(8)) }),
    );

    if (mostrarOcupacao && !fechado) {
      casa.append(
        criarElemento('small', { textContent: `${dia.encomendas}/${MAX_ENCOMENDAS_DIA}` }),
        criarElemento('small', { textContent: formatarPeso(dia.kg) }),
      );
    } else if (!livre && !fechado) {
      casa.append(criarElemento('small', { textContent: 'cheio' }));
    }
    grelha.append(casa);
  }

  contentor.replaceChildren(
    criarElemento('p', {
      className: 'calendario__periodo',
      textContent: `De ${diaEMes(agenda[0].data)} a ${diaEMes(agenda.at(-1).data)}`,
    }),
    grelha,
  );
}

/* ---------- Impressão ---------- */

// Põe o elemento numa área que só aparece no papel e abre a janela de impressão.
function imprimir(elemento) {
  document.querySelector('.impressao')?.remove();
  elemento.classList.add('impressao');
  document.body.append(elemento);
  window.print();
}

// Recibo de uma encomenda ou de uma venda ao balcão.
// É um recibo simples e não uma fatura: as faturas só podem sair de um programa certificado.
function criarRecibo(registo) {
  const eEncomenda = 'estado' in registo;
  const cliente = eEncomenda ? registo.cliente.nome : registo.cliente;
  const metodo = METODOS_PAGAMENTO[eEncomenda ? registo.pagamento.metodo : registo.metodo];
  const celula = (texto) => criarElemento('td', { textContent: texto });

  const dados = criarElemento('dl', { className: 'recibo__dados' });
  preencherDetalhes(dados, [
    [eEncomenda ? 'Encomenda n.º' : 'Venda n.º', String(registo.numero)],
    ['Data do pagamento', formatarDataCompleta(eEncomenda ? registo.pagamento.em : registo.em)],
    ['Cliente', cliente],
    ['Atendido por', eEncomenda ? '' : registo.por],
    ['Entrega', eEncomenda ? `${formatarEntrega(registo.entrega)} — ${formatarMorada(registo.entrega)}` : ''],
  ]);

  return criarElemento('section', { className: 'recibo' },
    criarElemento('p', { className: 'recibo__empresa', textContent: 'Doces & Companhia, Lda.' }),
    criarElemento('p', { className: 'recibo__contactos', textContent: 'Pastelaria artesanal · Lisboa · Tel. 912 345 678' }),
    criarElemento('h1', { textContent: 'Recibo' }),
    dados,
    criarElemento('table', { className: 'recibo__linhas' },
      criarElemento('thead', {},
        criarElemento('tr', {}, ...['Produto', 'Qtd.', 'Preço', 'Total'].map((titulo) =>
          criarElemento('th', { textContent: titulo, scope: 'col' }))),
      ),
      criarElemento('tbody', {}, ...registo.linhas.map((linha) =>
        criarElemento('tr', {},
          celula(linha.nome),
          celula(linha.quantidade),
          celula(formatarPreco(linha.preco)),
          celula(formatarPreco(linha.preco * linha.quantidade)),
        ))),
      criarElemento('tfoot', {},
        criarElemento('tr', {},
          criarElemento('th', { textContent: `Total pago (${metodo})`, colSpan: 3, scope: 'row' }),
          celula(formatarPreco(totalDe(registo))),
        ),
      ),
    ),
    criarElemento('p', {
      className: 'recibo__nota',
      textContent: 'Este documento é um recibo simples e não serve de fatura. Projeto escolar: a empresa é fictícia.',
    }),
  );
}
