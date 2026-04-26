'use strict';

/* ─── NAVBAR ─────────────────────────────────────────────── */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const burgerBtn = document.getElementById('burger-btn');
  const navMenu   = document.getElementById('nav-menu');
  if (!navbar || !burgerBtn || !navMenu) return;

  const navLinks = navMenu.querySelectorAll('.nav-link, .nav-cta');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  const toggleMenu = (force) => {
    const isOpen = force !== undefined ? force : !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', isOpen);
    burgerBtn.classList.toggle('active', isOpen);
    burgerBtn.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  burgerBtn.addEventListener('click', () => toggleMenu());
  navLinks.forEach(link => link.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

  const sections = document.querySelectorAll('section[id]');
  const updateActive = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      const link = navMenu.querySelector(`a[href="#${sec.id}"]`);
      if (link) link.classList.toggle('nav-link--active', scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight);
    });
  };
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
}

/* ─── SCROLL REVEAL ──────────────────────────────────────── */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = entry.target.parentElement.querySelectorAll('.reveal');
      let delay = 0;
      siblings.forEach((sib, i) => { if (sib === entry.target) delay = i * 80; });
      setTimeout(() => entry.target.classList.add('visible'), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => observer.observe(el));
}

/* ─── CONTADORES HERO ────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.stat__number[data-target]');
  if (!counters.length) return;

  const animate = (el, target) => {
    const start = performance.now();
    const duration = 1800;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(ease(progress) * target).toLocaleString('pt-BR');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(el => animate(el, +el.dataset.target));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target, +entry.target.dataset.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

/* ─── SLIDER DE AVALIAÇÕES ───────────────────────────────── */
function initSlider() {
  const track  = document.getElementById('reviews-track');
  const prev   = document.getElementById('prev-btn');
  const next   = document.getElementById('next-btn');
  const dots   = document.getElementById('slider-dots');
  if (!track || !prev || !next || !dots) return;

  const cards = Array.from(track.querySelectorAll('.review-card'));
  let current = 0, autoId = null;

  const visible  = () => window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
  const total    = () => Math.ceil(cards.length / visible());
  const cardW    = () => (cards[0]?.offsetWidth ?? 0) + 24;

  const buildDots = () => {
    dots.innerHTML = '';
    for (let i = 0; i < total(); i++) {
      const d = document.createElement('button');
      d.className = 'dot';
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.addEventListener('click', () => { goTo(i); resetAuto(); });
      dots.appendChild(d);
    }
    syncDots();
  };
  const syncDots = () => dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));

  const goTo = (i) => {
    current = Math.max(0, Math.min(i, total() - 1));
    track.style.transform = `translateX(-${current * visible() * cardW()}px)`;
    syncDots();
  };
  const goNext = () => goTo(current >= total() - 1 ? 0 : current + 1);
  const goPrev = () => goTo(current <= 0 ? total() - 1 : current - 1);

  next.addEventListener('click', () => { goNext(); resetAuto(); });
  prev.addEventListener('click', () => { goPrev(); resetAuto(); });

  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const d = tx - e.changedTouches[0].screenX;
    if (Math.abs(d) > 50) { d > 0 ? goNext() : goPrev(); resetAuto(); }
  }, { passive: true });

  const startAuto = () => { autoId = setInterval(goNext, 5000); };
  const stopAuto  = () => clearInterval(autoId);
  const resetAuto = () => { stopAuto(); startAuto(); };

  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { buildDots(); goTo(0); }, 200);
  });

  buildDots();
  goTo(0);
  startAuto();
}

/* ─── LIGHTBOX DA GALERIA ────────────────────────────────── */
function initLightbox() {
  const items = document.querySelectorAll('.gallery__item');
  if (!items.length) return;

  const style = document.createElement('style');
  style.textContent = `
    #lightbox { position:fixed; inset:0; z-index:300; display:flex; align-items:center; justify-content:center; opacity:0; pointer-events:none; transition:opacity .3s; }
    #lightbox.open { opacity:1; pointer-events:all; }
    .lb-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.92); backdrop-filter:blur(8px); }
    .lb-box { position:relative; z-index:1; width:min(90vw,900px); height:min(80vh,600px); border-radius:12px; overflow:hidden; transform:scale(.92); transition:transform .3s; }
    #lightbox.open .lb-box { transform:scale(1); }
    .lb-img { width:100%; height:100%; background-size:cover; background-position:center; }
    .lb-close { position:absolute; top:12px; right:14px; z-index:2; background:rgba(0,0,0,.7); border:1px solid rgba(201,168,76,.4); border-radius:50%; width:38px; height:38px; color:#fff; font-size:1.3rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; }
    .lb-close:hover { background:#c9a84c; color:#0a0a0a; }
  `;
  document.head.appendChild(style);

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `<div class="lb-backdrop"></div><div class="lb-box"><button class="lb-close" aria-label="Fechar">&times;</button><div class="lb-img" id="lb-img"></div></div>`;
  document.body.appendChild(lb);

  const img    = lb.querySelector('#lb-img');
  const closeB = lb.querySelector('.lb-close');

  const open  = bg => { img.style.backgroundImage = bg; lb.classList.add('open'); document.body.style.overflow = 'hidden'; closeB.focus(); };
  const close = ()  => { lb.classList.remove('open'); document.body.style.overflow = ''; };

  items.forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'Ver imagem em tela cheia');
    item.addEventListener('click', () => { const d = item.querySelector('.gallery__img'); if (d) open(d.style.backgroundImage); });
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
  });

  closeB.addEventListener('click', close);
  lb.querySelector('.lb-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
}

/* ─── SMOOTH SCROLL ──────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
    });
  });
}

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initSmoothScroll();
  initNavbar();
  initCounters();
  initSlider();
  initLightbox();
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
