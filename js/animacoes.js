// Animações discretas, partilhadas por todas as páginas.

// Sombra no topo quando a página já não está no início.
const topo = document.querySelector('.topo');
const marcarTopo = () => topo.classList.toggle('topo--sombra', window.scrollY > 8);
window.addEventListener('scroll', marcarTopo, { passive: true });
marcarTopo();

// Elementos que aparecem ao entrar no ecrã.
// Só se escondem os que ainda estão abaixo do ecrã, para nada piscar ao abrir a página.
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduzirMovimento && 'IntersectionObserver' in window) {
  const observador = new IntersectionObserver((entradas) => {
    for (const { isIntersecting, target } of entradas) {
      if (!isIntersecting) continue;
      target.classList.add('revelado');
      // No fim, tira as classes para não atrasar as transições de hover.
      // (transitionend também chega dos filhos, por exemplo do zoom da foto.)
      target.addEventListener('transitionend', function terminar(evento) {
        if (evento.target !== target) return;
        target.classList.remove('revelar', 'revelado');
        target.removeEventListener('transitionend', terminar);
      });
      observador.unobserve(target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });

  for (const elemento of document.querySelectorAll('.seccao .sobretitulo, .seccao h2, .produto, .passos li')) {
    if (elemento.getBoundingClientRect().top < window.innerHeight) continue;
    // Cartões na mesma linha aparecem um a seguir ao outro.
    const posicao = [...elemento.parentElement.children].indexOf(elemento);
    elemento.style.setProperty('--ordem', posicao % 3);
    elemento.classList.add('revelar');
    observador.observe(elemento);
  }
}
