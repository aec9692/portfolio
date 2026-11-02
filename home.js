const scenicHome = document.querySelector('.scenic-home');
if (scenicHome) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...document.querySelectorAll('.scene-choice')];
  const layers = [...document.querySelectorAll('.scene-layer')];
  const pauseButton = document.getElementById('scenery-toggle');
  let paused = preference.matches;
  const selectScene = scene => {
    const selected = layers.find(layer => layer.dataset.scene === scene);
    if (scene !== 'lake' && !selected.style.backgroundImage) {
      const image = scene === 'forest' ? 'forest' : 'mountains';
      const size = matchMedia('(max-width: 760px)').matches && devicePixelRatio < 2 ? 'small' : 'large';
      selected.style.backgroundImage = 'url("assets/' + image + '-' + size + '.jpg")';
    }
    layers.forEach(layer => layer.classList.toggle('is-active', layer.dataset.scene === scene));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === scene)));
  };
  selectScene('lake');
  buttons.forEach(button => button.addEventListener('click', () => selectScene(button.dataset.scene)));
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const reset = () => {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    scenicHome.style.setProperty('--pointer-x', '0px');
    scenicHome.style.setProperty('--pointer-y', '0px');
  };
  const update = () => {
    scenicHome.classList.toggle('scenery-paused', paused);
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? 'Play scenery ▷' : 'Pause scenery Ⅱ';
    document.getElementById('scene-status').textContent = paused || preference.matches ? 'Pick a view. Make yourself at home.' : 'Move your pointer to look around.';
    reset();
  };
  pauseButton.addEventListener('click', () => { paused = !paused; update(); });
  preference.addEventListener('change', () => { paused = preference.matches; update(); });
  scenicHome.addEventListener('pointermove', event => {
    if (paused || preference.matches || event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const rect = scenicHome.getBoundingClientRect();
      scenicHome.style.setProperty('--pointer-x', (((pointerX - rect.left) / rect.width - .5) * -100) + 'px');
      scenicHome.style.setProperty('--pointer-y', (((pointerY - rect.top) / rect.height - .5) * -65) + 'px');
    });
  });
  scenicHome.addEventListener('pointerleave', reset);
  update();
}
