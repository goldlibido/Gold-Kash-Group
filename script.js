/* ============================================
   CHAMPAGNE SHOWERS · The Descent
   Cinematic edition — choreography & state
   ============================================ */

(function () {
  'use strict';

  const coldOpen = document.getElementById('coldOpen');
  const veil = document.getElementById('veil');
  const rail = document.getElementById('rail');
  const railFill = document.getElementById('railFill');
  const railTicks = document.getElementById('railTicks');
  const chapter = document.getElementById('chapter');
  const chapterNum = chapter.querySelector('.chapter-num');
  const chapterName = chapter.querySelector('.chapter-name');
  const brandmark = document.querySelector('.brandmark');
  const hint = document.getElementById('hint');
  const lbTop = document.getElementById('lbTop');
  const lbBottom = document.getElementById('lbBottom');
  const flareLayer = document.getElementById('flareLayer');
  const actCard = document.getElementById('actCard');
  const actCardNum = actCard.querySelector('.act-card-num');
  const actCardName = actCard.querySelector('.act-card-name');
  const scenes = Array.from(document.querySelectorAll('.scene'));

  let currentScene = 0;
  let currentAct = 0;
  let everScrolled = false;
  let bootComplete = false;

  const ACT_NAMES = {
    1: { num: 'Act I',   name: 'Arrival' },
    2: { num: 'Act II',  name: 'The Approach' },
    3: { num: 'Act III', name: 'The Ritual' }
  };

  /* ---- Progress rail ticks ---- */
  scenes.forEach(() => {
    const tick = document.createElement('span');
    railTicks.appendChild(tick);
  });
  const tickEls = railTicks.querySelectorAll('span');

  /* ---- Preload critical images ---- */
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
      setTimeout(resolve, 4000); // safety
    });
  }

  /* ---- Boot sequence ---- */
  async function boot() {
    // Cold open studio card plays for ~3.6s (CSS animation duration)
    // After it fades, the veil sits behind it briefly, then preload finishes
    await preload();

    // Hold cold open for its full animation, then dismiss
    setTimeout(() => {
      coldOpen.classList.add('gone');
    }, 3400);

    // Veil dismiss shortly after
    setTimeout(() => {
      veil.classList.add('gone');
    }, 4400);

    // Letterbox blooms in
    setTimeout(() => {
      lbTop.classList.add('cinema');
      lbBottom.classList.add('cinema');
    }, 4700);

    // HUD chrome appears
    setTimeout(() => {
      rail.classList.add('ready');
      chapter.classList.add('ready');
      brandmark.classList.add('ready');
      hint.classList.add('ready');
      bootComplete = true;
      // Trigger initial scene flare based on data-flare
      applyFlare(scenes[0]);
    }, 5100);
  }

  /* ---- Update chapter label ---- */
  function updateChapter(scene) {
    const num = scene.dataset.chapter || '';
    const name = scene.dataset.title || '';
    if (chapterNum.textContent === num) return;
    chapter.classList.add('swapping');
    setTimeout(() => {
      chapterNum.textContent = num;
      chapterName.textContent = name;
      chapter.classList.remove('swapping');
    }, 280);
  }

  /* ---- Update progress rail ---- */
  function updateRail(index) {
    const pct = (index / Math.max(1, scenes.length - 1)) * 100;
    railFill.style.height = pct + '%';
    tickEls.forEach((t, i) => t.classList.toggle('active', i <= index));
  }

  /* ---- Hide hint ---- */
  function dismissHint() {
    if (!everScrolled) {
      everScrolled = true;
      hint.classList.add('hidden');
    }
  }

  /* ---- Apply flare based on scene metadata ---- */
  function applyFlare(scene) {
    const flare = scene.dataset.flare;
    flareLayer.classList.remove('on', 'strong');
    if (flare === 'warm') flareLayer.classList.add('on');
    else if (flare === 'strong') flareLayer.classList.add('on', 'strong');
  }

  /* ---- Show act title card between acts ---- */
  let actCardTimeout = null;
  function showActCard(act) {
    if (!ACT_NAMES[act] || !bootComplete) return;
    if (actCardTimeout) {
      clearTimeout(actCardTimeout);
      actCardTimeout = null;
    }
    actCardNum.textContent = ACT_NAMES[act].num;
    actCardName.textContent = ACT_NAMES[act].name;
    actCard.classList.add('show');
    actCardTimeout = setTimeout(() => {
      actCard.classList.remove('show');
    }, 1800);
  }

  /* ---- Scene observer ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const scene = entry.target;
      const idx = parseInt(scene.dataset.scene, 10);
      const act = parseInt(scene.dataset.act, 10);
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        scene.classList.add('in-view');
        const previousScene = currentScene;
        currentScene = idx;
        updateChapter(scene);
        updateRail(idx);
        applyFlare(scene);

        // Act transition card (only when act actually changes, not on initial)
        if (act && act !== currentAct && currentAct !== 0) {
          showActCard(act);
        }
        if (act) currentAct = act;

      } else if (entry.intersectionRatio < 0.1) {
        scene.classList.remove('in-view');
      }
    });
  }, {
    threshold: [0, 0.1, 0.5, 0.9],
    rootMargin: '0px'
  });

  scenes.forEach(s => io.observe(s));

  /* ---- Scroll listeners ---- */
  const scrollListener = () => {
    dismissHint();
    document.removeEventListener('scroll', scrollListener);
    document.removeEventListener('wheel', scrollListener);
    document.removeEventListener('touchmove', scrollListener);
  };
  document.addEventListener('scroll', scrollListener, { passive: true });
  document.addEventListener('wheel', scrollListener, { passive: true });
  document.addEventListener('touchmove', scrollListener, { passive: true });

  /* ---- Keyboard nav ---- */
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
    dismissHint();
  });

  /* ---- Initial state ---- */
  scenes[0].classList.add('in-view');
  updateChapter(scenes[0]);
  updateRail(0);
  currentAct = parseInt(scenes[0].dataset.act, 10) || 1;

  /* ---- AUDIO HOOK (uncomment to enable a score) ----
     Drop a track at audio/score.mp3, then uncomment:

     const score = new Audio('audio/score.mp3');
     score.loop = true;
     score.volume = 0.4;
     const startScore = () => { score.play().catch(() => {}); document.removeEventListener('click', startScore); document.removeEventListener('touchstart', startScore); };
     document.addEventListener('click', startScore, { once: true });
     document.addEventListener('touchstart', startScore, { once: true });
  -------------------------------------------------- */

  boot();

})();
