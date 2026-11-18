/*
 * Wall Cards — custom cards για wall-mounted tablet (Home Assistant)
 * Ένα αρχείο, χωρίς build step και χωρίς εξαρτήσεις.
 *
 * Δομή:
 *   1. Κοινή βάση (fonts, tokens, WallBaseCard, helpers)
 *   2. Κάρτες (μία κλάση ανά τύπο)
 *   3. Καταχώριση (customElements + λίστα «Προσθήκη κάρτας»)
 *
 * Νέα κάρτα = νέα κλάση που κληρονομεί το WallBaseCard + μία γραμμή στο register().
 * Κανόνες και design language: AGENTS.md
 */
const VERSION = '0.3.0';

/* ───────────────────────── 1. Κοινή βάση ───────────────────────── */

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800' +
  '&family=Material+Symbols+Rounded:opsz,wght,FILL@20..48,400,0..1&display=block';

function ensureFonts() {
  if (document.getElementById('wall-cards-fonts')) return;
  const link = document.createElement('link');
  link.id = 'wall-cards-fonts';
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  document.head.appendChild(link);
}

/* Design tokens + στοιχεία που μοιράζονται όλες οι κάρτες */
const BASE_CSS = `
:host{
  --w-ink:#1c2228; --w-muted:#5b6670; --w-faint:#7a858f;
  --w-card:rgba(255,255,255,.75); --w-track:#e1e6eb;
  --w-ok:oklch(0.55 0.12 150); --w-warn:oklch(0.6 0.15 50);
  --w-blue:oklch(0.55 0.1 228); --w-blue-bg:oklch(0.94 0.025 228);
  --w-amber:#e09a1f; --w-hot:oklch(0.62 0.17 35); --w-cold:oklch(0.55 0.13 240);
  --w-font:'Manrope',sans-serif;
  --w-spring:cubic-bezier(.3,1.4,.5,1);
  display:block; height:100%; border-radius:24px;
  box-shadow:0 0 0 1px rgba(40,50,60,.05),0 8px 20px rgba(40,50,60,.10);
  font-family:var(--w-font); color:var(--w-ink);
  -webkit-font-smoothing:antialiased;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
/* Στην αφή: όχι «λάμψη» του Android πάνω στην κάρτα, όχι επιλογή κειμένου, όχι καθυστέρηση διπλού πατήματος */
.card{-webkit-user-select:none;user-select:none;touch-action:manipulation}
button{font:inherit;border:0;padding:0;cursor:pointer;color:inherit;background:none;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
.card{
  height:100%; min-height:var(--w-min-h,228px);
  border-radius:24px; padding:16px 18px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:space-between;
  background:var(--w-card); transition:background .4s, opacity .3s;
}
.card.on{background:var(--tint,var(--w-card))}
.card.unavail{opacity:.5}
.head{display:flex;flex-direction:column;min-width:0}
.title{font:600 17px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sub{font:500 15px var(--w-font);color:var(--w-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ms{
  font-family:'Material Symbols Rounded'; font-weight:400; font-style:normal; line-height:1;
  letter-spacing:normal; text-transform:none; white-space:nowrap; direction:ltr;
  -webkit-font-feature-settings:'liga'; font-feature-settings:'liga';
}
.fill{font-variation-settings:'FILL' 1}
.press{transition:transform .15s}
.press:active{transform:scale(.95)}

/* Κεφαλίδα με στρογγυλό κουμπί (έναρξη/παύση ή on/off) */
.top{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.pbtn{flex:none;width:56px;height:56px;margin:-8px -8px 0 0;border-radius:50%;display:grid;place-items:center;
  font-size:30px;background:#fff;color:var(--w-ink);transition:background .3s,color .3s,transform .15s}
.pbtn:active{transform:scale(.94)}
.pbtn:disabled{opacity:.4;cursor:default}
.on .pbtn{background:var(--acc,var(--w-blue));color:#fff}

/* Δαχτυλίδι προόδου με «παράθυρο» στη μέση + μεγάλος αριθμός δίπλα */
.row{position:relative;display:flex;align-items:center;gap:14px}
.dial{position:relative;width:76px;height:76px;flex:none;border-radius:50%;
  background:conic-gradient(var(--ring,var(--acc,var(--w-blue))) 0 var(--pct,0%),rgba(0,0,0,.08) var(--pct,0%) 100%)}
.drum{position:absolute;inset:6px;border-radius:50%;background:#f4f6f8;overflow:hidden}
.time{display:flex;flex-direction:column;min-width:0}
.big{font:400 40px var(--w-font);letter-spacing:-1.5px;line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums}

/* Ζεύγος κουμπιών − / + */
.steps{position:relative;display:flex;gap:10px}
.steps button{flex:1;height:44px;border-radius:22px;background:#fff;font-size:28px;box-shadow:0 1px 3px rgba(0,0,0,.08);transition:transform .15s}
.steps button:active{transform:scale(.96)}

/* Θερμότητα που ανεβαίνει / ψύχος που πέφτει */
@keyframes heat-rise{0%{transform:translateY(40px) scale(.7);opacity:0}35%{opacity:.75}100%{transform:translateY(-190px) scale(1.35);opacity:0}}
@keyframes cool-fall{0%{transform:translateY(-40px) scale(.7);opacity:0}35%{opacity:.75}100%{transform:translateY(190px) scale(1.35);opacity:0}}
@keyframes heat-wave{0%,100%{transform:translateX(-6px) scaleY(1)}50%{transform:translateX(6px) scaleY(1.08)}}
@keyframes wm-spin{to{transform:rotate(360deg)}}
@keyframes wm-wave{to{transform:translateX(-50%) rotate(360deg)}}
@keyframes wm-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-.6px,.4px)}75%{transform:translate(.6px,-.3px)}}
.fx{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .8s}
.fx.show{opacity:1}
.fx:not(.show) *{animation-play-state:paused!important}
.fx b{position:absolute;left:0;right:0;height:55%;animation:heat-wave 3.5s ease-in-out infinite}
.fx i{position:absolute;border-radius:50%}
.fx.heat b{bottom:0;background:linear-gradient(0deg,oklch(0.88 0.09 55 / .55),transparent)}
.fx.heat i{bottom:-20px;background:radial-gradient(circle,oklch(0.82 0.13 50 / .7),transparent 70%);animation:heat-rise 4.2s ease-in infinite}
.fx.cool b{top:0;background:linear-gradient(180deg,oklch(0.8 0.1 235 / .45),transparent)}
.fx.cool i{top:-20px;background:radial-gradient(circle,oklch(0.8 0.1 235 / .7),transparent 70%);animation:cool-fall 4.2s ease-out infinite}


/* Σκευόμορφα κοινά: οθόνη LCD, στρογγυλό πλήκτρο, χαραγμένο ταμπελάκι, γραμμή κατάστασης */
.lcd{background:#1b2622;color:#9ff0c0;border-radius:6px;font:600 20px var(--w-font);letter-spacing:.5px;
  display:grid;place-items:center;white-space:nowrap;font-variant-numeric:tabular-nums}
.kb{flex:none;border-radius:50%;display:grid;place-items:center;color:var(--w-ink);
  background:radial-gradient(circle at 35% 30%,#fff,#dfe3e6 45%,#aeb5bb);
  box-shadow:0 3px 6px rgba(0,0,0,.28),inset 0 1px 1px #fff;transition:transform .12s,color .3s}
.kb:active{transform:scale(.94)}
.kb:disabled{opacity:.4;cursor:default}
.kb.lit{color:#fff;background:radial-gradient(circle at 35% 30%,color-mix(in oklch,var(--acc,var(--w-blue)) 55%,#fff),var(--acc,var(--w-blue)))}
.tag{position:absolute;z-index:2;max-width:70%;font:600 13px var(--w-font);letter-spacing:.6px;text-transform:uppercase;
  color:var(--w-muted);background:linear-gradient(180deg,#eef0f2,#cfd4d8);padding:2px 8px;border-radius:4px;
  box-shadow:inset 0 1px 0 #fff,0 1px 1px rgba(0,0,0,.2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note{position:absolute;left:0;right:0;bottom:8px;padding:0 34px;text-align:center;font-weight:600;font-size:16px;color:var(--w-ink)}
.shell,.shell.on{padding:0;background:linear-gradient(180deg,#fcfdfd,#e6eaed);box-shadow:inset 0 1px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.08)}


/* Κατάσταση με μια ματιά: λυχνία στην ίδια γωνία σε κάθε συσκευή με κύκλο λειτουργίας.
   .idle = ανενεργή (ξεθωριασμένη), .on = λειτουργεί, .done = τελείωσε και περιμένει τον χρήστη */
@keyframes w-pulse{0%,100%{opacity:1}50%{opacity:.25}}
.lamp{position:absolute;left:14px;bottom:14px;width:14px;height:14px;border-radius:50%;background:#b8c2cb;transition:background .3s}
.on .lamp{background:var(--ring,var(--acc,var(--w-blue)));animation:w-pulse 2s ease-in-out infinite}
.done .lamp{background:var(--w-amber);animation:w-pulse 1s ease-in-out infinite}
.card.idle{opacity:.72}
.idle .lcd{color:#3d4d47}
.done .lcd{color:#ffd27a;animation:w-pulse 1.6s ease-in-out infinite}

@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const fxHTML = () =>
  `<div class="fx"><b></b>${[[12, 0, 70], [48, 1.3, 90], [78, 2.5, 64], [30, 3.2, 56]]
    .map(([x, d, s]) => `<i style="left:${x}%;width:${s}px;height:${s}px;margin-left:${-s / 2}px;animation-delay:${d}s"></i>`)
    .join('')}</div>`;

const UNAVAILABLE = ['unavailable', 'unknown', undefined, null];
const fmt = (n, d = 0) => Number(n).toFixed(d).replace('.', ',');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');
const hhmm = (t) => `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
const hms = (secs) => `${pad2(secs / 3600)}:${pad2((secs % 3600) / 60)}:${pad2(secs % 60)}`;

class WallBaseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._sig = null;
  }

  /* Οι κάρτες ορίζουν: static css, template(), watched(), update(), και προαιρετικά bind() */

  setConfig(config) {
    if (!config || !config.entity) throw new Error('Χρειάζεται entity');
    this._config = config;
    this._built = false;
    this._sig = null;
    if (this._hass) this.hass = this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) {
      ensureFonts();
      this.shadowRoot.innerHTML = `<style>${BASE_CSS}${this.constructor.css || ''}</style>${this.template()}`;
      this.bind?.();
      this._built = true;
    }
    /* Ξαναζωγραφίζουμε μόνο όταν αλλάξει κάποιο entity που μας αφορά */
    const sig = this.watched()
      .map((id) => { const s = id && hass.states[id]; return s ? s.state + '|' + s.last_updated : '-'; })
      .join(';');
    if (sig === this._sig) return;
    this._sig = sig;
    this.update();
    this._popup?.refresh();
  }

  connectedCallback() {
    this._sig = null;
    if (this._hass && this._config) this.hass = this._hass;
  }
  disconnectedCallback() { this.tick(false); }

  /* Ανανέωση ανά δευτερόλεπτο, μόνο για ενδείξεις που μετράνε χρόνο */
  tick(on) {
    if (on && !this._timer) this._timer = setInterval(() => this.update(), 1000);
    else if (!on && this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  $(sel) { return this.shadowRoot.querySelector(sel); }
  st(id) { return id ? this._hass.states[id] : undefined; }
  available(id) { const s = this.st(id); return !!s && !UNAVAILABLE.includes(s.state); }
  val(id) { return this.available(id) ? this.st(id).state : ''; }
  num(id) { return this.available(id) ? parseFloat(this.st(id).state) : NaN; }
  friendly(id) { return this.st(id)?.attributes?.friendly_name || id; }
  call(domain, service, data) { return this._hass.callService(domain, service, data); }

  /* «Πάτημα» ενός entity ενέργειας (button, script, switch, scene…) */
  trigger(id) {
    if (!id) return;
    const domain = id.split('.')[0];
    const svc = { button: 'press', input_button: 'press', scene: 'turn_on', script: 'turn_on' }[domain] || 'toggle';
    const dom = svc === 'toggle' ? 'homeassistant' : domain;
    this.call(dom, svc, { entity_id: id });
  }

  moreInfo(id) {
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
  }

  /* Πάτημα στο σώμα της κάρτας (όχι σε κουμπί) ανοίγει το popup της κάρτας, ή αλλιώς τις λεπτομέρειες του HA */
  tapMore(open) {
    const card = this.$('.card');
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
      if (open) open(); else this.moreInfo(this._config.entity);
    });
  }

  /* Προαιρετικό ταμπελάκι (config.label) για να ξεχωρίζουν δύο ίδιες κάρτες */
  label() {
    const tag = this.$('.tag');
    if (!tag) return;
    tag.textContent = this._config.label || '';
    tag.hidden = !this._config.label;
  }

  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 4, min_columns: 4, min_rows: 4 }; }
}

/* Πλατιά κάρτα (2 × 1) */
class WallWideCard extends WallBaseCard {
  getGridOptions() { return { columns: 12, rows: 4, min_columns: 8, min_rows: 4 }; }
}

/* ── Popup: ένα ενιαίο πρότυπο για όλες τις κάρτες ──
 *
 *   openPopup(card, {
 *     icon:   'lightbulb',               εικονίδιο κεφαλίδας
 *     size:   'sm' | 'md' | 'lg',        πλάτος φύλλου
 *     accent: () => 'css χρώμα',         χρώμα έμφασης (προαιρετικό)
 *     status: () => 'Αναμμένο · 63%',    γραμμή κατάστασης κάτω από τον τίτλο
 *     tabs:   [{ id, label, icon }],     καρτέλες (προαιρετικό)
 *     render: (p, tab) => { … },         γεμίζει το p.body με popSection / popChips / popSlider …
 *   })
 *
 * Τίτλος: config.title → config.label → όνομα του entity.
 * Το σώμα ξαναχτίζεται όταν αλλάξει η κατάσταση της κάρτας (όχι όσο ο χρήστης σέρνει κάτι).
 * Κλείνει με το ✕, με πάτημα έξω, με Escape, ή μόνο του μετά από POPUP_IDLE_MS αδράνειας.
 * Ανοίγει και κλείνει «από» την κάρτα που το κάλεσε. Ένα popup τη φορά.
 */
const POPUP_IDLE_MS = 30000;
const POPUP_CSS = `
:host{position:fixed;inset:0;z-index:9999;height:auto;border-radius:0;box-shadow:none}
.veil{position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:rgba(20,30,40,0);transition:background .25s}
.veil.in{background:rgba(20,30,40,.38)}
.sheet{width:100%;max-height:100%;display:flex;flex-direction:column;border-radius:30px;background:#f4f6f8;overflow:hidden;
  box-shadow:0 22px 50px rgba(20,30,40,.3);opacity:0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(.3);
  transition:transform .22s ease-in,opacity .18s ease-in}
.in .sheet{opacity:1;transform:none;transition:transform .42s var(--w-spring),opacity .2s}
.s-sm{max-width:380px}
.s-md{max-width:540px}
.s-lg{max-width:780px}
.ph{flex:none;display:flex;align-items:center;gap:12px;padding:18px 14px 14px 20px}
.pi{flex:none;width:48px;height:48px;border-radius:16px;display:grid;place-items:center;font-size:26px;
  background:#fff;color:var(--acc,var(--w-ink));box-shadow:0 1px 3px rgba(0,0,0,.08)}
.pt{flex:1;min-width:0;display:flex;flex-direction:column}
.pn{font:700 20px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ps{font:500 15px var(--w-font);color:var(--w-muted);min-height:20px}
.px{flex:none;width:48px;height:48px;border-radius:50%;font-size:26px;color:var(--w-muted);transition:transform .15s,background .2s}
.px:active{transform:scale(.92);background:rgba(0,0,0,.06)}
.tabs{flex:none;display:flex;gap:6px;margin:0 20px 14px;padding:4px;border-radius:18px;background:var(--w-track)}
.tabs button{flex:1;height:44px;border-radius:14px;font:600 15px var(--w-font);color:var(--w-muted);
  display:flex;align-items:center;justify-content:center;gap:6px;transition:background .2s,color .2s}
.tabs button.sel{background:#fff;color:var(--w-ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}
.tabs .ms{font-size:20px}
.pb{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;overscroll-behavior:contain;padding:4px 20px 22px;display:flex;flex-direction:column;gap:18px}
.grp{font:600 15px var(--w-font);color:var(--w-muted);margin:0 0 10px}
.sw{display:flex;flex-wrap:wrap;gap:12px}
.sw button{width:60px;height:60px;border-radius:50%;background:var(--c);box-shadow:0 3px 6px rgba(0,0,0,.2),inset 0 0 0 4px #fff;transition:transform .15s}
.sw button:active{transform:scale(.92)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips button{min-height:48px;padding:0 16px;border-radius:16px;background:#fff;font:600 15px var(--w-font);
  display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);transition:background .2s,color .2s,transform .15s}
.chips button:active{transform:scale(.96)}
.chips button.sel{background:var(--acc,var(--w-blue));color:#fff}
.chips .ms{font-size:22px}
.sl{position:relative;height:60px;border-radius:20px;background:var(--w-track);overflow:hidden;touch-action:none;cursor:ew-resize}
.sl i{position:absolute;left:0;top:0;bottom:0;width:var(--v,0%);background:var(--acc,var(--w-blue));opacity:.55}
.sl span{position:absolute;top:0;bottom:0;display:flex;align-items:center}
.sl .ms{left:18px;font-size:26px}
.sl .sv{right:18px;font:700 18px var(--w-font)}
.stepper{display:flex;align-items:center;justify-content:center;gap:18px}
.stepper button{width:64px;height:64px;border-radius:50%;background:#fff;font-size:34px;box-shadow:0 1px 3px rgba(0,0,0,.1);transition:transform .15s}
.stepper button:active{transform:scale(.94)}
.stepper b{min-width:160px;text-align:center;font:400 56px var(--w-font);letter-spacing:-2px;color:var(--acc,var(--w-ink))}
`;

let activePopup = null;
const popTitle = (card) => card._config.title || card._config.label || card.friendly(card._config.entity);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function openPopup(card, spec) {
  if (activePopup) activePopup.close(true);
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${BASE_CSS}${POPUP_CSS}</style>
<div class="veil"><div class="sheet s-${spec.size || 'sm'}" role="dialog" aria-modal="true">
  <header class="ph">
    <span class="pi ms fill"></span><div class="pt"><span class="pn"></span><span class="ps"></span></div>
    <button class="px ms" aria-label="Κλείσιμο">close</button>
  </header>
  <nav class="tabs" hidden></nav>
  <div class="pb"></div>
</div></div>`;
  const $ = (s) => root.querySelector(s);
  const veil = $('.veil'), sheet = $('.sheet'), body = $('.pb'), nav = $('.tabs');
  let idle, closed = false, tab = spec.tabs?.[0]?.id;

  /* Το φύλλο «βγαίνει» από την κάρτα και γυρίζει σε αυτήν: μετατόπιση από το κέντρο του ως το κέντρο της κάρτας */
  const aim = () => {
    const c = card.getBoundingClientRect(), s = sheet.getBoundingClientRect();
    sheet.style.setProperty('--dx', `${c.left + c.width / 2 - (s.left + s.width / 2)}px`);
    sheet.style.setProperty('--dy', `${c.top + c.height / 2 - (s.top + s.height / 2)}px`);
  };
  const wake = () => { clearTimeout(idle); idle = setTimeout(() => p.close(), POPUP_IDLE_MS); };
  const onKey = (e) => { if (e.key === 'Escape') p.close(); };

  const p = {
    card, body, busy: false,
    close(now) {
      if (closed) return;
      closed = true;
      clearTimeout(idle);
      document.removeEventListener('keydown', onKey);
      card._popup = null;
      if (activePopup === p) activePopup = null;
      if (now) return host.remove();
      aim();
      veil.classList.remove('in');
      setTimeout(() => host.remove(), 240);
    },
    /* Καλείται από την κάρτα σε κάθε αλλαγή κατάστασης */
    refresh() {
      $('.pi').textContent = spec.icon || 'tune';
      $('.pn').textContent = popTitle(card);
      $('.ps').textContent = spec.status?.() || '';
      if (spec.accent) sheet.style.setProperty('--acc', spec.accent());
      if (p.busy) return;
      const top = body.scrollTop;
      body.replaceChildren();
      spec.render(p, tab);
      body.scrollTop = top;
    },
  };

  if (spec.tabs?.length) {
    nav.hidden = false;
    spec.tabs.forEach((t) => {
      const b = el('button');
      if (t.icon) b.appendChild(el('span', 'ms', t.icon));
      b.appendChild(el('span', '', t.label));
      b.classList.toggle('sel', t.id === tab);
      b.addEventListener('click', () => {
        tab = t.id;
        nav.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b));
        body.scrollTop = 0;
        p.refresh();
      });
      nav.appendChild(b);
    });
  }
  veil.addEventListener('click', (e) => { if (e.target === veil) p.close(); });
  veil.addEventListener('pointerdown', wake);
  $('.px').addEventListener('click', () => p.close());
  document.addEventListener('keydown', onKey);

  document.body.appendChild(host);
  p.refresh();
  aim();
  /* Το aim() διάβασε ήδη το layout, οπότε η μετάβαση ξεκινά από τη θέση της κάρτας.
     Χωρίς requestAnimationFrame: σε σελίδα που ο browser θεωρεί ανενεργή, δεν τρέχει ποτέ. */
  sheet.getBoundingClientRect();
  veil.classList.add('in');
  wake();
  card._popup = p;
  activePopup = p;
  return p;
}

/* Δομικά στοιχεία popup — όλα τα popups χτίζονται μόνο με αυτά */

/* Ενότητα με προαιρετική επικεφαλίδα· επιστρέφει το στοιχείο όπου μπαίνουν τα χειριστήρια */
function popSection(p, title) {
  const s = el('section');
  if (title) s.appendChild(el('p', 'grp', title));
  p.body.appendChild(s);
  return s;
}

/* Κουμπιά-επιλογές: [{ label, icon, sel, tap }] */
function popChips(parent, items) {
  const g = el('div', 'chips');
  items.forEach(({ label, icon, sel, tap }) => {
    const b = el('button');
    if (icon) b.appendChild(el('span', 'ms', icon));
    b.appendChild(el('span', '', label));
    b.classList.toggle('sel', !!sel);
    b.addEventListener('click', tap);
    g.appendChild(b);
  });
  parent.appendChild(g);
}

/* Κύκλοι χρώματος: [{ label, color, tap }] */
function popSwatches(parent, items) {
  const g = el('div', 'sw');
  items.forEach(({ label, color, tap }) => {
    const b = el('button');
    b.style.setProperty('--c', color);
    b.setAttribute('aria-label', label);
    b.addEventListener('click', tap);
    g.appendChild(b);
  });
  parent.appendChild(g);
}

/* Οριζόντιο ρυθμιστικό 1–100: { icon, value, set(v) } · η εντολή στέλνεται στο άφημα */
function popSlider(parent, p, { icon, value, set }) {
  const s = el('div', 'sl');
  const text = el('span', 'sv');
  const paint = (v) => { s.style.setProperty('--v', v + '%'); text.textContent = v ? v + '%' : '—'; };
  s.append(el('i'), el('span', 'ms', icon), text);
  paint(value);
  s.addEventListener('pointerdown', (e0) => {
    s.setPointerCapture(e0.pointerId);
    p.busy = true;
    let v = value;
    const move = (ev) => {
      const r = s.getBoundingClientRect();
      v = Math.round(clamp(((ev.clientX - r.left) / r.width) * 100, 1, 100));
      paint(v);
    };
    const up = () => {
      s.removeEventListener('pointermove', move);
      s.removeEventListener('pointerup', up);
      s.removeEventListener('pointercancel', up);
      p.busy = false;
      set(v);
    };
    move(e0);
    s.addEventListener('pointermove', move);
    s.addEventListener('pointerup', up);
    s.addEventListener('pointercancel', up);
  });
  parent.appendChild(s);
}

/* Μεγάλος αριθμός με − / + : { text, dec(), inc() } */
function popStepper(parent, { text, dec, inc }) {
  const g = el('div', 'stepper');
  const a = el('button', 'ms', 'remove'), b = el('button', 'ms', 'add');
  a.setAttribute('aria-label', 'Λιγότερο');
  b.setAttribute('aria-label', 'Περισσότερο');
  a.addEventListener('click', dec);
  b.addEventListener('click', inc);
  g.append(a, el('b', '', text), b);
  parent.appendChild(g);
}

/* ── Φώτα: χρώμα λάμπας για ενδείξεις, και popup φωτός ── */
const lightModes = (s) => s?.attributes?.supported_color_modes || [];
const hasColor = (s) => lightModes(s).some((m) => ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'].includes(m));
const hasTemp = (s) => lightModes(s).includes('color_temp');
const isDimmable = (s) => lightModes(s).some((m) => m !== 'onoff');
const WHITES = [['Θερμό λευκό', 2700, '#f6cc7a'], ['Ουδέτερο λευκό', 4000, '#f6e7c4'], ['Ψυχρό λευκό', 6500, '#cfe2f7']];
const COLORS = [
  ['Κόκκινο', [255, 60, 50]], ['Πορτοκαλί', [255, 140, 40]], ['Κίτρινο', [255, 210, 60]], ['Πράσινο', [70, 200, 90]],
  ['Γαλάζιο', [60, 200, 210]], ['Μπλε', [70, 120, 255]], ['Μοβ', [160, 90, 240]], ['Ροζ', [255, 90, 170]],
];

function lampColor(s) {
  const a = s?.attributes || {};
  if (a.rgb_color && a.color_mode !== 'color_temp') return `rgb(${a.rgb_color.join(',')})`;
  const k = a.color_temp_kelvin;
  return !k || k < 3300 ? '#f6cc7a' : k < 5000 ? '#f6e7c4' : '#cfe2f7';
}

/* Φωτεινότητα, λευκά και χρώματα· ό,τι δεν είναι ρυθμιζόμενο φως πέφτει στο παράθυρο του HA */
function lightPopup(card) {
  const id = card._config.entity;
  const s0 = card.st(id);
  if (!id.startsWith('light.') || !isDimmable(s0)) return card.moreInfo(id);
  const turnOn = (data) => card.call('light', 'turn_on', { entity_id: id, ...data });
  openPopup(card, {
    icon: 'lightbulb',
    size: 'sm',
    accent: () => 'oklch(0.7 0.14 75)',
    status: () => {
      const s = card.st(id);
      if (!card.available(id)) return 'Μη διαθέσιμο';
      if (s.state !== 'on') return 'Σβηστό';
      const b = s.attributes.brightness;
      return b != null ? `Αναμμένο · ${Math.round((b / 255) * 100)}%` : 'Αναμμένο';
    },
    render: (p) => {
      const s = card.st(id);
      const on = s?.state === 'on';
      const pct = on ? Math.max(1, Math.round(((s.attributes.brightness ?? 255) / 255) * 100)) : 0;
      popSlider(popSection(p), p, { icon: 'light_mode', value: pct, set: (v) => turnOn({ brightness_pct: v }) });
      if (hasTemp(s)) {
        popSwatches(popSection(p, 'Λευκό'), WHITES.map(([label, k, color]) => ({ label, color, tap: () => turnOn({ color_temp_kelvin: k }) })));
      }
      if (hasColor(s)) {
        popSwatches(popSection(p, 'Χρώμα'), COLORS.map(([label, rgb]) => ({ label, color: `rgb(${rgb.join(',')})`, tap: () => turnOn({ rgb_color: rgb }) })));
      }
      popChips(popSection(p), [{
        label: on ? 'Σβήσιμο' : 'Άναμμα', icon: 'power_settings_new', sel: on,
        tap: () => card.call('light', 'toggle', { entity_id: id }),
      }]);
    },
  });
}

/* ── Κλίμα: popup με θερμοκρασία, λειτουργία, ανεμιστήρα και περσίδες ── */
const HVAC = {
  off: ['Κλειστό', 'power_settings_new'], heat: ['Θέρμανση', 'sunny'], cool: ['Ψύξη', 'ac_unit'],
  heat_cool: ['Αυτόματο', 'hdr_auto'], auto: ['Αυτόματο', 'hdr_auto'], dry: ['Αφύγρανση', 'water_drop'], fan_only: ['Ανεμιστήρας', 'mode_fan'],
};

/* Ελληνικά για τις συνηθισμένες τιμές ανεμιστήρα/περσίδων· ό,τι λείπει εμφανίζεται όπως το δίνει το HA */
const MODE_GR = {
  auto: 'Αυτόματο', low: 'Χαμηλή', medium: 'Μεσαία', middle: 'Μεσαία', high: 'Υψηλή', quiet: 'Αθόρυβη', turbo: 'Turbo', diffuse: 'Διάχυτη',
  off: 'Σταθερές', on: 'Κίνηση', vertical: 'Κάθετη', horizontal: 'Οριζόντια', both: 'Και οι δύο',
};

function climatePopup(card) {
  const id = card._config.entity;
  if (!card.available(id)) return card.moreInfo(id);
  const set = (service, data) => card.call('climate', service, { entity_id: id, ...data });
  openPopup(card, {
    icon: 'thermostat',
    size: 'md',
    accent: () => card.$('.card').style.getPropertyValue('--acc') || 'var(--w-ink)',
    status: () => {
      const s = card.st(id);
      const cur = s?.attributes?.current_temperature;
      return [HVAC[s?.state]?.[0] || s?.state, cur != null && `χώρος ${fmt(cur, 1)}°`].filter(Boolean).join(' · ');
    },
    render: (p) => {
      const s = card.st(id);
      const a = s?.attributes || {};
      const by = a.target_temp_step || 0.5;
      const go = (dir) => () => set('set_temperature', { temperature: clamp(a.temperature + dir * by, a.min_temp ?? 5, a.max_temp ?? 35) });
      if (a.temperature != null) popStepper(popSection(p), { text: `${fmt(a.temperature, by < 1 ? 1 : 0)}°`, dec: go(-1), inc: go(1) });
      const chips = (title, list, cur, service, key) => {
        if (!list?.length) return;
        popChips(popSection(p, title), list.map((m) => ({
          label: key === 'hvac_mode' ? HVAC[m]?.[0] || m : MODE_GR[String(m).toLowerCase()] || m, icon: key === 'hvac_mode' ? HVAC[m]?.[1] : undefined,
          sel: cur === m, tap: () => set(service, { [key]: m }),
        })));
      };
      chips('Λειτουργία', a.hvac_modes, s?.state, 'set_hvac_mode', 'hvac_mode');
      chips('Ανεμιστήρας', a.fan_modes, a.fan_mode, 'set_fan_mode', 'fan_mode');
      chips('Περσίδες', a.swing_modes, a.swing_mode, 'set_swing_mode', 'swing_mode');
    },
  });
}

/* Φόρμα ρυθμίσεων από απλή περιγραφή πεδίων: [όνομα, ετικέτα, selector, required] */
function form(fields) {
  const labels = Object.fromEntries(fields.map((f) => [f[0], f[1]]));
  return {
    schema: fields.map(([name, , selector, required]) => ({ name, selector, required: !!required })),
    computeLabel: (s) => labels[s.name] || s.name,
  };
}
const ent = (domain, device_class) => ({ entity: { filter: device_class ? { domain, device_class } : { domain } } });
const ANY = { entity: {} };
const TEXT = { text: {} };
const firstEntity = (hass, domain) => Object.keys(hass.states).find((id) => id.startsWith(domain + '.')) || '';

/* Δέχεται "1:12:00", "0:55", λεπτά ως αριθμό, ή χρονική στιγμή λήξης → λεπτά */
function toMinutes(st) {
  if (!st || UNAVAILABLE.includes(st.state)) return null;
  const s = String(st.state);
  if (/^\d+:\d{2}(:\d{2})?$/.test(s)) {
    const p = s.split(':').map(Number);
    return p[0] * 60 + p[1] + (p[2] || 0) / 60;
  }
  if (/^\d{4}-\d\d-\d\dT/.test(s)) return Math.max(0, (new Date(s) - Date.now()) / 60000);
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  const u = st.attributes?.unit_of_measurement;
  return u === 's' ? n / 60 : u === 'h' ? n * 60 : n;
}

/* Ποιότητα αέρα από PM2.5 → [ετικέτα, απόχρωση] */
const airQuality = (pm) => (pm <= 12 ? ['Καλή', 150] : pm <= 35 ? ['Μέτρια', 85] : ['Κακή', 30]);

/* Πρόοδος αναπαραγωγής media_player σε % (ή null) */
function mediaProgress(s) {
  const a = s?.attributes || {};
  if (!a.media_duration || a.media_position == null) return null;
  let pos = a.media_position;
  if (s.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - new Date(a.media_position_updated_at)) / 1000;
  return clamp((pos / a.media_duration) * 100, 0, 100);
}

const cssUrl = (u) => `url("${String(u).replace(/["\\\n]/g, '')}")`;

/* ───────────────────────── 2. Κάρτες ───────────────────────── */

/* Καμία κάρτα δεν γράφει το όνομα της συσκευής: η μορφή της λέει τι είναι.
   Για δύο ίδιες κάρτες υπάρχει το προαιρετικό ταμπελάκι (label). */
const TAG = '<span class="tag" hidden></span>';
const LABEL = ['label', 'Ταμπελάκι, π.χ. «Σαλόνι» (προαιρετικό)', TEXT];
const TITLE = ['title', 'Όνομα στο popup (προαιρετικό)', TEXT];

/* ── Φως: ψηλή κάρτα, σύρσιμο πάνω-κάτω για φωτεινότητα, διακόπτης κάτω ── */
class WallLightCard extends WallBaseCard {
  static css = `
:host{--w-min-h:468px}
.card,.card.on{padding:0;border-radius:22px;color:#2d2a24;justify-content:flex-start;
  background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:0 14px 28px rgba(40,45,55,.16),0 3px 6px rgba(40,45,55,.10),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05)}
.zone{flex:1;position:relative;overflow:hidden;touch-action:none;cursor:ns-resize}
.zone.nodim{cursor:default}
.glow{position:absolute;left:0;right:0;bottom:0;transition:height .12s,opacity .35s;
  background:linear-gradient(180deg,color-mix(in srgb,var(--lamp,#f6cc7a) 55%,#fff),color-mix(in srgb,var(--lamp,#f6cc7a) 85%,#fff))}
.grip{position:absolute;left:0;right:0;display:flex;justify-content:center;transition:bottom .12s,opacity .35s}
.grip span{width:40px;height:4px;border-radius:2px;background:rgba(80,60,20,.25);margin-bottom:-12px}
.top{padding:14px 14px 0;justify-content:flex-end;align-items:center;min-height:40px}
.tag{position:static;margin-right:auto}
.tune{width:40px;height:40px;flex:none;margin:-6px -8px 0 0;border-radius:50%;color:#a8a296;font-size:22px}
.leds{position:absolute;right:18px;top:84px;bottom:18px;display:flex;flex-direction:column-reverse;justify-content:space-between;align-items:center}
.leds span{width:5px;height:5px;border-radius:50%;transition:background .15s;background:rgba(45,42,36,.15)}
.leds span.lit{background:#2d2a24}
.pct{position:absolute;left:18px;bottom:14px;font:700 30px var(--w-font);letter-spacing:-1px;transition:opacity .35s}
.rocker{flex:0 0 33%;display:flex;align-items:center;justify-content:center;color:#2d2a24;
  border-top:1px solid rgba(0,0,0,.06);transition:background .2s,box-shadow .2s;
  background:linear-gradient(180deg,#fdfdfb,#f1efea);box-shadow:inset 0 -2px 3px rgba(0,0,0,.05)}
.rocker .ms{font-size:34px;transition:color .3s,text-shadow .3s}
.on .rocker{background:linear-gradient(180deg,#ebe8e1,#f3f1ec);box-shadow:inset 0 3px 7px rgba(0,0,0,.12)}
.on .rocker .ms{color:oklch(0.62 0.15 70);text-shadow:0 0 12px oklch(0.8 0.14 80 / .8)}
`;

  static getConfigForm() { return form([['entity', 'Φως', ent('light'), true], LABEL, TITLE]); }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'light') }; }

  getCardSize() { return 8; }
  getGridOptions() { return { columns: 6, rows: 8, min_columns: 4, min_rows: 6 }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="zone">
    <div class="glow"></div>
    <div class="grip"><span></span></div>
    <div class="top">${TAG}<button class="tune ms" aria-label="Ρυθμίσεις">tune</button></div>
    <div class="leds">${'<span></span>'.repeat(8)}</div>
    <span class="pct"></span>
  </div>
  <button class="rocker" aria-label="Άναμμα/Σβήσιμο"><span class="ms">power_settings_new</span></button>
</div>`;
  }

  bind() {
    const zone = this.$('.zone');
    this.$('.tune').addEventListener('pointerdown', (e) => e.stopPropagation());
    this.$('.tune').addEventListener('click', () => lightPopup(this));
    this.$('.rocker').addEventListener('click', () => {
      this._hold = null;
      this.call('light', 'toggle', { entity_id: this._config.entity });
    });

    zone.addEventListener('pointerdown', (e0) => {
      if (!this._dimmable || !this.available(this._config.entity)) return;
      zone.setPointerCapture(e0.pointerId);
      const upd = (ev) => {
        const r = zone.getBoundingClientRect();
        this._drag = Math.round(clamp(((r.bottom - ev.clientY) / r.height) * 100, 1, 100));
        this.paint(true, this._drag);
      };
      const up = () => {
        zone.removeEventListener('pointermove', upd);
        zone.removeEventListener('pointerup', up);
        zone.removeEventListener('pointercancel', up);
        const pct = this._drag;
        this._drag = null;
        /* Κρατάμε την τιμή που άφησε το δάχτυλο μέχρι να απαντήσει η συσκευή */
        this._hold = { pct, until: Date.now() + 2500 };
        this.call('light', 'turn_on', { entity_id: this._config.entity, brightness_pct: pct });
      };
      upd(e0);
      zone.addEventListener('pointermove', upd);
      zone.addEventListener('pointerup', up);
      zone.addEventListener('pointercancel', up);
    });
  }

  update() {
    const id = this._config.entity;
    const s = this.st(id);
    this.label();
    this.$('.card').style.setProperty('--lamp', lampColor(s));
    this.$('.card').classList.toggle('unavail', !this.available(id));
    const modes = s?.attributes?.supported_color_modes || [];
    this._dimmable = modes.some((m) => m !== 'onoff');
    this.$('.zone').classList.toggle('nodim', !this._dimmable);
    if (this._drag != null) return;
    if (this._hold && Date.now() < this._hold.until) { this.paint(true, this._hold.pct); return; }
    this._hold = null;
    const on = s?.state === 'on';
    const br = s?.attributes?.brightness;
    this.paint(on, this._dimmable && br != null ? Math.max(1, Math.round((br / 255) * 100)) : 100);
  }

  paint(on, pct) {
    const h = on ? pct + '%' : '0%';
    this.$('.card').classList.toggle('on', on);
    const glow = this.$('.glow'); glow.style.height = h; glow.style.opacity = on ? 1 : 0;
    const grip = this.$('.grip'); grip.style.bottom = h; grip.style.opacity = on && this._dimmable ? 1 : 0;
    const p = this.$('.pct'); p.textContent = on ? (this._dimmable ? pct + '%' : 'On') : '—'; p.style.opacity = on ? 1 : 0;
    this.shadowRoot.querySelectorAll('.leds span').forEach((el, i) =>
      el.classList.toggle('lit', on && (i + 1) * 12.5 <= Math.max(12.5, pct)));
  }
}

/* ── Διακόπτης: πλήκτρο τοίχου· στα φώτα γεμίζει στο χρώμα της λάμπας ως τη φωτεινότητα ── */
class WallSwitchCard extends WallBaseCard {
  static css = `
.card,.card.on{padding:0;border-radius:22px;color:#2d2a24;background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05)}
.key{position:absolute;left:50%;top:20px;width:112px;height:156px;margin-left:-56px;border-radius:16px;overflow:hidden;
  touch-action:none;cursor:pointer;transition:box-shadow .2s;
  background:linear-gradient(180deg,#ffffff,#eeece6);box-shadow:0 4px 8px rgba(40,45,55,.18),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.06)}
.on .key{box-shadow:inset 0 3px 7px rgba(0,0,0,.14),0 1px 0 #fff}
.lvl{position:absolute;left:0;right:0;bottom:0;height:0;transition:height .12s;
  background:linear-gradient(180deg,color-mix(in srgb,var(--lamp,#f6cc7a) 70%,#fff),var(--lamp,#f6cc7a))}
.ic{position:absolute;left:0;right:0;top:18px;text-align:center;font-size:34px;color:#8a8578;transition:color .3s}
.on .ic{color:color-mix(in srgb,var(--lamp,#f6cc7a) 55%,#3a2a08)}
.pc{position:absolute;left:0;right:0;bottom:12px;text-align:center;font:700 24px var(--w-font);letter-spacing:-.5px}
.more{position:absolute;right:2px;top:2px;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#a8a296;font-size:22px}
.dot{width:28px;height:28px;border-radius:50%;background:var(--lamp,#d8d4ca);box-shadow:0 2px 4px rgba(0,0,0,.25),inset 0 0 0 3px #fff}
.card:not(.on) .dot{background:#d8d4ca}
.tag{left:50%;transform:translateX(-50%);bottom:12px}
`;

  static getConfigForm() {
    return form([['entity', 'Συσκευή', ent(['light', 'switch', 'input_boolean', 'fan']), true], LABEL, TITLE]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'light') || firstEntity(hass, 'switch') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="key" role="button" aria-label="Άναμμα/Σβήσιμο">
    <div class="lvl"></div><span class="ic ms">power_settings_new</span><span class="pc"></span>
  </div>
  <button class="more" aria-label="Χρώμα και ρυθμίσεις"><span class="dot" hidden></span><span class="ms tn">tune</span></button>
  ${TAG}
</div>`;
  }

  bind() {
    const key = this.$('.key');
    this.$('.more').addEventListener('click', () => lightPopup(this));
    /* Πάτημα = on/off. Σύρσιμο πάνω-κάτω (μόνο σε φώτα με ρύθμιση) = φωτεινότητα. */
    key.addEventListener('pointerdown', (e0) => {
      const id = this._config.entity;
      if (!this.available(id)) return;
      key.setPointerCapture(e0.pointerId);
      let moved = false;
      const move = (ev) => {
        if (!this._dimmable || (!moved && Math.abs(ev.clientY - e0.clientY) < 8)) return;
        moved = true;
        const r = key.getBoundingClientRect();
        this._drag = Math.round(clamp(((r.bottom - ev.clientY) / r.height) * 100, 1, 100));
        this.paint(true, this._drag);
      };
      const up = (ev) => {
        key.removeEventListener('pointermove', move);
        key.removeEventListener('pointerup', up);
        key.removeEventListener('pointercancel', up);
        if (moved) {
          const pct = this._drag;
          this._hold = { pct, until: Date.now() + 2500 };
          this.call('light', 'turn_on', { entity_id: id, brightness_pct: pct });
        } else if (ev.type === 'pointerup') {
          this._hold = null;
          this.call('homeassistant', 'toggle', { entity_id: id });
        }
        this._drag = null;
      };
      key.addEventListener('pointermove', move);
      key.addEventListener('pointerup', up);
      key.addEventListener('pointercancel', up);
    });
  }

  update() {
    const id = this._config.entity;
    const s = this.st(id);
    const card = this.$('.card');
    card.classList.toggle('unavail', !this.available(id));
    card.style.setProperty('--lamp', id.startsWith('light.') ? lampColor(s) : '#f6cc7a');
    this._dimmable = id.startsWith('light.') && lightModes(s).some((m) => m !== 'onoff');
    const pick = hasColor(s) || hasTemp(s);
    this.$('.dot').hidden = !pick;
    this.$('.tn').hidden = pick;
    this.label();
    if (this._drag != null) return;
    if (this._hold && Date.now() < this._hold.until) { this.paint(true, this._hold.pct); return; }
    this._hold = null;
    const br = s?.attributes?.brightness;
    this.paint(s?.state === 'on', this._dimmable && br != null ? Math.max(1, Math.round((br / 255) * 100)) : 100);
  }

  paint(on, pct) {
    this.$('.card').classList.toggle('on', on);
    this.$('.lvl').style.height = on ? pct + '%' : '0%';
    this.$('.pc').textContent = on && this._dimmable ? pct + '%' : '';
  }
}

/* ── Κλειδαριά: μεταλλική πλάκα με πόμολο· το φόντο λέει την κατάσταση, χωρίς λεκτικό ── */
class WallLockCard extends WallBaseCard {
  static css = `
.card{align-items:center;justify-content:center;background:oklch(0.93 0.04 235)}
.card.locked{background:oklch(0.93 0.05 150)}
.card.jam{background:oklch(0.93 0.05 60)}
.tag{left:12px;top:12px}
.plate{flex:none;width:112px;height:164px;border-radius:56px;position:relative;
  background:linear-gradient(145deg,#f7f8f9 0%,#d5d9dd 45%,#eceff1 60%,#bfc5ca 100%);
  box-shadow:0 10px 18px rgba(30,40,50,.24),0 2px 3px rgba(30,40,50,.18),inset 0 1px 1px #fff,inset 0 -2px 3px rgba(0,0,0,.12)}
.led{position:absolute;top:11px;left:50%;width:10px;height:10px;margin-left:-5px;border-radius:50%;
  transition:background .3s,box-shadow .3s;background:var(--c);box-shadow:0 0 6px var(--c),inset 0 1px 1px rgba(255,255,255,.5)}
.ring{position:absolute;left:50%;top:50%;width:88px;height:88px;margin:-40px 0 0 -44px;border-radius:50%;
  background:linear-gradient(160deg,#c9ced3,#f3f5f6);box-shadow:inset 0 3px 6px rgba(0,0,0,.25),inset 0 -1px 1px #fff}
.knob{position:absolute;left:50%;top:50%;width:76px;height:76px;margin:-34px 0 0 -38px;border-radius:50%;
  transition:transform .5s var(--w-spring);
  background:radial-gradient(circle at 35% 30%,#ffffff,#dfe3e6 40%,#aeb5bb 100%);box-shadow:0 4px 8px rgba(0,0,0,.3),inset 0 1px 1px #fff}
.locked .knob{transform:rotate(90deg)}
.knob span{position:absolute;left:50%;top:7px;bottom:7px;width:22px;margin-left:-11px;border-radius:11px;
  background:linear-gradient(90deg,#b4bbc1,#f4f6f7 45%,#c3c9ce);box-shadow:0 2px 3px rgba(0,0,0,.3),inset 0 1px 0 #fff}
.slot{position:absolute;bottom:11px;left:50%;width:6px;height:12px;margin-left:-3px;border-radius:3px;background:#3a4148;box-shadow:inset 0 2px 2px #000,0 1px 0 #fff}
.batt{position:absolute;right:12px;top:12px;font:600 15px var(--w-font);color:var(--w-warn);display:flex;align-items:center;gap:2px}
.batt .ms{font-size:20px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Κλειδαριά', ent('lock'), true],
      LABEL, TITLE,
      ['battery_entity', 'Μπαταρία — εμφανίζεται μόνο όταν πέσει κάτω από 20% (προαιρετικό)', ent('sensor', 'battery')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'lock') }; }

  watched() { return [this._config.entity, this._config.battery_entity]; }

  template() {
    return `
<div class="card">
  ${TAG}
  <span class="batt" hidden><span class="ms">battery_1_bar</span><span class="bv"></span></span>
  <button class="plate press" aria-label="Κλείδωμα/Ξεκλείδωμα">
    <span class="led"></span><span class="ring"></span><span class="knob"><span></span></span><span class="slot"></span>
  </button>
</div>`;
  }

  bind() {
    this.$('.plate').addEventListener('click', () => {
      const s = this.st(this._config.entity)?.state;
      if (!this.available(this._config.entity)) return;
      const locked = s === 'locked' || s === 'locking';
      this.call('lock', locked ? 'unlock' : 'lock', { entity_id: this._config.entity });
    });
  }

  update() {
    const c = this._config;
    const s = this.st(c.entity)?.state;
    const ok = this.available(c.entity);
    const locked = s === 'locked' || s === 'locking';
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('locked', locked);
    card.classList.toggle('jam', s === 'jammed');
    card.style.setProperty('--c', !ok ? 'var(--w-faint)' : s === 'jammed' ? 'var(--w-warn)' : locked ? 'var(--w-ok)' : 'oklch(0.6 0.13 240)');
    this.$('.plate').setAttribute('aria-label', locked ? 'Κλειδωμένη — πάτα για ξεκλείδωμα' : 'Ξεκλείδωτη — πάτα για κλείδωμα');
    this.label();
    const lvl = this.num(c.battery_entity);
    this.$('.batt').hidden = isNaN(lvl) || lvl >= 20;
    this.$('.bv').textContent = isNaN(lvl) ? '' : Math.round(lvl) + '%';
  }
}

/* ── Είσοδος πολυκατοικίας: θυροτηλέφωνο με μεγάλο χρυσό κουμπί και «άνοιγμα στο κουδούνι» ── */
class WallOpenerCard extends WallBaseCard {
  static css = `
@keyframes bld-ring{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.5);opacity:0}}
@keyframes bld-buzz{0%,100%{translate:0 0}25%{translate:-1.5px 0}75%{translate:1.5px 0}}
.card,.card.on{padding:0;background:linear-gradient(160deg,#f1f3f4,#d6dadd 60%,#c3c8cc);
  box-shadow:inset 0 1px 0 #fff,inset 0 -2px 4px rgba(0,0,0,.12)}
.tag{left:12px;top:12px}
.bell{position:absolute;right:10px;top:10px;width:46px;height:46px;font-size:24px;color:#3b4148}
.rto .bell{color:#3a2a08;background:radial-gradient(circle at 35% 30%,#ffe2a0,oklch(0.78 0.15 75))}
.socket{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-66px 0 0 -75px;border-radius:50%;display:grid;place-items:center;
  background:linear-gradient(160deg,#aeb5ba,#e8ebed);box-shadow:inset 0 3px 6px rgba(0,0,0,.28),0 1px 0 #fff}
.wave{position:absolute;inset:10px;border-radius:50%;border:2px solid oklch(0.72 0.15 80);pointer-events:none;opacity:0}
.opening .wave{animation:bld-ring 1.2s ease-out infinite}
.key{position:relative;width:126px;height:126px;border-radius:50%;display:grid;place-items:center;font-size:48px;color:#5a4317;
  transition:transform .12s,box-shadow .12s,color .3s;
  background:radial-gradient(circle at 35% 30%,#f7e2a8,#d1a752 50%,#9c7428 100%);
  box-shadow:0 4px 6px rgba(0,0,0,.5),inset 0 1px 1px #fff8de,inset 0 -2px 3px rgba(0,0,0,.25)}
.opening .key{transform:translateY(2px) scale(.96);color:#2f2410;animation:bld-buzz .07s linear infinite;
  box-shadow:0 1px 2px rgba(0,0,0,.5),inset 0 2px 4px rgba(0,0,0,.35)}
.bar{position:absolute;left:14px;top:50%;width:5px;height:44px;margin-top:-14px;border-radius:3px;
  transition:background .3s,box-shadow .3s;background:var(--led);box-shadow:0 0 8px var(--led)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Θυροτηλέφωνο (lock)', ent('lock'), true],
      LABEL, TITLE,
      ['rto_entity', 'Άνοιγμα στο κουδούνι (προαιρετικό)', ent(['switch', 'input_boolean', 'lock'])],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'lock') }; }
  watched() { return [this._config.entity, this._config.rto_entity]; }

  template() {
    return `
<div class="card">
  ${TAG}
  <button class="kb bell ms fill" aria-label="Άνοιγμα στο κουδούνι">notifications_active</button>
  <span class="bar"></span>
  <span class="socket">
    <span class="wave"></span><span class="wave" style="animation-delay:.4s"></span><span class="wave" style="animation-delay:.8s"></span>
    <button class="key ms" aria-label="Άνοιγμα εισόδου">key</button>
  </span>
</div>`;
  }

  /* Χωρίς ξεχωριστό entity, το «ξεκλείδωτο» του ίδιου του θυροτηλεφώνου σημαίνει «ανοίγει στο κουδούνι» */
  rtoActive() {
    const c = this._config;
    return c.rto_entity ? ['on', 'unlocked'].includes(this.val(c.rto_entity)) : this.val(c.entity) === 'unlocked';
  }

  bind() {
    this.$('.key').addEventListener('click', () => {
      const id = this._config.entity;
      if (!this.available(id) || Date.now() < (this._pulse || 0)) return;
      this.call('lock', 'open', { entity_id: id });
      /* Σύντομη ανάδραση πατήματος· η πραγματική κατάσταση έρχεται από το entity */
      this._pulse = Date.now() + 3000;
      this.update();
      setTimeout(() => this.update(), 3050);
    });
    this.$('.bell').addEventListener('click', () => {
      const c = this._config;
      const id = c.rto_entity || c.entity;
      if (!this.available(id)) return;
      if (id.startsWith('lock.')) this.call('lock', this.rtoActive() ? 'lock' : 'unlock', { entity_id: id });
      else this.call('homeassistant', 'toggle', { entity_id: id });
    });
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const s = this.val(c.entity);
    const opening = ok && (s === 'open' || s === 'opening' || Date.now() < (this._pulse || 0));
    const rto = ok && this.rtoActive();
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('opening', opening);
    card.classList.toggle('rto', rto);
    card.style.setProperty('--led', opening ? 'oklch(0.72 0.17 150)' : rto ? 'oklch(0.78 0.15 75)' : '#5a1f1f');
    this.label();
  }
}

/* ── Συσκευές με πρόγραμμα: η κάρτα είναι η πρόσοψη της συσκευής ── */
const APPL_IDLE = ['off', 'idle', 'standby', 'power off', 'ready', 'none', '-', ''];
const APPL_DONE = ['finished', 'complete', 'completed', 'end', 'done'];
const APPL_PAUSED = ['pause', 'paused'];
const KNOB = '<button class="kb knob ms fill" aria-label="Έναρξη/Παύση"></button>';
const DOOR = (art) => `<div class="door"><div class="rim"></div><div class="glass">${art}<span class="check ms">check</span><span class="shine"></span></div></div>`;

class WallApplianceCard extends WallBaseCard {
  static css = `
.strip{position:absolute;left:12px;right:12px;top:12px;height:44px;display:flex;align-items:center;gap:8px}
.strip .lcd{flex:1;height:44px;cursor:pointer}
.knob{width:44px;height:44px;font-size:24px}
.drawer{width:54px;height:22px;border-radius:5px;background:linear-gradient(180deg,#dfe4e8,#f4f6f7);box-shadow:inset 0 2px 3px rgba(0,0,0,.2)}
.vent{width:54px;display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
.vent i{height:20px;border-radius:2px;background:#aab2b9;box-shadow:inset 0 1px 2px rgba(0,0,0,.3)}
.door{position:absolute;left:50%;top:62px;width:130px;height:130px;margin-left:-65px;border-radius:50%;box-shadow:0 4px 8px rgba(0,0,0,.2);
  background:conic-gradient(var(--ring) 0 var(--pct,0%),#c3cad0 var(--pct,0%) 100%)}
.rim{position:absolute;inset:7px;border-radius:50%;background:linear-gradient(145deg,#f4f6f7,#bfc6cc);box-shadow:inset 0 1px 1px #fff}
.glass{position:absolute;inset:16px;border-radius:50%;background:#1e3340;overflow:hidden;box-shadow:inset 0 4px 10px rgba(0,0,0,.6)}
.shine{position:absolute;left:14px;top:10px;width:26px;height:12px;border-radius:50%;background:rgba(255,255,255,.35);transform:rotate(-30deg)}
.water{position:absolute;width:170px;height:170px;left:50%;top:96px;border-radius:42%;transform:translateX(-50%);
  background:rgba(110,180,220,.75);transition:top .8s;animation:wm-wave 3.2s linear infinite}
.on .water{top:42px}
.card:not(.on) .water{animation-play-state:paused}
.holes{position:absolute;inset:8px;border-radius:50%;border:2px dashed rgba(255,255,255,.35)}
.on .holes{animation:wm-spin 2.4s linear infinite}
.tag{right:10px;bottom:36px}
.k-washer{--ring:#2f7fa8}
.k-dryer{--ring:#c9792e}
.k-dryer .glass{background:#3a2a20}
.warm{position:absolute;inset:0;opacity:0;transition:opacity .8s;background:radial-gradient(circle at 50% 70%,#f2b266,#7a3d12 75%)}
.on .warm{opacity:1}
.k-dryer.on .holes{animation-duration:1.6s}
.k-dish{--ring:#2f9aa0}
.band{position:absolute;left:0;right:0;top:0;height:50px;padding:0 10px 0 14px;display:flex;align-items:center;gap:8px;background:linear-gradient(180deg,#39424a,#252c32)}
.band .lcd{flex:1;height:44px;cursor:pointer;background:#101a1c;color:#8fe0e6}
.handle{position:absolute;left:14px;right:14px;top:60px;height:12px;border-radius:6px;background:linear-gradient(180deg,#f6f8f9,#b9c0c6);box-shadow:0 3px 5px rgba(0,0,0,.25)}
.win{position:absolute;left:22px;right:22px;top:86px;bottom:34px;border-radius:12px;background:#17313a;overflow:hidden;box-shadow:inset 0 4px 10px rgba(0,0,0,.6)}
.win .fillw{position:absolute;left:0;right:0;bottom:0;height:0;background:rgba(110,200,205,.45);transition:height .8s}
.on .win .fillw{height:46%}
.plates{position:absolute;left:14px;right:14px;top:12px;bottom:26px;display:flex;justify-content:space-between}
.plates i{width:8px;border-radius:4px;background:#e9eef0}
.arm{position:absolute;left:50%;bottom:10px;width:84px;height:6px;margin-left:-42px;border-radius:3px;background:#aeb9bf}
.on .arm{animation:wm-spin 1.4s linear infinite}
.bar{position:absolute;left:22px;right:22px;bottom:26px;height:3px;border-radius:2px;background:linear-gradient(90deg,var(--ring) var(--pct,0%),#c3cad0 var(--pct,0%))}
.shell.on{box-shadow:inset 0 0 0 3px var(--ring)}
.shell.done{--ring:var(--w-amber);cursor:pointer;background:linear-gradient(180deg,#fff7e6,#f6e3bd);box-shadow:inset 0 0 0 4px var(--w-amber)}
.check{position:absolute;inset:0;display:grid;place-items:center;background:#33424b;color:#fff;font-size:48px;opacity:0;transition:opacity .4s}
.done .check{opacity:1}
`;
  static kind = 'washer';
  static face = `<div class="strip"><div class="drawer"></div><div class="lcd"></div>${KNOB}</div>${DOOR('<div class="water"></div><div class="holes"></div>')}`;

  static getConfigForm() {
    const sensor = ent(['sensor', 'input_select', 'input_text', 'select']);
    const action = ent(['button', 'input_button', 'script', 'switch']);
    return form([
      ['entity', 'Κατάσταση (τρέχει / σβηστό / τελείωσε)', ANY, true],
      LABEL, TITLE,
      ['remaining_entity', 'Υπόλοιπος χρόνος', sensor],
      ['total_entity', 'Συνολικός χρόνος προγράμματος', sensor],
      ['program_entity', 'Πρόγραμμα', sensor],
      ['temp_entity', 'Θερμοκρασία', sensor],
      ['pause_entity', 'Κουμπί παύσης', action],
      ['start_entity', 'Κουμπί έναρξης', action],
      ['ack_entity', 'Ενέργεια επιβεβαίωσης «το άδειασα» (προαιρετικό)', action],
    ]);
  }
  static getStubConfig() { return { entity: '' }; }

  watched() {
    const c = this._config;
    return [c.entity, c.remaining_entity, c.total_entity, c.program_entity, c.temp_entity, c.pause_entity, c.start_entity];
  }

  template() {
    const k = this.constructor;
    return `<div class="card shell k-${k.kind}">${k.face}${TAG}<span class="lamp"></span><span class="sub note"></span></div>`;
  }

  bind() {
    /* Πάτημα στην κάρτα: επιβεβαίωση όταν έχει τελειώσει, αλλιώς λεπτομέρειες */
    this.$('.card').addEventListener('click', (e) => {
      if (e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
    this.$('.knob').addEventListener('click', () => this.trigger(this._action));
    /* Πάτημα στην οθόνη: εναλλαγή ανάμεσα σε υπόλοιπο (−) και χρόνο που πέρασε (+) */
    const lcd = this.$('.lcd');
    lcd.setAttribute('role', 'button');
    lcd.setAttribute('aria-label', 'Υπόλοιπο ή χρόνος που πέρασε');
    lcd.addEventListener('click', (e) => {
      if (!this._canFlip) return;
      e.stopPropagation();
      this._elapsed = !this._elapsed;
      this.update();
    });
    });
    this.$('.knob').addEventListener('click', () => this.trigger(this._action));
  }

  /* Επιβεβαίωση «το άδειασα»: γυρίζει τη συσκευή σε ανενεργή. Η κατάσταση ζει στο HA, όχι στην κάρτα. */
  ack() {
    const c = this._config;
    if (c.ack_entity) return this.trigger(c.ack_entity);
    const domain = c.entity.split('.')[0];
    const idle = (this.st(c.entity)?.attributes?.options || []).find((o) => APPL_IDLE.includes(String(o).toLowerCase()));
    if (['input_select', 'select'].includes(domain) && idle) return this.call(domain, 'select_option', { entity_id: c.entity, option: idle });
    this.moreInfo(c.entity);
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const raw = ok ? String(this.st(c.entity).state).toLowerCase() : '';
    const paused = APPL_PAUSED.includes(raw);
    const done = APPL_DONE.includes(raw);
    const run = ok && !paused && !done && !APPL_IDLE.includes(raw);

    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', run);
    card.classList.toggle('done', done);
    card.classList.toggle('idle', ok && !run && !paused && !done);
    this._done = done;
    this.label();
    const program = [this.val(c.program_entity), this.val(c.temp_entity)].filter(Boolean).join(' ');
    this.$('.note').textContent =
      !ok ? 'Μη διαθέσιμο' : paused ? 'Σε παύση' : done ? '' : run ? program || 'Σε λειτουργία' : '';

    /* Επιλογέας: παύση όταν τρέχει, έναρξη αλλιώς — μόνο αν έχει οριστεί το αντίστοιχο entity */
    const knob = this.$('.knob');
    this._action = run ? c.pause_entity : c.start_entity;
    knob.hidden = !c.pause_entity && !c.start_entity;
    knob.disabled = !this._action || this.st(this._action)?.state === 'unavailable';
    knob.textContent = run ? 'pause' : 'play_arrow';

    const active = run || paused;
    const rem = active ? toMinutes(this.st(c.remaining_entity)) : null;
    const total = active ? toMinutes(this.st(c.total_entity)) : null;
    const m = rem == null ? null : Math.round(rem);
    /* Χρόνος που πέρασε = συνολικός − υπόλοιπο· χωρίς συνολικό χρόνο δεν γίνεται εναλλαγή */
    this._canFlip = rem != null && total != null;
    const shown = this._canFlip && this._elapsed ? Math.max(0, Math.round(total - rem)) : m;
    const sign = !this._canFlip ? '' : this._elapsed ? '+' : '−';
    this.$('.lcd').textContent = done ? 'ΤΕΛΟΣ' : shown == null ? '--:--' : `${sign}${Math.floor(shown / 60)}:${pad2(shown % 60)}`;
    const pct = done ? 100 : rem != null && total ? clamp((1 - rem / total) * 100, 0, 100) : 0;
    card.style.setProperty('--pct', pct + '%');
  }
}
class WallWasherCard extends WallApplianceCard {}
class WallDryerCard extends WallApplianceCard {
  static kind = 'dryer';
  static face = `<div class="strip"><div class="vent">${'<i></i>'.repeat(6)}</div><div class="lcd"></div>${KNOB}</div>${DOOR('<div class="warm"></div><div class="holes"></div>')}`;
}
class WallDishwasherCard extends WallApplianceCard {
  static kind = 'dish';
  static face = `<div class="band"><div class="lcd"></div>${KNOB}</div><div class="handle"></div>
<div class="win"><div class="fillw"></div><div class="plates">${'<i></i>'.repeat(7)}</div><div class="arm"></div><span class="check ms">check</span></div><div class="bar"></div>`;
}

/* ── Κλίμα: στρογγυλός θερμοστάτης τοίχου, ή εσωτερική μονάδα κλιματιστικού ── */
const COOL_MODES = ['cool', 'dry', 'fan_only'];

class WallClimateCard extends WallBaseCard {
  static css = `
.steps{align-items:center}
.steps .pw{flex:none;width:44px;height:44px;border-radius:50%;font-size:22px;
  background:radial-gradient(circle at 35% 30%,#fff,#dfe3e6 45%,#aeb5bb);box-shadow:0 3px 6px rgba(0,0,0,.28),inset 0 1px 1px #fff}
.on .steps .pw{color:#fff;background:radial-gradient(circle at 35% 30%,color-mix(in oklch,var(--acc) 55%,#fff),var(--acc))}
.room{display:none}
/* θερμοστάτης */
.th .ring{position:relative;flex:none;width:140px;height:140px;margin:-6px auto 0;border-radius:50%;
  background:conic-gradient(from 225deg,var(--acc,#9aa4ad) 0 var(--deg,0deg),#c9cfd4 var(--deg,0deg) 270deg,transparent 270deg)}
.bez{position:absolute;inset:8px;border-radius:50%;background:linear-gradient(145deg,#f7f8f9,#c4cad0);box-shadow:0 4px 8px rgba(40,40,40,.2)}
.face{position:absolute;inset:18px;border-radius:50%;background:radial-gradient(circle at 40% 30%,#2e353b,#0f1215);
  display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
.flame{font-size:16px;color:#ff9a57;opacity:0;transition:opacity .4s}
.heating .flame{opacity:1}
.th .sp{font:500 29px var(--w-font);letter-spacing:-1px;line-height:1.1}
.th .room{font:500 13px var(--w-font);color:#b9c1c8}
.th .tag{left:10px;top:10px}
/* κλιματιστικό */
.unit{position:relative;flex:none;height:62px;margin:-2px -4px 0;border-radius:14px 14px 8px 8px;
  background:linear-gradient(180deg,#fff,#e8ecef);box-shadow:0 6px 12px rgba(40,60,90,.22),inset 0 1px 0 #fff}
.vents{position:absolute;left:12px;top:13px;display:flex;flex-direction:column;gap:4px}
.vents i{width:64px;height:2px;background:#c9d0d6}
.unit .lcd{position:absolute;right:10px;top:8px;width:82px;height:32px;background:#16222e;color:var(--lcd,#6b7a86);transition:color .3s}
.flap{position:absolute;left:8px;right:8px;bottom:-3px;height:9px;border-radius:3px;transform-origin:50% 0;transition:transform .6s;
  background:linear-gradient(180deg,#f7f9fa,#cdd4da);box-shadow:0 2px 3px rgba(0,0,0,.2)}
.on .flap{transform:perspective(60px) rotateX(-35deg)}
.ac .tag{left:26px;top:56px}
.ac .fx{top:70px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Θερμοστάτης / κλιματιστικό', ent('climate'), true],
      LABEL, TITLE,
      ['look', 'Μορφή', { select: { mode: 'dropdown', options: [
        { value: 'auto', label: 'Αυτόματα' }, { value: 'thermostat', label: 'Θερμοστάτης' }, { value: 'ac', label: 'Κλιματιστικό' },
      ] } }],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'climate') }; }
  watched() { return [this._config.entity]; }

  template() {
    /* Αυτόματα: ό,τι μπορεί να ψύξει σχεδιάζεται ως κλιματιστικό */
    const modes = this.st(this._config.entity)?.attributes?.hvac_modes || [];
    const look = this._config.look;
    this._ac = look === 'ac' || (look !== 'thermostat' && modes.includes('cool'));
    const steps = `
  <div class="steps">
    <button class="ms dn" aria-label="Χαμηλότερα">keyboard_arrow_down</button>
    <button class="pw ms" aria-label="On/Off">power_settings_new</button>
    <button class="ms up" aria-label="Ψηλότερα">keyboard_arrow_up</button>
  </div>`;
    return this._ac
      ? `<div class="card ac">${fxHTML()}
  <div class="unit"><div class="vents"><i></i><i></i><i></i></div><div class="lcd sp"></div><div class="flap"></div></div>
  ${TAG}<span class="sub room"></span>${steps}</div>`
      : `<div class="card th">${fxHTML()}${TAG}
  <div class="ring"><div class="bez"></div><div class="face">
    <span class="ms fill flame">local_fire_department</span><span class="sp"></span><span class="room"></span>
  </div></div>${steps}</div>`;
  }

  bind() {
    this.tapMore(() => climatePopup(this));
    this.$('.pw').addEventListener('click', () => {
      const id = this._config.entity;
      if (this.available(id)) this.call('climate', this.val(id) === 'off' ? 'turn_on' : 'turn_off', { entity_id: id });
    });
    const step = (dir) => () => {
      const id = this._config.entity;
      const a = this.st(id)?.attributes || {};
      const cur = this._hold && Date.now() < this._hold.until ? this._hold.v : a.temperature;
      if (!this.available(id) || cur == null) return;
      const by = a.target_temp_step || 0.5;
      const v = clamp(Math.round((cur + dir * by) / by) * by, a.min_temp ?? 5, a.max_temp ?? 35);
      this._hold = { v, until: Date.now() + 3000 };
      this.update();
      this.call('climate', 'set_temperature', { entity_id: id, temperature: v });
    };
    this.$('.dn').addEventListener('click', step(-1));
    this.$('.up').addEventListener('click', step(1));
  }

  update() {
    const id = this._config.entity;
    const ok = this.available(id);
    const s = this.st(id);
    const a = s?.attributes || {};
    const on = ok && s.state !== 'off';
    const action = a.hvac_action;
    const cool = action && action !== 'idle' && action !== 'off' ? action === 'cooling' : COOL_MODES.includes(s?.state);
    const active = on && (action ? action === 'heating' || action === 'cooling' : true);

    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.classList.toggle('heating', active && !cool);
    card.style.setProperty('--acc', !on ? '#9aa4ad' : cool ? 'var(--w-cold)' : 'var(--w-hot)');
    card.style.setProperty('--tint', cool ? 'oklch(0.93 0.035 235)' : 'oklch(0.94 0.035 60)');
    card.style.setProperty('--lcd', !on ? '#6b7a86' : cool ? '#9fd4ff' : '#ffc48a');
    const fx = this.$('.fx');
    fx.classList.toggle('show', active);
    fx.classList.toggle('cool', cool);
    fx.classList.toggle('heat', !cool);
    this.label();

    const room = a.current_temperature != null ? `χώρος ${fmt(a.current_temperature, 1)}°` : '';
    this.$('.room').textContent = !ok ? 'Μη διαθέσιμο' : '';

    const held = this._hold && Date.now() < this._hold.until;
    if (!held) this._hold = null;
    const sp = held ? this._hold.v : a.temperature;
    const dec = (a.target_temp_step || 0.5) < 1 ? 1 : 0;
    this.$('.sp').textContent = sp != null ? `${fmt(sp, dec)}°` : '—';
    const lo = a.min_temp ?? 5, hi = a.max_temp ?? 35;
    card.style.setProperty('--deg', (sp != null ? clamp((sp - lo) / (hi - lo), 0, 1) * 270 : 0) + 'deg');
    this.shadowRoot.querySelectorAll('.dn,.up').forEach((b) => (b.style.visibility = sp != null ? 'visible' : 'hidden'));
  }
}

/* ── Θερμοσίφωνας: κύλινδρος που ζεσταίνεται και μηχανικός χρονοδιακόπτης ── */
class WallHeaterCard extends WallBaseCard {
  static css = `
.card{--acc:var(--w-hot);--tint:oklch(0.95 0.03 50);padding:0}
.tank{position:absolute;left:18px;top:20px;bottom:16px;width:70px;border-radius:30px;
  background:linear-gradient(90deg,#d9dee2,#fbfcfc 40%,#cfd5da);box-shadow:0 6px 12px rgba(90,50,20,.22)}
.tank::before,.tank::after{content:'';position:absolute;top:-10px;width:6px;height:12px;background:#b9c0c6}
.tank::before{left:18px}.tank::after{right:18px}
.well{position:absolute;left:8px;right:8px;top:12px;bottom:12px;border-radius:22px;background:#e9edf0;overflow:hidden;box-shadow:inset 0 2px 5px rgba(0,0,0,.25)}
.hot{position:absolute;left:0;right:0;bottom:0;height:var(--fill,0%);background:linear-gradient(0deg,#d9502a,#f2a25c);transition:height 1s}
.well i{position:absolute;bottom:-4px;width:14px;height:14px;margin-left:-7px;border-radius:50%;opacity:0;
  background:rgba(255,235,210,.8);animation:heat-rise 3.2s ease-in infinite}
.card:not(.on) .well i{animation:none}
.side{position:absolute;left:100px;right:12px;top:14px;bottom:12px;display:flex;flex-direction:column;align-items:center;justify-content:space-between}
.dialr{flex:none;width:84px;height:84px;border-radius:50%;position:relative;
  background:repeating-conic-gradient(#8a939b 0 2deg,#f4f6f7 2deg 15deg);box-shadow:0 4px 8px rgba(0,0,0,.25)}
.pw{position:absolute;inset:9px;font-size:22px}
.on .pw{color:var(--w-hot)}
.ptr{position:absolute;left:50%;top:4px;width:4px;height:16px;margin-left:-2px;border-radius:2px;background:var(--w-hot);
  transform-origin:50% 29px;transform:rotate(var(--ang,0deg));transition:transform .5s}
.big{font-size:26px;letter-spacing:-.5px}
.hint{min-height:16px;font-size:12px}
.steps{align-self:stretch;gap:6px}
.steps button{font-size:22px}
.tag{left:14px;bottom:6px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Διακόπτης θερμοσίφωνα', ent(['switch', 'input_boolean']), true],
      LABEL, TITLE,
      ['timer_entity', 'Χρονόμετρο (timer helper)', ent('timer')],
      ['default_minutes', 'Προεπιλεγμένη διάρκεια (λεπτά)', { number: { min: 1, max: 180, step: 1, mode: 'box' } }],
      ['max_minutes', 'Μέγιστη διάρκεια (λεπτά)', { number: { min: 10, max: 240, step: 5, mode: 'box' } }],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'switch') }; }
  watched() { return [this._config.entity, this._config.timer_entity]; }

  template() {
    return `
<div class="card">
  <div class="tank"><div class="well"><div class="hot"></div><i style="left:32%"></i><i style="left:62%;animation-delay:1.4s"></i></div></div>
  ${TAG}
  <div class="side">
    <div class="dialr"><button class="kb pw ms fill" aria-label="On/Off"><span class="ptr"></span>power_settings_new</button></div>
    <span class="big"></span><span class="sub hint"></span>
    <div class="steps">
      <button class="ms dn" aria-label="−1 λεπτό">remove</button>
      <button class="ms up" aria-label="+1 λεπτό">add</button>
    </div>
  </div>
</div>`;
  }

  /* Δευτερόλεπτα που απομένουν στο χρονόμετρο, ή null αν δεν μετράει */
  left() {
    const t = this.st(this._config.timer_entity);
    if (!t || t.state !== 'active' || !t.attributes.finishes_at) return null;
    return Math.max(0, Math.round((new Date(t.attributes.finishes_at) - Date.now()) / 1000));
  }
  max() { return this._config.max_minutes || 30; }

  bind() {
    this._dur = this._config.default_minutes || 15;
    this.$('.pw').addEventListener('click', () => {
      const c = this._config;
      if (!this.available(c.entity)) return;
      const on = this.val(c.entity) === 'on';
      this.call('homeassistant', on ? 'turn_off' : 'turn_on', { entity_id: c.entity });
      if (c.timer_entity) {
        if (on) this.call('timer', 'cancel', { entity_id: c.timer_entity });
        else this.call('timer', 'start', { entity_id: c.timer_entity, duration: hms(this._dur * 60) });
      }
    });
    const step = (dir) => () => {
      const left = this.left();
      if (left != null) {
        /* Όσο μετράει: ξεκινάμε ξανά το χρονόμετρο με τον νέο υπόλοιπο χρόνο */
        const secs = clamp(left + dir * 60, 60, this.max() * 60);
        this.call('timer', 'start', { entity_id: this._config.timer_entity, duration: hms(secs) });
      } else {
        this._dur = clamp(this._dur + dir, 1, this.max());
        this.update();
      }
    };
    this.$('.dn').addEventListener('click', step(-1));
    this.$('.up').addEventListener('click', step(1));
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const on = this.val(c.entity) === 'on';
    const left = on ? this.left() : null;
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    this.tick(left != null);
    this.label();
    this.$('.steps').style.visibility = c.timer_entity ? 'visible' : 'hidden';

    let big, hint, frac, fill;
    if (left != null) {
      const total = (toMinutes({ state: this.st(c.timer_entity).attributes.duration || '' }) || this._dur) * 60;
      big = `${Math.floor(left / 60)}:${pad2(left % 60)}`;
      hint = `τέλος ${hhmm(new Date(this.st(c.timer_entity).attributes.finishes_at))}`;
      frac = left / (this.max() * 60);
      fill = clamp((1 - left / total) * 100, 12, 100);
    } else if (on) {
      big = 'On'; hint = ''; frac = 1; fill = 100;
    } else {
      big = c.timer_entity ? `${this._dur}′` : 'Off'; hint = !ok ? 'Μη διαθέσιμος' : c.timer_entity ? 'διάρκεια' : '';
      frac = c.timer_entity ? this._dur / this.max() : 0; fill = 0;
    }
    this.$('.big').textContent = big;
    this.$('.hint').textContent = hint;
    card.style.setProperty('--ang', clamp(frac, 0, 1) * 360 + 'deg');
    card.style.setProperty('--fill', fill + '%');
  }
}

/* ── Καθαριστής αέρα: πύργος με φωτεινό δαχτυλίδι ποιότητας και ρυθμιστικό στάθμης ── */
const PUR_OFF = ['off', 'idle', 'standby', 'unavailable', 'unknown', ''];

class WallPurifierCard extends WallBaseCard {
  static css = `
.card{padding:0;--acc:oklch(0.58 0.13 var(--h,150));--tint:oklch(0.95 0.03 var(--h,150))}
.tower{position:absolute;left:18px;top:18px;bottom:14px;width:88px;border-radius:26px 26px 14px 14px;
  background:linear-gradient(90deg,#dfe4e7,#ffffff 45%,#d3d9dd);box-shadow:0 6px 12px rgba(30,60,40,.22)}
.solo .tower{left:50%;margin-left:-44px}
.halo{position:absolute;left:10px;right:10px;top:10px;height:22px;border-radius:50%;background:#20262b;
  box-shadow:0 0 0 4px #b8c2cb;transition:box-shadow .4s}
.on .halo{box-shadow:0 0 0 4px var(--glow,#e9eef2),0 0 10px var(--glow,#e9eef2)}
.grille{position:absolute;left:12px;right:12px;top:48px;bottom:14px;border-radius:8px;
  background:radial-gradient(circle,#8f989f 1.5px,transparent 2px) 0 0/8px 8px}
.pw{position:absolute;left:50%;bottom:16px;width:48px;height:48px;margin-left:-24px;font-size:24px}
.lv{position:absolute;right:16px;top:18px;bottom:14px;width:80px;border-radius:22px;background:#cdd6cf;box-shadow:inset 0 2px 5px rgba(0,0,0,.2)}
.lv.live{cursor:pointer}
.lvfill{position:absolute;left:4px;right:4px;bottom:4px;height:calc(var(--pos,0) * (100% - 48px) + 20px);border-radius:18px;
  background:var(--acc);opacity:0;transition:height .4s,opacity .3s}
.on .lvfill{opacity:.85}
.thumb{position:absolute;left:4px;right:4px;height:40px;bottom:calc(var(--pos,0) * (100% - 48px) + 4px);border-radius:20px;
  display:grid;place-items:center;padding:0 6px;font:700 14px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  background:linear-gradient(180deg,#ffffff,#e3e7ea);box-shadow:0 3px 6px rgba(0,0,0,.25),inset 0 1px 0 #fff;transition:bottom .4s var(--w-spring)}
.tag{left:22px;top:52px;max-width:80px}
`;

  static getConfigForm() {
    const action = ent(['script', 'button', 'input_button']);
    return form([
      ['entity', 'Κατάσταση ή συσκευή (fan, διακόπτης, αισθητήρας)', ANY, true],
      LABEL, TITLE,
      ['level_entity', 'Στάθμη λειτουργίας — μόνο ένδειξη (προαιρετικό)', ent(['input_select', 'select', 'sensor'])],
      ['pm25_entity', 'Αισθητήρας PM2.5 για το χρώμα του δαχτυλιδιού (προαιρετικό)', ent('sensor')],
      ['on_entity', 'Ενέργεια ανάμματος (προαιρετικό)', action],
      ['off_entity', 'Ενέργεια σβησίματος (προαιρετικό)', action],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'fan') }; }
  watched() { const c = this._config; return [c.entity, c.level_entity, c.pm25_entity]; }

  template() {
    return `
<div class="card">
  <div class="tower"><div class="halo"></div><div class="grille"></div>
    <button class="kb pw ms fill" aria-label="On/Off">power_settings_new</button>
  </div>
  ${TAG}
  <div class="lv"><div class="lvfill"></div><div class="thumb"></div></div>
</div>`;
  }

  /* Οι στάθμες έρχονται από το level_entity (ένδειξη) ή από τα preset ενός fan (ρυθμίζονται) */
  levels() {
    const c = this._config;
    const lv = this.st(c.level_entity);
    if (lv) return { list: lv.attributes?.options || [], cur: lv.state, live: false };
    const a = this.st(c.entity)?.attributes || {};
    if (c.entity.startsWith('fan.') && a.preset_modes?.length) return { list: a.preset_modes, cur: a.preset_mode, live: true };
    return { list: [], cur: '', live: false };
  }
  direct() { return ['fan', 'switch', 'input_boolean', 'light'].includes(this._config.entity.split('.')[0]); }
  isOn() { return this.available(this._config.entity) && !PUR_OFF.includes(this.val(this._config.entity).toLowerCase()); }

  bind() {
    this.tapMore();
    this.$('.pw').addEventListener('click', () => {
      const c = this._config;
      if (!this.available(c.entity)) return;
      if (this.direct()) this.call('homeassistant', 'toggle', { entity_id: c.entity });
      else this.trigger(this.isOn() ? c.off_entity : c.on_entity);
    });
    this.$('.lv').addEventListener('click', (e) => {
      const { list, live } = this.levels();
      if (!live) return;
      e.stopPropagation();
      const r = this.$('.lv').getBoundingClientRect();
      const i = Math.round(clamp((r.bottom - e.clientY) / r.height, 0, 1) * (list.length - 1));
      this.call('fan', 'set_preset_mode', { entity_id: this._config.entity, preset_mode: list[i] });
    });
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const on = this.isOn();
    const pm = this.num(c.pm25_entity);
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.style.setProperty('--h', isNaN(pm) ? 150 : airQuality(pm)[1]);
    card.style.setProperty('--glow', isNaN(pm) ? '#e9eef2' : `oklch(0.72 0.15 ${airQuality(pm)[1]})`);
    this.$('.pw').classList.toggle('lit', on);
    this.$('.pw').hidden = !this.direct() && !c.on_entity && !c.off_entity;
    this.label();

    const { list, cur, live } = this.levels();
    const i = list.indexOf(cur);
    const lv = this.$('.lv');
    lv.hidden = !list.length;
    lv.classList.toggle('live', live);
    card.classList.toggle('solo', !list.length);
    card.style.setProperty('--pos', i > 0 && list.length > 1 ? i / (list.length - 1) : 0);
    this.$('.thumb').textContent = i >= 0 ? cur : '—';
  }
}

/* ── Ποιότητα αέρα: επιτοίχιος αισθητήρας με οθόνη ── */
class WallAirCard extends WallBaseCard {
  static css = `
.card{padding:0;background:linear-gradient(160deg,#eef1f3,#dfe4e8)}
.dev{position:absolute;left:20px;right:20px;top:20px;bottom:20px;border-radius:26px;
  background:linear-gradient(160deg,#ffffff,#e4e8eb);box-shadow:0 8px 16px rgba(40,50,60,.2),inset 0 1px 0 #fff}
.lcd{position:absolute;left:14px;right:14px;top:14px;height:104px;border-radius:12px;padding:8px 10px;
  display:flex;flex-direction:column;justify-content:space-between;place-items:stretch}
.main{display:flex;align-items:baseline;gap:6px}
.pm{font:500 36px var(--w-font);line-height:1}
.q{margin-left:auto;font-size:12px}
.small{font-size:11px}
.more{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px;font-size:11px;line-height:1.25;white-space:pre-line}
.more span{overflow:hidden;text-overflow:ellipsis}
.slots{position:absolute;left:14px;right:14px;bottom:30px;display:grid;grid-template-columns:repeat(9,1fr);gap:4px}
.slots i{height:3px;background:#aab2b9}
.led{position:absolute;left:50%;bottom:11px;width:48px;height:5px;margin-left:-24px;border-radius:3px;
  background:oklch(0.7 0.15 var(--h,150));transition:background .4s}
.tag{left:50%;transform:translateX(-50%);top:4px}
`;

  static getConfigForm() {
    const sensor = ent('sensor');
    return form([
      ['entity', 'PM2.5', sensor, true],
      LABEL, TITLE,
      ['co2_entity', 'CO₂ (προαιρετικό)', sensor],
      ['voc_entity', 'VOC (προαιρετικό)', sensor],
      ['pm10_entity', 'PM10 (προαιρετικό)', sensor],
    ]);
  }
  static getStubConfig() { return { entity: '' }; }
  watched() { const c = this._config; return [c.entity, c.co2_entity, c.voc_entity, c.pm10_entity]; }

  template() {
    return `
<div class="card">
  ${TAG}
  <div class="dev">
    <div class="lcd">
      <div class="main"><span class="pm"></span><span class="small">PM2.5</span><span class="q"></span></div>
      <div class="more">
        <span data-k="co2_entity" data-n="CO₂"></span><span data-k="voc_entity" data-n="VOC"></span><span data-k="pm10_entity" data-n="PM10"></span>
      </div>
    </div>
    <div class="slots">${'<i></i>'.repeat(9)}</div>
    <div class="led"></div>
  </div>
</div>`;
  }

  bind() { this.tapMore(); }

  update() {
    const c = this._config;
    const pm = this.num(c.entity);
    const ok = !isNaN(pm);
    const [quality, hue] = ok ? airQuality(pm) : ['', 150];
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.style.setProperty('--h', hue);
    this.label();
    this.$('.pm').textContent = ok ? String(Math.round(pm)) : '--';
    this.$('.q').textContent = quality;
    this.shadowRoot.querySelectorAll('.more span').forEach((el) => {
      const v = this.val(c[el.dataset.k]);
      el.hidden = !v;
      if (!v) return;
      const n = parseFloat(v);
      el.textContent = `${el.dataset.n}
${isNaN(n) ? v : String(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).replace('.', ',')}`;
    });
  }
}

/* ── Σκούπα ρομπότ: το ρομπότ από πάνω, με τα δύο του πλήκτρα ── */
const VAC_LABELS = {
  docked: 'Στη βάση', cleaning: 'Καθαρίζει', paused: 'Σε παύση', returning: 'Επιστρέφει', idle: 'Σε αναμονή', error: 'Σφάλμα',
};
const VAC_LED = {
  docked: '#4fc27a', cleaning: 'oklch(0.75 0.17 150)', paused: 'oklch(0.8 0.15 75)', returning: 'oklch(0.7 0.13 240)', error: 'oklch(0.62 0.2 28)',
};

class WallVacuumCard extends WallBaseCard {
  static css = `
.card,.card.on{padding:0;background:linear-gradient(160deg,#eef2ee,#dbe6dc)}
.dock{position:absolute;left:50%;top:0;width:100px;height:30px;margin-left:-50px;border-radius:0 0 12px 12px;
  background:linear-gradient(180deg,#cfd6db,#b4bcc3)}
.dock span{position:absolute;left:50%;top:14px;width:16px;height:4px;margin-left:-8px;border-radius:2px;background:var(--led,#b8c2cb)}
.bot{position:absolute;left:50%;top:22px;width:156px;height:156px;margin-left:-78px;border-radius:50%;transition:top .6s,box-shadow .3s;
  background:radial-gradient(circle at 38% 28%,#59626b,#15191d 70%);box-shadow:0 8px 16px rgba(0,0,0,.35),0 0 0 3px var(--led,#b8c2cb)}
.card:not(.docked) .bot{top:32px}
.on .bot{animation:wm-shake .4s linear infinite}
.turret{position:absolute;left:50%;top:14px;width:46px;height:46px;margin-left:-23px;border-radius:50%;
  background:radial-gradient(circle at 40% 30%,#3a424a,#0d1013);box-shadow:inset 0 1px 1px rgba(255,255,255,.2),0 2px 4px rgba(0,0,0,.5)}
.keys{position:absolute;left:16px;right:16px;bottom:22px;display:flex;justify-content:space-between}
.keys .kb{width:46px;height:46px;font-size:24px}
.tag{left:10px;top:10px;max-width:50px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Σκούπα', ent('vacuum'), true],
      LABEL, TITLE,
      ['battery_entity', 'Μπαταρία (προαιρετικό)', ent('sensor', 'battery')],
      ['area_entity', 'Καθαρισμένη επιφάνεια (προαιρετικό)', ent('sensor')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'vacuum') }; }
  watched() { const c = this._config; return [c.entity, c.battery_entity, c.area_entity]; }

  template() {
    return `
<div class="card">
  <div class="dock"><span></span></div>
  ${TAG}
  <div class="bot">
    <div class="turret"></div>
    <div class="keys">
      <button class="kb go ms fill" aria-label="Έναρξη/Παύση"></button>
      <button class="kb home ms fill" aria-label="Επιστροφή στη βάση">home</button>
    </div>
  </div>
  <span class="sub note"></span>
</div>`;
  }

  bind() {
    this.tapMore();
    const id = () => this._config.entity;
    this.$('.go').addEventListener('click', () => {
      if (this.available(id())) this.call('vacuum', this.val(id()) === 'cleaning' ? 'pause' : 'start', { entity_id: id() });
    });
    this.$('.home').addEventListener('click', () => {
      if (this.available(id())) this.call('vacuum', 'return_to_base', { entity_id: id() });
    });
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const s = this.val(c.entity);
    const cleaning = s === 'cleaning';
    const batt = !isNaN(this.num(c.battery_entity)) ? this.num(c.battery_entity) : this.st(c.entity)?.attributes?.battery_level;
    const area = this.num(c.area_entity);
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', cleaning);
    card.classList.toggle('docked', s === 'docked');
    card.style.setProperty('--led', VAC_LED[s] || '#b8c2cb');
    this.label();
    this.$('.go').textContent = cleaning ? 'pause' : 'play_arrow';
    const extra = (cleaning || s === 'paused') && !isNaN(area) ? `${Math.round(area)} m²` : batt != null ? `${Math.round(batt)}%` : '';
    this.$('.note').textContent = ok ? [VAC_LABELS[s] || s, extra].filter(Boolean).join(' · ') : 'Μη διαθέσιμη';
  }
}

/* ── Τηλεόραση (πλατιά): η οθόνη δείχνει ό,τι παίζει, τα πλήκτρα είναι στο τηλεχειριστήριο ── */
class WallTvCard extends WallWideCard {
  static css = `
.card,.card.on{padding:18px 20px 14px;flex-direction:row;justify-content:flex-start;align-items:stretch;gap:18px;
  background:linear-gradient(160deg,#f1f3f5,#dfe4e8)}
.tv{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center}
.set{flex:1;align-self:stretch;border-radius:8px;background:#0c0f12;padding:5px;box-shadow:0 8px 16px rgba(20,30,40,.35)}
.screen{height:100%;border-radius:4px;background:#14181c center/cover no-repeat;color:#fff;padding:10px 12px;overflow:hidden;
  display:flex;flex-direction:column;justify-content:space-between;transition:background-color .4s}
.on .screen{background-image:linear-gradient(135deg,oklch(0.42 0.13 var(--h,20)),#161a20)}
.src{font:700 11px var(--w-font);letter-spacing:.4px;text-transform:uppercase;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.info{display:flex;flex-direction:column;min-width:0;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.title{font-weight:700;font-size:16px}
.ssub{font:500 12px var(--w-font);opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.prog{height:3px;border-radius:2px;background:rgba(255,255,255,.25);margin-top:6px}
.prog i{display:block;height:100%;border-radius:2px;background:#fff;width:var(--pct,0%)}
.neck{width:20px;height:12px;background:#2a3036}
.foot{width:96px;height:7px;border-radius:4px;background:linear-gradient(180deg,#4a525a,#22272c)}
.remote{flex:none;width:78px;border-radius:22px;padding:12px 0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
  background:linear-gradient(160deg,#3b434a,#1c2126);box-shadow:0 6px 12px rgba(0,0,0,.3)}
.remote .kb{width:46px;height:46px;font-size:22px}
.pwr{--acc:#c0392b}
.mute{--acc:oklch(0.6 0.17 30)}
.tag{left:20px;bottom:8px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Τηλεόραση', ent('media_player'), true],
      LABEL, TITLE,
      ['remote_entity', 'Χειριστήριο (προαιρετικό)', ent('remote')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'media_player') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="tv">
    <div class="set"><div class="screen">
      <span class="src"></span>
      <div class="info"><span class="title"></span><span class="ssub"></span><div class="prog"><i></i></div></div>
    </div></div>
    <div class="neck"></div><div class="foot"></div>
  </div>
  ${TAG}
  <div class="remote">
    <button class="kb pwr ms" aria-label="On/Off">power_settings_new</button>
    <button class="kb mute ms" aria-label="Σίγαση"></button>
    <button class="kb more ms" aria-label="Χειριστήριο">apps</button>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    const id = () => this._config.entity;
    this.$('.pwr').addEventListener('click', () => {
      if (this.available(id())) this.call('media_player', 'toggle', { entity_id: id() });
    });
    this.$('.mute').addEventListener('click', () => {
      const muted = !!this.st(id())?.attributes?.is_volume_muted;
      if (this.available(id())) this.call('media_player', 'volume_mute', { entity_id: id(), is_volume_muted: !muted });
    });
    this.$('.more').addEventListener('click', () => this.moreInfo(this._config.remote_entity || id()));
  }

  update() {
    const id = this._config.entity;
    const ok = this.available(id);
    const s = this.st(id);
    const a = s?.attributes || {};
    const on = ok && !['off', 'standby'].includes(s.state);
    const source = a.app_name || a.source || '';
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.style.setProperty('--h', [...source].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360);
    this.label();
    this.$('.screen').style.backgroundImage = on && a.entity_picture ? cssUrl(a.entity_picture) : '';
    this.$('.src').textContent = on ? source : '';
    this.$('.title').textContent = on ? a.media_title || '' : '';
    this.$('.ssub').textContent = on ? a.media_series_title || a.media_artist || '' : '';
    const pct = on ? mediaProgress(s) : null;
    this.$('.prog').style.visibility = pct == null ? 'hidden' : 'visible';
    card.style.setProperty('--pct', (pct || 0) + '%');
    this.tick(pct != null && s.state === 'playing');
    this.$('.pwr').classList.toggle('lit', on);
    const mute = this.$('.mute');
    mute.textContent = a.is_volume_muted ? 'volume_off' : 'volume_up';
    mute.classList.toggle('lit', !!a.is_volume_muted);
  }
}

/* ── Μουσική (πλατιά): πικάπ, με το εξώφυλλο ως ετικέτα του δίσκου ── */
class WallMusicCard extends WallWideCard {
  static css = `
.card,.card.on{padding:0;flex-direction:row;justify-content:flex-start;color:#fff;background:linear-gradient(160deg,#5a4634,#33261b)}
.deck{width:212px;flex:none;position:relative}
.disc{position:absolute;left:22px;top:50%;width:172px;height:172px;margin-top:-86px;border-radius:50%;
  background:repeating-radial-gradient(circle,#111 0 2px,#262626 2px 4px);box-shadow:0 6px 14px rgba(0,0,0,.5);
  animation:wm-spin 6s linear infinite;animation-play-state:paused}
.playing .disc{animation-play-state:running}
.lab{position:absolute;inset:52px;border-radius:50%;
  background:linear-gradient(135deg,oklch(0.62 0.14 var(--h,25)),oklch(0.4 0.12 calc(var(--h,25) + 40))) center/cover no-repeat}
.hole{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:#e9e9e9}
.pivot{position:absolute;right:0;top:18px;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9aa1a8)}
.arm{position:absolute;right:9px;top:29px;width:5px;height:108px;border-radius:3px;background:linear-gradient(90deg,#b9bfc5,#f1f3f4);
  transform-origin:50% 0;transform:rotate(6deg);transition:transform .8s}
.playing .arm{transform:rotate(24deg)}
.body{flex:1;min-width:0;padding:18px 18px 16px 10px;display:flex;flex-direction:column;justify-content:space-between}
.title{font-weight:700;font-size:16px}
.sub{color:#e2d3c3}
.prog{height:4px;border-radius:2px;background:rgba(255,255,255,.2);overflow:hidden}
.prog i{display:block;height:100%;border-radius:2px;background:#fff;width:var(--pct,0%)}
.ctl{display:flex;align-items:center;justify-content:space-between;gap:4px}
.ctl .kb{width:44px;height:44px;font-size:24px}
.ctl .play{width:54px;height:54px;font-size:30px}
.tag{left:10px;bottom:8px}
`;

  static getConfigForm() { return form([['entity', 'Ηχείο / player', ent('media_player'), true], LABEL, TITLE]); }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'media_player') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="deck">
    <div class="disc"><div class="lab"></div><span class="hole"></span></div>
    <span class="pivot"></span><span class="arm"></span>
  </div>
  ${TAG}
  <div class="body">
    <div class="head"><span class="title"></span><span class="sub"></span></div>
    <div class="prog"><i></i></div>
    <div class="ctl">
      <button class="kb prev ms fill" aria-label="Προηγούμενο">skip_previous</button>
      <button class="kb play ms fill" aria-label="Αναπαραγωγή/Παύση"></button>
      <button class="kb next ms fill" aria-label="Επόμενο">skip_next</button>
    </div>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    const go = (svc) => () => {
      if (this.available(this._config.entity)) this.call('media_player', svc, { entity_id: this._config.entity });
    };
    this.$('.prev').addEventListener('click', go('media_previous_track'));
    this.$('.play').addEventListener('click', go('media_play_pause'));
    this.$('.next').addEventListener('click', go('media_next_track'));
  }

  update() {
    const id = this._config.entity;
    const ok = this.available(id);
    const s = this.st(id);
    const a = s?.attributes || {};
    const playing = s?.state === 'playing';
    const has = ok && !!a.media_title;
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('playing', playing);
    card.style.setProperty('--h', [...(a.media_title || '')].reduce((n, ch) => n + ch.charCodeAt(0), 25) % 360);
    this.label();
    this.$('.lab').style.backgroundImage = has && a.entity_picture ? cssUrl(a.entity_picture) : '';
    this.$('.title').textContent = !ok ? 'Μη διαθέσιμο' : has ? a.media_title : 'Δεν παίζει τίποτα';
    this.$('.sub').textContent = has ? a.media_artist || a.media_album_name || '' : '';
    this.$('.play').textContent = playing ? 'pause' : 'play_arrow';
    const pct = has ? mediaProgress(s) : null;
    this.$('.prog').style.visibility = pct == null ? 'hidden' : 'visible';
    card.style.setProperty('--pct', (pct || 0) + '%');
    this.tick(pct != null && playing);
  }
}

/* ── Αυτοκίνητο (πλατιά): φωτογραφία, μπαταρία, πινακίδα με το όνομα ── */
class WallCarCard extends WallWideCard {
  static css = `
.card,.card.on{padding:0;background:linear-gradient(160deg,#f9fafb,#e4e9ee)}
.pic{position:absolute;right:-22px;bottom:14px;width:270px;max-height:86%;object-fit:contain;mix-blend-mode:multiply;pointer-events:none}
.plate{position:absolute;right:18px;bottom:14px;max-width:150px;height:26px;padding:0 10px 0 22px;border-radius:5px;background:#fff;
  border:1.5px solid var(--w-ink);font:700 13px var(--w-font);letter-spacing:1.2px;text-transform:uppercase;line-height:23px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.plate::before{content:'';position:absolute;left:0;top:0;bottom:0;width:14px;background:#1d4fb5}
.col{position:relative;height:100%;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;width:230px;flex:1}
.lvl{display:flex;align-items:center;gap:10px}
.cell{flex:none;width:92px;height:44px;border-radius:9px;border:3px solid #2a3036;position:relative;padding:3px}
.cell::after{content:'';position:absolute;right:-9px;top:11px;width:5px;height:16px;border-radius:0 3px 3px 0;background:#2a3036}
.cell i{display:block;height:100%;border-radius:4px;background:#2a3036;width:var(--pct,0%);transition:width .4s,background .3s}
.low .cell i{background:var(--w-warn)}
.charging .cell i{background:#3aa35f}
.big{font-size:26px;font-weight:500;letter-spacing:-1px}
.btns{display:flex;gap:8px;min-height:46px}
.btns .kb{width:46px;height:46px;font-size:22px;--acc:oklch(0.55 0.12 150)}
.btns .clima{--acc:oklch(0.55 0.12 230)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Μπαταρία ή καύσιμο (%)', ent('sensor'), true],
      ['name', 'Κείμενο πινακίδας (προαιρετικό)', TEXT],
      ['image', 'Φωτογραφία (π.χ. /local/car.png)', TEXT],
      ['range_entity', 'Αυτονομία', ent('sensor')],
      ['location_entity', 'Τοποθεσία', ent(['device_tracker', 'person'])],
      ['charging_entity', 'Φορτίζει', ent(['binary_sensor', 'sensor', 'switch'])],
      ['lock_entity', 'Κλείδωμα', ent('lock')],
      ['climate_entity', 'Κλιματισμός', ent(['climate', 'switch'])],
      ['charger_entity', 'Διακόπτης φόρτισης', ent('switch')],
      ['locate_entity', 'Εντοπισμός / κόρνα', ent(['button', 'script'])],
    ]);
  }
  static getStubConfig() { return { entity: '' }; }
  watched() {
    const c = this._config;
    return [c.entity, c.range_entity, c.location_entity, c.charging_entity, c.lock_entity, c.climate_entity, c.charger_entity, c.locate_entity];
  }

  template() {
    return `
<div class="card">
  <img class="pic" alt="" hidden>
  <span class="plate" hidden></span>
  <div class="col">
    <div class="lvl"><div class="cell"><i></i></div><div class="head"><span class="big"></span><span class="sub range"></span></div></div>
    <span class="sub status"></span>
    <div class="btns">
      <button class="kb lock ms fill" aria-label="Κλείδωμα"></button>
      <button class="kb clima ms fill" aria-label="Κλιματισμός">mode_fan</button>
      <button class="kb chg ms fill" aria-label="Φόρτιση">ev_station</button>
      <button class="kb find ms fill" aria-label="Εντοπισμός">near_me</button>
    </div>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    const c = () => this._config;
    this.$('.lock').addEventListener('click', () => {
      const id = c().lock_entity;
      if (this.available(id)) this.call('lock', this.val(id) === 'locked' ? 'unlock' : 'lock', { entity_id: id });
    });
    this.$('.clima').addEventListener('click', () => {
      const id = c().climate_entity;
      if (!this.available(id)) return;
      if (id.startsWith('climate.')) this.call('climate', this.val(id) === 'off' ? 'turn_on' : 'turn_off', { entity_id: id });
      else this.trigger(id);
    });
    this.$('.chg').addEventListener('click', () => this.available(c().charger_entity) && this.trigger(c().charger_entity));
    this.$('.find').addEventListener('click', () => this.trigger(c().locate_entity));
  }

  update() {
    const c = this._config;
    const lvl = this.num(c.entity);
    const ok = !isNaN(lvl);
    const charging = ['on', 'charging'].includes(this.val(c.charging_entity).toLowerCase());
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('charging', charging);
    card.classList.toggle('low', ok && lvl < 20);
    card.style.setProperty('--pct', (ok ? clamp(lvl, 0, 100) : 0) + '%');
    const pic = this.$('.pic');
    pic.hidden = !c.image;
    if (c.image && pic.getAttribute('src') !== c.image) pic.setAttribute('src', c.image);
    const plate = this.$('.plate');
    plate.hidden = !c.name;
    plate.textContent = c.name || '';

    const loc = this.val(c.location_entity);
    const place = loc === 'home' ? 'Σπίτι' : loc === 'not_home' ? 'Εκτός' : loc;
    this.$('.status').textContent = [place, charging ? 'φορτίζει' : ''].filter(Boolean).join(' · ');
    this.$('.big').textContent = ok ? `${Math.round(lvl)}%` : '—';
    const range = this.st(c.range_entity);
    this.$('.range').textContent = this.available(c.range_entity)
      ? `${Math.round(parseFloat(range.state))} ${range.attributes.unit_of_measurement || 'km'}` : '';

    const btn = (sel, id, active) => {
      const b = this.$(sel);
      b.hidden = !id;
      b.classList.toggle('lit', !!active);
    };
    const locked = this.val(c.lock_entity) === 'locked';
    btn('.lock', c.lock_entity, locked);
    this.$('.lock').textContent = locked ? 'lock' : 'lock_open';
    btn('.clima', c.climate_entity, this.available(c.climate_entity) && this.val(c.climate_entity) !== 'off');
    btn('.chg', c.charger_entity, this.val(c.charger_entity) === 'on');
    btn('.find', c.locate_entity, false);
  }
}

/* ───────────────────────── 3. Καταχώριση ───────────────────────── */

function register(tag, cls, name, description) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === tag)) {
    window.customCards.push({ type: tag, name, description, preview: true });
  }
}

register('wall-light-card', WallLightCard, 'Wall · Φως', 'Ψηλή κάρτα φωτός: σύρσιμο για φωτεινότητα, διακόπτης κάτω.');
register('wall-switch-card', WallSwitchCard, 'Wall · Διακόπτης', 'Πλήκτρο τοίχου για φως, πρίζα ή ό,τι ανάβει και σβήνει.');
register('wall-lock-card', WallLockCard, 'Wall · Κλειδαριά', 'Μεταλλική κλειδαριά με πόμολο που γυρίζει.');
register('wall-opener-card', WallOpenerCard, 'Wall · Είσοδος', 'Θυροτηλέφωνο: άνοιγμα πόρτας και άνοιγμα στο κουδούνι.');
register('wall-washer-card', WallWasherCard, 'Wall · Πλυντήριο', 'Πρόσοψη πλυντηρίου: πόρτα με νερό, χρόνος στην οθόνη.');
register('wall-dryer-card', WallDryerCard, 'Wall · Στεγνωτήριο', 'Πρόσοψη στεγνωτηρίου: ζεστή πόρτα, χρόνος στην οθόνη.');
register('wall-dishwasher-card', WallDishwasherCard, 'Wall · Πλυντήριο πιάτων', 'Πρόσοψη με χειρολαβή και παράθυρο με πιάτα.');
register('wall-climate-card', WallClimateCard, 'Wall · Κλίμα', 'Στρογγυλός θερμοστάτης ή εσωτερική μονάδα κλιματιστικού.');
register('wall-heater-card', WallHeaterCard, 'Wall · Θερμοσίφωνας', 'Κύλινδρος που ζεσταίνεται, με χρονοδιακόπτη.');
register('wall-purifier-card', WallPurifierCard, 'Wall · Καθαριστής αέρα', 'Πύργος με φωτεινό δαχτυλίδι στο χρώμα της ποιότητας.');
register('wall-air-card', WallAirCard, 'Wall · Ποιότητα αέρα', 'Επιτοίχιος αισθητήρας: PM2.5 με CO₂, VOC και PM10.');
register('wall-vacuum-card', WallVacuumCard, 'Wall · Σκούπα', 'Το ρομπότ από πάνω, με έναρξη, παύση και επιστροφή.');
register('wall-tv-card', WallTvCard, 'Wall · Τηλεόραση', 'Πλατιά κάρτα: οθόνη με ό,τι παίζει και τηλεχειριστήριο.');
register('wall-music-card', WallMusicCard, 'Wall · Μουσική', 'Πλατιά κάρτα: πικάπ με το εξώφυλλο στον δίσκο.');
register('wall-car-card', WallCarCard, 'Wall · Αυτοκίνητο', 'Πλατιά κάρτα: μπαταρία, αυτονομία, πινακίδα και γρήγορες ενέργειες.');

/* Για τη σελίδα δοκιμής και για πειραματισμό από την κονσόλα */
window.wallCards = { VERSION, openPopup, popSection, popChips, popSwatches, popSlider, popStepper };

console.info(`%c WALL-CARDS %c v${VERSION} `, 'background:#1c2228;color:#fff;border-radius:4px 0 0 4px', 'background:#e1e6eb;color:#1c2228;border-radius:0 4px 4px 0');
