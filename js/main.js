/* Thor Trafikk — interaksjoner (vanilla, ingen avhengigheter) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var kr = function (n) { return Math.round(n).toLocaleString('nb-NO') + ' kr'; };

  /* ---------- Nav: solid når toppområdet er forbi ---------- */
  var nav = document.querySelector('.nav');
  var sentinel = document.querySelector('[data-nav-sentinel]');
  if (nav && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-solid', !entries[0].isIntersecting);
    }, { rootMargin: '-76px 0px 0px 0px' }).observe(sentinel);
  } else if (nav) {
    nav.classList.add('is-solid');
  }

  /* ---------- Mobilmeny ---------- */
  var burger = document.querySelector('.nav__burger');
  var menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Desktop dropdown (klikk/tastatur, hover styres av CSS) ---------- */
  document.querySelectorAll('.has-dd').forEach(function (dd) {
    var btn = dd.querySelector('.dd__btn');
    var panel = dd.querySelector('.dd__panel');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', 'false');
    var toggle = function (open) {
      panel.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function (e) { e.preventDefault(); toggle(!panel.classList.contains('is-open')); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false); });
  });

  /* ---------- Scroll-reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Tall som teller opp ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var formatNum = function (val, decimals) { return val.toFixed(decimals).replace('.', ','); };
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = prefix + formatNum(target, decimals) + suffix; return; }
    var start = performance.now(), dur = 1400;
    var tick = function (now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatNum(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatNum(target, decimals) + suffix;
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) { counters.forEach(runCount); }
    else {
      var co = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); obs.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ---------- FAQ: én åpen om gangen + filter + dyplenke ---------- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq details'));
  faqItems.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqItems.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
  // åpne dyplenket spørsmål (#sporsmal-...)
  if (location.hash.length > 1) {
    var target = document.getElementById(location.hash.slice(1));
    if (target && target.tagName === 'DETAILS') { target.open = true; }
  }
  var faqFilter = document.querySelector('[data-faq-filter]');
  if (faqFilter) {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.faq__group'));
    var emptyMsg = document.querySelector('.faq__empty');
    faqFilter.addEventListener('input', function () {
      var q = faqFilter.value.trim().toLowerCase();
      var anyVisible = false;
      faqItems.forEach(function (d) {
        var text = d.textContent.toLowerCase();
        var show = !q || text.indexOf(q) !== -1;
        d.hidden = !show;
        if (show) anyVisible = true;
      });
      groups.forEach(function (g) {
        var visible = g.querySelectorAll('.faq details:not([hidden])').length > 0;
        g.hidden = !visible;
      });
      if (emptyMsg) emptyMsg.classList.toggle('show', !anyVisible);
    });
  }

  /* ---------- Skjema (demo: trenger ekte endepunkt før lansering) ---------- */
  var form = document.querySelector('[data-lead-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form__status');
      if (status) {
        status.classList.add('is-ok');
        status.textContent = 'Takk! Vi har mottatt påmeldingen din og tar kontakt så snart vi kan for å avtale oppstart.';
        status.setAttribute('role', 'status');
      }
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.type !== 'submit' && el.type !== 'checkbox' && el.type !== 'radio') el.value = '';
      });
    });
  }

  /* ---------- Pris-estimator ---------- */
  var est = document.querySelector('[data-estimator]');
  if (est) {
    /* Priser fra Thor Trafikks prisliste (thortrafikk.no/prisliste). Oppdater ved prisendring. */
    var P = {
      trafikalt: 3740,     // Trafikalt grunnkurs (1750) + mørkekjøring (1990)
      time: 875,           // Kjøretime à 45 min (automat/manuell)
      trinn: 2380,         // Trinnvurdering trinn 2 (1190) + trinn 3 (1190)
      bane: 5895,          // Sikkerhetskurs på bane (4395) + NAF baneleie (1500)
      veg: 10330,          // Sikkerhetskurs på veg (1290 + 4375 + 3375 + 1290)
      leiebil: 2990,       // Leiebil til oppkjøring (inkl. 30 min oppvarming)
      forerprove: 1540     // Førerprøve (praktisk oppkjøring) hos Statens vegvesen, klasse B (på trafikkstasjon)
    };
    var gearBtns = est.querySelectorAll('[data-gear]');
    var timerVal = est.querySelector('#est-timer-val');
    var packPrice = est.querySelector('#est-pack-price');
    var cLeie = est.querySelector('#est-leiebil');
    var cFp = est.querySelector('#est-forerprove');
    var out = est.querySelector('#est-total');
    var brk = est.querySelector('#est-break');
    var minus = est.querySelector('#est-minus');
    var plus = est.querySelector('#est-plus');
    var gear = 'manuell', timer = 10, MIN = 0, MAX = 40;

    // Obligatoriske deler — hver kan hukes av/på i tilfelle eleven har tatt noe fra før
    var obl = [
      { el: est.querySelector('#est-trafikalt'), price: P.trafikalt, label: 'Trafikalt grunnkurs + mørkekjøring' },
      { el: est.querySelector('#est-trinn'),     price: P.trinn,     label: 'Trinnvurdering trinn 2 og 3' },
      { el: est.querySelector('#est-bane'),      price: P.bane,      label: 'Sikkerhetskurs på bane (inkl. baneleie)' },
      { el: est.querySelector('#est-veg'),       price: P.veg,       label: 'Sikkerhetskurs på veg' }
    ].filter(function (o) { return o.el; });

    var line = function (label, val) { return '<li><span>' + label + '</span><span class="est__amt">' + kr(val) + '</span></li>'; };

    var recalc = function () {
      var grunn = 0, sub = '';
      obl.forEach(function (o) { if (o.el.checked) { grunn += o.price; sub += '<li>' + o.label + '</li>'; } });
      var timerSum = timer * P.time;
      var leie = cLeie && cLeie.checked ? P.leiebil : 0;
      var fp = cFp && cFp.checked ? P.forerprove : 0;
      var total = grunn + timerSum + leie + fp;
      var lines = '';
      if (grunn > 0) lines += '<li class="est__group"><div class="est__grouptop"><span>Obligatorisk grunnpakke</span><span class="est__amt">' + kr(grunn) + '</span></div><ul class="est__sub">' + sub + '</ul></li>';
      lines += line(timer + ' kjøretimer (à 45 min)', timerSum);
      if (leie) lines += line('Leiebil til oppkjøring', leie);
      if (fp) lines += line('Førerprøve (Statens vegvesen)', fp);
      if (timerVal) timerVal.textContent = timer;
      if (packPrice) packPrice.textContent = kr(grunn);
      if (out) out.textContent = kr(total);
      if (brk) brk.innerHTML = lines;
    };

    gearBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        gear = b.getAttribute('data-gear');
        gearBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        timer = gear === 'automat' ? 8 : 10; // automat krever i snitt litt færre timer
        recalc();
      });
    });
    if (minus) minus.addEventListener('click', function () { timer = Math.max(MIN, timer - 1); recalc(); });
    if (plus) plus.addEventListener('click', function () { timer = Math.min(MAX, timer + 1); recalc(); });
    obl.forEach(function (o) { o.el.addEventListener('change', recalc); });
    if (cLeie) cLeie.addEventListener('change', recalc);
    if (cFp) cFp.addEventListener('change', recalc);
    recalc();
  }

  /* ---------- Teoriquiz ---------- */
  var quiz = document.querySelector('[data-quiz]');
  if (quiz) {
    var loadQuestions = function (cb) {
      var inline = document.getElementById('quiz-data');
      if (inline) { try { cb(JSON.parse(inline.textContent)); return; } catch (e) {} }
      if (window.fetch) {
        fetch('data/quiz.json').then(function (r) { return r.json(); })
          .then(function (d) { cb(d.questions || d); })
          .catch(function () { cb(null); });
      } else { cb(null); }
    };

    loadQuestions(function (questions) {
      if (!questions || !questions.length) { quiz.style.display = 'none'; return; }
      // bruk maks 6 spørsmål i widgeten
      questions = questions.slice(0, parseInt(quiz.getAttribute('data-limit') || '6', 10));
      var total = questions.length;
      var i = 0, score = 0, answered = false;
      var bar = quiz.querySelector('.quiz__bar i');
      var count = quiz.querySelector('.quiz__count');
      var qEl = quiz.querySelector('.quiz__q');
      var optsEl = quiz.querySelector('.quiz__opts');
      var fb = quiz.querySelector('.quiz__feedback');
      var actions = quiz.querySelector('.quiz__actions');
      var stage = quiz.querySelector('.quiz__stage');
      var result = quiz.querySelector('.quiz__result');

      var render = function () {
        answered = false;
        var q = questions[i];
        if (count) count.textContent = 'Spørsmål ' + (i + 1) + ' av ' + total;
        if (bar) bar.style.width = (i / total * 100) + '%';
        if (qEl) qEl.textContent = q.question;
        if (fb) { fb.classList.remove('show'); fb.innerHTML = ''; }
        if (actions) actions.innerHTML = '';
        optsEl.innerHTML = '';
        q.options.forEach(function (opt, idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'quiz__opt';
          b.innerHTML = '<span class="mark">' + String.fromCharCode(65 + idx) + '</span><span>' + opt + '</span>';
          b.addEventListener('click', function () { choose(idx, b); });
          optsEl.appendChild(b);
        });
      };

      var choose = function (idx, btn) {
        if (answered) return;
        answered = true;
        var q = questions[i];
        var buttons = optsEl.querySelectorAll('.quiz__opt');
        buttons.forEach(function (b, k) {
          b.disabled = true;
          if (k === q.answer) b.classList.add('is-correct');
        });
        if (idx === q.answer) { score++; }
        else { btn.classList.add('is-wrong'); }
        if (fb) {
          fb.innerHTML = '<b>' + (idx === q.answer ? 'Riktig! ' : 'Riktig svar: ' + String.fromCharCode(65 + q.answer) + '. ') + '</b>' + (q.explain || '');
          fb.classList.add('show');
        }
        if (bar) bar.style.width = ((i + 1) / total * 100) + '%';
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'btn btn--primary';
        var last = i === total - 1;
        next.innerHTML = (last ? 'Se resultat' : 'Neste spørsmål') + '<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
        next.addEventListener('click', function () { if (last) finish(); else { i++; render(); } });
        if (actions) actions.appendChild(next);
      };

      var finish = function () {
        if (stage) stage.hidden = true;
        if (bar) bar.style.width = '100%';
        if (count) count.textContent = 'Ferdig';
        var pct = Math.round(score / total * 100);
        var msg = pct >= 80 ? 'Sterkt! Du er godt på vei mot teoriprøven.' : pct >= 50 ? 'Bra start — litt mer øving, så sitter det.' : 'Helt normalt før du har øvd. Et teorikurs hos oss gjør susen.';
        if (result) {
          result.hidden = false;
          result.innerHTML = '<div class="quiz__score">' + score + ' / ' + total + '</div>' +
            '<p>' + msg + ' Vil du øve mer og ta teorien trygt? Vi kjører teorikurs i Molde.</p>' +
            '<div class="btn-row" style="justify-content:center">' +
            '<a class="btn btn--primary" href="teorikurs.html">Les om teorikurs<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>' +
            '<button type="button" class="btn btn--ghost" data-quiz-restart>Prøv igjen<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></span></button>' +
            '</div>';
          var rb = result.querySelector('[data-quiz-restart]');
          if (rb) rb.addEventListener('click', function () { i = 0; score = 0; result.hidden = true; if (stage) stage.hidden = false; render(); });
        }
      };

      render();
    });
  }

  /* ---------- TikTok: klikk for å spille av (lett facade → smooth scroll) ---------- */
  var ttScreen = document.querySelector('[data-tiktok]');
  if (ttScreen) {
    var poster = ttScreen.querySelector('.iphone__poster');
    if (poster) {
      poster.addEventListener('click', function () {
        var id = ttScreen.getAttribute('data-tiktok');
        var ifr = document.createElement('iframe');
        ifr.className = 'iphone__video';
        ifr.src = 'https://www.tiktok.com/player/v1/' + id + '?autoplay=1&rel=0&description=0&music_info=0&native_context_menu=0&closed_caption=0';
        ifr.title = 'Thor Trafikk på TikTok – @trafikkthor';
        ifr.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        ifr.setAttribute('allowfullscreen', '');
        poster.replaceWith(ifr);
      });
    }
  }

  /* ---------- År i footer ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
