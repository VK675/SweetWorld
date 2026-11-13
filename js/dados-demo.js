// Dados de demonstração da Doces & Companhia.
// Encomendas, vendas ao balcão, stock e SMS inventados, para as listas e os relatórios
// não aparecerem vazios. O dados.js chama gerarDadosDemo() na primeira visita
// e quando o Gerente carrega em "Repor dados de demonstração".
// Com dados reais (Firebase), este ficheiro deixa de ser preciso.

function gerarDadosDemo() {
  // Números "ao acaso" que saem sempre iguais, para a demonstração não mudar a cada reposição.
  let semente = 20261112;
  const acaso = () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entre = (min, max) => min + Math.floor(acaso() * (max - min + 1));
  const escolher = (lista) => lista[entre(0, lista.length - 1)];
  const sorte = (probabilidade) => acaso() < probabilidade;
  // escolherComPeso([['a', 3], ['b', 1]]): o 'a' sai três vezes mais do que o 'b'.
  const escolherComPeso = (opcoes) => {
    let ponto = acaso() * opcoes.reduce((soma, [, peso]) => soma + peso, 0);
    for (const [valor, peso] of opcoes) {
      ponto -= peso;
      if (ponto < 0) return valor;
    }
    return opcoes.at(-1)[0];
  };

  /* ---------- Datas ---------- */

  const agora = new Date();
  const hojeData = dataLocal(agora);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const diaDaSemana = (data) => new Date(`${data}T12:00`).getDay();
  const domingo = (data) => diaDaSemana(data) === 0;
  const minutosDe = (hora) => Number(hora.slice(0, 2)) * 60;

  // Momento num dia, a tantos minutos da meia-noite. Nunca fica no futuro.
  const momento = (data, minutos) => {
    const m = new Date(`${data}T00:00`);
    m.setMinutes(minutos);
    return new Date(Math.min(m.getTime(), agora.getTime() - 60000)).toISOString();
  };

  const diaUtilSeguinte = (data) => {
    let dia = somarDias(data, 1);
    while (domingo(dia)) dia = somarDias(dia, 1);
    return dia;
  };

  // O dia em que a loja abriu há "n" dias úteis.
  const diaUtilHa = (n) => {
    let dia = hojeData;
    for (let i = 0; i < n; i += 1) {
      dia = somarDias(dia, -1);
      while (domingo(dia)) dia = somarDias(dia, -1);
    }
    return dia;
  };

  /* ---------- Clientes inventados ---------- */

  const NOMES = ['Ana', 'Maria', 'João', 'Pedro', 'Rita', 'Tiago', 'Inês', 'Miguel', 'Sofia', 'Rui', 'Marta',
    'Carlos', 'Beatriz', 'Nuno', 'Catarina', 'André', 'Helena', 'Paulo', 'Joana', 'Diogo', 'Teresa', 'Luís'];
  const APELIDOS = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins',
    'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho'];
  const RUAS = [
    ['Rua da Prata', '1100-420', 'Lisboa'],
    ['Avenida de Roma', '1000-265', 'Lisboa'],
    ['Rua Morais Soares', '1900-341', 'Lisboa'],
    ['Rua de Campo de Ourique', '1250-062', 'Lisboa'],
    ['Avenida da Igreja', '1700-236', 'Lisboa'],
    ['Estrada de Benfica', '1500-077', 'Lisboa'],
    ['Rua Elias Garcia', '2700-312', 'Amadora'],
    ['Rua Cândido dos Reis', '2780-211', 'Oeiras'],
    ['Avenida 25 de Abril', '2750-512', 'Cascais'],
    ['Rua Dr. Alfredo da Costa', '2710-523', 'Sintra'],
    ['Rua da República', '2670-470', 'Loures'],
    ['Rua Guilherme Gomes Fernandes', '2675-372', 'Odivelas'],
    ['Avenida 25 de Abril', '2640-456', 'Mafra'],
    ['Rua Alves Redol', '2600-099', 'Vila Franca de Xira'],
  ];
  const ANDARES = ['', '', '', 'R/C esquerdo', '1.º direito', '2.º B', '3.º esquerdo', '4.º frente'];
  const nomeCompleto = () => `${escolher(NOMES)} ${escolher(APELIDOS)}`;

  const clientes = Array.from({ length: 40 }, () => {
    const [rua, codigoPostal, concelho] = escolher(RUAS);
    return {
      nome: nomeCompleto(),
      telefone: `9${escolher(['1', '2', '3', '6'])}${entre(0, 9)} ${entre(100, 999)} ${entre(100, 999)}`,
      morada: `${rua}, ${entre(1, 180)}`,
      indicacoes: escolher(ANDARES),
      codigoPostal,
      concelho,
    };
  });

  /* ---------- Encomendas ---------- */

  const produto = (id) => PRODUTOS_INICIAIS.find((p) => p.id === id);
  const BOLOS = ['aniversario', 'chocolate', 'frutos-vermelhos', 'morango-natas'];
  const LEVES = ['pasteis-nata', 'macarons', 'bolachas-manteiga', 'bolachas-chocolate', 'bolachas-gengibre'];
  const MAIS_ENCOMENDADOS = [['aniversario', 5], ['chocolate', 3], ['frutos-vermelhos', 2], ['morango-natas', 2],
    ['torta-morango', 1], ['pasteis-nata', 3], ['macarons', 2], ['bolachas-manteiga', 2],
    ['bolachas-chocolate', 2], ['bolachas-gengibre', 1]];
  const TEXTOS = ['Parabéns, Marta!', 'Feliz aniversário, avó!', 'Parabéns, João!', 'Muitos parabéns, Inês!',
    '25 anos de casados', 'Bem-vinda, Clara!', 'Parabéns, campeão!'];
  const VELAS = ['1', '5', '7', '8', '10', '18', '30', '40', '50', '65'];
  const NOTAS = ['Sem frutos secos, por favor.', 'É para oferta: laço na caixa.', 'Menos açúcar na cobertura, se possível.'];
  const COZINHA = [['Susana', 3], ['Bruno', 1]];

  const encomendas = [];
  const ocupacao = {}; // dia → { n: encomendas, kg }
  const ocupar = (data, kg) => {
    ocupacao[data] ??= { n: 0, kg: 0 };
    ocupacao[data].n += Math.sign(kg);
    ocupacao[data].kg = arredondar(ocupacao[data].kg + kg);
  };

  // A encomenda é feita entre 1 e 7 dias antes da entrega, mas nunca depois de hoje.
  const momentoDaEncomenda = (dataEntrega) => {
    const antes = Math.max(1, diasEntre(hojeData, dataEntrega));
    const dia = somarDias(dataEntrega, -entre(antes, antes + 6));
    return dia === hojeData
      ? momento(dia, entre(Math.max(0, minutosAgora - 300), Math.max(1, minutosAgora - 2)))
      : momento(dia, entre(8 * 60, 22 * 60));
  };

  const novaEncomenda = (data, id, quantidade = 1) => {
    const p = produto(id);
    const cliente = escolher(clientes);
    const criadaEm = momentoDaEncomenda(data);
    const hora = escolher(HORAS_ENTREGA);
    encomendas.push({
      numero: 0,
      criadaEm,
      cliente: { nome: cliente.nome, telefone: cliente.telefone },
      linhas: [criarLinha(p, quantidade)],
      personalizacao: {
        texto: p.personalizavel && sorte(id === 'aniversario' ? 0.9 : 0.3) ? escolher(TEXTOS) : '',
        velas: p.personalizavel && sorte(id === 'aniversario' ? 0.8 : 0.15) ? escolher(VELAS) : '',
        notas: sorte(0.12) ? escolher(NOTAS) : '',
      },
      entrega: {
        morada: cliente.morada,
        indicacoes: cliente.indicacoes,
        codigoPostal: cliente.codigoPostal,
        concelho: cliente.concelho,
        data,
        hora,
      },
      pagamento: { metodo: 'mbway', telefone: cliente.telefone, em: criadaEm },
      estado: 'pendente',
      historico: [{
        em: criadaEm,
        estado: 'pendente',
        por: cliente.nome,
        papel: 'cliente',
        nota: 'Encomenda feita no site e paga por MB WAY',
      }],
      // Só para gerar os SMS, mais abaixo: os dias para que a entrega esteve marcada.
      marcacoes: [{ data, hora, desde: criadaEm }],
    });
    ocupar(data, p.peso * quantidade);
  };

  // Do primeiro dia do mês passado até daqui a duas semanas.
  const primeiroDia = dataLocal(new Date(agora.getFullYear(), agora.getMonth() - 1, 1));

  // Dois dias especiais, para mostrar os limites: um sábado já com 10 encomendas
  // e a sexta-feira anterior quase nos 10 kg (só cabem coisas leves).
  let diaCheio = somarDias(hojeData, 4);
  while (diaDaSemana(diaCheio) !== 6) diaCheio = somarDias(diaCheio, 1);
  const diaPesado = somarDias(diaCheio, -1);

  for (let data = primeiroDia; data <= somarDias(hojeData, 14); data = somarDias(data, 1)) {
    if (domingo(data)) continue;
    const distancia = diasEntre(hojeData, data);

    if (data === diaCheio) {
      novaEncomenda(data, 'aniversario');
      novaEncomenda(data, 'chocolate');
      for (let i = 0; i < MAX_ENCOMENDAS_DIA - 2; i += 1) novaEncomenda(data, escolher(LEVES));
      continue;
    }
    if (data === diaPesado) {
      // Sete bolos, 9,2 kg: já não cabe outro bolo, mas cabem bolachas.
      for (let i = 0; i < 7; i += 1) novaEncomenda(data, BOLOS[i % BOLOS.length]);
      continue;
    }

    let quantas;
    if (distancia <= 0) quantas = entre(3, 6) + (diaDaSemana(data) >= 5 ? 1 : 0);
    else if (distancia <= 2) quantas = 6 - distancia;
    else if (distancia <= 6) quantas = entre(1, 3);
    else quantas = entre(0, 2);

    for (let i = 0; i < quantas; i += 1) {
      let id = escolherComPeso(MAIS_ENCOMENDADOS);
      let quantidade = LEVES.includes(id) ? entre(1, 3) : 1;
      if ((ocupacao[data]?.kg ?? 0) + produto(id).peso * quantidade > 8.5) {
        id = escolher(LEVES);
        quantidade = 1;
      }
      novaEncomenda(data, id, quantidade);
    }
  }

  /* ---------- O que aconteceu a cada encomenda ---------- */

  const produzir = (e, data) => {
    const inicio = Math.max(7 * 60, minutosDe(e.entrega.hora) - 180) + entre(0, 25);
    const por = escolherComPeso(COZINHA);
    e.historico.push({ em: momento(data, inicio), estado: 'em-producao', por, papel: 'producao' });
    e.historico.push({ em: momento(data, inicio + entre(50, 95)), estado: 'pronta', por, papel: 'producao' });
    e.estado = 'pronta';
  };

  const entregar = (e, data, minutos) => {
    const nome = sorte(0.8) ? e.cliente.nome : nomeCompleto();
    const nota = e.estado === 'no-armazem' ? `Levantada no armazém por ${nome}` : `Recebida por ${nome}`;
    e.historico.push({ em: momento(data, minutos), estado: 'entregue', por: 'Michael', papel: 'entregador', nota });
    e.estado = 'entregue';
    e.recebidaPor = nome;
  };

  const deixarNoArmazemDemo = (e, data, minutos) => {
    e.levantarAte = somarDiasUteis(data, DIAS_ARMAZEM);
    e.historico.push({
      em: momento(data, minutos),
      estado: 'no-armazem',
      por: 'Michael',
      papel: 'entregador',
      nota: `O cliente pode levantar até ${formatarDia(e.levantarAte)}`,
    });
    e.estado = 'no-armazem';
  };

  // Procura, a partir de um dia, o primeiro em que a encomenda ainda cabe.
  const diaComEspaco = (aPartirDe, kg) => {
    let dia = domingo(aPartirDe) ? diaUtilSeguinte(aPartirDe) : aPartirDe;
    while ((ocupacao[dia]?.n ?? 0) >= MAX_ENCOMENDAS_DIA || (ocupacao[dia]?.kg ?? 0) + kg > MAX_KG_DIA) {
      dia = diaUtilSeguinte(dia);
    }
    return dia;
  };

  const remarcar = (e, data, minutos, aPartirDe) => {
    const antes = { data: e.entrega.data, hora: e.entrega.hora };
    const kg = pesoDe(e);
    const em = momento(data, minutos);
    ocupar(antes.data, -kg);
    e.entrega.data = diaComEspaco(aPartirDe, kg);
    e.entrega.hora = escolher(HORAS_ENTREGA);
    ocupar(e.entrega.data, kg);
    e.marcacoes.push({ data: e.entrega.data, hora: e.entrega.hora, desde: em });
    e.historico.push({
      em,
      estado: 'remarcada',
      por: 'Michael',
      papel: 'entregador',
      nota: `Entrega passou de ${formatarEntregaCurta(antes)} para ${formatarEntregaCurta(e.entrega)}`,
    });
    e.estado = 'remarcada';
  };

  // Entregas que correram mal, para haver exemplos de todos os estados.
  const doDia = (data) => encomendas.filter((e) => e.entrega.data === data);
  const casos = new Map([
    [doDia(diaUtilHa(1))[0], 'no-armazem'],
    [doDia(diaUtilHa(1))[1], 'remarcada'],
    [doDia(diaUtilHa(5))[0], 'no-armazem'],
    [doDia(diaUtilHa(8))[0], 'remarcada-e-entregue'],
    [doDia(diaUtilHa(11))[0], 'armazem-e-levantada'],
  ]);

  for (const e of encomendas.filter((encomenda) => encomenda.entrega.data < hojeData)) {
    const data = e.entrega.data;
    const tentativa = minutosDe(e.entrega.hora) + entre(-5, 25);
    produzir(e, data);

    switch (casos.get(e)) {
      case 'no-armazem':
        deixarNoArmazemDemo(e, data, tentativa);
        break;
      case 'armazem-e-levantada':
        deixarNoArmazemDemo(e, data, tentativa);
        entregar(e, diaUtilSeguinte(data), 16 * 60 + entre(0, 90));
        break;
      case 'remarcada':
        remarcar(e, data, tentativa, somarDias(hojeData, 1));
        break;
      case 'remarcada-e-entregue':
        remarcar(e, data, tentativa, diaUtilSeguinte(data));
        entregar(e, e.entrega.data, minutosDe(e.entrega.hora) + entre(-5, 25));
        break;
      default:
        entregar(e, data, tentativa);
    }
  }

  // Hoje: as entregas cuja hora já passou estão feitas; das outras, três estão prontas,
  // uma está a ser feita e as restantes esperam. As duas últimas do dia ficam sempre
  // por entregar, para haver o que experimentar a qualquer hora.
  const deHoje = doDia(hojeData).sort((a, b) => a.entrega.hora.localeCompare(b.entrega.hora));
  const porFazerHoje = [];
  deHoje.forEach((e, i) => {
    if (minutosDe(e.entrega.hora) + 30 < minutosAgora && i < deHoje.length - 2) {
      produzir(e, hojeData);
      entregar(e, hojeData, minutosDe(e.entrega.hora) + entre(-5, 25));
    } else {
      porFazerHoje.push(e);
    }
  });
  porFazerHoje.forEach((e, i) => {
    if (i < 3) {
      produzir(e, hojeData);
    } else if (i === 3) {
      e.historico.push({ em: momento(hojeData, 8 * 60 + 40), estado: 'em-producao', por: 'Susana', papel: 'producao' });
      e.estado = 'em-producao';
    }
  });

  // Os números seguem a ordem em que as encomendas foram feitas.
  encomendas.sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));
  encomendas.forEach((e, i) => {
    e.numero = 1001 + i;
  });

  /* ---------- SMS ---------- */

  // Lembrete dois dias antes, às 10:00 (ou logo a seguir à encomenda, se foi feita mais tarde).
  const sms = [];
  for (const e of encomendas) {
    for (const marcacao of e.marcacoes) {
      const doisDiasAntes = new Date(`${somarDias(marcacao.data, -DIAS_LEMBRETE)}T10:00`).getTime();
      const envio = new Date(Math.max(doisDiasAntes, Date.parse(marcacao.desde) + 120000));
      if (envio.getTime() < agora.getTime() - 60000 && dataLocal(envio) < marcacao.data) {
        sms.push(smsLembrete({ ...e, entrega: marcacao }, envio.toISOString()));
      }
    }
    delete e.marcacoes;

    const noArmazem = e.historico.find((registo) => registo.estado === 'no-armazem');
    if (noArmazem) sms.push(smsArmazem(e, noArmazem.em));
  }
  sms.sort((a, b) => a.em.localeCompare(b.em));

  /* ---------- Produtos do dia e vendas ao balcão ---------- */

  const MAIS_VENDIDOS = [['croissant', 6], ['queque', 4], ['pasteis-nata', 3], ['bolachas-manteiga', 2],
    ['bolachas-chocolate', 2], ['bolachas-gengibre', 1], ['macarons', 2], ['torta-morango', 1]];
  const stockHoje = {
    croissant: 30,
    queque: 18,
    'pasteis-nata': 12,
    'torta-morango': 2,
    macarons: 8,
    'bolachas-manteiga': 10,
    'bolachas-chocolate': 10,
    'bolachas-gengibre': 6,
  };
  const restante = { ...stockHoje };
  const vendas = [];

  const novaVenda = (data, minutos, pedidos) => {
    const linhas = [];
    for (const [id, pedida] of pedidos) {
      // Hoje não se pode vender mais do que o stock do dia.
      const quantidade = data === hojeData ? Math.min(pedida, restante[id]) : pedida;
      if (quantidade === 0) continue;
      if (data === hojeData) restante[id] -= quantidade;
      linhas.push(criarLinha(produto(id), quantidade));
    }
    if (linhas.length === 0) return;
    vendas.push({
      numero: 0,
      em: momento(data, minutos),
      por: 'Filipe',
      cliente: sorte(0.25) ? nomeCompleto() : '',
      metodo: sorte(0.55) ? 'dinheiro' : 'mbway',
      linhas,
    });
  };

  for (let data = primeiroDia; data <= hojeData; data = somarDias(data, 1)) {
    if (domingo(data)) continue;
    // Logo de manhã saem as duas tortas do dia: assim há um produto esgotado para mostrar.
    if (data === hojeData && minutosAgora > 9 * 60 + 20) novaVenda(data, 9 * 60 + 20, [['torta-morango', 2]]);

    const quantas = entre(8, 14) + (diaDaSemana(data) === 6 ? 4 : 0);
    for (let i = 0; i < quantas; i += 1) {
      const minutos = entre(9 * 60 + 5, 18 * 60 + 55);
      if (data === hojeData && minutos >= minutosAgora) continue;
      const ids = new Set(Array.from({ length: entre(1, 3) }, () => escolherComPeso(MAIS_VENDIDOS)));
      novaVenda(data, minutos, [...ids].map((id) => [id, ['croissant', 'queque'].includes(id) ? entre(1, 4) : entre(1, 2)]));
    }
  }
  vendas.sort((a, b) => a.em.localeCompare(b.em));
  vendas.forEach((venda, i) => {
    venda.numero = i + 1;
  });

  return {
    encomendas,
    vendas,
    stock: domingo(hojeData) ? {} : { [hojeData]: stockHoje },
    sms,
  };
}
