// ===== KOREAN CHARACTER NETWORK =====
(function () {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');

  const CHARS = '가나다라마바사아자차카타파하기니디리미비시이지치키티피히고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후그느드르므브스즈크트프흐'.split('');

  const CFG = {
    count:      85,
    speed:      0.38,
    maxDist:    125,
    mouseRad:   155,
    expThresh:  0.20,   // 20% ulanganda portlash
    expCooldown: 110,   // frame
    font:       "'Malgun Gothic','Apple SD Gothic Neo',sans-serif",
  };

  let W, H;
  let particles     = [];
  let shards        = [];      // portlash parchalari
  let mouse         = { x: null, y: null };
  let cooldown      = 0;
  let flashAlpha    = 0;

  /* ── ranglar ── */
  function C() {
    const lm = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      gold:  lm ? [201,122,18]  : [232,148,26],
      red:   lm ? [139,26,42]   : [180,40,55],
      line:  lm ? [139,26,42]   : [232,148,26],
      flash: lm ? 'rgba(201,122,18,' : 'rgba(232,148,26,',
    };
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randChar()  { return CHARS[Math.floor(Math.random() * CHARS.length)]; }
  function rgba([r,g,b], a) { return `rgba(${r},${g},${b},${a})`; }

  /* ── resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── particle yaratish ── */
  function makeP() {
    return {
      x:    rand(0, W),
      y:    rand(0, H),
      vx:   (Math.random() - 0.5) * CFG.speed,
      vy:   (Math.random() - 0.5) * CFG.speed,
      ch:   randChar(),
      size: rand(11, 18),
      type: Math.random() > 0.70 ? 'red' : 'gold',
      op:   rand(0.45, 0.80),
      near: false,
    };
  }

  function init() { particles = Array.from({ length: CFG.count }, makeP); }

  /* ── portlash ── */
  function explode() {
    if (cooldown > 0 || mouse.x === null) return;
    cooldown  = CFG.expCooldown;
    flashAlpha = 0.45;                     // flash boshlash

    // 36 ta shard yaratish
    for (let i = 0; i < 36; i++) {
      const angle = (Math.PI * 2 / 36) * i + rand(-0.15, 0.15);
      const spd   = rand(4, 13);
      shards.push({
        x:    mouse.x, y: mouse.y,
        vx:   Math.cos(angle) * spd,
        vy:   Math.sin(angle) * spd,
        ch:   randChar(),
        size: rand(13, 22),
        life: 1.0,
        decay: rand(0.018, 0.035),
        type: Math.random() > 0.5 ? 'gold' : 'red',
      });
    }

    // Yaqin particle larni uloqtirish
    for (const p of particles) {
      if (!p.near) continue;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d  = Math.sqrt(dx*dx + dy*dy) || 1;
      const f  = rand(6, 12);
      p.vx += (dx / d) * f;
      p.vy += (dy / d) * f;
      p.ch  = randChar();              // harf almashinsin
    }
  }

  /* ── asosiy render ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const c = C();

    // cooldown
    if (cooldown > 0) cooldown--;

    /* --- particle harakati & mouse tortish kuchi --- */
    let nearCount = 0;
    for (const p of particles) {
      // sichqonchaga sekin tortilish
      if (mouse.x !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d  = Math.hypot(dx, dy) || 1;
        // tortish kuchi: uzoqda kuchsiz, yaqinda o'rta — lekin juda katta emas
        const force = Math.min(0.012, 1.8 / (d * d) * 300);
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }

      // tezlik so'nishi
      p.vx *= 0.985;
      p.vy *= 0.985;

      // minimal tezlik (mouse yo'q paytda suzib yursin)
      if (mouse.x === null && Math.hypot(p.vx, p.vy) < CFG.speed * 0.25) {
        p.vx += (Math.random() - 0.5) * 0.12;
        p.vy += (Math.random() - 0.5) * 0.12;
      }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0)  { p.vx = Math.abs(p.vx);  p.x = 0; }
      if (p.x > W)  { p.vx = -Math.abs(p.vx); p.x = W; }
      if (p.y < 0)  { p.vy = Math.abs(p.vy);  p.y = 0; }
      if (p.y > H)  { p.vy = -Math.abs(p.vy); p.y = H; }

      p.near = false;
      if (mouse.x !== null) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < CFG.mouseRad) { p.near = true; nearCount++; }
      }
    }

    // portlash tekshiruvi
    if (nearCount >= Math.floor(CFG.count * CFG.expThresh)) explode();

    /* --- particle-particle chiziqlar --- */
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < CFG.maxDist) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = rgba(c.line, +((1 - d / CFG.maxDist) * 0.22).toFixed(3));
          ctx.lineWidth   = 0.65;
          ctx.stroke();
        }
      }

      /* --- mouse chiziqlar --- */
      if (a.near && mouse.x !== null) {
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        const bright = cooldown > CFG.expCooldown - 8;   // portlash daqiqasida yorqin
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = rgba(c.line, +((bright ? 0.9 : (1 - d / CFG.mouseRad) * 0.55)).toFixed(3));
        ctx.lineWidth   = bright ? 1.4 : 0.85;
        ctx.stroke();
      }
    }

    /* --- particle harflar --- */
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    for (const p of particles) {
      const alpha = p.near ? Math.min(p.op + 0.35, 1) : p.op;
      ctx.font      = `${p.size}px ${CFG.font}`;
      ctx.fillStyle = rgba(p.type === 'gold' ? c.gold : c.red, alpha);
      ctx.fillText(p.ch, p.x, p.y);
    }

    /* --- portlash shardlari --- */
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.vx *= 0.92; s.vy *= 0.92;
      s.x  += s.vx; s.y  += s.vy;
      s.life -= s.decay;
      if (s.life <= 0) { shards.splice(i, 1); continue; }

      ctx.globalAlpha = s.life;
      ctx.font        = `bold ${s.size}px ${CFG.font}`;
      ctx.fillStyle   = rgba(s.type === 'gold' ? c.gold : c.red, 1);
      ctx.fillText(s.ch, s.x, s.y);
    }
    ctx.globalAlpha = 1;

    /* --- flash effekti --- */
    if (flashAlpha > 0) {
      ctx.fillStyle = c.flash + flashAlpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      flashAlpha = Math.max(0, flashAlpha - 0.04);
    }

    requestAnimationFrame(draw);
  }

  resize();
  init();
  draw();

  window.addEventListener('resize',    () => { resize(); init(); });
  window.addEventListener('mousemove', e  => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave',()  => { mouse.x = null; mouse.y = null; });
})();

// ===== CURSOR GLOW =====
const cursorGlow = document.getElementById('cursor-glow');
let cursorVisible = false;

document.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top  = e.clientY + 'px';
  if (!cursorVisible) {
    cursorGlow.classList.add('visible');
    cursorVisible = true;
  }
});

document.addEventListener('mouseleave', () => {
  cursorGlow.classList.remove('visible');
  cursorVisible = false;
});

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// Mobile menu toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Scroll animations (IntersectionObserver)
const animEls = document.querySelectorAll('.fade-in, .fade-up');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

animEls.forEach(el => observer.observe(el));

// Trigger hero animations on load
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .fade-in, .hero .fade-up').forEach(el => {
    el.classList.add('visible');
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 100;
  const isLight = html.getAttribute('data-theme') === 'light';
  sections.forEach(sec => {
    const top    = sec.offsetTop;
    const height = sec.offsetHeight;
    const id     = sec.getAttribute('id');
    const link   = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) {
      link.style.color = (scrollY >= top && scrollY < top + height)
        ? (isLight ? '#1a0a05' : '#f0e8df')
        : '';
    }
  });
});
