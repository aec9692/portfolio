(() => {
  let loading;
  let ready = false;
  const start = () => loading ||= import('./model-viewer.js').then(() => { ready = true; });
  document.addEventListener('click', event => {
    const button = event.target.closest('.model-preview');
    if (!button || ready) return;
    event.preventDefault();
    start().then(() => button.click());
  }, { capture: true });
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 100);
  }, { once: true });
})();
