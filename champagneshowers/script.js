/* ============================================
   CHAMPAGNE SHOWERS · Silent Cinematic
   Boot + flare choreography (no text layer)
   ============================================ */

(function () {
  'use strict';

  const coldOpen = document.getElementById('coldOpen');
  const veil = document.getElementById('veil');
  const lbTop = document.getElementById('lbTop');
  const lbBottom = document.getElementById('lbBottom');
  const flareLayer = document.getElementById('flareLayer');
  const scenes = Array.from(document.querySelectorAll('.scene'));

  /* ---- Preload first 4 scenes ---- */
  function preload() {
    return new Promise((resolve) => {
      const critical = scenes.slice(0, 4).map(s => s.querySelector('img'));
      let loaded = 0;
      const total = critical.length;
      if (total === 0) return resolve();
      critical.forEach(img => {
        if (img.complete) {
          loaded++;
          if (loaded === total) resolve();
        } else {
          const done = () => { loaded++; if (loaded === total) resolve(); };
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }
      });
      setTimeout(resolve, 4000);
    });
  }

  /* ---- Apply flare based on scene metadata ---- */
  function applyFlare(scene) {
    const flare = scene.dataset.flare;
    flareLayer.classList.remove('on', 'strong');
    if (flare === 'warm') flareLayer.classList.add('on');
    else if (flare === 'strong') flareLayer.classList.add('on', 'strong');
  }

  /* ---- Boot ---- */
  async function boot() {
    await preload();

    // Hold cold open for a beat of pure black, then dismiss
    setTimeout(() => { coldOpen.classList.add('gone'); }, 1400);

    // Veil drops just after
    setTimeout(() => { veil.classList.add('gone'); }, 2400);

    // Letterbox blooms in
    setTimeout(() => {
      lbTop.classList.add('cinema');
      lbBottom.classList.add('cinema');
    }, 2700);

    // First scene flare engages
    setTimeout(() => {
      applyFlare(scenes[0]);
    }, 3100);
  }

  /* ---- Scene observer: just toggles in-view + flare ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const scene = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        scene.classList.add('in-view');
        applyFlare(scene);
      } else if (entry.intersectionRatio < 0.1) {
        scene.classList.remove('in-view');
      }
    });
  }, {
    threshold: [0, 0.1, 0.5, 0.9],
    rootMargin: '0px'
  });

  scenes.forEach(s => io.observe(s));
  scenes[0].classList.add('in-view');

  /* ---- Keyboard nav ---- */
  let currentScene = 0;
  const observer2 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        currentScene = parseInt(entry.target.dataset.scene, 10);
      }
    });
  }, { threshold: [0.5] });
  scenes.forEach(s => observer2.observe(s));

  document.addEventListener('keydown', (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let target = currentScene;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') target++;
    if (e.key === 'ArrowUp' || e.key === 'PageUp') target--;
    if (e.key === 'Home') target = 0;
    if (e.key === 'End') target = scenes.length - 1;
    target = Math.max(0, Math.min(scenes.length - 1, target));
    scenes[target].scrollIntoView({ behavior: 'smooth' });
  });

  boot();

})();
