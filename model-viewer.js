import * as THREE from './assets/vendor/three/three.module.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';
import { STLLoader } from './assets/vendor/three/STLLoader.js';

const host = document.querySelector('#model-canvas');
const status = document.querySelector('#model-status');
const select = document.querySelector('#model-select');
const buttons = [...document.querySelectorAll('[data-view-control]')];
// Reuse the exported geometry across previews and the single interactive viewer.
const geometryCache = new Map();
function getGeometry(name) {
  if (!geometryCache.has(name)) {
    const promise = fetch(`assets/models/${name}.stl`).then(async response => {
      if (!response.ok) throw new Error('Missing export');
      const geometry = new STLLoader().parse(await response.arrayBuffer());
      geometry.computeBoundingBox();
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      const extent = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(extent) || extent <= 0) throw new Error('Invalid geometry');
      geometry.center();
      geometry.scale(2 / extent, 2 / extent, 2 / extent);
      geometry.computeVertexNormals();
      return geometry;
    }).catch(error => { geometryCache.delete(name); throw error; });
    geometryCache.set(name, promise);
  }
  return geometryCache.get(name);
}
const gallery = document.querySelector('#interactive-model');
const dialog = document.createElement('dialog');
dialog.className = 'model-dialog';
dialog.setAttribute('aria-labelledby', 'model-heading');
const close = document.createElement('button');
close.type = 'button';
close.className = 'model-close';
close.textContent = 'Close viewer ×';
dialog.append(close, gallery);
document.body.append(dialog);
close.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => document.body.classList.remove('viewer-open'));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const previews = [];
const previewObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const preview = previews.find(item => item.button === entry.target);
    if (preview) preview.visible = entry.isIntersecting;
  }
});
async function initializePreviews() {
for (const button of document.querySelectorAll('.model-preview')) {
  button.addEventListener('click', () => {
    const changed = select.value !== button.dataset.model;
    select.value = button.dataset.model;
    dialog.showModal();
    document.body.classList.add('viewer-open');
    if (!renderer) initializeViewer();
    else if (changed) select.dispatchEvent(new Event('change'));
  });
  const initializePreview = async () => {
  try {
    const previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    const previewHost = button.querySelector('.preview-canvas');
    previewHost.append(previewRenderer.domElement);
    const previewScene = new THREE.Scene();
    const previewCamera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
    previewCamera.position.set(2.5, 1.9, 3);
    previewCamera.lookAt(0, 0, 0);
    previewScene.add(new THREE.HemisphereLight(0xffffff, 0x536354, 3));
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(3, 5, 4);
    previewScene.add(key);
    const turntable = new THREE.Group();
    previewScene.add(turntable);
    new ResizeObserver(() => {
      const { width, height } = previewHost.getBoundingClientRect();
      if (!width || !height) return;
      previewRenderer.setSize(width, height);
      previewCamera.aspect = width / height;
      previewCamera.updateProjectionMatrix();
    }).observe(previewHost);
    const preview = { button, visible: false };
    previews.push(preview);
    previewObserver.observe(button);
    const geometry = await getGeometry(button.dataset.model);
    const part = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x66ccff, metalness: 0.35, roughness: 0.4, side: THREE.DoubleSide }));
    part.rotation.x = -Math.PI / 2;
    turntable.add(part);
    let previous = 0;
    let lastRendered = 0;
    previewRenderer.setAnimationLoop(time => {
      const delta = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      if (!preview.visible || document.hidden || dialog.open) return;
      if (!reducedMotion.matches) turntable.rotation.y += delta * 0.18;
      if (time - lastRendered < 1000 / 30) return;
      lastRendered = time;
      previewRenderer.render(previewScene, previewCamera);
    });
  } catch {
    button.querySelector('.preview-canvas').textContent = 'Open 3D viewer';
    button.querySelector('.preview-label').textContent = '3D PROJECT';
  }
  };
  const loader = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    loader.disconnect();
    // Yield between expensive WebGL setups so input and painting stay responsive.
    if ('requestIdleCallback' in window) requestIdleCallback(initializePreview, { timeout: 1200 });
    else setTimeout(initializePreview, 0);
  }, { rootMargin: '100px' });
  loader.observe(button);
}
}
initializePreviews();

let renderer;
function initializeViewer() {
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch {
  status.textContent = '3D viewing is unavailable in this browser. Try a browser with WebGL enabled.';
}
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Interactive model. Drag to rotate, scroll to zoom, or use the view buttons.');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.5;
  controls.maxDistance = 12;
  controls.enablePan = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x536354, 3));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(3, 5, 4);
  scene.add(light);
  let mesh;
  let request = 0;
  const reset = () => {
    if (mesh) mesh.rotation.set(-Math.PI / 2, 0, 0);
    controls.target.set(0, 0, 0);
    camera.position.set(2.7, 2, 3.2);
    controls.update();
  };
  reset();
  new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }).observe(host);
  renderer.setAnimationLoop(() => {
    if (!dialog.open || document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  });
  host.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    status.textContent = 'The 3D view was interrupted. Reload the page to try again.';
  });
  async function load() {
    const id = ++request;
    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh = null;
    }
    buttons.forEach(button => button.disabled = true);
    host.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading model…';
    try {
      const geometry = (await getGeometry(select.value)).clone();
      if (id !== request) { geometry.dispose(); return; }
      mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x66ccff, metalness: 0.35, roughness: 0.4, side: THREE.DoubleSide }));
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);
      reset();
      buttons.forEach(button => button.disabled = false);
      document.querySelector('[data-view-control="wire"]').setAttribute('aria-pressed', 'false');
      status.textContent = `${select.selectedOptions[0].textContent} — drag to rotate, scroll or pinch to zoom.`;
    } catch {
      if (id === request) status.textContent = 'This model’s interactive preview is not available yet. Please check back soon.';
    } finally {
      if (id === request) host.setAttribute('aria-busy', 'false');
    }
  }
  select.addEventListener('change', load);
  buttons.forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.viewControl;
    if (action === 'reset') reset();
    if (action === 'left' || action === 'right') mesh.rotation.z += action === 'left' ? -Math.PI / 8 : Math.PI / 8;
    if (action === 'in' || action === 'out') {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * (action === 'in' ? 0.8 : 1.25), 0.5, 12));
      camera.position.copy(controls.target).add(offset);
    }
    if (action === 'wire') {
      mesh.material.wireframe = !mesh.material.wireframe;
      button.setAttribute('aria-pressed', String(mesh.material.wireframe));
    }
    controls.update();
  }));
  load();
}

}
