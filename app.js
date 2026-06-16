
'use strict';
/* ──────────────────────────────
   TINY DOM HELPERS
────────────────────────────── */
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));


/* ──────────────────────────────
   1. NAV — scroll class + active link
────────────────────────────── */
const navEl = $('#nav');

window.addEventListener('scroll', () => {
  navEl.classList.toggle('scrolled', window.scrollY > 50);
  let cur = '';
  $$('section[id]').forEach(s => {
    if (window.scrollY + 120 >= s.offsetTop) cur = s.id;
  });
  $$('.nav-links a').forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === '#' + cur)
  );
}, { passive: true });


/* ──────────────────────────────
   2. MOBILE HAMBURGER DRAWER
────────────────────────────── */
const hBtn   = $('#hamburger');
const drawer = $('#mobileDrawer');

const openDrawer  = () => { hBtn.classList.add('open');    drawer.classList.add('open');    hBtn.setAttribute('aria-expanded','true');  };
const closeDrawer = () => { hBtn.classList.remove('open'); drawer.classList.remove('open'); hBtn.setAttribute('aria-expanded','false'); };

hBtn.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
$$('.drawer-link').forEach(a => a.addEventListener('click', closeDrawer));
document.addEventListener('click', e => {
  if (!navEl.contains(e.target) && !drawer.contains(e.target)) closeDrawer();
});


/* ──────────────────────────────
   3. HERO COUNTERS — ease-out cubic
────────────────────────────── */
function countUp(el, end, suffix, ms) {
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / ms, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * end).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

let countersFired = false;
new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !countersFired) {
    countersFired = true;
    setTimeout(() => {
      countUp($('#cnt-families'), 250000, '+',  2400);
      countUp($('#cnt-claims'),   98,     '%',  2000);
      countUp($('#cnt-years'),    25,     '+',  1800);
      countUp($('#cnt-sat'),      99,     '%',  2000);
    }, 900);
  }
}, { threshold: 0.4 }).observe($('#home'));


/* ──────────────────────────────
   4. SCROLL CUE
────────────────────────────── */
const cue = $('#scrollCue');
if (cue) {
  const go = () => $('#about').scrollIntoView({ behavior: 'smooth' });
  cue.addEventListener('click', go);
  cue.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
}


/* ──────────────────────────────
   5. GENERIC SCROLL REVEAL
      Adds .visible on enter,
      removes .visible when element scrolls back ABOVE viewport
────────────────────────────── */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
      if (isIntersecting) {
        target.classList.add('visible');
      } else if (boundingClientRect.top > 0) {
        // Element is above the screen — reset so it can re-animate on scroll down
        target.classList.remove('visible');
      }
    });
  }, { threshold: 0.13 });

  $$('.reveal, .reveal-left, .reveal-right, .reveal-stagger')
    .forEach(el => obs.observe(el));
})();


/* ──────────────────────────────
   6. PRODUCT CAROUSEL
      · Section-level page-scroll triggers the WOW cascade
      · Cards reset when section scrolls back above viewport
      · Horizontal scroll also reveals cards entering view
      · Drag (desktop) + swipe (mobile) + arrow buttons
      · Dot indicators auto-generated & synced
────────────────────────────── */
(function initProducts() {
  const track   = $('#productTrack');
  const sect    = $('#product');
  let   cards   = $$('.pcard', track);   // all 10 cards
  let   visible = [...cards];            // currently shown subset
  let   sectIn  = false;                 // is product section in page viewport?

  /* Build dot buttons */
  function buildDots(vis) {
    const wrap = $('#productDots');
    wrap.innerHTML = '';
    vis.forEach((card, i) => {
      const b = document.createElement('button');
      b.className = 'prod-dot' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Product ' + (i + 1));
      b.addEventListener('click', () =>
        card.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'start' })
      );
      wrap.appendChild(b);
    });
  }
  buildDots(visible);

  /* Sync active dot */
  function syncDots() {
    const vis  = cards.filter(c => c.style.display !== 'none');
    const dots = $$('.prod-dot');
    const tL   = track.getBoundingClientRect().left;
    let best = 0, minD = Infinity;
    vis.forEach((c, i) => {
      const d = Math.abs(c.getBoundingClientRect().left - tL);
      if (d < minD) { minD = d; best = i; }
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === best));
  }
  track.addEventListener('scroll', syncDots, { passive: true });

  /* Cascade reveal with stagger */
  function cascade(vis) {
    vis.forEach((c, i) => {
      setTimeout(() => { if (sectIn) c.classList.add('revealed'); }, i * 95 + 60);
    });
  }

  /* Page-scroll section observer → trigger cascade OR reset */
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      sectIn = true;
      cascade(cards.filter(c => c.style.display !== 'none'));
    } else if (e.boundingClientRect.top > 0) {
      // Scrolled back above → full reset
      sectIn = false;
      cards.forEach(c => c.classList.remove('revealed'));
    }
  }, { threshold: 0.05 }).observe(sect);

  /* Horizontal observer — reveal cards entering track viewport,
     re-hide cards that scroll back off the left edge */
  const hObs = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting, boundingClientRect }) => {
      if (isIntersecting && sectIn) {
        target.classList.add('revealed');
      } else if (!isIntersecting && boundingClientRect.left < 0 && sectIn) {
        target.classList.remove('revealed');
      }
    });
  }, { root: track, threshold: 0.12 });
  cards.forEach(c => hObs.observe(c));

  /* Arrow buttons */
  $('#trackPrev').addEventListener('click', () => track.scrollBy({ left: -340, behavior: 'smooth' }));
  $('#trackNext').addEventListener('click', () => track.scrollBy({ left:  340, behavior: 'smooth' }));

  /* Desktop drag */
  let drag = false, dX = 0, dSL = 0;
  track.addEventListener('mousedown', e => {
    drag = true; dX = e.pageX - track.offsetLeft; dSL = track.scrollLeft;
    track.style.cursor = 'grabbing'; track.style.userSelect = 'none';
  });
  document.addEventListener('mouseup', () => {
    drag = false; track.style.cursor = ''; track.style.userSelect = '';
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    e.preventDefault();
    track.scrollLeft = dSL - (e.pageX - track.offsetLeft - dX);
  });

  /* Touch swipe */
  let tx0 = 0;
  track.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchmove',  e => {
    const dx = tx0 - e.touches[0].clientX;
    track.scrollLeft += dx * 0.8;
    tx0 = e.touches[0].clientX;
  }, { passive: true });

  /* Filter pills */
  $$('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.cat;
      cards.forEach(c => c.classList.remove('revealed'));

      requestAnimationFrame(() => {
        visible = [];
        cards.forEach(c => {
          const show = cat === 'all' || c.dataset.cat === cat;
          c.style.display = show ? '' : 'none';
          if (show) visible.push(c);
        });
        track.scrollLeft = 0;
        buildDots(visible);
        cascade(visible);
      });
    });
  });
})();


/* ──────────────────────────────
   7. WHY US TICKER
────────────────────────────── */
(function initTicker() {
  const reasons = [
    { ic:'⚡',  t:'15-Minute Approval'       },
    { ic:'🔒',  t:'Premium Lock for Life'    },
    { ic:'💸',  t:'48-Hour Claim Payout'     },
    { ic:'🤝',  t:'No Hidden Fees, Ever'     },
    { ic:'📱',  t:'Manage 100% Online'       },
    { ic:'🏆',  t:'A+ Regulator Rating'      },
    { ic:'👨‍👩‍👧‍👦',t:'Family Bundle Discounts' },
    { ic:'🌍',  t:'Global Emergency Cover'   },
    { ic:'📊',  t:'Real-Time Dashboard'      },
    { ic:'🎓',  t:'Free Financial Advisor'   },
    { ic:'🇰🇭', t:'Khmer-Speaking Support'   },
    { ic:'💼',  t:'Corporate Group Plans'    },
  ];
  const el = $('#whyTicker');
  [...reasons, ...reasons].forEach(r => {
    const c = document.createElement('div');
    c.className = 't-chip';
    c.innerHTML = `<span class="t-ic">${r.ic}</span><span class="t-txt">${r.t}</span>`;
    el.appendChild(c);
  });
})();


/* ──────────────────────────────
   8. CONTACT FORM
────────────────────────────── */
$('#contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn  = this.querySelector('.form-submit');
  const orig = btn.textContent;
  btn.textContent = 'Sending…';
  btn.disabled = true;
  // Swap with your real endpoint / API call here
  setTimeout(() => {
    btn.textContent = '✓ Request Sent!';
    btn.style.background = '#2e7d32';
    this.reset();
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.disabled = false;
    }, 3500);
  }, 1200);
});
