// Página "Área de funcionários": escolher a função, escrever o nome e entrar.

const formulario = document.querySelector('#form-entrar');
const campos = formulario.elements;
const jaEntrou = document.querySelector('#ja-entrou');
const erroEntrar = document.querySelector('#erro-entrar');

// Uma página de funcionário mandou para aqui quem ainda não tinha entrado:
// entrar.html?voltar=producao → depois de entrar volta à Produção.
const papelPedido = new URLSearchParams(location.search).get('voltar');
if (papelPedido in PAPEIS) campos.papel.value = papelPedido;

function mostrarSessao() {
  const sessao = obterSessao();
  jaEntrou.hidden = sessao === null;
  if (!sessao) return;
  jaEntrou.querySelector('[data-campo="nome"]').textContent = sessao.nome;
  jaEntrou.querySelector('[data-campo="papel"]').textContent = PAPEIS[sessao.papel];
  jaEntrou.querySelector('#continuar').href = PAGINAS_FUNCIONARIOS[sessao.papel];
}

jaEntrou.querySelector('#sair').addEventListener('click', () => {
  terminarSessao();
  mostrarSessao();
  campos.nome.focus();
});

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  erroEntrar.hidden = true;
  if (!validarFormulario(formulario)) return;

  try {
    iniciarSessao(campos.papel.value, campos.nome.value);
  } catch (erro) {
    erroEntrar.textContent = erro.message;
    erroEntrar.hidden = false;
    return;
  }
  location.href = PAGINAS_FUNCIONARIOS[campos.papel.value];
});

limparErrosAoCorrigir(formulario);
mostrarSessao();
