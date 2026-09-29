(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('.card, .gallery-item')];
  const pending = new Map();
  const reset = card => {
    cancelAnimationFrame(pending.get(card));
    pending.delete(card);
    card.classList.remove('is-tilting');
    ['--tilt-x','--tilt-y','--light-x','--light-y'].forEach(key => card.style.removeProperty(key));
  };
  cards.forEach(card => {
    // Use the stable grid cell as the reference, avoiding feedback from rotation.
    let box;
    card.addEventListener('pointerenter', () => { box = card.getBoundingClientRect(); });
    card.addEventListener('pointermove', event => {
      if (reduced.matches || !pointer.matches || event.pointerType !== 'mouse') return;
      if (!box) box = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
      const y = Math.max(0, Math.min(1, (event.clientY - box.top) / box.height));
      cancelAnimationFrame(pending.get(card));
      pending.set(card, requestAnimationFrame(() => {
        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-x', `${(0.5-y)*9}deg`);
        card.style.setProperty('--tilt-y', `${(x-0.5)*11}deg`);
        card.style.setProperty('--light-x', `${x*100}%`);
        card.style.setProperty('--light-y', `${y*100}%`);
        pending.delete(card);
      }));
    });
    ['pointerleave','pointercancel'].forEach(name => card.addEventListener(name, () => { reset(card); box = null; }));
  });
  const active = new Set();
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reduced.matches) return;
        const animation = entry.target.animate([
          { opacity: 0, translate: '0 25px' },
          { opacity: 1, translate: '0 0' }
        ], {duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
        active.add(animation);
        animation.onfinish = () => active.delete(animation);
      });
    }, {threshold:0.12});
    document.querySelectorAll('.section-title,.gallery-head,.card,.gallery-item,.step,.contact>div').forEach(el => observer.observe(el));
  }
  const stop = () => { cards.forEach(reset); if(reduced.matches){active.forEach(a => a.cancel());active.clear();} };
  reduced.addEventListener('change',stop);
  pointer.addEventListener('change',stop);
  window.addEventListener('blur',stop);
  window.addEventListener('scroll',stop,{passive:true});
})();
