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
const VERSION = '0.12.1';

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
 *     title:  'Αφυγραντήρας',          προεπιλεγμένος τίτλος (προαιρετικό)
 *     size:   'sm' | 'md' | 'lg',        πλάτος φύλλου
 *     accent: () => 'css χρώμα',         χρώμα έμφασης (προαιρετικό)
 *     status: () => 'Αναμμένο · 63%',    γραμμή κατάστασης κάτω από τον τίτλο
 *     tabs:   [{ id, label, icon }],     καρτέλες (προαιρετικό)
 *     render: (p, tab) => { … },         γεμίζει το p.body με popSection / popChips / popSlider …
 *   })
 *
 * Τίτλος: config.title → spec.title → config.label → όνομα του entity.
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
const popTitle = (card, spec) => card._config.title || spec?.title || card._config.label || card.friendly(card._config.entity);
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
      $('.pn').textContent = popTitle(card, spec);
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

/* ── Διακόπτης: rocker που γέρνει αριστερά, κουκκίδες φωτεινότητας δεξιά, χρώμα λάμπας που έρχεται από δεξιά ──
 * Πάτημα στο rocker = on/off. Σύρσιμο πάνω-κάτω οπουδήποτε στην κάρτα = φωτεινότητα (μόνο σε φώτα με ρύθμιση).
 * Πάτημα στη δεξιά πλευρά χωρίς σύρσιμο = popup φωτός (φωτεινότητα, λευκά, χρώματα).
 */
class WallSwitchCard extends WallBaseCard {
  static css = `
.card,.card.on{padding:0;border-radius:22px;color:#2d2a24;background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05);touch-action:none}
.wash{position:absolute;inset:0;opacity:0;transition:opacity .4s;
  background:linear-gradient(270deg,color-mix(in srgb,var(--lamp,#f6cc7a) 75%,transparent),transparent 55%)}
.on .wash{opacity:1}
.rk{position:absolute;left:16px;top:22px;bottom:44px;width:88px;border-radius:14px;z-index:1;
  background:#e9e6df;box-shadow:inset 0 2px 5px rgba(0,0,0,.18);perspective:300px}
.rk b{position:absolute;inset:6px;border-radius:10px;transform:rotateX(-14deg);transition:transform .35s var(--w-spring),background .2s;
  background:linear-gradient(180deg,#fff 0%,#f4f2ed 49%,#e3e0d8 50%,#f7f5f0 100%);box-shadow:0 6px 10px rgba(0,0,0,.18)}
.on .rk b{transform:rotateX(14deg);background:linear-gradient(180deg,#e3e0d8 0%,#f7f5f0 50%,#fff 51%,#f4f2ed 100%)}
.leds{position:absolute;right:26px;top:26px;bottom:48px;z-index:1;display:flex;flex-direction:column-reverse;justify-content:space-between;align-items:center}
.leds span{width:8px;height:8px;border-radius:50%;background:rgba(45,42,36,.15);transition:background .15s}
.leds span.lit{background:#2d2a24}
.pc{position:absolute;right:14px;bottom:12px;z-index:1;font:700 16px var(--w-font)}
.tag{left:18px;bottom:12px}
`;

  static getConfigForm() {
    return form([['entity', 'Συσκευή', ent(['light', 'switch', 'input_boolean', 'fan']), true], LABEL, TITLE]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'light') || firstEntity(hass, 'switch') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="wash"></div>
  <button class="rk" aria-label="Άναμμα/Σβήσιμο"><b></b></button>
  <div class="leds">${'<span></span>'.repeat(8)}</div>
  <span class="pc"></span>
  ${TAG}
</div>`;
  }

  bind() {
    const card = this.$('.card');
    card.addEventListener('pointerdown', (e0) => {
      const id = this._config.entity;
      if (!this.available(id)) return;
      card.setPointerCapture(e0.pointerId);
      const onRocker = e0.composedPath().includes(this.$('.rk'));
      let moved = false;
      const move = (ev) => {
        if (!this._dimmable || (!moved && Math.abs(ev.clientY - e0.clientY) < 10)) return;
        moved = true;
        const r = card.getBoundingClientRect();
        this._drag = Math.round(clamp(((r.bottom - 30 - ev.clientY) / (r.height - 60)) * 100, 1, 100));
        this.paint(true, this._drag);
      };
      const up = (ev) => {
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerup', up);
        card.removeEventListener('pointercancel', up);
        if (moved) {
          const pct = this._drag;
          this._hold = { pct, until: Date.now() + 2500 };
          this.call('light', 'turn_on', { entity_id: id, brightness_pct: pct });
        } else if (ev.type === 'pointerup') {
          if (onRocker) { this._hold = null; this.call('homeassistant', 'toggle', { entity_id: id }); }
          else lightPopup(this);
        }
        this._drag = null;
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerup', up);
      card.addEventListener('pointercancel', up);
    });
  }

  update() {
    const id = this._config.entity;
    const s = this.st(id);
    const card = this.$('.card');
    card.classList.toggle('unavail', !this.available(id));
    card.style.setProperty('--lamp', id.startsWith('light.') ? lampColor(s) : '#f6cc7a');
    this._dimmable = id.startsWith('light.') && isDimmable(s);
    this.$('.leds').hidden = !this._dimmable;
    this.label();
    if (this._drag != null) return;
    if (this._hold && Date.now() < this._hold.until) { this.paint(true, this._hold.pct); return; }
    this._hold = null;
    const br = s?.attributes?.brightness;
    this.paint(s?.state === 'on', this._dimmable && br != null ? Math.max(1, Math.round((br / 255) * 100)) : 100);
  }

  paint(on, pct) {
    this.$('.card').classList.toggle('on', on);
    this.$('.pc').textContent = on && this._dimmable ? pct + '%' : '';
    this.shadowRoot.querySelectorAll('.leds span').forEach((el, i) =>
      el.classList.toggle('lit', on && (i + 1) * 12.5 <= Math.max(12.5, pct)));
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

/* ── Κλιματιστικό: εσωτερική μονάδα με οθόνη και πτερύγιο, πάνελ με −/+ και πλήκτρο ανεμιστήρα, ⏻ πάνω δεξιά ── */
class WallAcCard extends WallBaseCard {
  static css = `
.card,.card.on{padding:0;background:linear-gradient(180deg,#f4f5f6,#e6e9eb);--a:#3d8fe6;transition:background .5s}
.card.on{background:linear-gradient(180deg,#f4f7fa 40%,color-mix(in srgb,var(--a) 22%,#eef1f3))}
.card:not(.on){background:linear-gradient(180deg,#e8eaeb,#dcdfe1)}
.card.heat{--a:#e0702a}
.unit{position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(180deg,#fff,#eef1f3);
  box-shadow:0 6px 12px rgba(40,60,90,.18),inset 0 -1px 0 #d5dade}
.vent{position:absolute;left:18px;top:26px;display:flex;flex-direction:column;gap:5px}
.vent i{width:64px;height:2px;background:#d3d8dc}
.led{position:absolute;left:18px;bottom:16px;width:28px;height:4px;border-radius:2px;background:#d3d8dc;transition:background .4s,box-shadow .4s}
.on .led{background:var(--a);box-shadow:0 0 8px var(--a)}
.seg{position:absolute;right:16px;bottom:18px;width:72px;height:34px;border-radius:5px;background:#1b2229;box-shadow:inset 0 1px 4px rgba(0,0,0,.7);
  display:flex;align-items:center;justify-content:center;font:600 22px ui-monospace,'Cascadia Mono',Consolas,monospace;
  color:var(--a);text-shadow:0 0 6px color-mix(in srgb,var(--a) 60%,transparent)}
.card:not(.on) .seg{color:#2c3a46;text-shadow:none}
.flap{position:absolute;left:10px;right:10px;bottom:-4px;height:10px;border-radius:3px;transform-origin:50% 0;transition:transform .6s;
  background:linear-gradient(180deg,#f7f9fa,#cdd4da);box-shadow:0 2px 3px rgba(0,0,0,.2)}
.on .flap{transform:perspective(60px) rotateX(-35deg)}
.pw{position:absolute;right:10px;top:8px;width:48px;height:48px;border:0;background:none;padding:0;cursor:pointer;z-index:3;
  display:grid;place-items:center;font-size:26px;color:#7a8187;transition:color .3s,text-shadow .3s}
.on .pw{color:var(--a);text-shadow:0 0 8px color-mix(in srgb,var(--a) 70%,transparent)}
.keys{position:absolute;left:8%;right:8%;bottom:16px;height:56px;border-radius:12px;background:linear-gradient(180deg,#f1f3f5,#e2e6e9);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.18),0 1px 0 #fff;display:flex;align-items:center;justify-content:space-between;padding:0 8px}
.key{width:44px;height:40px;border:0;padding:0;border-radius:8px;display:grid;place-items:center;font-size:22px;color:#5f676d;cursor:pointer;
  background:linear-gradient(180deg,#fdfdfd,#e6e9ec);box-shadow:0 1px 2px rgba(0,0,0,.2),inset 0 -1px 0 rgba(0,0,0,.06)}
.key:active{box-shadow:inset 0 1px 3px rgba(0,0,0,.25)}
.fan{position:relative;width:72px;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding-bottom:10px;box-sizing:border-box}
.fan b{width:6px;border-radius:1px;background:#c5cbd0}
.on .fan b.l{background:var(--a)}
.fan .sl{width:30px;height:3px;border-radius:2px}
.fan .zz{position:absolute;left:50%;top:5px;transform:translateX(-50%);font:800 11px var(--w-font);letter-spacing:1px;color:#8b9196}
.on .fan .zz{color:var(--a)}
.fan .au{align-self:center;padding-top:10px;font:800 16px var(--w-font);letter-spacing:.5px;color:#8b9196}
.on .fan .au{color:var(--a)}
.tag{left:14px;top:8px}
`;

  static getConfigForm() {
    return form([['entity', 'Κλιματιστικό', ent('climate'), true], LABEL, TITLE]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'climate') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">${fxHTML()}
  <div class="unit"><div class="vent"><i></i><i></i><i></i></div><div class="led"></div><div class="seg"></div><div class="flap"></div></div>
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="keys">
    <button class="key dn ms" aria-label="Μείωση">remove</button>
    <button class="key fan" aria-label="Ταχύτητα ανεμιστήρα"></button>
    <button class="key up ms" aria-label="Αύξηση">add</button>
  </div>
</div>`;
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
      const v = clamp(Math.round((cur + dir * by) / by) * by, a.min_temp ?? 16, a.max_temp ?? 30);
      this._hold = { v, until: Date.now() + 3000 };
      this.update();
      this.call('climate', 'set_temperature', { entity_id: id, temperature: v });
    };
    this.$('.dn').addEventListener('click', step(-1));
    this.$('.up').addEventListener('click', step(1));
    this.$('.fan').addEventListener('click', () => {
      const id = this._config.entity;
      const a = this.st(id)?.attributes || {};
      const list = a.fan_modes || [];
      if (!this.available(id) || !list.length) return;
      const next = list[(list.indexOf(this._fan ?? a.fan_mode) + 1) % list.length];
      this._fan = next;
      this._fanUntil = Date.now() + 3000;
      this.update();
      this.call('climate', 'set_fan_mode', { entity_id: id, fan_mode: next });
    });
  }

  /* Η ταχύτητα ως μπάρες: 1–5 = μπάρες, Silence = χαμηλή γραμμή με zZz, Auto = η λέξη Auto */
  fanFace(mode, list) {
    const m = String(mode || '').toLowerCase();
    if (m === 'auto') return '<span class="au">Auto</span>';
    if (m === 'silence' || m === 'quiet') return '<span class="zz">zZz</span><b class="sl l"></b>';
    const nums = list.filter((x) => /^\d+$/.test(x));
    const n = nums.length ? nums.length : 5;
    const lvl = /^\d+$/.test(m) ? +m : ['low', 'medium', 'high'].indexOf(m) >= 0 ? Math.round(((['low', 'medium', 'high'].indexOf(m) + 1) / 3) * n) : 0;
    return Array.from({ length: n }, (_, i) => `<b class="${i < lvl ? 'l' : ''}" style="height:${6 + i * Math.round(12 / Math.max(1, n - 1))}px"></b>`).join('');
  }

  update() {
    const id = this._config.entity;
    const ok = this.available(id);
    const s = this.st(id);
    const a = s?.attributes || {};
    const on = ok && s.state !== 'off';
    const heat = on && (a.hvac_action ? a.hvac_action === 'heating' : s.state === 'heat');
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.classList.toggle('heat', heat);
    this.label();
    const held = this._hold && Date.now() < this._hold.until;
    if (!held) this._hold = null;
    const sp = held ? this._hold.v : a.temperature;
    const dec = (a.target_temp_step || 0.5) < 1 && sp % 1 ? 1 : 0;
    this.$('.seg').textContent = sp != null ? `${fmt(sp, dec)}°` : '--';
    this.shadowRoot.querySelectorAll('.dn,.up').forEach((b) => (b.style.visibility = sp != null ? 'visible' : 'hidden'));
    if (!(this._fanUntil && Date.now() < this._fanUntil)) this._fan = null;
    const list = a.fan_modes || [];
    const mode = this._fan ?? a.fan_mode;
    const fan = this.$('.fan');
    fan.hidden = !list.length;
    const face = this.fanFace(mode, list);
    if (fan._face !== face) { fan.innerHTML = face; fan._face = face; }
    /* Θερμότητα (ή ψύχος) όπως στην κάρτα θερμοστάτη */
    const fx = this.$('.fx');
    fx.classList.toggle('show', on);
    fx.classList.toggle('cool', !heat);
    fx.classList.toggle('heat', heat);
  }
}

/* ── Λέβητας: λευκή πρόσοψη, γκρι πάνελ με οθόνη στόχου και −/+, ⏻ πάνω δεξιά ── */
class WallBoilerCard extends WallBaseCard {
  static css = `
.card,.card.on{padding:0;background:linear-gradient(90deg,#e6e8ea,#fff 12%,#fff 88%,#e3e5e7)}
.card:not(.on){background:linear-gradient(90deg,#dcdee0,#eceeef 12%,#eceeef 88%,#d9dbdd)}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 62%,rgba(255,140,60,.28),transparent 65%);opacity:0;transition:opacity .6s}
.heating .glow{opacity:1}
.pw{position:absolute;right:10px;top:8px;width:48px;height:48px;border:0;background:none;padding:0;cursor:pointer;
  display:grid;place-items:center;font-size:26px;color:#7a8187;transition:color .3s,text-shadow .3s}
.on .pw{color:#3d8fe6;text-shadow:0 0 8px rgba(61,143,230,.7)}
.pn{position:absolute;left:0;right:0;bottom:0;height:44%;background:linear-gradient(180deg,#6b7075,#4d5256);
  clip-path:ellipse(95% 100% at 50% 100%)}
.lcd{position:absolute;left:50%;bottom:24%;width:46%;height:44px;transform:translateX(-50%);border-radius:6px;background:#1c2024;
  box-shadow:inset 0 1px 3px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;gap:4px;
  color:#e9eef2;font:700 24px var(--w-font);letter-spacing:.5px}
.card:not(.on) .lcd{color:#3a4045}
.fl{font-size:18px;color:#ff9a57;width:0;opacity:0;transition:opacity .3s}
.heating .fl{width:auto;opacity:1;animation:b-fk .7s ease-in-out infinite alternate}
@keyframes b-fk{to{opacity:.55;transform:scaleY(1.12)}}
.k{position:absolute;bottom:calc(24% + 5px);width:34px;height:34px;border:0;padding:0;border-radius:9px;display:grid;place-items:center;
  font-size:22px;color:#e1e5e8;cursor:pointer;background:linear-gradient(180deg,#5d6267,#474b4f);
  box-shadow:0 0 0 1px rgba(255,255,255,.18),0 2px 3px rgba(0,0,0,.35)}
.k:active{transform:translateY(1px)}
.dn{left:7%}.up{right:7%}
.card:not(.on) .k{color:#7d8388}
.tag{left:14px;top:14px}
`;

  static getConfigForm() {
    return form([['entity', 'Λέβητας / θερμοστάτης', ent('climate'), true], LABEL, TITLE]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'climate') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="glow"></div>
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="pn">
    <button class="k dn ms" aria-label="Μείωση">remove</button>
    <div class="lcd"><span class="fl ms fill">local_fire_department</span><span class="sp"></span></div>
    <button class="k up ms" aria-label="Αύξηση">add</button>
  </div>
</div>`;
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
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.classList.toggle('heating', on && (a.hvac_action ? a.hvac_action === 'heating' : true));
    this.label();
    const held = this._hold && Date.now() < this._hold.until;
    if (!held) this._hold = null;
    const sp = held ? this._hold.v : a.temperature;
    const dec = (a.target_temp_step || 0.5) < 1 && sp % 1 ? 1 : 0;
    this.$('.sp').textContent = sp != null ? `${fmt(sp, dec)}°` : '—';
    this.shadowRoot.querySelectorAll('.k').forEach((b) => (b.style.visibility = sp != null ? 'visible' : 'hidden'));
  }
}

/* ── Θερμοσίφωνας: κύλινδρος που ζεσταίνεται και μηχανικός χρονοδιακόπτης ── */
class WallHeaterCard extends WallBaseCard {
  static css = `
/* Όλη η κάρτα είναι το σώμα του θερμοσίφωνα· ο δακτύλιος είναι ο μηχανικός χρονοδιακόπτης */
.card,.card.on{padding:0;background:linear-gradient(90deg,#d9dde0,#fff 30%,#fff 55%,#d4d8dc)}
.card:not(.on){background:linear-gradient(90deg,#d2d5d8,#eceeef 30%,#eceeef 55%,#cdd1d4)}
.hot{position:absolute;left:0;right:0;bottom:0;height:var(--fill,0%);transition:height 1s;
  background:linear-gradient(0deg,rgba(217,80,42,.42),rgba(242,162,92,.3));
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 26px);mask-image:linear-gradient(180deg,transparent,#000 26px)}
.card:not(.on) .hot{filter:grayscale(.8);opacity:.5}
.hot i{position:absolute;bottom:-8px;width:10px;height:10px;border-radius:50%;background:rgba(255,200,160,.75);opacity:0}
.on .hot i{animation:heat-rise 3.2s ease-in infinite}
.pw{position:absolute;right:10px;top:8px;width:48px;height:48px;border:0;background:none;padding:0;cursor:pointer;z-index:3;
  display:grid;place-items:center;font-size:26px;color:#7a8187;transition:color .3s,text-shadow .3s}
.on .pw{color:#e0702a;text-shadow:0 0 8px rgba(224,112,42,.7)}
.arc{position:absolute;left:50%;top:54%;width:65%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;
  background:conic-gradient(#e0702a 0 var(--ang,0deg),transparent 0);
  -webkit-mask:radial-gradient(closest-side,transparent 90%,#000 91%);mask:radial-gradient(closest-side,transparent 90%,#000 91%)}
.card:not(.on) .arc{background:conic-gradient(#9aa3ab 0 var(--ang,0deg),transparent 0)}
.ring{position:absolute;left:50%;top:54%;width:58%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;z-index:2;cursor:grab;touch-action:none;
  background:radial-gradient(circle at 40% 30%,#fafbfb,#d5dadd 70%,#b8bfc4);box-shadow:0 6px 12px rgba(0,0,0,.25)}
.ring.live{cursor:grabbing}
.ticks{position:absolute;inset:0;border-radius:50%;transform:rotate(var(--ang,0deg));
  background:repeating-conic-gradient(#8a939b 0 1.2deg,transparent 1.2deg var(--tick,6deg));
  -webkit-mask:radial-gradient(closest-side,transparent 80%,#000 81%,#000 92%,transparent 93%);mask:radial-gradient(closest-side,transparent 80%,#000 81%,#000 92%,transparent 93%)}
.ptr{position:absolute;inset:0;transform:rotate(var(--ang,0deg))}
.ptr::after{content:'';position:absolute;left:50%;top:4%;width:6px;height:12%;margin-left:-3px;border-radius:3px;background:#e0702a}
.card:not(.on) .ptr::after{background:#8f989f}
.face{position:absolute;inset:20%;border-radius:50%;display:grid;place-items:center;text-align:center;
  background:radial-gradient(circle at 40% 30%,#fff,#e8ebee);box-shadow:inset 0 1px 3px rgba(0,0,0,.12)}
.big{display:block;font:800 28px var(--w-font);color:#2d2a24;line-height:1}
.on .big{color:#c45a1e}
.hint{display:block;font:700 12px var(--w-font);color:#8b9196;margin-top:2px}
.tag{left:14px;top:14px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Διακόπτης θερμοσίφωνα', ent(['switch', 'input_boolean']), true],
      LABEL, TITLE,
      ['duration_entity', 'Διάρκεια (input_number) — μαζί με τον input_boolean και το αυτοματισμό σου', ent('input_number')],
      ['finish_entity', 'Ώρα τέλους (input_datetime), για την αντίστροφη μέτρηση', ent('input_datetime')],
      ['timer_entity', 'ή: Χρονόμετρο (timer helper), αν δεν έχεις τα παραπάνω', ent('timer')],
      ['default_minutes', 'Προεπιλεγμένη διάρκεια (λεπτά)', { number: { min: 1, max: 180, step: 1, mode: 'box' } }],
      ['max_minutes', 'Μέγιστη διάρκεια (λεπτά)', { number: { min: 10, max: 240, step: 5, mode: 'box' } }],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'switch') }; }
  watched() { const c = this._config; return [c.entity, c.timer_entity, c.duration_entity, c.finish_entity]; }

  template() {
    return `
<div class="card">
  <div class="hot"><i style="left:22%"></i><i style="left:66%;animation-delay:1.3s"></i><i style="left:44%;animation-delay:2.3s"></i></div>
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="arc"></div>
  <div class="ring"><div class="ticks"></div><div class="ptr"></div><div class="face"><div><span class="big"></span><span class="hint"></span></div></div></div>
</div>`;
  }

  /* Δευτερόλεπτα που απομένουν στο χρονόμετρο, ή null αν δεν μετράει */
  hasTimer() { return !!(this._config.timer_entity || this._config.duration_entity); }
  /* Όταν υπάρχουν duration_entity + finish_entity, τη διάρκεια και το σβήσιμο τα κάνει ο αυτοματισμός του HA (ο input_boolean είναι η «πρόθεση») */
  helperMode() { return !!this._config.duration_entity; }
  dur() {
    const d = this.num(this._config.duration_entity);
    return this.helperMode() && !isNaN(d) ? Math.round(d) : this._dur;
  }
  left() {
    const c = this._config;
    if (c.finish_entity) {
      const f = this.st(c.finish_entity);
      const ts = f?.attributes?.timestamp;
      if (this.val(c.entity) !== 'on' || ts == null) return null;
      return Math.max(0, Math.round(ts - Date.now() / 1000));
    }
    const t = this.st(this._config.timer_entity);
    if (!t || t.state !== 'active' || !t.attributes.finishes_at) return null;
    return Math.max(0, Math.round((new Date(t.attributes.finishes_at) - Date.now()) / 1000));
  }
  max() { const m = this.st(this._config.duration_entity)?.attributes?.max; return m || this._config.max_minutes || 30; }

  bind() {
    this._dur = this._config.default_minutes || 15;
    this.$('.pw').addEventListener('click', () => {
      const c = this._config;
      if (!this.available(c.entity)) return;
      const on = this.val(c.entity) === 'on';
      this.call('homeassistant', on ? 'turn_off' : 'turn_on', { entity_id: c.entity });
      if (!this.helperMode() && c.timer_entity) {
        if (on) this.call('timer', 'cancel', { entity_id: c.timer_entity });
        else this.call('timer', 'start', { entity_id: c.timer_entity, duration: hms(this.dur() * 60) });
      }
    });
    /* Περιστροφή του δακτυλίου: ένας πλήρης κύκλος = μέγιστη διάρκεια, κάθε γραμμούλα = 1 λεπτό */
    const ring = this.$('.ring');
    const angle = (e) => {
      const r = ring.getBoundingClientRect();
      return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    };
    const commit = (mins) => {
      const c = this._config;
      if (this.helperMode()) {
        /* Σε λειτουργία: μετακινούμε την ώρα τέλους (το watchdog του HA τη διαβάζει)· σε αναμονή: αλλάζουμε τη διάρκεια */
        if (this.left() != null && c.finish_entity) this.call('input_datetime', 'set_datetime', { entity_id: c.finish_entity, timestamp: Math.round(Date.now() / 1000 + Math.max(1, mins) * 60) });
        else this.call('input_number', 'set_value', { entity_id: c.duration_entity, value: Math.max(1, mins) });
        return;
      }
      if (this.left() != null) this.call('timer', 'start', { entity_id: this._config.timer_entity, duration: hms(Math.max(1, mins) * 60) });
      else this._dur = Math.max(1, mins);
    };
    ring.addEventListener('pointerdown', (e) => {
      if (!this.hasTimer() || !this.available(this._config.entity)) return;
      ring.setPointerCapture(e.pointerId);
      ring.classList.add('live');
      let last = angle(e);
      const left = this.left();
      this._drag = left != null ? left / 60 : this.dur();
      const move = (ev) => {
        const a = angle(ev);
        let d = a - last;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        last = a;
        this._drag = clamp(this._drag + (d / 360) * this.max(), 0, this.max());
        this.update();
      };
      const up = () => {
        ring.removeEventListener('pointermove', move);
        ring.classList.remove('live');
        const mins = Math.max(1, Math.round(this._drag));
        this._drag = null;
        commit(mins);
        this._hold = { mins, until: Date.now() + 2500 };
        this.update();
      };
      ring.addEventListener('pointermove', move);
      ring.addEventListener('pointerup', up, { once: true });
      ring.addEventListener('pointercancel', up, { once: true });
    });
    ring.addEventListener('wheel', (e) => {
      if (!this.hasTimer()) return;
      e.preventDefault();
      const left = this.left();
      const cur = left != null ? Math.ceil(left / 60) : this.dur();
      const mins = clamp(cur + (e.deltaY < 0 ? 1 : -1), 1, this.max());
      commit(mins);
      this._hold = { mins, until: Date.now() + 2500 };
      this.update();
    }, { passive: false });
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const on = this.val(c.entity) === 'on';
    const left = on ? this.left() : null;
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.style.setProperty('--tick', 360 / this.max() + 'deg');
    this.tick(left != null);
    this.label();
    this.$('.ring').style.cursor = this.hasTimer() ? '' : 'default';

    const held = this._hold && Date.now() < this._hold.until ? this._hold.mins : null;
    if (held == null) this._hold = null;
    let mins, hint, fill;
    if (this._drag != null || held != null) {
      mins = this._drag != null ? Math.round(this._drag) : held;
      hint = on ? 'απομένουν' : 'διάρκεια';
      fill = on ? 60 : 0;
    } else if (left != null) {
      const total = this.helperMode() ? Math.max(left, this.dur() * 60) : (toMinutes({ state: this.st(c.timer_entity)?.attributes?.duration || '' }) || this._dur) * 60;
      mins = Math.ceil(left / 60);
      hint = 'απομένουν';
      fill = clamp((1 - left / total) * 100, 12, 100);
    } else if (on) {
      mins = null; hint = ''; fill = 100;
    } else {
      mins = this.hasTimer() ? this.dur() : null; hint = !ok ? 'Μη διαθέσιμος' : this.hasTimer() ? 'διάρκεια' : ''; fill = 0;
    }
    this.$('.big').textContent = mins != null ? `${mins}′` : on ? 'On' : 'Off';
    this.$('.hint').textContent = hint;
    card.style.setProperty('--ang', (mins != null ? clamp(mins / this.max(), 0, 1) * 360 : on ? 360 : 0) + 'deg');
    card.style.setProperty('--fill', fill + '%');
  }
}

/* ── Καθαριστής αέρα: πύργος με φωτεινό δαχτυλίδι ποιότητας και ρυθμιστικό στάθμης ── */
const PUR_OFF = ['off', 'idle', 'standby', 'unavailable', 'unknown', ''];

class WallPurifierCard extends WallBaseCard {
  static css = `
/* Πρόσοψη καθαριστή: όλη η κάρτα είναι η λευκή μπροστινή πλευρά */
.card,.card.on{padding:0;background:linear-gradient(180deg,#ffffff,#eef0f2)}
.card:not(.on){background:linear-gradient(180deg,#eceeef,#dcdfe1)}
.pw{position:absolute;right:10px;top:8px;width:48px;height:48px;border:0;background:none;padding:0;cursor:pointer;
  display:grid;place-items:center;font-size:26px;color:#7a8187;transition:color .3s,text-shadow .3s}
.on .pw{color:var(--q);text-shadow:0 0 8px color-mix(in srgb,var(--q) 70%,transparent)}
.aq{position:absolute;left:50%;top:34%;width:64px;height:5px;margin-left:-32px;border-radius:3px;background:#d3d7da;transition:background .4s}
.on .aq{background:var(--q);box-shadow:0 0 10px 2px color-mix(in srgb,var(--q) 60%,transparent);animation:p-br 2.8s ease-in-out infinite}
@keyframes p-br{50%{box-shadow:0 0 4px 1px color-mix(in srgb,var(--q) 35%,transparent)}}
.lvt{position:absolute;left:12px;right:12px;top:calc(34% + 14px);text-align:center;font:700 16px var(--w-font);color:#7a8187;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.on .lvt{color:var(--q)}
.lvt.live{cursor:pointer}
.per,.flow{position:absolute;left:14px;right:14px;top:56%;bottom:0}
.per{background:radial-gradient(circle,#2f3438 1.3px,transparent 1.7px) 0 0/9px 9px;
  -webkit-mask-image:linear-gradient(180deg,transparent,rgba(0,0,0,.25) 25%,#000 55%);mask-image:linear-gradient(180deg,transparent,rgba(0,0,0,.25) 25%,#000 55%)}
.card:not(.on) .per{opacity:.6}
.flow{opacity:0;background:linear-gradient(180deg,transparent,var(--q),transparent) 0 0/100% 60% no-repeat;
  -webkit-mask-image:radial-gradient(circle,#000 1.3px,transparent 1.7px);-webkit-mask-size:9px 9px;
  mask-image:radial-gradient(circle,#000 1.3px,transparent 1.7px);mask-size:9px 9px}
.on .flow{opacity:.9;animation:p-flow 2.4s linear infinite}
@keyframes p-flow{from{background-position:0 160%}to{background-position:0 -80%}}
.tag{left:14px;top:14px}
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
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="aq"></div><div class="lvt"></div>
  <div class="per"></div><div class="flow"></div>
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
    this.$('.lvt').addEventListener('click', (e) => {
      const { list, cur, live } = this.levels();
      if (!live || !list.length) return;
      e.stopPropagation();
      this.call('fan', 'set_preset_mode', { entity_id: this._config.entity, preset_mode: list[(list.indexOf(cur) + 1) % list.length] });
    });
  }

  update() {
    const c = this._config;
    const on = this.isOn();
    const pm = this.num(c.pm25_entity);
    const card = this.$('.card');
    card.classList.toggle('unavail', !this.available(c.entity));
    card.classList.toggle('on', on);
    /* Χωρίς αισθητήρα η λυχνία είναι μπλε, όπως στη συσκευή· με PM2.5 παίρνει το χρώμα της ποιότητας */
    card.style.setProperty('--q', isNaN(pm) ? '#3d8fe6' : `oklch(0.66 0.15 ${airQuality(pm)[1]})`);
    this.$('.pw').hidden = !this.direct() && !c.on_entity && !c.off_entity;
    this.label();
    const { list, cur, live } = this.levels();
    const t = this.$('.lvt');
    t.textContent = list.includes(cur) ? cur : '';
    t.classList.toggle('live', live);
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

/* ── Ιστορικό 24 ωρών: κοινή συνάρτηση για όσες κάρτες σχεδιάζουν καμπύλες ──
 * Επιστρέφει { [entity_id]: [[ms, τιμή], …] }. Κρατά αποτέλεσμα για 10 λεπτά ανά σύνολο entities.
 */
const HISTORY_TTL = 10 * 60000;
const historyCache = new Map();

async function fetchHistory(hass, ids, hours = 24) {
  ids = ids.filter(Boolean);
  if (!ids.length || !hass.callWS) return {};
  const key = ids.join(',');
  const hit = historyCache.get(key);
  if (hit && Date.now() - hit.at < HISTORY_TTL) return hit.data;
  const res = await hass.callWS({
    type: 'history/history_during_period',
    start_time: new Date(Date.now() - hours * 3600000).toISOString(),
    entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: true,
  });
  const data = {};
  for (const id of ids) {
    data[id] = (res?.[id] || [])
      .map((p) => [p.lu != null ? p.lu * 1000 : new Date(p.last_updated || p.last_changed).getTime(), parseFloat(p.s ?? p.state)])
      .filter(([t, v]) => !isNaN(t) && !isNaN(v));
  }
  historyCache.set(key, { at: Date.now(), data });
  return data;
}

/* Ομαλή καμπύλη SVG (γραμμή + γέμισμα) από σημεία, μέσα σε πλαίσιο w×h· lo/hi = εύρος τιμών */
function smoothPath(points, w, h, lo, hi, hours = 24) {
  if (points.length < 2) return null;
  const t0 = Date.now() - hours * 3600000;
  const n = 48;
  /* Δειγματοληψία σε σταθερά βήματα, για να μη χαλάει η καμπύλη από αραιά ή πυκνά σημεία */
  const ys = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = t0 + (i / n) * hours * 3600000;
    while (j < points.length - 1 && points[j + 1][0] <= t) j++;
    ys.push(points[j][1]);
  }
  const pad = (hi - lo) * 0.15 || 1;
  const y = (v) => h - 6 - ((clamp(v, lo - pad, hi + pad) - (lo - pad)) / (hi - lo + 2 * pad)) * (h - 12);
  const pts = ys.map((v, i) => [(i / n) * w, y(v)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return { line: d, area: `${d} L${w},${h} L0,${h} Z` };
}

/* ── Δωμάτιο ή σπίτι (πλατιά): θερμοκρασία και υγρασία με ζώνη άνεσης και καμπύλη 24 ωρών ── */
const ROOM_ICONS = { sofa: 'chair', bed: 'bed', kitchen: 'kitchen', bath: 'bathtub', home: 'home', desk: 'desk', child: 'child_care' };
/* Απόχρωση ανά κατάσταση: χαμηλά / άνετα / ψηλά, για θερμοκρασία και υγρασία */
const ROOM_TONES = {
  t: { lo: ['#5b8fd6', '#e3eef9'], ok: ['#4a9c66', '#e6f1e7'], hi: ['#e08a45', '#fbe9d2'] },
  h: { lo: ['#d09a2a', '#fbefd6'], ok: ['#4a9c66', '#e6f1e7'], hi: ['#c9562b', '#f9dccd'] },
};

class WallRoomCard extends WallWideCard {
  static css = `
.card,.card.on{padding:0;background:linear-gradient(90deg,var(--bt,#f5f3ef) 0%,#f6f4f0 50%,var(--bh,#f5f3ef) 100%);transition:background .6s}
.chart{position:absolute;left:0;bottom:0;width:100%;height:42%;pointer-events:none}
.fl{-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 30%,transparent 62%);mask-image:linear-gradient(90deg,#000 0%,#000 30%,transparent 62%)}
.fr{-webkit-mask-image:linear-gradient(270deg,#000 0%,#000 30%,transparent 62%);mask-image:linear-gradient(270deg,#000 0%,#000 30%,transparent 62%)}
.chart path.ln{fill:none;stroke-width:2;stroke-opacity:.7;vector-effect:non-scaling-stroke}
.chart path.ar{stroke:none}
.rn{position:absolute;left:18px;top:14px;right:18px;display:flex;align-items:center;gap:8px;font:700 17px var(--w-font);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rn .ms{font-size:24px;flex:none}
.m{position:absolute;top:50px;display:flex;flex-direction:column}
.m.t{left:18px}
.m.h{left:52%}
.v{display:flex;align-items:center;gap:6px;font:400 46px var(--w-font);letter-spacing:-2px;line-height:1.05;white-space:nowrap}
.v .ms{font-size:28px;letter-spacing:0;color:var(--c)}
.m.alert .num{color:var(--c)}
.z{position:relative;width:150px;max-width:100%;height:22px;margin-top:8px;color:var(--c)}
.z s{position:absolute;left:0;right:0;top:10px;height:2px;border-radius:1px;background:rgba(28,34,40,.15)}
.z b{position:absolute;top:8px;height:6px;border-radius:3px;background:rgba(79,165,108,.55)}
.z i{position:absolute;top:0;width:0;height:0;margin-left:-6px;border-left:6px solid transparent;border-right:6px solid transparent;
  border-top:8px solid currentColor;transition:left .6s var(--w-spring)}
`;

  static getConfigForm() {
    const icons = Object.keys(ROOM_ICONS).map((value) => ({
      value, label: { sofa: 'Σαλόνι', bed: 'Υπνοδωμάτιο', kitchen: 'Κουζίνα', bath: 'Μπάνιο', home: 'Σπίτι', desk: 'Γραφείο', child: 'Παιδικό' }[value],
    }));
    const n = (min, max, step) => ({ number: { min, max, step, mode: 'box' } });
    return form([
      ['entity', 'Θερμοκρασία', ent('sensor', 'temperature'), true],
      ['humidity_entity', 'Υγρασία', ent('sensor', 'humidity')],
      ['name', 'Όνομα δωματίου', TEXT],
      ['icon', 'Εικονίδιο', { select: { mode: 'dropdown', options: icons } }],
      ['temp_min', 'Άνετη θερμοκρασία από (°)', n(10, 30, 0.5)],
      ['temp_max', 'Άνετη θερμοκρασία έως (°)', n(10, 35, 0.5)],
      ['hum_min', 'Άνετη υγρασία από (%)', n(10, 90, 1)],
      ['hum_max', 'Άνετη υγρασία έως (%)', n(10, 95, 1)],
    ]);
  }
  static getStubConfig() { return { entity: '', icon: 'sofa' }; }
  watched() { return [this._config.entity, this._config.humidity_entity]; }

  template() {
    return `
<div class="card">
  <svg class="chart fl ct" viewBox="0 0 400 100" preserveAspectRatio="none"><defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".42"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path class="ar" fill="url(#gt)"/><path class="ln"/></svg>
  <svg class="chart fr ch" viewBox="0 0 400 100" preserveAspectRatio="none"><defs><linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".42"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path class="ar" fill="url(#gh)"/><path class="ln"/></svg>
  <div class="rn"><span class="ms"></span><span class="nm"></span></div>
  <div class="m t"><span class="v"><span class="ms">device_thermostat</span><span class="num"></span></span>
    <div class="z"><s></s><b></b><i></i></div></div>
  <div class="m h"><span class="v"><span class="ms">water_drop</span><span class="num"></span></span>
    <div class="z"><s></s><b></b><i></i></div></div>
</div>`;
  }

  bind() { this.tapMore(); }

  /* Μία μέτρηση: τιμή, ζώνη άνεσης πάνω σε σταθερή κλίμακα, απόχρωση */
  metric(sel, id, kind, scaleLo, scaleHi, okLo, okHi, text) {
    const box = this.$(sel);
    const v = this.num(id);
    box.hidden = !id;
    if (!id) return null;
    const state = isNaN(v) ? 'ok' : v < okLo ? 'lo' : v > okHi ? 'hi' : 'ok';
    const [c, bg] = ROOM_TONES[kind][state];
    const at = (x) => clamp(((x - scaleLo) / (scaleHi - scaleLo)) * 100, 0, 100);
    box.style.setProperty('--c', c);
    box.classList.toggle('alert', state !== 'ok');
    box.querySelector('.num').textContent = isNaN(v) ? '—' : text(v);
    box.querySelector('.z b').style.left = at(okLo) + '%';
    box.querySelector('.z b').style.right = 100 - at(okHi) + '%';
    box.querySelector('.z i').style.left = (isNaN(v) ? -50 : at(v)) + '%';
    box.querySelector('.z i').hidden = isNaN(v);
    return { c, bg };
  }

  update() {
    const c = this._config;
    const tLo = c.temp_min ?? 20, tHi = c.temp_max ?? 24, hLo = c.hum_min ?? 40, hHi = c.hum_max ?? 60;
    const card = this.$('.card');
    card.classList.toggle('unavail', !this.available(c.entity));
    this.$('.rn .ms').textContent = ROOM_ICONS[c.icon] || 'chair';
    this.$('.nm').textContent = c.name || '';
    const t = this.metric('.m.t', c.entity, 't', 14, 30, tLo, tHi, (v) => `${fmt(v, 1)}°`);
    const h = this.metric('.m.h', c.humidity_entity, 'h', 20, 85, hLo, hHi, (v) => `${Math.round(v)}%`);
    card.style.setProperty('--bt', t?.bg || '#f5f3ef');
    card.style.setProperty('--bh', h?.bg || t?.bg || '#f5f3ef');
    this._tones = { t: t?.c, h: h?.c };
    this.paintCharts();
    this.loadHistory();
  }

  async loadHistory() {
    const c = this._config;
    if (this._loading || (this._hist && Date.now() - this._histAt < HISTORY_TTL)) return;
    this._loading = true;
    try {
      this._hist = await fetchHistory(this._hass, [c.entity, c.humidity_entity]);
      this._histAt = Date.now();
      this.paintCharts();
    } catch (e) {
      this._histAt = Date.now(); /* χωρίς ιστορικό η κάρτα δουλεύει κανονικά· ξαναδοκιμάζει σε 10 λεπτά */
    } finally {
      this._loading = false;
    }
  }

  paintCharts() {
    const c = this._config;
    const draw = (sel, id, color, lo, hi) => {
      const svg = this.$(sel);
      const pts = this._hist?.[id] || [];
      const now = this.num(id);
      const p = smoothPath(isNaN(now) ? pts : [...pts, [Date.now(), now]], 400, 100, lo, hi);
      svg.style.visibility = p ? 'visible' : 'hidden';
      if (!p) return;
      const [ar, ln] = svg.querySelectorAll('path');
      ar.setAttribute('d', p.area);
      svg.style.color = color;
      ln.setAttribute('d', p.line);
      ln.setAttribute('stroke', color);
    };
    /* Κάθε καμπύλη κλιμακώνεται στο δικό της 24ωρο εύρος, ώστε να φαίνεται η τάση */
    const range = (id) => {
      const vs = (this._hist?.[id] || []).map((p) => p[1]).concat(isNaN(this.num(id)) ? [] : [this.num(id)]);
      return vs.length ? [Math.min(...vs), Math.max(...vs)] : [0, 1];
    };
    draw('.ct', c.entity, this._tones?.t || '#e08a45', ...range(c.entity));
    if (c.humidity_entity) draw('.ch', c.humidity_entity, this._tones?.h || '#4a7fc8', ...range(c.humidity_entity));
    else this.$('.ch').style.visibility = 'hidden';
  }
}

/* ── Καιρός (πλατιά): ουρανός που αλλάζει με τις συνθήκες, πρόγνωση ημερών και insight ── */
const WX = {
  'clear-night': ['Αίθριος', 'clear_night', 'night'], sunny: ['Ηλιοφάνεια', 'sunny', 'sun'],
  partlycloudy: ['Λίγα σύννεφα', 'partly_cloudy_day', 'sun cloud'], cloudy: ['Συννεφιά', 'cloud', 'cloud dull'],
  fog: ['Ομίχλη', 'foggy', 'fog dull'], hail: ['Χαλάζι', 'weather_hail', 'cloud rain dull'],
  lightning: ['Καταιγίδα', 'thunderstorm', 'cloud storm dull'], 'lightning-rainy': ['Καταιγίδα', 'thunderstorm', 'cloud rain storm dull'],
  pouring: ['Δυνατή βροχή', 'rainy_heavy', 'cloud rain dull'], rainy: ['Βροχή', 'rainy', 'cloud rain dull'],
  snowy: ['Χιόνι', 'weather_snowy', 'cloud snow dull'], 'snowy-rainy': ['Χιονόνερο', 'weather_mix', 'cloud snow rain dull'],
  windy: ['Άνεμος', 'air', 'sun wind'], 'windy-variant': ['Άνεμος', 'air', 'cloud wind'], exceptional: ['Ακραία φαινόμενα', 'warning', 'cloud dull'],
};
const WX_DAYS = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'];
const WET = ['rainy', 'pouring', 'lightning-rainy', 'snowy', 'snowy-rainy', 'hail'];

/* Ένα σύντομο insight από την ωριαία πρόγνωση των επόμενων 12 ωρών */
function weatherInsight(hourly, nowTemp) {
  const next = (hourly || []).filter((f) => new Date(f.datetime) > Date.now()).slice(0, 12);
  if (!next.length) return null;
  const hh = (f) => `${pad2(new Date(f.datetime).getHours())}:00`;
  const wet = next.find((f) => WET.includes(f.condition) || (f.precipitation_probability ?? 0) >= 50);
  if (wet) {
    const snow = String(wet.condition).startsWith('snow');
    return ['umbrella', `${snow ? 'Χιόνι' : 'Βροχή'} από τις ${hh(wet)}`];
  }
  const frost = next.find((f) => f.temperature <= 0);
  if (frost) return ['ac_unit', `Παγετός από τις ${hh(frost)}`];
  if (nowTemp != null) {
    const hot = next.reduce((a, f) => (f.temperature > a.temperature ? f : a));
    const cold = next.reduce((a, f) => (f.temperature < a.temperature ? f : a));
    if (hot.temperature - nowTemp >= 5) return ['trending_up', `Ανεβαίνει στους ${Math.round(hot.temperature)}° ως τις ${hh(hot)}`];
    if (nowTemp - cold.temperature >= 5) return ['trending_down', `Πέφτει στους ${Math.round(cold.temperature)}° ως τις ${hh(cold)}`];
  }
  return null;
}

class WallWeatherCard extends WallWideCard {
  static css = `
.card,.card.on{padding:0;color:#fff;transition:background 1s;background:linear-gradient(180deg,var(--s1,#5f93cf) 0%,var(--s2,#9cc3ea) 60%,var(--s3,#d6e7f6) 100%)}
.sky{position:absolute;left:0;top:0;bottom:0;width:52%;overflow:hidden;pointer-events:none;
  -webkit-mask-image:linear-gradient(90deg,#000 70%,transparent);mask-image:linear-gradient(90deg,#000 70%,transparent)}
.sky > *{position:absolute;opacity:0;transition:opacity 1s}
.sun{left:56%;top:-36px;width:140px;height:140px;border-radius:50%;animation:wx-glow 6s ease-in-out infinite;
  background:radial-gradient(circle,#fff7cf 0,#ffd968 35%,rgba(255,217,104,0) 70%)}
.moon{left:62%;top:14px;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffbe8,#dcd7c0);
  box-shadow:0 0 24px rgba(255,250,220,.5)}
.cl{border-radius:999px;background:rgba(255,255,255,.55);animation:wx-drift linear infinite}
.dull .cl{background:rgba(235,240,245,.7)}
.drops,.flakes{inset:0}
.drops i,.flakes i{position:absolute;top:-10px;border-radius:2px;background:rgba(255,255,255,.75)}
.drops i{width:2px;height:14px;animation:wx-rain 1s linear infinite}
.flakes i{width:6px;height:6px;border-radius:50%;animation:wx-snow 4s linear infinite}
.stars{inset:0;background-image:radial-gradient(1.5px 1.5px at 20% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 45% 18%,#fff,transparent),
  radial-gradient(1px 1px at 70% 40%,#fff,transparent),radial-gradient(1px 1px at 30% 60%,#fff,transparent),radial-gradient(1.5px 1.5px at 85% 25%,#fff,transparent);
  animation:wx-twinkle 4s ease-in-out infinite}
.flash{inset:0;background:#fff;animation:wx-flash 7s linear infinite}
.sun-on .sun,.moon-on .moon,.cloud-on .cl,.rain-on .drops,.snow-on .flakes,.night-on .stars{opacity:1}
.storm-on .flash{opacity:1}
@keyframes wx-glow{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.08);opacity:1}}
@keyframes wx-drift{0%{transform:translateX(-120px)}100%{transform:translateX(260px)}}
@keyframes wx-rain{0%{transform:translate(0,-20px)}100%{transform:translate(-12px,230px)}}
@keyframes wx-snow{0%{transform:translate(0,-20px)}50%{transform:translate(8px,100px)}100%{transform:translate(-4px,230px)}}
@keyframes wx-twinkle{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes wx-flash{0%,90%,94%,100%{opacity:0}91%,93%{opacity:.6}}
.now{position:absolute;left:20px;top:16px;text-shadow:0 1px 6px rgba(0,40,90,.35)}
.loc{font:600 15px var(--w-font);opacity:.9}
.t{font:400 58px var(--w-font);letter-spacing:-3px;line-height:1}
.lh{font:600 16px var(--w-font);margin-top:4px}
.lh .lo{opacity:.85;margin-right:8px}
.fc{position:absolute;right:14px;top:14px;bottom:70px;width:48%;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px;color:var(--w-ink)}
.fd{border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:0;
  background:radial-gradient(120% 90% at 50% 45%,rgba(255,255,255,.95) 0%,rgba(255,255,255,.8) 55%,rgba(255,255,255,.35) 100%);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 0 18px 6px rgba(255,255,255,.3)}
.fd .d{font:700 14px var(--w-font)}
.fd .ms{font-size:28px;color:var(--ic,#6c7a86)}
.fd .lo{font:600 13px var(--w-font);color:var(--w-muted)}
.fd .hi{font:700 17px var(--w-font)}
.tip{position:absolute;left:14px;right:14px;bottom:14px;height:44px;border-radius:16px;padding:0 14px;display:flex;align-items:center;gap:10px;
  color:var(--w-ink);font:600 16px var(--w-font);white-space:nowrap;overflow:hidden;
  background:radial-gradient(140% 120% at 50% 50%,rgba(255,255,255,.95),rgba(255,255,255,.7));box-shadow:0 0 16px 4px rgba(255,255,255,.3)}
.tip .ms{font-size:24px;color:#3f73c4;flex:none}
.tip span:last-child{overflow:hidden;text-overflow:ellipsis}
.notip .fc{bottom:14px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Καιρός', ent('weather'), true],
      ['show_location', 'Εμφάνιση τοποθεσίας', { boolean: {} }],
      ['days', 'Ημέρες πρόγνωσης', { number: { min: 0, max: 5, step: 1, mode: 'slider' } }],
      ['insight_entity', 'Δικό σου κείμενο insight, αντί για το αυτόματο (προαιρετικό)', ent(['sensor', 'input_text'])],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'weather') }; }
  watched() { return [this._config.entity, this._config.insight_entity, 'sun.sun']; }

  template() {
    const cl = [[34, 100, 30, '0s', 30], [70, 70, 22, '-18s', 44], [12, 80, 26, '-8s', 38]]
      .map(([top, w, h, d, s]) => `<span class="cl" style="top:${top}px;width:${w}px;height:${h}px;animation-delay:${d};animation-duration:${s}s"></span>`).join('');
    const drops = Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 7 + 3) % 100}%;animation-delay:${(i * 0.13) % 1}s"></i>`).join('');
    const flakes = Array.from({ length: 10 }, (_, i) => `<i style="left:${(i * 11 + 5) % 100}%;animation-delay:${(i * 0.41) % 4}s"></i>`).join('');
    return `
<div class="card">
  <div class="sky"><span class="stars"></span><span class="sun"></span><span class="moon"></span>${cl}
    <span class="drops">${drops}</span><span class="flakes">${flakes}</span><span class="flash"></span></div>
  <div class="now"><div class="loc" hidden></div><div class="t"></div><div class="lh"><span class="lo"></span><span class="hi"></span></div></div>
  <div class="fc"></div>
  <div class="tip"><span class="ms"></span><span class="tx"></span></div>
</div>`;
  }

  bind() { this.tapMore(); }

  connectedCallback() {
    super.connectedCallback();
    if (this._hass && this._config) this.subscribe();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe();
  }
  unsubscribe() {
    (this._unsubs || []).forEach((p) => p.then((u) => u && u()).catch(() => {}));
    this._unsubs = null;
  }
  /* Η πρόγνωση δεν είναι attribute πια: έρχεται με συνδρομή, ημερήσια και ωριαία */
  subscribe() {
    const conn = this._hass?.connection;
    if (this._unsubs || !conn?.subscribeMessage || !this._config?.entity) return;
    const sub = (type, key) => conn.subscribeMessage((ev) => { this[key] = ev.forecast || []; this.update(); },
      { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: this._config.entity });
    this._unsubs = [sub('daily', '_daily'), sub('hourly', '_hourly')].map((p) => p.catch(() => null));
  }

  update() {
    this.subscribe();
    const c = this._config;
    const s = this.st(c.entity);
    const a = s?.attributes || {};
    const ok = this.available(c.entity);
    const night = this.val('sun.sun') === 'below_horizon';
    const cond = ok ? s.state : 'cloudy';
    const fx = (WX[cond] || WX.cloudy)[2].split(' ');
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);

    /* Ουρανός: νύχτα σκούρος, συννεφιά/βροχή γκρίζος, αλλιώς γαλάζιος */
    const dull = fx.includes('dull');
    const sky = night ? ['#1d2b4a', '#33496f', '#5a6f93'] : dull ? ['#7d8a99', '#a9b4c0', '#d3dae1'] : ['#5f93cf', '#9cc3ea', '#d6e7f6'];
    ['--s1', '--s2', '--s3'].forEach((k, i) => card.style.setProperty(k, sky[i]));
    const sk = this.$('.sky');
    sk.className = 'sky' + (dull ? ' dull' : '');
    const on = (k, v) => sk.classList.toggle(k + '-on', !!v);
    on('sun', fx.includes('sun') && !night);
    on('moon', night && !dull);
    on('night', night && !dull);
    on('cloud', fx.includes('cloud'));
    on('rain', fx.includes('rain'));
    on('snow', fx.includes('snow'));
    on('storm', fx.includes('storm'));

    const loc = this.$('.loc');
    loc.hidden = !c.show_location;
    loc.textContent = [a.friendly_name, (WX[cond] || [cond])[0]].filter(Boolean).join(' · ');
    this.$('.t').textContent = a.temperature != null ? `${Math.round(a.temperature)}°` : '—';

    const days = this._daily || [];
    const today = days[0];
    this.$('.lo').textContent = today?.templow != null ? `↓ ${Math.round(today.templow)}°` : '';
    this.$('.hi').textContent = today?.temperature != null ? `↑ ${Math.round(today.temperature)}°` : '';

    /* Πρόγνωση: οι επόμενες ημέρες (χωρίς τη σημερινή) */
    const n = c.days ?? 3;
    const fc = this.$('.fc');
    fc.hidden = !n;
    fc.replaceChildren(...days.slice(1, n + 1).map((f) => {
      const [, icon] = WX[f.condition] || WX.cloudy;
      const d = el('div', 'fd');
      const i = el('span', 'ms fill', icon);
      d.style.setProperty('--ic', WET.includes(f.condition) ? '#3f73c4' : f.condition === 'sunny' ? '#e0a21f' : '#6c7a86');
      d.append(el('span', 'd', WX_DAYS[new Date(f.datetime).getDay()]), i,
        el('span', 'lo', f.templow != null ? `↓ ${Math.round(f.templow)}°` : ''), el('span', 'hi', `↑ ${Math.round(f.temperature)}°`));
      return d;
    }));

    const custom = this.val(c.insight_entity);
    const tip = custom ? ['info', custom] : weatherInsight(this._hourly, a.temperature);
    card.classList.toggle('notip', !tip);
    this.$('.tip').hidden = !tip;
    if (tip) { this.$('.tip .ms').textContent = tip[0]; this.$('.tx').textContent = tip[1]; }
  }
}

/* ── Χρόνος από τότε, στα ελληνικά: «12 λεπτά», «3 ώρες», «1 ημέρα» ── */
function since(iso) {
  if (!iso || isNaN(new Date(iso))) return '';
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (m < 1) return 'μόλις τώρα';
  if (m < 60) return m === 1 ? '1 λεπτό' : `${m} λεπτά`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? '1 ώρα' : `${h} ώρες`;
  const d = Math.round(h / 24);
  return d === 1 ? '1 ημέρα' : `${d} ημέρες`;
}

/* ── Άτομο (πλατιά): χάρτης στο φόντο, avatar με δαχτυλίδι κατάστασης, απόσταση και διεύθυνση ──
 * Ο χάρτης έρχεται από το Geoapify (στατική εικόνα) μόνο αν οριστεί map_api_key· είναι η μόνη
 * εξωτερική κλήση της βιβλιοθήκης πέρα από τις γραμματοσειρές. Ζητείται νέα εικόνα μόνο όταν
 * η θέση αλλάξει πάνω από ~50 m, για να μη γεμίζει το όριο του δωρεάν λογαριασμού.
 */
const PERSON_TONE = { home: '#3f9d62', driving: '#2f6fb5', zone: '#7a5bc4', away: '#e09a1f' };
const PERSON_BADGE = { home: 'home', driving: 'directions_car', zone: 'location_on', away: 'directions_walk' };

class WallPersonCard extends WallWideCard {
  static css = `
.card,.card.on{padding:0;background:#eef0ec}
.map{position:absolute;top:0;left:3%;width:140%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s,filter .6s}
.map.ok{opacity:1}
.home .map{filter:saturate(.45) brightness(1.04)}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(248,249,250,.97) 0%,rgba(248,249,250,.9) 38%,rgba(248,249,250,0) 72%)}
.nomap .fade{background:linear-gradient(90deg,#f8f9fa,#eef1f4)}
.pin{position:absolute;left:73%;top:52%;width:24px;height:24px;margin:-24px 0 0 -12px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
  background:var(--tone);box-shadow:0 2px 4px rgba(0,0,0,.3)}
.pin::after{content:'';position:absolute;inset:7px;border-radius:50%;background:#fff}
.halo{position:absolute;left:73%;top:calc(52% - 12px);width:30px;height:30px;margin:-15px;border-radius:50%;background:var(--tone);opacity:0;
  animation:p-halo 2s ease-out infinite}
@keyframes p-halo{0%{transform:scale(.6);opacity:.55}100%{transform:scale(2.4);opacity:0}}
.home .pin,.home .halo,.nomap .pin,.nomap .halo{display:none}
.hm{position:absolute;left:73%;top:50%;width:42px;height:42px;margin:-21px;border-radius:50%;display:none;place-items:center;font-size:22px;
  color:#fff;background:var(--tone);box-shadow:0 0 0 7px color-mix(in srgb,var(--tone) 25%,transparent)}
.home:not(.nomap) .hm{display:grid}
.av{position:absolute;left:20px;top:20px;width:88px;height:88px;border-radius:50%;padding:4px;background:var(--tone);
  box-shadow:0 6px 14px rgba(30,40,50,.25);transition:background .4s}
.av span{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;border:3px solid #fff;color:#fff;font:600 32px var(--w-font);
  background:linear-gradient(160deg,#a8b4bf,#6b7884) center/cover no-repeat}
.bd{position:absolute;left:86px;top:86px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:18px;color:#fff;
  background:var(--tone);border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.ds{position:absolute;right:16px;top:16px;height:38px;padding:0 14px;border-radius:19px;display:flex;align-items:center;gap:6px;
  background:rgba(255,255,255,.92);font:700 16px var(--w-font);box-shadow:0 2px 6px rgba(0,0,0,.12)}
.ds .ms{font-size:20px;color:var(--w-muted)}
.tx{position:absolute;left:20px;bottom:16px;right:44%;display:flex;flex-direction:column;gap:2px;min-width:0}
.st{font:700 20px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ad{font:600 15px var(--w-font);color:var(--w-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Άτομο', ent('person'), true],
      ['distance_entity', 'Απόσταση από το σπίτι (προαιρετικό)', ent('sensor')],
      ['address_entity', 'Διεύθυνση, π.χ. geocoded location του κινητού (προαιρετικό)', ent('sensor')],
      ['driving_entity', 'Οδηγεί (προαιρετικό)', ent(['binary_sensor', 'input_boolean'])],
      ['map_api_key', 'Κλειδί Geoapify για τον χάρτη (προαιρετικό)', { text: { type: 'password' } }],
      ['map_style', 'Στυλ χάρτη', { select: { mode: 'dropdown', options: [
        { value: 'positron', label: 'Ανοιχτόχρωμο' }, { value: 'osm-bright', label: 'Έντονο' }, { value: 'klokantech-basic', label: 'Βασικό' },
      ] } }],
      ['zoom', 'Ζουμ χάρτη', { number: { min: 12, max: 18, step: 1, mode: 'slider' } }],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'person') }; }
  watched() { const c = this._config; return [c.entity, c.distance_entity, c.address_entity, c.driving_entity]; }

  template() {
    return `
<div class="card">
  <img class="map" alt="">
  <span class="halo"></span><span class="pin"></span><span class="hm ms fill">home</span>
  <div class="fade"></div>
  <div class="av"><span></span></div>
  <span class="bd ms fill"></span>
  <div class="ds" hidden><span class="ms">home</span><span class="dv"></span></div>
  <div class="tx"><span class="st"></span><span class="ad"></span></div>
</div>`;
  }

  bind() {
    this.tapMore();
    this.$('.map').addEventListener('load', () => this.$('.map').classList.add('ok'));
    this.$('.map').addEventListener('error', () => this.$('.map').classList.remove('ok'));
    /* Το «πριν από πόσο» αλλάζει με τον χρόνο, όχι μόνο με την κατάσταση */
    this._clock = setInterval(() => this.isConnected && this._hass && this.update(), 60000);
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._clock); this._built = false; }

  mapUrl(lat, lon) {
    const c = this._config;
    if (!c.map_api_key || lat == null || lon == null) return '';
    /* Στρογγύλεμα ~50 m: η ίδια θέση δίνει την ίδια διεύθυνση εικόνας και ο browser την έχει ήδη */
    const r = (v) => Math.round(v * 2000) / 2000;
    const q = new URLSearchParams({
      style: c.map_style || 'positron', width: '1154', height: '424', scaleFactor: '1',
      center: `lonlat:${r(lon)},${r(lat)}`, zoom: String(c.zoom || 16), apiKey: c.map_api_key,
    });
    return `https://maps.geoapify.com/v1/staticmap?${q}`;
  }

  update() {
    const c = this._config;
    const s = this.st(c.entity);
    const a = s?.attributes || {};
    const ok = this.available(c.entity);
    const driving = this.val(c.driving_entity) === 'on';
    const home = s?.state === 'home';
    const kind = driving ? 'driving' : home ? 'home' : !ok || s.state === 'not_home' ? 'away' : 'zone';
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('home', home && !driving);
    card.style.setProperty('--tone', PERSON_TONE[kind]);

    const url = this.mapUrl(a.latitude, a.longitude);
    card.classList.toggle('nomap', !url);
    const img = this.$('.map');
    if (url && img.getAttribute('src') !== url) { img.classList.remove('ok'); img.setAttribute('src', url); }
    if (!url) img.removeAttribute('src');

    const pic = this.$('.av span');
    pic.style.backgroundImage = a.entity_picture ? cssUrl(a.entity_picture) : '';
    pic.textContent = a.entity_picture ? '' : (a.friendly_name || '?').trim().charAt(0).toUpperCase();
    this.$('.bd').textContent = PERSON_BADGE[kind];

    const label = driving ? 'Οδηγεί' : home ? 'Σπίτι' : kind === 'zone' ? s.state : 'Εκτός';
    const ago = since(driving ? this.st(c.driving_entity).last_changed || this.st(c.driving_entity).last_updated : s.last_changed || s.last_updated);
    this.$('.st').textContent = ok ? [label, ago].filter(Boolean).join(' · ') : 'Άγνωστο';

    /* Διεύθυνση: οι δύο πρώτες λέξεις-τμήματα (οδός, πόλη) αρκούν σε μια ματιά */
    const addr = this.val(c.address_entity);
    this.$('.ad').textContent = !home && addr ? addr.split(',').slice(0, 2).join(',').trim() : '';

    const dist = this.st(c.distance_entity);
    const dv = this.available(c.distance_entity) ? dist.state : '';
    this.$('.ds').hidden = home || !dv;
    if (dv) {
      const n = parseFloat(dv);
      const unit = dist.attributes?.unit_of_measurement || dv.replace(/[\d.,\s]/g, '') || 'm';
      this.$('.dv').textContent = isNaN(n) ? dv
        : unit === 'm' && n >= 1000 ? `${fmt(n / 1000, n < 10000 ? 1 : 0)} km` : `${fmt(n, unit === 'km' && n < 10 ? 1 : 0)} ${unit}`;
    }
  }
}

/* ── Αφυγραντήρας: φορητή συσκευή με οθόνη υγρασίας· popup με στόχο και δωμάτιο ── */
const ROOM_GR = {
  bedroom: ['Υπνοδωμάτιο', 'bed'], 'master bedroom': ['Κύριο υπνοδ.', 'king_bed'], 'living room': ['Σαλόνι', 'chair'],
  kitchen: ['Κουζίνα', 'kitchen'], bathroom: ['Μπάνιο', 'bathtub'], home: ['Σπίτι', 'home'], office: ['Γραφείο', 'desk'],
  'kids room': ['Παιδικό', 'child_care'], 'guest room': ['Ξενώνας', 'bed'],
};
const roomInfo = (o) => ROOM_GR[String(o).toLowerCase()] || [o, 'meeting_room'];

/* Βρίσκει τον αισθητήρα υγρασίας ενός δωματίου από το όνομά του, π.χ. «Living Room» → «Living Room Sensor Humidity».
   Προτιμά διαθέσιμους αισθητήρες και το πιο κοντινό όνομα («Bedroom» δεν πιάνει το «Master Bedroom»). */
function roomHumidity(hass, room) {
  const want = String(room).toLowerCase();
  let best = null;
  for (const [id, s] of Object.entries(hass.states)) {
    if (!id.startsWith('sensor.') || s.attributes?.device_class !== 'humidity') continue;
    const name = String(s.attributes.friendly_name || '').toLowerCase();
    if (!name.startsWith(want) || id.includes('dehumidifier')) continue;
    const score = (UNAVAILABLE.includes(s.state) ? 1000 : 0) + name.length;
    if (!best || score < best.score) best = { id, score, s };
  }
  return best && !UNAVAILABLE.includes(best.s.state) ? parseFloat(best.s.state) : NaN;
}

class WallDehumidifierCard extends WallBaseCard {
  static css = `
/* Πρόσοψη αφυγραντήρα: πάνελ με οθόνη και πλήκτρα −/+, δοχείο με παραθυράκι νερού */
.card,.card.on{padding:0;background:linear-gradient(90deg,#e4e7ea,#fff 18%,#fff 82%,#e1e4e7)}
.card:not(.on){background:linear-gradient(90deg,#d8dbde,#eceeef 18%,#eceeef 82%,#d5d8db)}
.pw{position:absolute;right:10px;top:8px;width:48px;height:48px;border:0;background:none;padding:0;cursor:pointer;z-index:3;
  display:grid;place-items:center;font-size:26px;color:#7a8187;transition:color .3s,text-shadow .3s}
.on .pw{color:#3d8fe6;text-shadow:0 0 8px rgba(61,143,230,.7)}
.panel{position:absolute;left:8%;right:8%;top:34%;height:58px;border-radius:12px;background:linear-gradient(180deg,#f1f3f5,#e2e6e9);
  box-shadow:inset 0 1px 3px rgba(0,0,0,.18),0 1px 0 #fff;display:flex;align-items:center;justify-content:space-between;padding:0 8px}
.key{width:44px;height:40px;border:0;padding:0;border-radius:8px;display:grid;place-items:center;font-size:22px;color:#5f676d;cursor:pointer;
  background:linear-gradient(180deg,#fdfdfd,#e6e9ec);box-shadow:0 1px 2px rgba(0,0,0,.2),inset 0 -1px 0 rgba(0,0,0,.06)}
.key:active{box-shadow:inset 0 1px 3px rgba(0,0,0,.25)}
.seg{flex:none;width:86px;height:42px;border-radius:6px;background:#1b2229;box-shadow:inset 0 1px 4px rgba(0,0,0,.7);
  display:flex;align-items:center;justify-content:center;gap:3px;font:600 28px ui-monospace,'Cascadia Mono',Consolas,monospace;
  color:#7fc4ff;text-shadow:0 0 6px rgba(127,196,255,.6)}
.seg small{font-size:14px;align-self:flex-end;margin-bottom:8px}
.card:not(.run) .seg{color:#2c3a46;text-shadow:none}
.card.on:not(.run) .seg{color:#4f7ea8}
.setting .seg{color:#ffd27a;text-shadow:0 0 6px rgba(255,210,122,.6);animation:d-bl 1s steps(2) infinite}
@keyframes d-bl{50%{opacity:.35}}
.seam{position:absolute;left:0;right:0;top:72%;height:2px;background:linear-gradient(90deg,#c9ced2,#e3e6e9,#c9ced2);box-shadow:0 1px 0 #fff}
.win{position:absolute;left:50%;top:calc(72% + 14px);width:10px;height:34px;margin-left:-5px;border-radius:5px;background:#dfe5ea;
  box-shadow:inset 0 1px 3px rgba(0,0,0,.3);overflow:hidden}
.win i{position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(180deg,#9cc8ee,#5d9ad6)}
.run .win i{animation:d-fill 6s ease-in-out infinite}
@keyframes d-fill{50%{height:52%}}
.tag{left:14px;top:14px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Αφυγραντήρας (humidifier)', ent('humidifier'), true],
      ['humidity_entity', 'Υγρασία που ακολουθεί (προαιρετικό)', ent('sensor', 'humidity')],
      ['room_entity', 'Επιλογή δωματίου (select)', ent(['select', 'input_select'])],
      ['running_entity', 'Ο συμπιεστής δουλεύει, π.χ. πρίζα (προαιρετικό)', ent(['switch', 'binary_sensor'])],
      ['power_entity', 'Κατανάλωση (προαιρετικό)', ent('sensor', 'power')],
      LABEL, TITLE,
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'humidifier') }; }
  watched() { const c = this._config; return [c.entity, c.humidity_entity, c.room_entity, c.running_entity, c.power_entity]; }

  template() {
    return `
<div class="card">
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="panel">
    <button class="key dn ms" aria-label="Μείωση στόχου">remove</button>
    <div class="seg"><span class="num"></span><small>%</small></div>
    <button class="key up ms" aria-label="Αύξηση στόχου">add</button>
  </div>
  <div class="seam"></div><div class="win"><i></i></div>
</div>`;
  }

  bind() {
    this.tapMore(() => this.popup());
    this.$('.pw').addEventListener('click', () => this.power());
    /* −/+ : η οθόνη δείχνει τον στόχο να αναβοσβήνει για 3″ και μετά επιστρέφει στην υγρασία του χώρου */
    const step = (dir) => () => {
      const id = this._config.entity;
      const a = this.st(id)?.attributes || {};
      if (!this.available(id) || a.humidity == null) return;
      const cur = this._set && Date.now() < this._set.until ? this._set.v : a.humidity;
      const v = clamp(Math.round((cur + dir * 5) / 5) * 5, a.min_humidity ?? 30, a.max_humidity ?? 80);
      this._set = { v, until: Date.now() + 3000 };
      clearTimeout(this._setT);
      this._setT = setTimeout(() => this.update(), 3100);
      this.update();
      this.call('humidifier', 'set_humidity', { entity_id: id, humidity: v });
    };
    this.$('.dn').addEventListener('click', step(-1));
    this.$('.up').addEventListener('click', step(1));
  }

  /* Όταν το hygrostat είναι unavailable (π.χ. έπεσε ο αισθητήρας υγρασίας), η πρίζα συνεχίζει να δουλεύει: την ελέγχουμε απευθείας */
  fallbackSwitch() {
    const sw = this._config.running_entity;
    return !this.available(this._config.entity) && sw && sw.startsWith('switch.') && this.available(sw) ? sw : null;
  }
  isOn() {
    const sw = this.fallbackSwitch();
    if (sw) return this.val(sw) === 'on';
    return this.available(this._config.entity) && this.st(this._config.entity).state === 'on';
  }
  power() {
    const sw = this.fallbackSwitch();
    if (sw) this.call('homeassistant', 'toggle', { entity_id: sw });
    else if (this.available(this._config.entity)) this.call('humidifier', 'toggle', { entity_id: this._config.entity });
  }

  current() {
    const c = this._config;
    const v = this.num(c.humidity_entity);
    return isNaN(v) ? this.st(c.entity)?.attributes?.current_humidity : v;
  }

  popup() {
    const c = this._config;
    const id = c.entity;
    if (!this.available(id) && !this.fallbackSwitch()) return this.moreInfo(id);
    openPopup(this, {
      icon: 'water_drop', size: 'md', title: 'Αφυγραντήρας', accent: () => '#2f6fb5',
      status: () => {
        const cur = this.current();
        const room = this.val(c.room_entity);
        const w = this.num(c.power_entity);
        return [this.isOn() ? 'Λειτουργεί' : 'Κλειστός', [room && roomInfo(room)[0], cur != null && `${Math.round(cur)}%`].filter(Boolean).join(' '),
          !isNaN(w) && w > 1 && `${Math.round(w)} W`].filter(Boolean).join(' · ');
      },
      render: (p) => {
        const a = this.st(id)?.attributes || {};
        const on = this.isOn();
        const step = 5;
        const go = (dir) => () => this.call('humidifier', 'set_humidity', {
          entity_id: id, humidity: clamp(Math.round((a.humidity + dir * step) / step) * step, a.min_humidity ?? 30, a.max_humidity ?? 80),
        });
        if (a.humidity != null) popStepper(popSection(p, 'Στόχος υγρασίας'), { text: `${a.humidity}%`, dec: go(-1), inc: go(1) });
        const sel = this.st(c.room_entity);
        if (sel?.attributes?.options?.length) {
          const domain = c.room_entity.split('.')[0];
          popChips(popSection(p, 'Δωμάτιο'), sel.attributes.options.map((o) => {
            const [label, icon] = roomInfo(o);
            const h = roomHumidity(this._hass, o);
            return {
              label: isNaN(h) ? label : `${label}  ${Math.round(h)}%`, icon, sel: sel.state === o,
              tap: () => this.call(domain, 'select_option', { entity_id: c.room_entity, option: o }),
            };
          }));
        }
        popChips(popSection(p), [{
          label: on ? 'Σβήσιμο' : 'Άναμμα', icon: 'power_settings_new', sel: on,
          tap: () => this.power(),
        }]);
      },
    });
  }

  update() {
    const c = this._config;
    const s = this.st(c.entity);
    const ok = this.available(c.entity) || !!this.fallbackSwitch();
    const on = this.isOn();
    const w = this.num(c.power_entity);
    /* Λειτουργεί = πραγματική κατανάλωση (ή η πρίζα)· το «on» του hygrostat σημαίνει μόνο ότι είναι οπλισμένος */
    const run = on && (!isNaN(w) ? w > 5 : c.running_entity ? this.val(c.running_entity) === 'on' : true);
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.classList.toggle('run', run);
    const setting = this._set && Date.now() < this._set.until;
    if (!setting) this._set = null;
    card.classList.toggle('setting', !!setting);
    const cur = this.current();
    const v = setting ? this._set.v : cur;
    this.$('.num').textContent = v != null && !isNaN(v) ? Math.round(v) : '--';
    const canSet = this.available(c.entity) && s?.attributes?.humidity != null;
    this.shadowRoot.querySelectorAll('.key').forEach((k) => (k.style.visibility = canSet ? 'visible' : 'hidden'));
    this.label();
  }
}

/* ═════════════════════ 2β. Wall v2: ήσυχες κάρτες για τη σελίδα του tablet ═════════════════════
   Κοινό θέμα (φωτεινό/σκούρο) και στιλ (A απαλό / B γεμάτο χρώμα). Το θέμα το ορίζει η wall-layout για όλες,
   ή η κάθε κάρτα με theme/style στη δική της ρύθμιση. */

const V2 = { theme: 'auto', style: 'A' };

const XP_CSS = `
:host{overflow:visible;position:relative;z-index:6}
:host(.xopen){z-index:30}
.xp{--box:#fff;--ink:#1c2228;--mut:#5f6b76;--faint:#9aa4ad;--line:#e6eaee;--chip:#eef1f4;--accent:#2f5fa8;--ok:#3f8a5c;
  position:absolute;left:0;right:0;top:100%;z-index:30;box-sizing:border-box;padding:6px 14px 14px;background:var(--box);color:var(--ink);
  border-radius:0 0 22px 22px;box-shadow:0 26px 40px -14px rgba(20,30,40,.4);font-family:var(--w-font);transform-origin:top}
.xp.dark{--box:#1b2127;--ink:#e9eef2;--mut:#93a0ab;--faint:#5f6b76;--line:#2a323a;--chip:#252d35;--accent:#8fb5ef;--ok:#6cc08e}
.xp:not([hidden]){animation:xpin .34s cubic-bezier(.2,.9,.25,1)}
.xp.out{animation:xpout .2s ease-in forwards}
@keyframes xpin{from{clip-path:inset(0 0 100% 0);opacity:.3}to{clip-path:inset(0 0 -60px 0)}}
@keyframes xpout{to{clip-path:inset(0 0 100% 0);opacity:0}}
.card.v2.open{border-bottom-left-radius:0;border-bottom-right-radius:0;box-shadow:none;background:var(--box)!important;transition:none}
.xp .ms{font-family:'Material Symbols Rounded';font-feature-settings:'liga'}
`;
/* Άνοιγμα/κλείσιμο panel που «βγαίνει» από την κάρτα, σαν συνέχειά της */
/* Κουδούνισμα σε όλη την οθόνη, με ήχο από WebAudio· σταματά με πάτημα ή σε 5 λεπτά */
let RING_EL = null;
function ring(title, sub, snooze) {
  ringStop();
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(10,14,18,.86);backdrop-filter:blur(6px);font-family:Manrope,sans-serif;color:#fff;animation:wcfade .3s';
  o.innerHTML = `<style>@keyframes wcfade{from{opacity:0}}@keyframes wcbell{0%,100%{transform:rotate(0)}20%{transform:rotate(16deg)}40%{transform:rotate(-14deg)}60%{transform:rotate(8deg)}}
.wcb{border:0;border-radius:22px;font:800 22px Manrope,sans-serif;padding:20px 34px;cursor:pointer}</style>
<div style="text-align:center"><div style="font-size:84px;animation:wcbell 1s ease-in-out infinite;font-family:'Material Symbols Rounded'">alarm</div>
<div style="font:800 64px Manrope,sans-serif;letter-spacing:-2px">${title}</div><div style="font:600 22px Manrope,sans-serif;opacity:.75;margin:6px 0 34px">${sub || ''}</div>
<div style="display:flex;gap:16px;justify-content:center">${snooze ? '<button class="wcb" data-s style="background:#2f3a44;color:#fff">Αναβολή 10′</button>' : ''}<button class="wcb" data-x style="background:#fff;color:#1c2228">Σταμάτα</button></div></div>`;
  o.addEventListener('click', (e) => { if (e.target.closest('[data-s]')) snooze?.(); if (e.target.closest('button')) ringStop(); });
  document.body.append(o);
  let ctx = null;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (at, f) => { const g = ctx.createGain(), os = ctx.createOscillator(); os.type = 'sine'; os.frequency.value = f; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.35, at + .02); g.gain.exponentialRampToValueAtTime(.001, at + .35); os.connect(g).connect(ctx.destination); os.start(at); os.stop(at + .4); };
    const loop = () => { if (!RING_EL) return; const n = ctx.currentTime; [0, .45, .9].forEach((d, i) => beep(n + d, i === 2 ? 1320 : 880)); RING_EL.t = setTimeout(loop, 1800); };
    RING_EL = { o, ctx }; loop();
  } catch (e) { RING_EL = { o, ctx }; }
  RING_EL.end = setTimeout(ringStop, 300000);
}
function ringStop() { if (!RING_EL) return; clearTimeout(RING_EL.t); clearTimeout(RING_EL.end); RING_EL.o.remove(); try { RING_EL.ctx?.close(); } catch (e) { /* */ } RING_EL = null; }
const SCHED_DAYS = [['mon', 'Δ'], ['tue', 'Τ'], ['wed', 'Τ'], ['thu', 'Π'], ['fri', 'Π'], ['sat', 'Σ'], ['sun', 'Κ']];
const XP_OPEN = new Set();
function expander(card, xp, onOpen) {
  const cardEl = card.$('.card');
  const close = () => {
    if (xp.hidden) return;
    xp.classList.add('out');
    setTimeout(() => { xp.hidden = true; xp.classList.remove('out'); if (!card.shadowRoot.querySelector('.xp:not([hidden])')) { cardEl.classList.remove('open'); card.classList.remove('xopen'); } }, 190);
    clearTimeout(xp._t);
  };
  const open = () => {
    XP_OPEN.forEach((f) => f !== close && f()); XP_OPEN.clear(); XP_OPEN.add(close);
    card.shadowRoot.querySelectorAll('.xp:not([hidden])').forEach((o) => { if (o !== xp) { o.hidden = true; } });
    xp.classList.toggle('dark', cardEl.classList.contains('dark'));
    xp.hidden = false; cardEl.classList.add('open'); card.classList.add('xopen');
    onOpen?.(); clearTimeout(xp._t); xp._t = setTimeout(close, 45000);
  };
  const away = (e) => { if (!xp.hidden && !e.composedPath().includes(card)) close(); };
  document.addEventListener('click', away);
  (card._xpOff ||= []).push(() => document.removeEventListener('click', away));
  return { open, close, toggle: () => (xp.hidden ? open() : close()) };
}
const V2_CSS = `
:host{box-shadow:none;border-radius:20px}
.card.v2{
  --bg:#eef1f4;--box:#fff;--ink:#1c2228;--mut:#5f6b76;--faint:#9aa4ad;--line:#e6eaee;--chip:#eef1f4;
  --sh:0 1px 3px rgba(0,0,0,.05),0 6px 16px rgba(40,50,60,.06);--ok:#3f8a5c;--nav:#1f6b4f;--accent:#2f5fa8;
  min-height:0;height:100%;padding:12px 14px;border-radius:20px;background:var(--box);color:var(--ink);
  box-shadow:var(--sh);justify-content:flex-start;transition:background .4s,color .4s}
.card.v2.dark{--bg:#0f1316;--box:#1b2127;--ink:#e9eef2;--mut:#93a0ab;--faint:#5f6b76;--line:#2a323a;--chip:#252d35;--sh:0 1px 2px rgba(0,0,0,.4);--ok:#6cc08e;--accent:#8fb5ef}
.v2 .lbl{font:800 11px var(--w-font);letter-spacing:.6px;color:var(--faint);text-transform:uppercase}
.v2 .mut{color:var(--mut)}
.v2 .ms{font-size:22px}
.v2 .btn{height:36px;min-width:36px;padding:0 10px;border-radius:11px;border:1.5px solid color-mix(in srgb,var(--ink) 20%,transparent);
  display:grid;place-items:center;font:700 14px var(--w-font);color:var(--mut);background:var(--box);transition:transform .1s}
.v2 .btn:active{transform:scale(.94)}
.v2 .btn.ms{font-family:'Material Symbols Rounded';font-weight:400;font-size:20px;padding:0}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

class Wall2Card extends WallBaseCard {
  static css2 = '';
  static get css() { return V2_CSS + this.css2; }
  set hass(hass) {
    super.hass = hass;
    if (this._built) this.applyTheme();
  }
  get hass() { return this._hass; }
  applyTheme() {
    const c = this._config, card = this.$('.card');
    if (!card) return;
    const theme = c.theme || V2.theme;
    const dark = theme === 'dark' || (theme === 'auto' && !!this._hass?.themes?.darkMode);
    card.classList.add('v2');
    card.classList.toggle('dark', dark);
    card.classList.toggle('styleB', (c.style || V2.style) === 'B');
    this.shadowRoot.querySelectorAll('.xp').forEach((x) => x.classList.toggle('dark', dark));
  }
  setConfig(config) {
    if (!config) throw new Error('Λείπει η ρύθμιση');
    this._config = config;
    this._built = false;
    this._sig = null;
    if (this._hass) this.hass = this._hass;
  }
}

/* ── Εικονογραφημένα εικονίδια συσκευών (στιλ «Soft 3D»): b σώμα, d λεπτομέρεια, k σκούρο, ac τόνος, fl υγρό, ln γραμμή ── */
const PICS = {
  washer: `<rect class="b" x="9" y="5" width="30" height="38" rx="5"/><rect class="d" x="9" y="5" width="30" height="8" rx="4"/><circle class="k" cx="15" cy="9" r="1.6"/><rect class="ac" x="24" y="8" width="11" height="2.4" rx="1.2"/><circle class="d" cx="24" cy="28" r="11"/><circle class="fl" cx="24" cy="28" r="8"/><path class="ln spin" d="M18 29q3-4 6 0t6 0"/>`,
  dryer: `<rect class="b" x="9" y="5" width="30" height="38" rx="5"/><rect class="d" x="9" y="5" width="30" height="8" rx="4"/><circle class="ac blink" cx="15" cy="9" r="1.8"/><circle class="k" cx="31" cy="9" r="2.4"/><circle class="d" cx="24" cy="28" r="11"/><circle class="k" cx="24" cy="28" r="8"/><g class="spin"><path class="ac" d="M24 22c2 2 2 4 0 6s-2 4 0 6c-4-1-5-4-3-6s2-4 3-6z"/></g>`,
  dishwasher: `<rect class="b" x="8" y="5" width="32" height="38" rx="5"/><rect class="d" x="8" y="5" width="32" height="7" rx="3.5"/><rect class="k" x="17" y="7.6" width="14" height="2" rx="1"/><rect class="d" x="12" y="16" width="24" height="22" rx="3"/><g class="rise"><circle class="fl" cx="18" cy="31" r="2"/><circle class="fl" cx="25" cy="27" r="2.6"/><circle class="fl" cx="31" cy="32" r="1.7"/></g><rect class="ac" x="12" y="39.5" width="24" height="1.8" rx=".9"/>`,
  heater: `<rect class="b" x="13" y="3" width="22" height="40" rx="11"/><rect class="d" x="13" y="28" width="22" height="15" rx="2"/><path class="k" d="M18 43h4v3h-4zM26 43h4v3h-4z"/><g class="wob"><path class="ac" d="M24 13c4 4 5 6 5 8a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-7z"/></g><circle class="k" cx="24" cy="35" r="2.6"/>`,
  vacuum: `<path class="d" d="M11 4h26a3 3 0 0 1 3 3v19H8V7a3 3 0 0 1 3-3z"/><rect class="k" x="19" y="8" width="10" height="2.4" rx="1.2"/><rect class="k" x="5" y="42" width="38" height="2.4" rx="1.2"/><g class="roam"><circle class="b" cx="24" cy="29" r="13"/><circle class="d" cx="24" cy="29" r="9"/><circle class="k" cx="24" cy="22.5" r="3.2"/><circle class="ac blink" cx="24" cy="22.5" r="1.3"/></g>`,
  printer: `<rect class="d" x="6" y="5" width="36" height="38" rx="4"/><rect class="b" x="10" y="9" width="28" height="30" rx="2"/><rect class="k" x="10" y="13" width="28" height="2.4"/><g class="slide"><rect class="k" x="19" y="11" width="10" height="7" rx="1.5"/><path class="k" d="M22 18h4l-2 3z"/></g><path class="ac" d="M17 35h14l-2-8h-10z"/><rect class="k" x="12" y="35" width="24" height="2"/>`,
  router: `<rect class="b" x="6" y="27" width="36" height="12" rx="4"/><circle class="ac blink" cx="13" cy="33" r="1.8"/><circle class="ac" cx="19" cy="33" r="1.8"/><circle class="ac blink" cx="25" cy="33" r="1.8" style="animation-delay:.5s"/><path class="d" d="M11 27l-2-14h3l2 14zM37 27l2-14h-3l-2 14z"/><path class="ln" d="M18 17a8 8 0 0 1 12 0M21 21a4 4 0 0 1 6 0"/>`,
  ac: `<rect class="b" x="4" y="10" width="40" height="17" rx="5"/><rect class="d" x="8" y="22" width="32" height="2.6" rx="1.3"/><circle class="ac" cx="37" cy="15" r="1.6"/><g class="rise"><path class="ln" d="M14 31q2 4 0 8M24 31q2 4 0 8M34 31q2 4 0 8"/></g>`,
  boiler: `<rect class="b" x="10" y="4" width="28" height="34" rx="4"/><rect class="k" x="15" y="9" width="18" height="7" rx="2"/><rect class="ac" x="18" y="11.2" width="7" height="2.6" rx="1"/><circle class="d" cx="24" cy="27" r="6"/><g class="wob"><path class="ac" d="M24 23c2 2 3 3 3 4.5a3 3 0 0 1-6 0c0-1 .6-1.8 1.2-2.4 0 1 .6 1.6 1.2 1.6 0-1.6 0-2.6.6-3.7z"/></g><path class="k" d="M15 38h3v6h-3zM22.5 38h3v6h-3zM30 38h3v6h-3z"/>`,
  dehumidifier: `<rect class="b" x="11" y="4" width="26" height="40" rx="6"/><rect class="d" x="15" y="8" width="18" height="10" rx="3"/><path class="ln" d="M16 24h16M16 28h16M16 32h16"/><rect class="fl" x="15" y="36" width="18" height="5" rx="1.5"/><g class="rise"><path class="ac" d="M24 9.5c2 2.3 3 3.8 3 5a3 3 0 0 1-6 0c0-1.2 1-2.7 3-5z"/></g>`,
  purifier: `<rect class="b" x="12" y="6" width="24" height="38" rx="9"/><circle class="d" cx="24" cy="17" r="7"/><g class="spin"><path class="ac" d="M24 17l0-5a3 3 0 0 1 0 5l5 0a3 3 0 0 1-5 0l0 5a3 3 0 0 1 0-5l-5 0a3 3 0 0 1 5 0z"/></g><path class="ln" d="M17 29h14M17 33h14M17 37h14"/>`,
};
const PIC_BY_ICON = { local_laundry_service: 'washer', cyclone: 'dryer', dishwasher: 'dishwasher', water_heater: 'heater', robot_2: 'vacuum', view_in_ar: 'printer',
  router: 'router', local_fire_department: 'boiler', heat: 'ac', ac_unit: 'ac', water_drop: 'dehumidifier', mode_fan: 'purifier', air_purifier: 'purifier' };
const PIC_DEFS = `<defs><linearGradient id="wpb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9d2d9"/></linearGradient>
<linearGradient id="wpd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa6b0"/><stop offset="1" stop-color="#5e6b76"/></linearGradient>
<linearGradient id="wpa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#3d8fe6"/></linearGradient></defs>`;
const PIC_CSS = `
.pic{width:clamp(34px,36cqmin,58px);height:clamp(34px,36cqmin,58px);margin:-2px 0 0 -3px;flex:none;align-self:flex-start;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3));overflow:visible}
.pic *{stroke:none}.pic .b{fill:url(#wpb)}.pic .d{fill:url(#wpd)}.pic .k{fill:#3d4851}.pic .fl{fill:url(#wpa)}
.pic .ac{fill:#7d8a95;transition:fill .4s}.pic .ln{fill:none;stroke:#3d4851;stroke-width:2;stroke-linecap:round}
.on .pic .ac,.att .pic .ac{fill:var(--a);filter:drop-shadow(0 0 2.5px var(--a))}
.card.v2:not(.on):not(.att) .pic{opacity:.62;filter:saturate(.3) drop-shadow(0 2px 2px rgba(0,0,0,.25))}
.pic g,.pic path,.pic circle{transform-box:fill-box;transform-origin:center}
.on .pic .spin{animation:pspin 2.4s linear infinite}.on .pic .wob{animation:pwob 1.4s ease-in-out infinite;transform-origin:50% 90%}
.on .pic .blink{animation:pblink 1.4s steps(2) infinite}.on .pic .rise{animation:prise 2s ease-in infinite}
.on .pic .roam{animation:proam 5s ease-in-out infinite}.on .pic .slide{animation:pslide 2.2s ease-in-out infinite}
@keyframes pspin{to{transform:rotate(360deg)}}@keyframes pwob{25%{transform:scale(1.08,.94)}60%{transform:scale(.95,1.06)}}
@keyframes pblink{50%{opacity:.2}}@keyframes prise{from{transform:translateY(3px);opacity:0}50%{opacity:1}to{transform:translateY(-5px);opacity:0}}
@keyframes proam{0%,100%{transform:translate(0,0)}30%{transform:translate(-5px,3px) rotate(-12deg)}65%{transform:translate(5px,2px) rotate(10deg)}}
@keyframes pslide{50%{transform:translateX(7px)}}
.haspic .nm{visibility:hidden;height:0;line-height:0}.haspic.shownm .nm{display:block}
`;
/* ── Συσκευή (template 1×1): εικονίδιο, ⏻, όνομα, τιμή, γραμμή, −/+ ή πρόοδος ── */
const TILE_KINDS = {
  climate: { icon: 'heat', color: '#e0702a', anim: 'wave' },
  humidifier: { icon: 'water_drop', color: '#3d7fe0', anim: 'drop' },
  fan: { icon: 'mode_fan', color: '#2f86d9', anim: 'spin' },
  vacuum: { icon: 'robot_2', color: '#7a5fd0', anim: 'roam' },
  light: { icon: 'lightbulb', color: '#e0a020', anim: 'glow' },
  switch: { icon: 'power', color: '#2f9a76', anim: 'pulse' },
  input_boolean: { icon: 'toggle_on', color: '#2f9a76', anim: 'pulse' },
  sensor: { icon: 'sensors', color: '#2f9a76', anim: 'pulse' },
  binary_sensor: { icon: 'sensors', color: '#2f9a76', anim: 'pulse' },
  input_select: { icon: 'local_laundry_service', color: '#2f9a76', anim: 'wob' },
};
const ANIMS = ['wave', 'drop', 'spin', 'roam', 'glow', 'pulse', 'wob', 'flame'];
const VAC = { cleaning: 'Καθαρίζει', docked: 'Στη βάση', returning: 'Επιστρέφει', paused: 'Σε παύση', idle: 'Σε αναμονή', error: 'Σφάλμα' };
const STATE_GR = { on: 'Λειτουργεί', off: '', running: 'Λειτουργεί', idle: 'σε αναμονή', paused: 'σε παύση', standby: 'αναμονή',
  done: 'Τελείωσε', finished: 'Τελείωσε', finish: 'Τελείωσε', connected: 'Online', disconnected: 'Offline', printing: 'Τυπώνει', prepare: 'Προετοιμασία',
  failed: 'Απέτυχε', unknown: 'άγνωστο', home: 'Σπίτι', not_home: 'Εκτός' };
const grState = (s) => STATE_GR[String(s).toLowerCase()] ?? s;
const DONE = ['done', 'finished', 'complete', 'completed', 'end', 'τέλος'];
const OFFS = ['off', 'idle', 'docked', 'standby', 'paused', 'none', 'closed', 'locked'];

/* ── Συσκευές με κύκλο (πλυντήρια, στεγνωτήριο, πιάτα): κοινή ανάγνωση και popup με καρτέλες ── */
/* «1h 31m», «51m», «0:42», «2:32:10» → λεπτά */
function parseDur(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s || s === '-' || s === '--') return null;
  let m = s.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i);
  if (m && (m[1] || m[2])) return (+m[1] || 0) * 60 + (+m[2] || 0);
  m = s.match(/^(\d+):(\d\d)(?::(\d\d))?$/);
  if (m) return m[3] != null ? +m[1] * 60 + +m[2] + +m[3] / 60 : +m[1] * 60 + +m[2];
  return null;
}
const durText = (min) => (min == null ? '' : min >= 60 ? `${Math.floor(min / 60)}ω ${pad2(Math.round(min % 60))}′` : `${Math.round(min)}′`);
const validTime = (s) => { if (!s) return null; const d = new Date(String(s).replace(' ', 'T')); return isNaN(d) || d.getFullYear() < 2000 ? null : d; };
/* WashData: entities με κοινό πρόθεμα (π.χ. sensor.dryer_state, sensor.dryer_time_remaining…) */
function washdata(card) {
  const pre = card._config.washdata; if (!pre) return null;
  const S = (k) => card.st(`sensor.${pre}_${k}`), N = (k) => card.num(`sensor.${pre}_${k}`), V = (k) => card.val(`sensor.${pre}_${k}`);
  const last = (k) => Object.keys(card._hass.states).find((id) => id.startsWith('sensor.') && id.endsWith(`${pre}_last_cycle_${k}`));
  const ids = { state: `sensor.${pre}_state`, power: `sensor.${pre}_current_power`, lastDur: last('duration'), lastEnergy: last('energy'), lastCost: last('cost') };
  const btn = (k) => { const id = `button.${pre}_${k}`; return card.st(id) ? id : null; };
  const profiles = Object.keys(card._hass.states).filter((id) => id.startsWith('sensor.') && id.includes(`${pre}_profile_`) && id.endsWith('_count'))
    .map((id) => [card.friendly(id).replace(/^.*Profile\s*/i, '').replace(/\s*Count$/i, ''), card.num(id)]).filter(([, n]) => !isNaN(n)).sort((a, b) => b[1] - a[1]);
  return { S, N, V, ids, profiles, buttons: { pause: btn('pause_cycle'), resume: btn('resume_cycle'), end: btn('force_end_cycle'), unload: btn('mark_unloaded') } };
}
function applianceInfo(card) {
  const wd = washdata(card);
  if (wd) {
    const st = wd.V('state').toLowerCase(), run = ['running', 'on', 'paused', 'starting', 'ending'].includes(st);
    const done = ['finished', 'done', 'complete', 'completed', 'clean', 'unload'].includes(st);
    const el2 = wd.N('elapsed_time'), rem = wd.N('time_remaining'), tot = wd.N('total_duration'), prg = wd.N('progress');
    const prog = wd.V('program');
    const s = card.st(wd.ids.state);
    return { st, run, done, paused: st === 'paused', elapsed: !isNaN(el2) ? el2 / 60 : null, remaining: run && !isNaN(rem) ? rem : null, total: !isNaN(tot) ? tot : null,
      progress: run && !isNaN(prg) && prg > 0 ? prg : null, energy: card.num(card._config.cycle_energy_entity) || null, program: prog && !/detect/i.test(prog) ? prog : null, temp: null,
      started: card._config.start_entity ? validTime(card.val(card._config.start_entity)) : null,
      finished: !run && s?.last_changed ? new Date(s.last_changed) : null, cycles: wd.N('cycle_count'), wd };
  }
  const c = card._config, s = card.st(c.entity), a = s?.attributes || {};
  const st = String(s?.state || '').toLowerCase();
  const run = ['on', 'running', 'run', 'wash', 'rinse', 'spin', 'drying', 'λειτουργεί'].includes(st);
  const done = DONE.includes(st);
  const elapsed = parseDur(a.time_elapsed);
  let remaining = a.time_remaining_sec != null ? a.time_remaining_sec / 60 : parseDur(a.time_remaining);
  if (remaining === 0 && !run) remaining = null;
  const total = parseDur(a.program_duration) ?? (elapsed != null && remaining != null ? elapsed + remaining : null);
  const progress = a.progress != null && +a.progress > 0 ? +a.progress : total && elapsed != null ? clamp((elapsed / total) * 100, 0, 100) : null;
  const energy = a.energy_used != null ? parseFloat(a.energy_used) : null;
  const finished = validTime(a.time_finished) || (c.finish_entity ? validTime(card.val(c.finish_entity)) : null) || (done || !run ? (s?.last_changed ? new Date(s.last_changed) : null) : null);
  return { st, run, done, elapsed, remaining, total, progress, energy, program: a.program && a.program !== '-' ? a.program : null, temp: a.temp && a.temp !== '-' ? String(a.temp).replace('℃', '°') : null,
    started: validTime(a.time_started), finished, cycles: a.counter_full_cycles };
}
const agoText = (d) => { if (!d) return ''; const m = Math.floor((Date.now() - d) / 60000); return m < 1 ? 'μόλις τώρα' : m < 60 ? `πριν ${m}′` : m < 1440 ? `πριν ${Math.floor(m / 60)}ω` : `πριν ${Math.floor(m / 1440)} ημ.`; };

/* Ιστορικό καταστάσεων (κείμενο), για τους κύκλους */
async function fetchStates(hass, id, days = 30) {
  if (!hass.callWS || !id) return [];
  const key = `states:${id}:${days}`, hit = historyCache.get(key);
  if (hit && Date.now() - hit.at < HISTORY_TTL) return hit.data;
  const res = await hass.callWS({ type: 'history/history_during_period', start_time: new Date(Date.now() - days * 864e5).toISOString(), entity_ids: [id], minimal_response: true, no_attributes: true, significant_changes_only: false });
  const data = (res?.[id] || []).map((p) => [p.lu != null ? p.lu * 1000 : new Date(p.last_updated || p.last_changed).getTime(), String(p.s ?? p.state).toLowerCase()]);
  historyCache.set(key, { at: Date.now(), data });
  return data;
}
function cyclesFrom(points) {
  const out = []; let start = null;
  const isRun = (s) => ['on', 'running', 'run', 'wash', 'rinse', 'spin', 'drying', 'paused'].includes(s);
  points.forEach(([t, s]) => { if (isRun(s) && start == null) start = t; else if (!isRun(s) && start != null) { if (t - start > 5 * 60000) out.push([start, t]); start = null; } });
  return out.reverse();
}
/* Μικρό γράφημα μέσα στο popup */
function popGraph(parent, points, { hours = 24, color = '#2f86d9', unit = '', h = 90 } = {}) {
  const box = el('div'); box.style.cssText = 'position:relative;background:#fff;border-radius:16px;padding:10px 12px 6px;box-shadow:0 1px 3px rgba(0,0,0,.06)';
  if (points.length < 2) { box.append(el('p', 'grp', 'Δεν υπάρχουν δεδομένα')); parent.append(box); return; }
  const vals = points.map((x) => x[1]), lo = Math.min(0, ...vals), hi = Math.max(...vals) || 1;
  const pth = smoothPath(points, 300, h, lo, hi, hours);
  box.innerHTML = `<svg viewBox="0 0 300 ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px;display:block"><path d="${pth.area}" fill="${color}" opacity=".15"/><path d="${pth.line}" fill="none" stroke="${color}" stroke-width="2.2"/></svg>
  <div style="display:flex;justify-content:space-between;font:600 12px var(--w-font);color:var(--w-muted)"><span>${hours >= 24 ? `${Math.round(hours / 24) > 1 ? Math.round(hours / 24) + ' ημέρες' : '24 ώρες'}` : `${hours} ώρες`}</span><span>μέγιστο ${fmt(hi, hi < 10 ? 1 : 0)} ${unit}</span></div>`;
  parent.append(box);
}
/* Γραμμές «ετικέτα — τιμή» */
function popFacts(parent, rows) {
  const g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';
  rows.filter((r) => r && r[1] != null && r[1] !== '').forEach(([k, v, icon]) => {
    const b = el('div'); b.style.cssText = 'background:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 1px 3px rgba(0,0,0,.06)';
    b.innerHTML = `<div style="font:600 12px var(--w-font);color:var(--w-muted);display:flex;gap:5px;align-items:center">${icon ? `<span class="ms" style="font-size:16px">${icon}</span>` : ''}${k}</div><div style="font:800 19px var(--w-font);letter-spacing:-.4px">${v}</div>`;
    g.append(b);
  });
  parent.append(g);
}
function appliancePopup(card) {
  const c = card._config;
  const p = openPopup(card, {
    icon: c.icon || 'local_laundry_service', size: 'md', accent: () => c.color || '#2f9a76', title: c.name,
    tabs: [{ id: 'now', label: 'Τώρα', icon: 'play_circle' }, { id: 'hist', label: 'Ιστορικό', icon: 'history' }, { id: 'energy', label: 'Κατανάλωση', icon: 'bolt' }],
    status: () => { const i = applianceInfo(card); return i.run ? `Σε λειτουργία${i.program ? ' · ' + i.program : ''}` : i.done ? `Τελείωσε ${agoText(i.finished)}` : i.finished ? `Τελευταία φορά ${agoText(i.finished)}` : 'Σβηστό'; },
    render: (pp, tab) => {
      const i = applianceInfo(card), w = card.num(c.power_entity || i.wd?.ids.power);
      if (tab === 'now') {
        if (i.run && i.progress != null) {
          const bar = el('div'); bar.style.cssText = `height:12px;border-radius:6px;background:var(--w-track);overflow:hidden`;
          bar.innerHTML = `<i style="display:block;height:100%;width:${i.progress}%;background:var(--acc);border-radius:6px"></i>`;
          popSection(pp, `Πρόοδος ${Math.round(i.progress)}%`).append(bar);
        }
        popFacts(popSection(pp), [
          i.run ? ['Απομένει', durText(i.remaining), 'hourglass_bottom'] : null,
          ['Διάρκεια', durText(i.elapsed), 'timer'],
          ['Πρόγραμμα', i.program, 'tune'], ['Θερμοκρασία', i.temp, 'thermostat'],
          ['Ξεκίνησε', i.started ? hhmm(i.started) : null, 'schedule'],
          i.run && i.remaining != null ? ['Τελειώνει', hhmm(new Date(Date.now() + i.remaining * 60000)), 'flag'] : ['Τελείωσε', i.finished && !i.run ? `${hhmm(i.finished)} · ${agoText(i.finished)}` : null, 'flag'],
          ['Τώρα', !isNaN(w) ? `${fmt(w, 0)} W` : null, 'bolt'], ['Ενέργεια κύκλου', i.energy != null ? `${fmt(i.energy, 2)} kWh` : null, 'electric_meter'],
        ]);
        const b = i.wd?.buttons;
        if (b) {
          const chips = [];
          if (i.run && !i.paused && b.pause) chips.push({ label: 'Παύση', icon: 'pause', tap: () => card.call('button', 'press', { entity_id: b.pause }) });
          if (i.paused && b.resume) chips.push({ label: 'Συνέχεια', icon: 'play_arrow', tap: () => card.call('button', 'press', { entity_id: b.resume }) });
          if (i.run && b.end) chips.push({ label: 'Τέλος κύκλου', icon: 'stop', tap: () => card.call('button', 'press', { entity_id: b.end }) });
          if (i.done && b.unload) chips.push({ label: 'Άδειασε', icon: 'check', tap: () => card.call('button', 'press', { entity_id: b.unload }) });
          if (chips.length) popChips(popSection(pp), chips);
        }
        const pw = c.power_entity || i.wd?.ids.power;
        if (pw) fetchHistory(card._hass, [pw], 3).then((d) => { if (pp.body.isConnected && !pp.busy) popGraph(popSection(pp, 'Κατανάλωση, τελευταίες 3 ώρες'), d[pw] || [], { hours: 3, color: c.color || '#2f9a76', unit: 'W' }); });
        if (false) fetchHistory(card._hass, [c.power_entity], 3).then((d) => { if (pp.body.isConnected && !pp.busy) popGraph(popSection(pp, 'Κατανάλωση, τελευταίες 3 ώρες'), d[c.power_entity] || [], { hours: 3, color: c.color || '#2f9a76', unit: 'W' }); });
      } else if (tab === 'hist') {
        const sec = popSection(pp, 'Κύκλοι, τελευταίες 30 ημέρες');
        sec.append(el('p', 'grp', 'Φόρτωση…'));
        fetchStates(card._hass, i.wd?.ids.state || c.entity, 30).then((pts) => {
          const cyc = cyclesFrom(pts); sec.replaceChildren();
          const mins = cyc.map(([a, b]) => (b - a) / 60000);
          const wd = i.wd;
          if (wd) {
            const L = (id, u, d = 0) => { const v = card.num(id); return isNaN(v) ? null : `${fmt(v, d)}${u}`; };
            popFacts(popSection(pp, 'Τελευταίος κύκλος'), [['Διάρκεια', wd.ids.lastDur ? durText(card.num(wd.ids.lastDur)) : null, 'timer'], ['Ενέργεια', L(wd.ids.lastEnergy, ' kWh', 2), 'electric_meter'],
              ['Κόστος', L(wd.ids.lastCost, ' €', 2), 'euro'], ['Σύνολο κύκλων', i.cycles != null && !isNaN(i.cycles) ? String(i.cycles) : null, 'functions']]);
            if (wd.profiles.length) popChips(popSection(pp, 'Προγράμματα'), wd.profiles.slice(0, 8).map(([n, k]) => ({ label: `${n} · ${k}`, icon: 'tune' })));
          }
          popFacts(sec, [['Κύκλοι', String(cyc.length), 'repeat'], ['Μέση διάρκεια', mins.length ? durText(mins.reduce((x, y) => x + y, 0) / mins.length) : '—', 'timer'],
            ['Αυτή την εβδομάδα', String(cyc.filter(([a]) => a > Date.now() - 7 * 864e5).length), 'date_range'], ['Σύνολο κύκλων', i.cycles != null ? String(i.cycles) : null, 'functions']]);
          const list = el('div'); list.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:10px';
          cyc.slice(0, 8).forEach(([a, b]) => {
            const r = el('div'); r.style.cssText = 'display:flex;justify-content:space-between;background:#fff;border-radius:12px;padding:9px 12px;font:600 14px var(--w-font);box-shadow:0 1px 2px rgba(0,0,0,.05)';
            const d = new Date(a);
            r.innerHTML = `<span>${WX_DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} · ${hhmm(d)}</span><b>${durText((b - a) / 60000)}</b>`;
            list.append(r);
          });
          if (!cyc.length) list.append(el('p', 'grp', 'Δεν βρέθηκαν κύκλοι'));
          sec.append(list);
        });
      } else {
        popFacts(popSection(pp), [['Τώρα', !isNaN(w) ? `${fmt(w, 0)} W` : null, 'bolt'], ['Αυτός ο κύκλος', i.energy != null ? `${fmt(i.energy, 2)} kWh` : null, 'electric_meter'],
          ...(c.energy_entities || []).map((e) => { const s = card.st(e.entity || e); return s ? [e.name || card.friendly(e.entity || e), `${fmt(+s.state, +s.state < 10 ? 2 : 0)} ${s.attributes.unit_of_measurement || ''}`, 'calendar_today'] : null; })]);
        const pw = c.power_entity || i.wd?.ids.power;
        if (pw) {
          const s1 = popSection(pp, 'Ισχύς, 24 ώρες');
          fetchHistory(card._hass, [pw], 24).then((d) => popGraph(s1, d[pw] || [], { hours: 24, color: c.color || '#2f9a76', unit: 'W' }));
          const s2 = popSection(pp, 'Ισχύς, 7 ημέρες');
          fetchHistory(card._hass, [pw], 168).then((d) => popGraph(s2, d[pw] || [], { hours: 168, color: c.color || '#2f9a76', unit: 'W', h: 70 }));
        } else popSection(pp).append(el('p', 'grp', 'Πρόσθεσε αισθητήρα ισχύος (W) στη ρύθμιση της κάρτας για γραφήματα.'));
      }
    },
  });
  return p;
}

class WallTileCard extends Wall2Card {
  static css2 = PIC_CSS + `
:host{container-type:size}
.card.v2{padding:7cqmin 7cqmin 6cqmin;cursor:pointer;--a:#7a858f}
.ico{font-size:clamp(22px,19cqmin,30px)!important}
.nm{font-size:clamp(11px,8.6cqmin,13px)!important}
.v{font-size:clamp(17px,16cqmin,25px)!important}
.v small,.s{font-size:clamp(10px,7.8cqmin,12px)!important}
.pw{width:clamp(32px,27cqmin,42px)!important;height:clamp(32px,27cqmin,42px)!important;font-size:clamp(18px,15cqmin,23px)!important}
.ft .btn{height:clamp(24px,21cqmin,32px)!important;font-size:clamp(16px,13cqmin,20px)!important}
.ft:not([hidden])~.s,.ft:not([hidden])+.s{display:none}
.vac{position:absolute;right:7cqh;bottom:7cqh;display:flex;gap:6px}.vac .btn{width:clamp(30px,26cqh,40px);height:clamp(30px,26cqh,40px);font-size:clamp(17px,15cqh,21px)}
@container (max-aspect-ratio:3/2){.vac{display:none!important}}
.ico{font-size:30px!important;color:var(--faint);transition:color .4s;align-self:flex-start}
.pw{position:absolute;right:5px;top:5px;width:42px;height:42px;display:grid;place-items:center;font-size:23px!important;color:var(--faint);border-radius:12px}
.nm{margin-top:auto;font:700 13px var(--w-font);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v{font:800 25px var(--w-font);letter-spacing:-.8px;line-height:1.08;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v small{font:700 12px var(--w-font);color:var(--mut);letter-spacing:0}
.s{font:600 12px var(--w-font);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft{display:flex;gap:6px;margin-top:6px}.ft .btn{flex:1;font:500 20px var(--w-font);height:32px}
.pg{height:4px;border-radius:2px;background:var(--line);margin-top:5px;overflow:hidden}.pg i{display:block;height:100%;width:0;background:var(--a);border-radius:3px;transition:width 1s}
.card.v2:not(.on):not(.att){background:color-mix(in srgb,var(--box) 55%,var(--bg));box-shadow:inset 0 0 0 1px var(--line)}
.card.v2:not(.on):not(.att) :is(.v,.nm){color:var(--mut)}
.card.v2:not(.on):not(.att) .ico{color:var(--faint);opacity:.7}
.on .ico,.on .pw{color:var(--a)}
.card.v2.on{background:linear-gradient(160deg,color-mix(in srgb,var(--a) 10%,var(--box)) 20%,color-mix(in srgb,var(--a) 30%,var(--box)));box-shadow:inset 0 0 0 2px var(--a),var(--sh)}
.dark .card.v2.on,.card.v2.dark.on{background:linear-gradient(160deg,color-mix(in srgb,var(--a) 22%,var(--box)) 20%,color-mix(in srgb,var(--a) 42%,var(--box)))}

.on .ft .btn{border-color:color-mix(in srgb,var(--a) 55%,transparent)}
.styleB.on{background:var(--a)!important;color:#fff}
.styleB.on :is(.ico,.pw,.nm,.s,.v small){color:rgba(255,255,255,.92)}
.styleB.on .ft .btn{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.55);color:#fff}
.styleB.on .pg{background:rgba(255,255,255,.3)}.styleB.on .pg i{background:#fff}
.card.v2.att{background:var(--a);color:#fff;animation:attn 1.2s ease-out 1}
.att :is(.ico,.pw,.nm,.s,.v small){color:rgba(255,255,255,.92)!important}
.styleB.att{box-shadow:0 0 0 3px var(--box),0 0 0 6px var(--a)}
@keyframes attn{30%{transform:scale(1.04)}}
.card.v2.unavail{opacity:.5}
.on.a-flame .ico{animation:flick 1.6s ease-in-out infinite;transform-origin:50% 90%}
@keyframes flick{25%{transform:scale(1.06,.95)}50%{transform:scale(.96,1.05)}}
.on.a-spin .ico{animation:spin 2.6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.on.a-wob .ico{animation:wob .5s ease-in-out infinite}@keyframes wob{25%{transform:translate(-1px,1px)}75%{transform:translate(1px,-1px)}}
.on.a-drop .ico{animation:drop 1.8s ease-in infinite}@keyframes drop{0%{transform:translateY(-4px);opacity:.3}40%{opacity:1}100%{transform:translateY(4px);opacity:.3}}
.on.a-wave .ico{animation:wave 2.2s ease-in-out infinite}@keyframes wave{50%{transform:translateY(-3px)}}
.on.a-roam .ico{animation:roam 4s ease-in-out infinite}@keyframes roam{25%{transform:translateX(-3px) rotate(-8deg)}75%{transform:translateX(3px) rotate(8deg)}}
.on.a-pulse .ico{animation:pulse 2s ease-in-out infinite}@keyframes pulse{50%{opacity:.5}}
.on.a-glow .ico{animation:glw 2.4s ease-in-out infinite}@keyframes glw{50%{filter:drop-shadow(0 0 6px var(--a))}}
`;
  static getConfigForm() {
    return form([
      ['entity', 'Συσκευή', ANY, true],
      ['pic', 'Εικόνα συσκευής', { select: { mode: 'dropdown', options: ['auto', 'washer', 'dryer', 'dishwasher', 'heater', 'vacuum', 'printer', 'router', 'ac', 'boiler', 'dehumidifier', 'purifier', 'none'].map((v) => ({ value: v, label: v })) } }],
      ['show_name', 'Δείξε και το όνομα', { boolean: {} }],
      ['appliance', 'Συσκευή με κύκλο (πλυντήριο, στεγνωτήριο, πιάτα)', { boolean: {} }],
      ['washdata', 'WashData: πρόθεμα entities (π.χ. dryer)', TEXT],
      ['cycle_energy_entity', 'Ενέργεια τρέχοντος κύκλου (kWh)', ent('sensor')],
      ['name', 'Όνομα', TEXT], ['icon', 'Εικονίδιο (Material Symbols, π.χ. heat)', TEXT],
      ['color', 'Χρώμα όταν λειτουργεί (π.χ. #e0702a)', TEXT],
      ['animation', 'Κίνηση εικονιδίου', { select: { mode: 'dropdown', options: ['', ...ANIMS].map((v) => ({ value: v, label: v || 'αυτόματα' })) } }],
      ['value_entity', 'Τιμή από άλλο entity (προαιρετικό)', ANY],
      ['secondary_entity', 'Δεύτερη γραμμή από entity (προαιρετικό)', ANY],
      ['power_entity', 'Κατανάλωση W: «λειτουργεί» πάνω από 5 W (προαιρετικό)', ent('sensor')],
      ['energy_entities', 'Ενέργεια (kWh) για το popup: σήμερα, μήνας…', { entity: { multiple: true, filter: { domain: 'sensor' } } }],
      ['remaining_entity', 'Χρόνος που απομένει (λεπτά ή timestamp)', ANY],
      ['total_entity', 'Συνολική διάρκεια σε λεπτά, για την πρόοδο', ANY],
      ['progress_entity', 'Πρόοδος 0–100 (προαιρετικό)', ANY],
      ['finish_entity', 'Ώρα τέλους (input_datetime) για χρονοδιακόπτη', ent('input_datetime')],
      ['duration_entity', 'Διάρκεια (input_number) για χρονοδιακόπτη', ent('input_number')],
      ['humidity_entity', 'Υγρασία χώρου (για αφυγραντήρα)', ent('sensor')],
      ['attention_entity', 'Θέλει προσοχή: entity (προαιρετικό)', ANY],
      ['attention_state', 'Θέλει προσοχή: κατάσταση (π.χ. done)', TEXT],
      ['attention_text', 'Θέλει προσοχή: κείμενο (π.χ. Τελείωσε)', TEXT],
      ['power_button', 'Κουμπί ⏻', { select: { mode: 'dropdown', options: [{ value: '', label: 'αυτόματα' }, { value: 'show', label: 'ναι' }, { value: 'hide', label: 'όχι' }] } }],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'climate') || firstEntity(hass, 'switch') }; }
  getGridOptions() { return { columns: 3, rows: 2, min_columns: 3, min_rows: 2 }; }
  watched() {
    const c = this._config;
    const wd = c.washdata ? ['state', 'program', 'progress', 'time_remaining', 'elapsed_time', 'total_duration', 'current_power'].map((k) => `sensor.${c.washdata}_${k}`) : [];
    return [...wd, c.cycle_energy_entity, c.entity, c.value_entity, c.secondary_entity, c.power_entity, c.remaining_entity, c.total_entity, c.progress_entity,
      c.finish_entity, c.duration_entity, c.humidity_entity, c.attention_entity];
  }
  template() {
    return `<div class="card"><span class="ms fill ico"></span><button class="ms pw" aria-label="On/Off">power_settings_new</button>
  <div class="nm"></div><div class="v"></div><div class="s" hidden></div>
  <div class="ft" hidden><button class="btn dn">−</button><button class="btn up">+</button></div><div class="pg" hidden><i></i></div>
  <div class="vac" hidden><button class="btn ms" data-v="start">play_arrow</button><button class="btn ms" data-v="pause">pause</button><button class="btn ms" data-v="return_to_base">home</button></div></div>`;
  }
  domain() { return (this._config.entity || '').split('.')[0]; }
  kind() { return TILE_KINDS[this.domain()] || TILE_KINDS.sensor; }
  bind() {
    this.tapMore(() => this.open());
    this.$('.pw').addEventListener('click', () => this.power());
    this.$('.dn').addEventListener('click', () => this.step(-1));
    this.$('.up').addEventListener('click', () => this.step(1));
    this.$('.vac').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) this.call('vacuum', b.dataset.v, { entity_id: this._config.entity }); });
  }
  open() {
    const c = this._config, d = this.domain();
    if (this.$('.card').classList.contains('att') && (c.attention_entity || c.appliance)) { this._ack = this.st(c.attention_entity || c.entity)?.last_changed; if (c.ack_entity) this.call('input_select', 'select_option', { entity_id: c.ack_entity, option: 'off' }); this.update(); return; }
    if (this._config.appliance) return appliancePopup(this);
    if (this.timer()) return this.timerPopup();
    if (d === 'climate') return climatePopup(this);
    if (d === 'light') return lightPopup(this);
    this.moreInfo(c.entity);
  }
  power() {
    const c = this._config, d = this.domain(), id = c.entity;
    if (!this.available(id)) return;
    if (d === 'climate') return this.call('climate', this.val(id) === 'off' ? 'turn_on' : 'turn_off', { entity_id: id });
    if (d === 'vacuum') return this.call('vacuum', this.val(id) === 'cleaning' ? 'return_to_base' : 'start', { entity_id: id });
    if (d === 'humidifier') return this.call('humidifier', 'toggle', { entity_id: id });
    this.call('homeassistant', 'toggle', { entity_id: id });
  }
  timer() { return !!(this._config.finish_entity && this._config.duration_entity); }
  maxMin() { return this._config.max_minutes || this.st(this._config.duration_entity)?.attributes?.max || 30; }
  setMinutes(m, running) {
    const c = this._config;
    m = clamp(Math.round(m), 1, this.maxMin());
    this._hold = { v: m, until: Date.now() + 3000 }; this.update();
    if (running) return this.call('input_datetime', 'set_datetime', { entity_id: c.finish_entity, timestamp: Math.round(Date.now() / 1000 + m * 60) });
    return this.call('input_number', 'set_value', { entity_id: c.duration_entity, value: m });
  }
  timerPopup() {
    const c = this._config;
    openPopup(this, {
      icon: c.icon || 'water_heater', size: 'sm', accent: () => c.color || '#d9573b',
      status: () => { const l = this.minutesLeft(); return this.val(c.entity) === 'on' && l != null ? `Λειτουργεί · ${Math.ceil(l)}′ απομένουν` : 'Σβηστός'; },
      render: (pp) => {
        const on = this.val(c.entity) === 'on', left = this.minutesLeft();
        const cur = on && left != null ? Math.ceil(left) : Math.round(this.num(c.duration_entity)) || 15;
        popStepper(popSection(pp, on ? 'Υπόλοιπο' : 'Διάρκεια'), { text: `${cur}′`, dec: () => this.setMinutes(cur - 1, on), inc: () => this.setMinutes(cur + 1, on) });
        const max = this.maxMin();
        popChips(popSection(pp, `Γρήγορα (ως ${max}′)`), [5, 10, 15, 20, 30].filter((m) => m <= max).map((m) => ({ label: `${m}′`, sel: m === cur, tap: () => this.setMinutes(m, on) })));
        popChips(popSection(pp), [{ label: on ? 'Σβήσιμο' : 'Έναρξη', icon: 'power_settings_new', sel: on, tap: () => this.call('homeassistant', on ? 'turn_off' : 'turn_on', { entity_id: c.entity }) }]);
      },
    });
  }
  step(dir) {
    const c = this._config, d = this.domain(), id = c.entity, a = this.st(id)?.attributes || {};
    if (!this.available(id)) return;
    if (this.timer()) {
      const on = this.val(id) === 'on', left = this.minutesLeft();
      const cur = this._hold && Date.now() < this._hold.until ? this._hold.v : on && left != null ? Math.ceil(left) : this.num(c.duration_entity);
      return this.setMinutes(cur + dir, on);
    }
    if (d === 'climate') {
      const by = a.target_temp_step || 0.5;
      const cur = this._hold && Date.now() < this._hold.until ? this._hold.v : a.temperature;
      if (cur == null) return;
      const v = clamp(Math.round((cur + dir * by) / by) * by, a.min_temp ?? 7, a.max_temp ?? 35);
      this._hold = { v, until: Date.now() + 3000 }; this.update();
      return this.call('climate', 'set_temperature', { entity_id: id, temperature: v });
    }
    if (d === 'humidifier') {
      const cur = this._hold && Date.now() < this._hold.until ? this._hold.v : a.humidity;
      if (cur == null) return;
      const v = clamp(Math.round((cur + dir * 5) / 5) * 5, a.min_humidity ?? 30, a.max_humidity ?? 80);
      this._hold = { v, until: Date.now() + 3000 }; this.update();
      return this.call('humidifier', 'set_humidity', { entity_id: id, humidity: v });
    }
    if (d === 'input_number' || d === 'number') {
      const v = clamp(+this.val(id) + dir * (a.step || 1), a.min ?? -1e9, a.max ?? 1e9);
      return this.call(d, 'set_value', { entity_id: id, value: v });
    }
  }
  /* Λεπτά που απομένουν: από ώρα τέλους ή από entity λεπτών/timestamp */
  minutesLeft() {
    const c = this._config;
    if (c.finish_entity && this.val(c.entity) === 'on') {
      const ts = this.st(c.finish_entity)?.attributes?.timestamp;
      if (ts != null) return Math.max(0, (ts * 1000 - Date.now()) / 60000);
    }
    if (c.remaining_entity && this.available(c.remaining_entity)) {
      const s = this.st(c.remaining_entity);
      if (s.attributes.device_class === 'timestamp' || /T\d\d:/.test(s.state)) return Math.max(0, (new Date(s.state) - Date.now()) / 60000);
      const m = toMinutes(s);
      if (m != null) return m;
    }
    return null;
  }
  update() {
    const c = this._config, d = this.domain(), k = this.kind(), id = c.entity;
    const s = this.st(id), a = s?.attributes || {}, ok = this.available(id), st = this.val(id);
    const card = this.$('.card');
    card.style.setProperty('--a', c.color || (d === 'climate' && ['cool', 'dry'].includes(st) ? '#2f86d9' : k.color));
    ANIMS.forEach((n) => card.classList.toggle('a-' + n, (c.animation || k.anim) === n));
    const w = this.num(c.power_entity);
    let on = ok && !OFFS.includes(st);
    if (d === 'climate') on = ok && st !== 'off';
    if (!isNaN(w)) on = on && w > 5;
    if (d === 'input_select' || d === 'sensor') on = ok && !OFFS.includes(st.toLowerCase()) && !DONE.includes(st.toLowerCase()) && st !== '0';
    const ap = c.appliance ? applianceInfo(this) : null;
    if (ap) on = ok && ap.run;
    const attState = c.attention_entity ? this.val(c.attention_entity) : '';
    let att = !!c.attention_entity && (c.attention_state ? attState === c.attention_state : DONE.includes(attState.toLowerCase()));
    if (ap && !c.attention_entity) att = ap.done;
    if (att && ap && !c.attention_entity && this._ack && this._ack === s?.last_changed) att = false;
    if (att && this._ack && this._ack === this.st(c.attention_entity)?.last_changed) att = false;
    card.classList.toggle('on', on && !att);
    card.classList.toggle('att', att);
    card.classList.toggle('unavail', !ok);
    const icon = c.icon || (d === 'climate' && ['cool', 'dry'].includes(st) ? 'ac_unit' : k.icon);
    const pic = c.pic === false || c.pic === 'none' ? null : PICS[c.pic] ? c.pic : PIC_BY_ICON[icon] || (d === 'vacuum' ? 'vacuum' : null);
    if (pic !== this._pic) {
      this._pic = pic; this.$('.pic')?.remove();
      if (pic) this.$('.ico').insertAdjacentHTML('afterend', `<svg class="pic" viewBox="0 0 48 48">${PIC_DEFS}${PICS[pic]}</svg>`);
      this.$('.ico').style.display = pic ? 'none' : '';
    }
    card.classList.toggle('haspic', !!pic); card.classList.toggle('shownm', !!c.show_name);
    this.$('.ico').textContent = icon;
    this.$('.nm').textContent = c.name || a.friendly_name || id;
    const pwMode = c.power_button || (['climate', 'humidifier', 'fan', 'vacuum', 'switch', 'light', 'input_boolean'].includes(d) ? 'show' : 'hide');
    this.$('.pw').hidden = pwMode === 'hide';

    const held = this._hold && Date.now() < this._hold.until;
    if (!held) this._hold = null;
    let v = '', sub = '', steps = false, prog = null;
    const left = this.minutesLeft();
    if (!ok) v = '<small>μη διαθέσιμο</small>';
    else if (ap) {
      if (ap.run) {
        v = ap.paused ? 'Σε παύση' : ap.remaining != null ? `${durText(ap.remaining)}<small> απομένουν</small>` : `${durText(ap.elapsed) || 'Λειτουργεί'}`;
        sub = [ap.program, ap.elapsed != null && ap.remaining != null ? `σε λειτουργία ${durText(ap.elapsed)}` : ''].filter(Boolean).join(' · ');
        prog = ap.progress;
      } else if (ap.done) { v = 'Τελείωσε'; sub = [durText(ap.elapsed), agoText(ap.finished)].filter(Boolean).join(' · '); }
      else { v = ''; sub = ap.finished ? `τελευταία ${agoText(ap.finished)}` : ''; }
    }
    else if (d === 'climate') {
      const t = held ? this._hold.v : a.temperature;
      v = t != null ? `${fmt(t, t % 1 ? 1 : 0)}°` : '—';
      sub = a.current_temperature != null && on ? `χώρος ${fmt(a.current_temperature, 1)}°` : '';
      steps = t != null;
    } else if (d === 'humidifier') {
      const cur = this.num(c.humidity_entity);
      const now = isNaN(cur) ? a.current_humidity : cur;
      const t = held ? this._hold.v : a.humidity;
      v = `${now != null ? Math.round(now) + '%' : '—'}<small> → ${t ?? '—'}</small>`;
      sub = on ? '' : st === 'on' ? 'σε αναμονή' : '';
      steps = t != null;
    } else if (d === 'vacuum') {
      v = VAC[st] || st; sub = a.battery_level != null ? `μπαταρία ${a.battery_level}%` : '';
    } else if (d === 'input_number' || d === 'number') {
      v = `${st}<small> ${a.unit_of_measurement || ''}</small>`; steps = true;
    } else if (this.timer()) {
      const hv = held ? this._hold.v : null;
      if (on && left != null) v = `${hv ?? Math.ceil(left)}′<small> απομένουν</small>`;
      else v = `${hv ?? Math.round(this.num(c.duration_entity))}′<small> διάρκεια</small>`;
      steps = true;
    } else if (left != null && on) {
      v = left >= 60 ? `${Math.floor(left / 60)}:${pad2(Math.round(left % 60))}` : `${Math.ceil(left)}′<small> απομένουν</small>`;
    } else if (c.value_entity) {
      const vs = this.st(c.value_entity);
      v = vs ? `${grState(vs.state)}<small> ${vs.attributes.unit_of_measurement || ''}</small>` : '—';
    } else if (['switch', 'light', 'input_boolean', 'fan'].includes(d)) {
      v = on ? (a.brightness ? `${Math.round(a.brightness / 2.55)}%` : a.preset_mode || 'Αναμμένο') : '';
    } else if (!on && OFFS.includes(st)) v = `<small>${grState(st)}</small>`;
    else v = `${grState(st)}<small> ${a.unit_of_measurement || ''}</small>`;
    if (att && !ap) { v = c.attention_text || 'Τελείωσε'; sub = 'πάτα για ΟΚ'; steps = false; }
    if (att && ap) steps = false;
    if (c.secondary_entity && !att) { const ss = this.st(c.secondary_entity); if (ss) sub = `${grState(ss.state)} ${ss.attributes.unit_of_measurement || ''}`.trim(); }

    /* Πρόοδος */
    if (ap) { /* από τη συσκευή */ } else if (c.progress_entity) prog = this.num(c.progress_entity);
    else if (left != null && on) {
      const total = c.total_entity ? toMinutes(this.st(c.total_entity)) : c.duration_entity ? this.num(c.duration_entity) : null;
      if (total) prog = clamp(100 - (left / total) * 100, 0, 100);
    }
    this.$('.v').innerHTML = v;
    this.$('.vac').hidden = d !== 'vacuum' || !ok;
    this.$('.s').textContent = sub; this.$('.s').hidden = !sub;
    this.$('.ft').hidden = !steps || (prog != null && !this.timer());
    const pg = this.$('.pg'); pg.hidden = prog == null || isNaN(prog) || att;
    if (!pg.hidden) pg.firstElementChild.style.width = `${prog}%`;
    this.tick((left != null && on) || !!ap);
  }
}

/* ── Ώρα, μήνας και ατζέντα ── */
const MONTHS = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
const DAYS_FULL = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
const CAL_COLORS = ['#2f5fa8', '#b0548a', '#3f9a62', '#c98a1e', '#7a5fd0'];

class WallTodayCard extends Wall2Card {
  static css2 = XP_CSS + `
.clock{font:700 46px var(--w-font);letter-spacing:-2px;line-height:1}
.date{font:600 14px var(--w-font);color:var(--mut);margin-top:2px}
.card.v2{overflow:hidden}
.mon{display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px;text-align:center;font:600 13px var(--w-font);margin-top:10px}
.mon .h{color:var(--faint);font-size:11px;font-weight:700}
.mon .d{position:relative;height:22px;display:grid;place-items:center;color:var(--ink)}
.mon .d.t{background:var(--ink);color:var(--box);border-radius:8px}
.mon .d i{position:absolute;bottom:0;left:50%;width:5px;height:5px;margin-left:-2.5px;border-radius:50%}
.ag{margin-top:10px;padding-top:8px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.ev{display:flex;align-items:center;gap:10px;font:600 14px var(--w-font);min-width:0}
.ev .k{width:4px;height:24px;border-radius:2px;flex:none}
.ev b{font:700 13px var(--w-font);color:var(--mut);min-width:66px;flex:none}
.ev span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.none{font:600 13px var(--w-font);color:var(--faint);font-style:italic}
:host{overflow:visible;position:relative;z-index:6}
.card.v2.chip{flex-direction:row;align-items:center;gap:12px;padding:0 6px 0 12px;cursor:pointer;height:100%;background:none!important;box-shadow:none!important}
.chip .clock{font-size:30px;letter-spacing:-1px}.chip .date{margin:0;font-size:14px;white-space:nowrap}
.drop{position:absolute;right:0;top:calc(100% + 8px);width:320px;padding:14px 16px;border-radius:20px;background:var(--box);color:var(--ink);
  box-shadow:0 18px 40px rgba(20,30,40,.25);animation:dropin .25s cubic-bezier(.3,1.4,.5,1)}
.drop.v2{--bg:#eef1f4;--box:#fff;--ink:#1c2228;--mut:#5f6b76;--faint:#9aa4ad;--line:#e6eaee}
.drop.v2.dark{--bg:#0f1316;--box:#1b2127;--ink:#e9eef2;--mut:#93a0ab;--faint:#5f6b76;--line:#2a323a}
@keyframes dropin{from{opacity:0;transform:translateY(-8px)}}
.drop .mon{margin-top:0}
.card.v2.bar2{flex-direction:row;align-items:center;justify-content:flex-start;gap:0;padding:0 2px;background:none;box-shadow:none;height:100%}
.bar2 .tp{border:0;background:none;color:var(--ink);cursor:pointer;padding:6px 8px;border-radius:14px;font-family:var(--w-font);text-align:left}
.bar2 .tp:active{background:var(--chip)}
.noclk :is(.clock,.date){display:none}.noclk .mon{margin-top:0}
.bar2 .date{margin:0;font:700 16px var(--w-font);color:var(--mut);line-height:1.15;white-space:normal}
.bar2 .clock{font:800 40px var(--w-font);letter-spacing:-1.5px;line-height:1}
.xp .mon{margin-top:4px}
.tsec{font:800 11px var(--w-font);letter-spacing:.6px;color:var(--faint);text-transform:uppercase;margin:10px 2px 6px}
.tsec:first-child{margin-top:4px}
.trow,.arow{display:flex;align-items:center;gap:10px;height:48px;padding:0 6px 0 12px;border-radius:14px;background:var(--chip);margin-bottom:6px;cursor:pointer}
.tl{font:800 22px var(--w-font);min-width:70px;font-variant-numeric:tabular-nums}.pz .tl{color:var(--faint)}
.tn{flex:1;min-width:0;font:700 13px var(--w-font);color:var(--mut);position:relative;padding-bottom:8px}
.tn i{position:absolute;left:0;bottom:0;height:4px;border-radius:2px;background:var(--accent);transition:width 1s linear}
.ib{width:36px;height:36px;border:0;border-radius:11px;background:var(--box);color:var(--ink);font-size:20px;display:grid;place-items:center;cursor:pointer}
.tadd{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.pc{height:40px;border:0;border-radius:12px;background:var(--chip);color:var(--ink);font:800 14px var(--w-font);cursor:pointer}
.tcus{display:flex;align-items:center;gap:8px;margin-top:8px}.tcus .ib{background:var(--chip)}.tcus b{font:800 18px var(--w-font);min-width:62px;text-align:center}
.go{flex:1;height:40px;border:0;border-radius:12px;background:var(--accent);color:var(--box);font:800 14px var(--w-font);display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer}
.tnone{font:600 12px var(--w-font);color:var(--faint);padding:2px 2px 4px;line-height:1.35}
.at{font:800 22px var(--w-font);min-width:62px;color:var(--faint)}.on .at{color:var(--ink)}
.an{flex:1;min-width:0;font:700 13px var(--w-font)}.an small{display:block;font:600 11px var(--w-font);color:var(--mut)}
.sw{width:40px;height:24px;border-radius:12px;background:var(--line);position:relative;flex:none;margin-right:6px}
.sw::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s}
.on .sw{background:var(--ok)}.on .sw::after{transform:translateX(16px)}
.arow .dl{width:30px;height:30px;font-size:18px;color:var(--faint);background:none}
.addal{width:100%;height:44px;border:1.5px dashed var(--line);border-radius:14px;background:none;color:var(--mut);font:800 14px var(--w-font);display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
.afrm{background:var(--chip);border-radius:16px;padding:10px}
.atm{display:flex;align-items:center;justify-content:center;gap:6px}.atm b{font:800 30px var(--w-font);min-width:44px;text-align:center}.atm span{font:800 26px var(--w-font)}
.adys{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:10px 0 2px}
.dy{height:36px;border:0;border-radius:10px;background:var(--box);color:var(--mut);font:800 13px var(--w-font);cursor:pointer}.dy.sel{background:var(--accent);color:var(--box)}
`;
  static getConfigForm() {
    return form([['mode', 'Μορφή', { select: { mode: 'dropdown', options: [{ value: 'card', label: 'Κάρτα' }, { value: 'clock', label: 'Ώρα στη μπάρα, ημερολόγιο με πάτημα' }] } }],
      ['calendars', 'Ημερολόγια', { entity: { multiple: true, filter: { domain: 'calendar' } } }],
      ['events', 'Πόσα επόμενα γεγονότα', { number: { min: 0, max: 6, mode: 'box' } }],
      ['show_month', 'Δείξε τον μήνα', { boolean: {} }]]);
  }
  static getStubConfig() { return { calendars: [], show_month: true }; }
  getGridOptions() { return { columns: 6, rows: 5 }; }
  timers() { const c = this._config; return c.timers || Object.keys(this._hass?.states || {}).filter((k) => k.startsWith('timer.wall_')).sort(); }
  alarms() { const c = this._config; return c.alarms || Object.keys(this._hass?.states || {}).filter((k) => k.startsWith('switch.schedule_') && /alarm|ξυπν/i.test(JSON.stringify(this._hass.states[k].attributes.tags || '') + (this._hass.states[k].attributes.friendly_name || ''))); }
  alarmBtn() { return this._config.alarm_button || 'input_button.wall_alarm'; }
  watched() { return [...(this._config.calendars || []), ...(this._config.mode === 'clock' ? [...this.timers(), ...this.alarms(), this.alarmBtn()] : [])]; }
  template() {
    if (this._config.mode === 'clock') return `<div class="card bar2"><button class="clock tp"></button><button class="date tp"></button></div>
  <div class="xp xcal" hidden><div class="mon"></div><div class="ag"></div></div>
  <div class="xp xtim" hidden></div>`;
    return `<div class="card${this._config.clock === false ? ' noclk' : ''}"><div class="clock"></div><div class="date"></div><div class="mon"></div><div class="ag"></div></div>`;
  }
  bind() {
    this._clock = setInterval(() => this.clock(), 15000);
    if (this._config.mode !== 'clock') return;
    this._ad = [];
    const cal = expander(this, this.$('.xcal')), tim = expander(this, this.$('.xtim'), () => this.renderTimers());
    this.$('.date').addEventListener('click', (e) => { e.stopPropagation(); cal.toggle(); });
    this.$('.clock').addEventListener('click', (e) => { e.stopPropagation(); tim.toggle(); });
    this.$('.xtim').addEventListener('click', (e) => this.timerTap(e));
    this._tick = setInterval(() => { if (!this.$('.xtim').hidden) this.tickTimers(); }, 1000);
  }
  /* ── χρονόμετρα (timer.wall_*) και ξυπνητήρια (Scheduler) ── */
  timerLeft(id) {
    const s = this.st(id); if (!s) return null;
    if (s.state === 'active' && s.attributes.finishes_at) return Math.max(0, (new Date(s.attributes.finishes_at) - Date.now()) / 1000);
    if (s.state === 'paused' && s.attributes.remaining) { const [h, m, x] = s.attributes.remaining.split(':').map(Number); return h * 3600 + m * 60 + x; }
    return null;
  }
  renderTimers() {
    const xp = this.$('.xtim'), busy = this.timers().filter((id) => ['active', 'paused'].includes(this.val(id)));
    const pool = this.timers().length, al = this.alarms();
    const fmtS = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return `${h ? h + ':' + pad2(m) : m}:${pad2(s % 60)}`; };
    this._step ??= 10;
    xp.innerHTML = `
<div class="tsec">Αντίστροφη μέτρηση</div>
${busy.map((id) => { const s = this.st(id), left = this.timerLeft(id) || 0, paused = s.state === 'paused';
      const dur = s.attributes.duration ? s.attributes.duration.split(':').map(Number).reduce((a, b) => a * 60 + b) : left;
      return `<div class="trow${paused ? ' pz' : ''}" data-id="${id}"><span class="tl" data-left="${id}">${fmtS(left)}</span><span class="tn">${s.attributes.friendly_name?.replace(/^.*?wall[_ ]?/i, '') && !/^\d+$/.test(s.attributes.friendly_name.replace(/^.*?wall[_ ]?/i, '')) ? s.attributes.friendly_name : 'Χρονόμετρο'}<i style="width:${clamp(100 - (left / (dur || 1)) * 100, 0, 100)}%"></i></span>
      <button class="ib ms" data-a="${paused ? 'start' : 'pause'}">${paused ? 'play_arrow' : 'pause'}</button><button class="ib ms" data-a="cancel">close</button></div>`; }).join('')}
${pool ? `<div class="tadd">${[1, 5, 10, 15, 30, 60].map((m) => `<button class="pc" data-min="${m}">${m < 60 ? m + '′' : '1ω'}</button>`).join('')}</div>
<div class="tcus"><button class="ib ms" data-a="dn">remove</button><b>${durText(this._step)}</b><button class="ib ms" data-a="up">add</button><button class="go" data-a="go"><span class="ms">play_arrow</span>Έναρξη</button></div>`
      : '<div class="tnone">Φτιάξε helpers «timer.wall_1», «timer.wall_2»… για αντίστροφες μετρήσεις.</div>'}
<div class="tsec">Ξυπνητήρια</div>
${al.map((id) => { const s = this.st(id), a = s.attributes, nx = validTime(a.next_trigger);
      const days = (a.weekdays || []).map((d) => SCHED_DAYS.find((x) => x[0] === d)?.[1] || (d === 'daily' ? 'Κάθε μέρα' : d === 'workday' ? 'Εργάσιμες' : d === 'weekend' ? 'Σ/Κ' : '')).join(' ');
      return `<div class="arow${s.state === 'on' ? ' on' : ''}" data-al="${id}"><span class="at">${a.timeslots?.[0]?.slice?.(0, 5) || (nx ? hhmm(nx) : '—')}</span><span class="an">${days || 'Μία φορά'}<small>${s.state === 'on' && nx ? `επόμενο ${WX_DAYS[nx.getDay()]} ${hhmm(nx)}` : 'ανενεργό'}</small></span><span class="sw"></span><button class="ib ms dl" data-a="del">delete</button></div>`; }).join('')}
${this._adding ? `<div class="afrm"><div class="atm"><button class="ib ms" data-a="h-">remove</button><b>${pad2(this._ah)}</b><button class="ib ms" data-a="h+">add</button><span>:</span><button class="ib ms" data-a="m-">remove</button><b>${pad2(this._am)}</b><button class="ib ms" data-a="m+">add</button></div>
<div class="adys">${SCHED_DAYS.map(([k, l]) => `<button class="dy${this._ad.includes(k) ? ' sel' : ''}" data-d="${k}">${l}</button>`).join('')}</div>
<div class="tcus"><button class="pc" data-a="cancel-add" style="flex:1">Άκυρο</button><button class="go" data-a="save"><span class="ms">alarm_add</span>Αποθήκευση</button></div></div>`
      : this._hass?.services?.scheduler ? '<button class="addal" data-a="add"><span class="ms">alarm_add</span>Νέο ξυπνητήρι</button>' : '<div class="tnone">Χρειάζεται το Scheduler για ξυπνητήρια.</div>'}`;
  }
  tickTimers() {
    const xp = this.$('.xtim');
    const active = this.timers().filter((id) => ['active', 'paused'].includes(this.val(id)));
    if (active.length !== xp.querySelectorAll('.trow').length) return this.renderTimers();
    xp.querySelectorAll('[data-left]').forEach((e) => { const s = this.timerLeft(e.dataset.left) || 0; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); e.textContent = `${h ? h + ':' + pad2(m) : m}:${pad2(Math.round(s) % 60)}`; });
  }
  timerTap(e) {
    e.stopPropagation();
    const b = e.target.closest('button,[data-al]'); if (!b) return;
    const start = (min) => {
      const free = this.timers().find((id) => !['active', 'paused'].includes(this.val(id)));
      if (!free) return;
      const h = Math.floor(min / 60), m = min % 60;
      this.call('timer', 'start', { entity_id: free, duration: `${pad2(h)}:${pad2(m)}:00` });
    };
    if (b.dataset.min) start(+b.dataset.min);
    else if (b.dataset.d) { const d = b.dataset.d; this._ad = this._ad.includes(d) ? this._ad.filter((x) => x !== d) : [...this._ad, d]; return this.renderTimers(); }
    else if (['add', 'cancel-add', 'save', 'h-', 'h+', 'm-', 'm+', 'del'].includes(b.dataset.a)) {
      const a = b.dataset.a;
      if (a === 'add') { const n = new Date(); this._adding = true; this._ah = 7; this._am = 0; this._ad = ['mon', 'tue', 'wed', 'thu', 'fri']; }
      else if (a === 'cancel-add') this._adding = false;
      else if (a === 'h-' || a === 'h+') this._ah = (this._ah + (a === 'h+' ? 1 : 23)) % 24;
      else if (a === 'm-' || a === 'm+') this._am = (this._am + (a === 'm+' ? 5 : 55)) % 60;
      else if (a === 'del') { this.call('scheduler', 'remove', { entity_id: b.closest('[data-al]').dataset.al }); }
      else if (a === 'save') {
        const tm = `${pad2(this._ah)}:${pad2(this._am)}`, days = this._ad.length === 7 ? ['daily'] : this._ad;
        this.call('scheduler', 'add', { name: `Ξυπνητήρι ${tm}`, tags: ['alarm'], weekdays: days.length ? days : ['daily'], repeat_type: days.length ? 'repeat' : 'single',
          timeslots: [{ start: `${tm}:00`, actions: [{ service: 'input_button.press', entity_id: this.alarmBtn() }] }] });
        this._adding = false;
      }
      this.renderTimers(); if (a === 'save' || a === 'del') setTimeout(() => this.renderTimers(), 1200); return;
    }
    else if (b.dataset.al) this.call('switch', 'toggle', { entity_id: b.dataset.al });
    else {
      const a = b.dataset.a, id = b.closest('[data-id]')?.dataset.id;
      if (a === 'up') this._step = Math.min(600, this._step + (this._step >= 60 ? 15 : 5));
      else if (a === 'dn') this._step = Math.max(1, this._step - (this._step > 60 ? 15 : this._step > 5 ? 5 : 1));
      else if (a === 'go') start(this._step);
      else if (id) this.call('timer', a, { entity_id: id });
    }
    setTimeout(() => this.renderTimers(), a2() );
    function a2() { return 350; }
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._clock); this._clock = null; clearInterval(this._tick); (this._xpOff || []).forEach((f) => f()); this._xpOff = []; }
  connectedCallback() { super.connectedCallback(); if (this._built && !this._clock) this.bind(); }
  clock() {
    const n = new Date();
    this.$('.clock').textContent = hhmm(n);
    this.$('.date').textContent = `${DAYS_FULL[n.getDay()]} ${n.getDate()} ${MONTHS[n.getMonth()]}`;
    if (this._day !== n.getDate()) { this._day = n.getDate(); this._fetched = 0; this.load(); }
  }
  async load() {
    const cals = this._config.calendars || [];
    if (!cals.length || !this._hass?.callApi || Date.now() - (this._fetched || 0) < 600000) return this.render();
    this._fetched = Date.now();
    const n = new Date(), start = new Date(n.getFullYear(), n.getMonth(), 1), end = new Date(n.getFullYear(), n.getMonth() + 2, 1);
    const all = [];
    await Promise.all(cals.map(async (id, i) => {
      try {
        const evs = await this._hass.callApi('GET', `calendars/${id}?start=${start.toISOString()}&end=${end.toISOString()}`);
        evs.forEach((e) => all.push({ id, color: CAL_COLORS[i % CAL_COLORS.length], title: e.summary, start: new Date(e.start.dateTime || e.start.date + 'T00:00'), allDay: !e.start.dateTime }));
      } catch (e) { /* ημερολόγιο που δεν απαντά */ }
    }));
    this._events = all.sort((x, y) => x.start - y.start);
    this.render();
  }
  render() {
    const c = this._config, n = new Date(), evs = this._events || [];
    const mon = this.$('.mon');
    mon.hidden = c.show_month === false;
    if (!mon.hidden) {
      const first = new Date(n.getFullYear(), n.getMonth(), 1), days = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
      const dots = {};
      evs.forEach((e) => { if (e.start.getMonth() === n.getMonth()) dots[e.start.getDate()] ??= e.color; });
      const cells = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'].map((d) => `<span class="h">${d}</span>`);
      for (let i = 0; i < (first.getDay() + 6) % 7; i++) cells.push('<span></span>');
      for (let d = 1; d <= days; d++) cells.push(`<span class="d${d === n.getDate() ? ' t' : ''}">${d}${dots[d] ? `<i style="background:${dots[d]}"></i>` : ''}</span>`);
      mon.innerHTML = cells.join('');
    }
    const today0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const next = evs.filter((e) => (e.allDay ? e.start >= today0 : e.start >= n)).slice(0, c.events ?? 2);
    const label = (e) => {
      const dd = Math.round((new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate()) - today0) / 864e5);
      const day = dd === 0 ? '' : dd === 1 ? 'Αύριο ' : `${WX_DAYS[e.start.getDay()]} `;
      return day + (e.allDay ? (dd === 0 ? 'Σήμερα' : '') : hhmm(e.start));
    };
    this.$('.ag').innerHTML = next.length
      ? next.map((e) => `<div class="ev"><span class="k" style="background:${e.color}"></span><b>${label(e).trim()}</b><span>${e.title}</span></div>`).join('')
      : `<div class="none">${(c.calendars || []).length ? 'Τίποτα για τις επόμενες μέρες' : 'Πρόσθεσε ημερολόγια στη ρύθμιση'}</div>`;
  }
  watchRing() {
    if (this._config.mode !== 'clock' || this._config.sound === false) return;
    const prev = this._tprev || {}, now = {};
    this.timers().forEach((id) => {
      const s = this.st(id); if (!s) return; now[id] = { st: s.state, fin: s.attributes.finishes_at };
      const p = prev[id];
      if (p && p.st === 'active' && s.state === 'idle' && p.fin && new Date(p.fin) - Date.now() < 4000)
        ring('Τέλος', s.attributes.friendly_name && !/^wall\s*\d*$/i.test(s.attributes.friendly_name) ? s.attributes.friendly_name : 'Η αντίστροφη μέτρηση τελείωσε');
    });
    this._tprev = now;
    const b = this.val(this.alarmBtn());
    if (this._bprev !== undefined && b && b !== this._bprev && Math.abs(Date.now() - new Date(b)) < 120000) {
      const free = this.timers().find((id) => !['active', 'paused'].includes(this.val(id)));
      ring(hhmm(new Date()), 'Ξυπνητήρι', free ? () => this.call('timer', 'start', { entity_id: free, duration: '00:10:00' }) : null);
    }
    this._bprev = b;
  }
  update() { this.clock(); this.load(); this.watchRing(); if (this.$('.xtim') && !this.$('.xtim').hidden && !this._adding) this.renderTimers(); }
}

/* ── Καιρός: ουρανός με κίνηση, τρέχουσες συνθήκες, 3 ημέρες (χαμηλή → υψηλή) ── */
class WallSkyCard extends Wall2Card {
  static css2 = `
.card.v2{color:#fff;background:linear-gradient(180deg,var(--s1,#5c7fa6),var(--s2,#9db6cf));padding:14px 16px;cursor:pointer}
.sky{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.cl{position:absolute;width:120px;height:40px;border-radius:40px;background:rgba(255,255,255,.7);animation:drift 40s linear infinite}
.cl::before,.cl::after{content:'';position:absolute;background:inherit;border-radius:50%}
.cl::before{width:56px;height:56px;left:18px;top:-26px}.cl::after{width:42px;height:42px;left:60px;top:-18px}
@keyframes drift{from{transform:translateX(-170px)}to{transform:translateX(420px)}}
.dull .cl{background:rgba(220,226,232,.7)}
.sun{position:absolute;right:24px;top:14px;width:52px;height:52px;border-radius:50%;background:#ffd35c;box-shadow:0 0 40px 10px rgba(255,210,90,.55);animation:sunp 6s ease-in-out infinite}
@keyframes sunp{50%{box-shadow:0 0 52px 14px rgba(255,210,90,.7)}}
.moon{position:absolute;right:26px;top:16px;width:44px;height:44px;border-radius:50%;box-shadow:-10px 4px 0 0 #f4efd8;transform:rotate(-20deg)}
.star{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;animation:tw 3s ease-in-out infinite}
@keyframes tw{50%{opacity:.2}}
.drop{position:absolute;top:-12px;width:1.5px;height:12px;background:rgba(255,255,255,.6);animation:rain .9s linear infinite}
@keyframes rain{to{transform:translateY(240px)}}
.flake{position:absolute;top:-8px;width:5px;height:5px;border-radius:50%;background:#fff;animation:snow 5s linear infinite}
@keyframes snow{to{transform:translate(18px,240px)}}
.sky>*{display:none}.sun-on .sun,.moon-on .moon,.night-on .star,.cloud-on .cl,.rain-on .drop,.snow-on .flake{display:block}
.z{position:relative}
.now{display:flex;align-items:flex-start;gap:12px}
.t{font:500 56px var(--w-font);letter-spacing:-3px;line-height:.95;text-shadow:0 1px 6px rgba(0,0,0,.2)}
.d{font:700 14px var(--w-font);line-height:1.35;padding-top:6px;text-shadow:0 1px 4px rgba(0,0,0,.25)}
.d small{display:block;font:600 12px var(--w-font);opacity:.9}
.fc{margin-top:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fc>div{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:12px;background:rgba(255,255,255,.18);backdrop-filter:blur(4px);font:700 12px var(--w-font);line-height:1.25}
.fc .ms{font-size:22px}.fc b{font:800 13px var(--w-font)}.fc small{opacity:.85;font-weight:600}
`;
  static getConfigForm() { return form([['entity', 'Καιρός', ent('weather'), true], ['days', 'Ημέρες πρόγνωσης', { number: { min: 0, max: 5, mode: 'box' } }]]); }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'weather') }; }
  getGridOptions() { return { columns: 6, rows: 3 }; }
  watched() { return [this._config.entity, 'sun.sun']; }
  template() {
    const stars = Array.from({ length: 22 }, (_, i) => `<i class="star" style="left:${(i * 37) % 100}%;top:${(i * 23) % 45}%;animation-delay:${(i % 5) * 0.6}s"></i>`).join('');
    const drops = Array.from({ length: 24 }, (_, i) => `<i class="drop" style="left:${(i * 41) % 100}%;animation-delay:${(i % 9) * 0.1}s"></i>`).join('');
    const flakes = Array.from({ length: 14 }, (_, i) => `<i class="flake" style="left:${(i * 29) % 100}%;animation-delay:${(i % 7) * 0.7}s"></i>`).join('');
    return `<div class="card"><div class="sky"><div class="sun"></div><div class="moon"></div>${stars}
  <div class="cl" style="top:30px"></div><div class="cl" style="top:70px;animation-delay:-20s;opacity:.6"></div>${drops}${flakes}</div>
  <div class="z now"><div class="t"></div><div class="d"><span class="cond"></span><small class="lh"></small></div></div><div class="z fc"></div></div>`;
  }
  bind() { this.tapMore(); }
  connectedCallback() { super.connectedCallback(); if (this._hass && this._config) this.subscribe(); }
  disconnectedCallback() { super.disconnectedCallback(); (this._unsub || []).forEach((p) => p.then((u) => u && u()).catch(() => {})); this._unsub = null; }
  subscribe() {
    const conn = this._hass?.connection;
    if (this._unsub || !conn?.subscribeMessage) return;
    const sub = (type, key) => conn.subscribeMessage((ev) => { this[key] = ev.forecast || []; this.update(); },
      { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: this._config.entity });
    this._unsub = [sub('daily', '_daily'), sub('hourly', '_hourly')].map((p) => p.catch(() => null));
  }
  update() {
    this.subscribe();
    const s = this.st(this._config.entity), a = s?.attributes || {}, ok = this.available(this._config.entity);
    const night = this.val('sun.sun') === 'below_horizon', cond = ok ? s.state : 'cloudy';
    const fx = (WX[cond] || WX.cloudy)[2].split(' '), dull = fx.includes('dull'), card = this.$('.card');
    const sky = night ? ['#1d2a44', '#3d5274'] : dull ? ['#7d8a99', '#b3bdc8'] : ['#4f86c6', '#a8cbea'];
    card.style.setProperty('--s1', sky[0]); card.style.setProperty('--s2', sky[1]);
    const sk = this.$('.sky');
    sk.className = 'sky' + (dull ? ' dull' : '');
    [['sun', fx.includes('sun') && !night], ['moon', night && !dull], ['night', night && !dull], ['cloud', fx.includes('cloud') || dull],
      ['rain', fx.includes('rain')], ['snow', fx.includes('snow')]].forEach(([k, v]) => sk.classList.toggle(k + '-on', v));
    this.$('.t').textContent = a.temperature != null ? `${Math.round(a.temperature)}°` : '—';
    const days = this._daily || [], today = days[0];
    const tip = weatherInsight(this._hourly, a.temperature);
    this.$('.cond').textContent = (WX[cond] || [cond])[0];
    this.$('.lh').textContent = [today?.templow != null ? `Ε ${Math.round(today.templow)}°` : '', today ? `Μ ${Math.round(today.temperature)}°` : '', tip?.[1] || ''].filter(Boolean).join(' · ');
    this.$('.fc').innerHTML = days.slice(1, (this._config.days ?? 3) + 1).map((f) =>
      `<div><span class="ms fill">${(WX[f.condition] || WX.cloudy)[1]}</span><span>${WX_DAYS[new Date(f.datetime).getDay()]}<br>${f.templow != null ? `<small>${Math.round(f.templow)}°</small> ` : ''}<b>${Math.round(f.temperature)}°</b></span></div>`).join('');
  }
}

/* ── Συνθήκες σπιτιού: θερμοκρασία, υγρασία, CO₂/VOC, τάση, 24ωρο ── */
const CO2_LEVELS = [[800, '#3f9a62'], [1200, '#d9a21f'], [Infinity, '#d9573b']];
class WallHomeCard extends Wall2Card {
  static css2 = `
.card.v2{padding:14px 16px 0;cursor:pointer}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.t{font:500 52px var(--w-font);letter-spacing:-3px;line-height:.95}
.h{text-align:right}.h b{font:600 26px var(--w-font);letter-spacing:-1px;color:#3d8fe6}
.tr{display:inline-flex;align-items:center;gap:2px;margin-top:4px;padding:2px 7px 2px 4px;border-radius:9px;font:800 11px var(--w-font);white-space:nowrap}
.tr .ms{font-size:15px}.tr.dn{background:color-mix(in srgb,#3d8fe6 16%,var(--box));color:#2f6fb5}.tr.up{background:color-mix(in srgb,#e0702a 16%,var(--box));color:#c0602a}
.aq{display:flex;gap:8px;margin-top:8px}
.aq>div{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;border-radius:11px;background:var(--chip);font:700 12px var(--w-font);color:var(--mut)}
.aq i{width:8px;height:8px;border-radius:50%}.aq b{color:var(--ink);font-weight:800}
svg{flex:1;width:calc(100% + 32px);margin:4px -16px 0;min-height:24px;display:block}
.tl{fill:none;stroke:#e0702a;stroke-width:2.5}.ta{fill:url(#gt)}.hl{fill:none;stroke:#3d8fe6;stroke-width:2;stroke-dasharray:4 4;opacity:.8}
`;
  static getConfigForm() {
    return form([['entity', 'Θερμοκρασία σπιτιού', ent('sensor', 'temperature'), true], ['humidity_entity', 'Υγρασία', ent('sensor', 'humidity')],
      ['co2_entity', 'CO₂ (προαιρετικό)', ent('sensor')], ['voc_entity', 'VOC (προαιρετικό)', ent('sensor')],
      ['temperature_trend_entity', 'Τάση θερμοκρασίας (Derivative, °C/h)', ent('sensor')], ['humidity_trend_entity', 'Τάση υγρασίας (Derivative, %/h)', ent('sensor')]]);
  }
  static getStubConfig() { return { entity: '' }; }
  getGridOptions() { return { columns: 6, rows: 3 }; }
  watched() { const c = this._config; return [c.entity, c.humidity_entity, c.co2_entity, c.voc_entity, c.temperature_trend_entity, c.humidity_trend_entity]; }
  template() {
    return `<div class="card"><div class="top"><div><div class="t"></div><span class="tr dn tt" hidden></span></div><div class="h"><b></b><br><span class="tr up th" hidden></span></div></div>
  <div class="aq" hidden></div>
  <svg viewBox="0 0 300 42" preserveAspectRatio="none"><defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0702a" stop-opacity=".22"/><stop offset="1" stop-color="#e0702a" stop-opacity="0"/></linearGradient></defs>
  <path class="ta"/><path class="tl"/><path class="hl"/></svg></div>`;
  }
  bind() { this.tapMore(); }
  trend(elm, id, unit, lim) {
    const v = this.num(id);
    elm.hidden = isNaN(v) || Math.abs(v) < lim;
    if (elm.hidden) return;
    elm.classList.toggle('dn', v < 0); elm.classList.toggle('up', v >= 0);
    elm.innerHTML = `<span class="ms">${v < 0 ? 'south_east' : 'north_east'}</span>${v > 0 ? '+' : '−'}${fmt(Math.abs(v), unit === '°' ? 1 : 0)}${unit}/ώρα`;
  }
  async update() {
    const c = this._config;
    const t = this.num(c.entity), h = this.num(c.humidity_entity);
    this.$('.t').textContent = isNaN(t) ? '—' : `${fmt(t, 1)}°`;
    this.$('.h b').textContent = isNaN(h) ? '' : `${Math.round(h)}%`;
    this.trend(this.$('.tt'), c.temperature_trend_entity, '°', 0.5);
    this.trend(this.$('.th'), c.humidity_trend_entity, '%', 4);
    const co2 = this.num(c.co2_entity), voc = this.st(c.voc_entity);
    const aq = this.$('.aq');
    const parts = [];
    if (!isNaN(co2)) parts.push(`<div><i style="background:${CO2_LEVELS.find(([m]) => co2 < m)[1]}"></i>CO₂ <b>${Math.round(co2)}</b></div>`);
    if (voc && this.available(c.voc_entity)) parts.push(`<div><i style="background:#3f9a62"></i>VOC <b>${voc.state}</b></div>`);
    aq.hidden = !parts.length; aq.innerHTML = parts.join('');
    const data = await fetchHistory(this._hass, [c.entity, c.humidity_entity]);
    const tp = data[c.entity] || [], hp = data[c.humidity_entity] || [];
    const range = (p) => { const v = p.map((x) => x[1]); return [Math.min(...v), Math.max(...v)]; };
    if (tp.length > 1) { const [lo, hi] = range(tp); const p = smoothPath(tp, 300, 42, lo, hi); this.$('.tl').setAttribute('d', p.line); this.$('.ta').setAttribute('d', p.area); }
    if (hp.length > 1) { const [lo, hi] = range(hp); this.$('.hl').setAttribute('d', smoothPath(hp, 300, 42, lo, hi).line); }
  }
}

/* ── Μέτρηση (μικρή κάρτα): τίτλος με εικονίδιο, τιμή, τάση, μικρό γράφημα ── */
const QUALITY = { co2: [[800, '#3f9a62'], [1200, '#d9a21f'], [Infinity, '#d9573b']], pm25: [[12, '#3f9a62'], [35, '#d9a21f'], [Infinity, '#d9573b']], voc: [[150, '#3f9a62'], [300, '#d9a21f'], [Infinity, '#d9573b']] };
class WallStatCard extends Wall2Card {
  static css2 = `
.card.v2{padding:9px 12px;justify-content:space-between;cursor:pointer}
.h{display:flex;align-items:center;gap:6px;font:700 11px var(--w-font);color:var(--mut);letter-spacing:.4px;text-transform:uppercase}
.h .ms{font-size:17px;color:var(--k)}.h i{margin-left:auto;width:9px;height:9px;border-radius:50%}
.v{font:700 24px var(--w-font);letter-spacing:-.8px;display:flex;align-items:baseline;gap:5px;position:relative;z-index:1}
.v small{font:700 12px var(--w-font);color:var(--mut);letter-spacing:0}
.tr{font:800 11px var(--w-font);padding:1px 6px;border-radius:8px;letter-spacing:0}.tr.dn{background:color-mix(in srgb,#3d8fe6 16%,var(--box));color:#2f6fb5}.tr.up{background:color-mix(in srgb,#e0702a 16%,var(--box));color:#c0602a}
svg{position:absolute;right:10px;bottom:10px;width:56px;height:22px}
`;
  static getConfigForm() {
    return form([['entity', 'Αισθητήρας', ent('sensor'), true], ['name', 'Τίτλος (π.χ. Υγρασία)', TEXT], ['icon', 'Εικονίδιο', TEXT], ['color', 'Χρώμα', TEXT],
      ['trend_entity', 'Τάση (Derivative)', ent('sensor')], ['trend_min', 'Δείξε την τάση από (π.χ. 0.5)', { number: { min: 0, max: 100, step: 0.1, mode: 'box' } }],
      ['quality', 'Ποιότητα (χρώμα τελείας)', { select: { mode: 'dropdown', options: [{ value: '', label: '—' }, { value: 'co2', label: 'CO₂' }, { value: 'pm25', label: 'PM2.5' }, { value: 'voc', label: 'VOC' }] } }],
      ['decimals', 'Δεκαδικά', { number: { min: 0, max: 2, mode: 'box' } }], ['graph', 'Μικρό γράφημα 24 ωρών', { boolean: {} }]]);
  }
  static getStubConfig() { return { entity: '' }; }
  getGridOptions() { return { columns: 3, rows: 1 }; }
  watched() { return [this._config.entity, this._config.trend_entity]; }
  template() {
    return `<div class="card"><div class="h"><span class="ms fill"></span><span class="tt"></span><i hidden></i></div><div class="v"><b></b><small></small><span class="tr" hidden></span></div>
  <svg viewBox="0 0 56 22" preserveAspectRatio="none" hidden><path fill="none" stroke-width="2"/></svg></div>`;
  }
  bind() { this.tapMore(); }
  async update() {
    const c = this._config, s = this.st(c.entity), a = s?.attributes || {}, n = this.num(c.entity);
    const col = c.color || ({ temperature: '#e0702a', humidity: '#3d8fe6', carbon_dioxide: '#3f9a62', pm25: '#7a5fd0' }[a.device_class] || '#7a858f');
    this.$('.card').style.setProperty('--k', col);
    this.$('.h .ms').textContent = c.icon || ({ temperature: 'thermostat', humidity: 'humidity_percentage', carbon_dioxide: 'co2', pm25: 'airwave', volatile_organic_compounds: 'air' }[a.device_class] || 'sensors');
    this.$('.tt').textContent = c.name || a.friendly_name || '';
    this.$('.v b').textContent = isNaN(n) ? '—' : fmt(n, c.decimals ?? (a.device_class === 'temperature' ? 1 : 0)) + (a.unit_of_measurement === '°C' ? '°' : '');
    this.$('.v small').textContent = a.unit_of_measurement === '°C' ? '' : a.unit_of_measurement || '';
    const q = c.quality && QUALITY[c.quality], dot = this.$('.h i');
    dot.hidden = !q || isNaN(n); if (!dot.hidden) dot.style.background = q.find(([m]) => n < m)[1];
    const tv = this.num(c.trend_entity), tr = this.$('.tr');
    tr.hidden = isNaN(tv) || Math.abs(tv) < (c.trend_min ?? 0.5);
    if (!tr.hidden) { tr.className = 'tr ' + (tv < 0 ? 'dn' : 'up'); tr.textContent = `${tv < 0 ? '↘' : '↗'} ${fmt(Math.abs(tv), Math.abs(tv) < 10 ? 1 : 0)}`; }
    const svg = this.$('svg');
    svg.hidden = c.graph === false;
    if (!svg.hidden) {
      const pts = (await fetchHistory(this._hass, [c.entity]))[c.entity] || [];
      if (pts.length > 1) { const v = pts.map((x) => x[1]); const pth = smoothPath(pts, 56, 22, Math.min(...v), Math.max(...v)); const el2 = svg.querySelector('path'); el2.setAttribute('d', pth.line); el2.setAttribute('stroke', col); }
    }
  }
}

/* ── Άτομο (2×½): αχνός χάρτης, κατάσταση· «Έρχεται» = πράσινη πλοήγηση με πρόοδο ── */
const tileUrl = (lat, lon, z, dark) => {
  const n = 2 ** z, x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
  return `https://basemaps.cartocdn.com/${dark ? 'dark_all' : 'light_all'}/${z}/${x}/${y}@2x.png`;
};
const ZONE_GR = { home: 'Σπίτι', not_home: 'Εκτός', unknown: 'Άγνωστο', unavailable: 'Άγνωστο' };
class WallPersonTile extends Wall2Card {
  static css2 = `
.card.v2{flex-direction:row;align-items:center;gap:12px;padding:0 14px;cursor:pointer}
.map{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.5}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,var(--box) 40%,transparent 90%)}
.z{position:relative}
.av{width:42px;height:42px;border-radius:50%;color:#fff;display:grid;place-items:center;font:700 16px var(--w-font);flex:none;background-size:cover;background-position:center}
.pn{font:700 14px var(--w-font)}.pst{font:800 20px var(--w-font);white-space:nowrap}.pst small{font:600 12px var(--w-font);color:var(--mut);margin-left:6px}
.home .pst{color:var(--ok)}
.coming{background:var(--nav)!important;color:#fff}.coming .fade{background:linear-gradient(90deg,var(--nav) 45%,transparent 92%)}.coming .map{opacity:.3}
.eta{position:absolute;right:14px;top:50%;transform:translateY(-60%);text-align:right;font:800 26px var(--w-font);line-height:1}.eta small{display:block;font:600 12px var(--w-font);opacity:.85;white-space:nowrap}
.sim{position:absolute;left:14px;right:14px;bottom:9px;height:5px;border-radius:3px;background:rgba(255,255,255,.3)}.sim i{display:block;height:100%;background:#fff;border-radius:3px;transition:width 2s}
.delay{display:inline-flex;align-items:center;gap:3px;margin-left:8px;padding:1px 7px;border-radius:9px;background:#ffc15e;color:#4a3000;font:800 11px var(--w-font);vertical-align:middle}.delay .ms{font-size:14px}
`;
  static getConfigForm() {
    return form([['entity', 'Άτομο', ent('person'), true], ['name', 'Όνομα', TEXT], ['color', 'Χρώμα (π.χ. #2f5fa8)', TEXT],
      ['driving_entity', 'Οδηγεί (binary_sensor)', ent('binary_sensor')], ['direction_entity', 'Κατεύθυνση (proximity: towards)', ent('sensor')],
      ['distance_entity', 'Απόσταση από το σπίτι (km)', ent('sensor')], ['eta_entity', 'Χρόνος για το σπίτι (λεπτά)', ent('sensor')],
      ['usual_minutes', 'Συνηθισμένος χρόνος (λεπτά) για ένδειξη καθυστέρησης', { number: { min: 0, max: 600, mode: 'box' } }],
      ['map', 'Χάρτης', { select: { mode: 'dropdown', options: [{ value: 'native', label: 'Του Home Assistant' }, { value: 'carto', label: 'CARTO' }] } }]]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'person') }; }
  getGridOptions() { return { columns: 6, rows: 1 }; }
  watched() { const c = this._config; return [c.entity, c.driving_entity, c.direction_entity, c.distance_entity, c.eta_entity]; }
  template() {
    return `<div class="card"><div class="map"></div><div class="fade"></div><div class="z av"></div>
  <div class="z"><div class="pn"></div><div class="pst"></div></div><div class="eta" hidden></div><div class="sim" hidden><i></i></div></div>`;
  }
  bind() { this.tapMore(); }
  /* Ο χάρτης του ίδιου του HA: φορτώνεται μαζί με την κάρτα χάρτη */
  async haMap(dark) {
    if (!customElements.get('ha-map')) {
      const h = window.loadCardHelpers ? await window.loadCardHelpers() : null; if (!h) return;
      h.createCardElement({ type: 'map', entities: [this._config.entity] });
      await Promise.race([customElements.whenDefined('ha-map'), new Promise((r) => setTimeout(r, 10000))]);
      if (!customElements.get('ha-map')) return;
    }
    if (!this._hm) {
      this._hm = document.createElement('ha-map');
      this._hm.style.cssText = 'position:absolute;inset:0;height:100%;pointer-events:none';
      this.$('.map').append(this._hm);
    }
    Object.assign(this._hm, { hass: this._hass, entities: [{ entity_id: this._config.entity, color: this._config.color }], zoom: 14, themeMode: dark ? 'dark' : 'light', autoFit: true });
  }
  update() {
    const c = this._config, s = this.st(c.entity), a = s?.attributes || {}, card = this.$('.card');
    if (this._hm) this._hm.hass = this._hass;
    const name = c.name || a.friendly_name || '';
    const av = this.$('.av');
    av.style.background = a.entity_picture ? cssUrl(a.entity_picture) + ' center/cover' : (c.color || '#2f5fa8');
    av.textContent = a.entity_picture ? '' : name.slice(0, 1);
    this.$('.pn').textContent = name;
    const st = s?.state, home = st === 'home';
    const driving = this.val(c.driving_entity) === 'on';
    const towards = !c.direction_entity || this.val(c.direction_entity) === 'towards';
    const km = this.num(c.distance_entity), eta = this.num(c.eta_entity);
    const coming = !home && driving && towards;
    card.classList.toggle('home', home); card.classList.toggle('coming', coming);
    if (a.latitude != null) {
      const key = `${a.latitude.toFixed(3)},${a.longitude.toFixed(3)},${card.classList.contains('dark')}`;
      if (key !== this._mapKey) {
        this._mapKey = key;
        if (c.map === 'carto') this.$('.map').style.backgroundImage = cssUrl(tileUrl(a.latitude, a.longitude, 15, card.classList.contains('dark')));
        else if (c.map !== false) this.haMap(card.classList.contains('dark'));
      }
    }
    const pst = this.$('.pst'), etaEl = this.$('.eta'), sim = this.$('.sim');
    etaEl.hidden = sim.hidden = !coming;
    if (coming) {
      const late = c.usual_minutes && !isNaN(eta) && eta > c.usual_minutes + 4 ? Math.round(eta - c.usual_minutes) : 0;
      pst.innerHTML = `Έρχεται${late ? `<span class="delay"><span class="ms fill">traffic</span>+${late}′</span>` : ''}`;
      const arr = !isNaN(eta) ? new Date(Date.now() + eta * 60000) : null;
      etaEl.innerHTML = `${arr ? hhmm(arr) : ''}<small>${[!isNaN(eta) ? `σε ${Math.round(eta)}′` : '', !isNaN(km) ? `${fmt(km, km < 10 ? 1 : 0)} km` : ''].filter(Boolean).join(' · ')}</small>`;
      if (!isNaN(km)) { this._d0 = Math.max(this._d0 || 0, km); sim.firstElementChild.style.width = `${clamp(100 - (km / this._d0) * 100, 3, 100)}%`; }
    } else {
      this._d0 = 0;
      const zone = ZONE_GR[st] || this.st(`zone.${st}`)?.attributes?.friendly_name || st || '—';
      const since2 = s?.last_changed ? `από ${hhmm(new Date(s.last_changed))}` : '';
      pst.innerHTML = `${zone}<small>${[home ? '' : !isNaN(km) ? `${fmt(km, 0)} km` : '', since2].filter(Boolean).join(' · ')}</small>`;
    }
  }
}

/* ── Αυτοκίνητο (2×½): μπαταρία/αυτονομία ή καύσιμο, και η φθηνότερη τιμή καυσίμου ── */
class WallCarTile extends Wall2Card {
  static css2 = `
.card.v2{flex-direction:row;align-items:center;gap:10px;padding:0 12px;cursor:pointer}
.ci{font-size:28px!important;color:var(--c,#7a858f)}.cx{flex:1;min-width:0}
.n{font:700 13px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.n small{font-weight:600;color:var(--mut)}
.bat{height:5px;border-radius:3px;background:var(--line);margin-top:5px;overflow:hidden}.bat i{display:block;height:100%;background:#3f9a62;border-radius:3px}
.cv{font:800 18px var(--w-font);text-align:right;line-height:1.05;white-space:nowrap}.cv small{display:block;font:600 11px var(--w-font);color:var(--mut)}
.fuel{display:flex;align-items:center;gap:4px;font:600 12px var(--w-font);color:var(--mut);margin-top:3px;white-space:nowrap;overflow:hidden}.fuel .ms{font-size:16px}.fuel b{color:var(--ink);font-weight:800}
.chg{color:#3f9a62}
`;
  static getConfigForm() {
    return form([['entity', 'Μπαταρία ή καύσιμο (%) ή location', ANY, true], ['name', 'Όνομα', TEXT], ['color', 'Χρώμα εικονιδίου', TEXT],
      ['electric', 'Ηλεκτρικό', { boolean: {} }], ['range_entity', 'Αυτονομία (km)', ent('sensor')], ['status_entity', 'Κατάσταση/θέση', ANY],
      ['charging_entity', 'Φορτίζει (binary_sensor)', ent('binary_sensor')], ['climate_entity', 'Κλιματισμός (προθέρμανση)', ent('climate')],
      ['price_entity', 'Φθηνότερη τιμή καυσίμου (sensor)', ent('sensor')], ['price_label', 'Ετικέτα τιμής (π.χ. πετρέλαιο)', TEXT]]);
  }
  static getStubConfig() { return { entity: '' }; }
  getGridOptions() { return { columns: 6, rows: 1 }; }
  watched() { const c = this._config; return [c.entity, c.range_entity, c.status_entity, c.charging_entity, c.climate_entity, c.price_entity]; }
  template() {
    return `<div class="card"><span class="ms fill ci"></span><div class="cx"><div class="n"></div><div class="bat" hidden><i></i></div><div class="fuel" hidden></div></div>
  <div class="cv"></div><button class="btn ms pre" hidden>mode_heat</button></div>`;
  }
  bind() {
    this.tapMore();
    this.$('.pre').addEventListener('click', () => { const id = this._config.climate_entity; this.call('climate', this.val(id) === 'off' ? 'turn_on' : 'turn_off', { entity_id: id }); });
  }
  update() {
    const c = this._config, s = this.st(c.entity);
    this.$('.card').style.setProperty('--c', c.color || (c.electric ? '#c0392b' : '#5f6b76'));
    this.$('.ci').textContent = c.electric ? 'electric_car' : 'directions_car';
    const status = this.st(c.status_entity);
    const where = status ? (ZONE_GR[status.state] || this.st(`zone.${status.state}`)?.attributes?.friendly_name || status.state) : '';
    this.$('.n').innerHTML = `${c.name || this.friendly(c.entity)}${where ? ` <small>· ${where}</small>` : ''}`;
    const pct = s?.attributes?.unit_of_measurement === '%' ? this.num(c.entity) : NaN;
    const bat = this.$('.bat'); bat.hidden = isNaN(pct);
    if (!bat.hidden) bat.firstElementChild.style.width = `${pct}%`;
    const rng = this.num(c.range_entity);
    this.$('.cv').innerHTML = isNaN(pct) ? '' : `${Math.round(pct)}%${!isNaN(rng) ? `<small>${Math.round(rng)} km</small>` : ''}`;
    const price = this.st(c.price_entity), fuel = this.$('.fuel');
    fuel.hidden = !price || !this.available(c.price_entity);
    if (!fuel.hidden) fuel.innerHTML = `<span class="ms">local_gas_station</span>${c.price_label || 'Φθηνότερο'} <b>${fmt(+price.state, 3)} ${price.attributes.unit_of_measurement || '€'}</b>${price.attributes.station || price.attributes.name ? ` · ${price.attributes.station || price.attributes.name}` : ''}`;
    const pre = this.$('.pre'); pre.hidden = !c.climate_entity;
    if (!pre.hidden) pre.classList.toggle('chg', this.val(c.climate_entity) !== 'off');
    this.$('.ci').classList.toggle('chg', this.val(c.charging_entity) === 'on');
  }
}

/* ── Κάτοψη: εικόνα (ή placeholder), λάμπες, χώροι, και στις γωνίες κλειδαριές, κατανάλωση, κάμερες ── */
class WallPlanCard extends Wall2Card {
  static css2 = `
.card.v2{padding:0;background:linear-gradient(180deg,color-mix(in srgb,var(--box) 70%,var(--bg)),var(--bg))}
.img{position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:center}
svg.ph{position:absolute;inset:0;width:100%;height:100%}
.fl{fill:#fbfcfd;stroke:#c9d1d8}.wl{fill:#e3e8ed;stroke:#c9d1d8}.in{stroke:#c9d1d8;fill:none}
.dark .fl{fill:#222a31;stroke:#36404a}.dark .wl{fill:#1a2026;stroke:#36404a}.dark .in{stroke:#36404a}
.rm{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;font:700 13px var(--w-font);background:color-mix(in srgb,var(--box) 92%,transparent);padding:5px 10px;border-radius:11px;box-shadow:var(--sh);cursor:pointer;white-space:nowrap}
.rm .t{font:600 12px var(--w-font);color:var(--mut);display:flex;gap:6px}.cold{color:#3d8fe6!important}.warm{color:#e0702a!important}
.bulb{position:absolute;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--box);color:var(--faint);box-shadow:var(--sh);transition:all .4s}
.bulb .ms{font-size:21px}
.bulb.on{background:#ffd76a;color:#6b4a00;box-shadow:0 0 0 7px rgba(255,215,106,.3),0 0 30px rgba(255,200,80,.75)}
.glow{position:absolute;transform:translate(-50%,-50%);width:220px;height:150px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,215,106,.5),transparent);pointer-events:none;opacity:0;transition:opacity .6s}
.glow.on{opacity:1}
.corner{position:absolute;display:flex;gap:8px}.tl{left:12px;top:12px}.tr{right:12px;top:12px}.bl{left:12px;bottom:12px}.br{right:12px;bottom:12px}
.chip{display:flex;align-items:center;gap:6px;height:38px;padding:0 12px 0 9px;border-radius:12px;background:color-mix(in srgb,var(--box) 94%,transparent);box-shadow:var(--sh);font:700 13px var(--w-font);color:var(--ink)}
.chip .ms{font-size:19px;color:var(--faint)}.chip b{font-weight:800}.chip small{font:600 11px var(--w-font);color:var(--mut)}
.chip.ok .ms{color:var(--ok)}.chip.bad{background:#d9573b;color:#fff}.chip.bad .ms{color:#fff}
.cam{position:relative;width:120px;height:72px;border-radius:12px;background:#2b333a center/cover;box-shadow:var(--sh);overflow:hidden}
.cam span{position:absolute;left:8px;bottom:6px;font:700 11px var(--w-font);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.stage{position:absolute;inset:0}.hasdock .stage{bottom:70px}.hasdock .bl{bottom:82px}
.dock{position:absolute;left:10px;right:10px;bottom:10px;height:58px;display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:16px;background:var(--box);box-shadow:var(--sh)}
.dmodes{display:flex;gap:4px;padding-right:8px;border-right:1px solid var(--line)}
.dmodes button{width:42px;height:42px;border-radius:12px;border:0;background:none;color:var(--faint);display:grid;place-items:center;cursor:pointer;font-size:23px}
.dmodes button.sel{background:var(--chip);color:var(--ink)}
.dctl{flex:1;min-width:0;display:flex;gap:8px;align-items:center;overflow-x:auto;scrollbar-width:none;animation:dfade .3s}
@keyframes dfade{from{opacity:0;transform:translateY(6px)}}
.db{flex:none;display:flex;align-items:center;gap:6px;height:42px;padding:0 13px 0 10px;border-radius:12px;border:0;background:var(--chip);color:var(--ink);font:700 13px var(--w-font);cursor:pointer;white-space:nowrap}
.db .ms{font-size:21px;color:var(--faint)}.db.on{background:#ffd76a;color:#5a3e00}.db.on .ms{color:#6b4a00}
.db.pri{background:#7a5fd0;color:#fff}.db.pri .ms{color:#fff}.db.ic{padding:0;width:42px;justify-content:center}
.dinfo{display:flex;flex-direction:column;line-height:1.15;margin-right:4px;white-space:nowrap}.dinfo b{font:800 15px var(--w-font)}.dinfo small{font:600 12px var(--w-font);color:var(--mut)}
.dcl{flex:none;display:flex;align-items:center;gap:4px;height:42px;padding:0 4px 0 10px;border-radius:12px;background:var(--chip);font:700 13px var(--w-font);white-space:nowrap}
.dcl b{font:800 16px var(--w-font);min-width:44px;text-align:center}.dcl .db{background:var(--box);height:34px;width:34px;padding:0;justify-content:center}.dcl .db.on{background:#ffd76a}
`;
  static getConfigForm() {
    return form([['image', 'Εικόνα κάτοψης (URL, προαιρετικό)', TEXT],
      ['locks', 'Κλειδαριές (πάνω αριστερά)', { entity: { multiple: true, filter: [{ domain: 'lock' }, { domain: 'binary_sensor' }] } }],
      ['energy', 'Κατανάλωση (πάνω δεξιά)', { entity: { multiple: true, filter: { domain: 'sensor' } } }],
      ['cameras', 'Κάμερες (κάτω αριστερά)', { entity: { multiple: true, filter: { domain: 'camera' } } }]]);
  }
  static getStubConfig() { return { rooms: [], lights: [] }; }
  getGridOptions() { return { columns: 12, rows: 6 }; }
  modes() {
    const c = this._config, m = [];
    if ((c.lights || []).length) m.push(['lights', 'lightbulb']);
    if (c.vacuum) m.push(['vacuum', 'robot_2']);
    if ((c.climates || []).length) m.push(['climate', 'thermostat']);
    return c.controls === false ? [] : m;
  }
  watched() {
    const c = this._config;
    return [c.vacuum, ...(c.climates || []), ...(c.lights || []).map((l) => l.entity), ...(c.rooms || []).flatMap((r) => [r.temperature, r.humidity]),
      ...(c.locks || []), ...(c.energy || []).map((e) => e.entity || e), ...(c.cameras || [])];
  }
  template() {
    const c = this._config;
    const ph = c.image ? `<div class="img" style="background-image:${cssUrl(c.image)}"></div>` : `<svg class="ph" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid meet">
   <path class="fl" stroke-width="2" d="M150 280 L450 130 L750 280 L450 430 Z"/><path class="wl" stroke-width="2" d="M150 280 L150 315 L450 465 L750 315 L750 280 L450 430 Z"/>
   <path class="in" stroke-width="2" d="M300 205 L600 355 M375 168 L225 243 M525 393 L675 318 M450 430 L450 465"/></svg>`;
    const rooms = (c.rooms || []).map((r, i) => `<div class="rm" data-i="${i}" style="left:${r.x}%;top:${r.y}%">${r.name}<span class="t"></span></div>`).join('');
    const lights = (c.lights || []).map((l, i) => `<div class="glow" data-g="${i}" style="left:${l.x}%;top:${l.y}%"></div><button class="bulb" data-l="${i}" style="left:${l.x}%;top:${l.y}%"><span class="ms fill">lightbulb</span></button>`).join('');
    const ms = this.modes();
    const dock = ms.length ? `<div class="dock">${ms.length > 1 ? `<div class="dmodes">${ms.map(([k, ic]) => `<button class="ms fill" data-m="${k}">${ic}</button>`).join('')}</div>` : ''}<div class="dctl"></div></div>` : '';
    return `<div class="card${ms.length ? ' hasdock' : ''}"><div class="stage">${ph}${lights}${rooms}</div><div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div>${dock}</div>`;
  }
  bind() {
    const c = this._config;
    this.shadowRoot.addEventListener('click', (e) => {
      const md = e.target.closest('[data-m]'); if (md) { this._mode = md.dataset.m; this._pin = Date.now(); return this.update(); }
      const dl = e.target.closest('[data-dl]'); if (dl) return this.call('homeassistant', 'toggle', { entity_id: dl.dataset.dl });
      if (e.target.closest('[data-alloff]')) return this.call('homeassistant', 'turn_off', { entity_id: c.lights.map((l) => l.entity) });
      const dv = e.target.closest('[data-dv]'); if (dv) return this.call('vacuum', dv.dataset.dv, { entity_id: c.vacuum });
      const dt = e.target.closest('[data-dt]'); if (dt) {
        const id = dt.dataset.id, a = this.st(id)?.attributes || {}, step = a.target_temp_step || 0.5;
        if (dt.dataset.dt === 'pw') return this.call('climate', this.val(id) === 'off' ? 'turn_on' : 'turn_off', { entity_id: id });
        return this.call('climate', 'set_temperature', { entity_id: id, temperature: (+a.temperature || 20) + (dt.dataset.dt === 'up' ? step : -step) });
      }
      const b = e.target.closest('[data-l]'); if (b) return this.call('homeassistant', 'toggle', { entity_id: c.lights[b.dataset.l].entity });
      const r = e.target.closest('[data-i]'); if (r) return this.moreInfo(c.rooms[r.dataset.i].temperature);
      const m = e.target.closest('[data-id]'); if (m) {
        const id = m.dataset.id;
        if (id.startsWith('lock.')) return this.call('lock', this.val(id) === 'locked' ? 'unlock' : 'lock', { entity_id: id });
        return this.moreInfo(id);
      }
    });
    let t;
    this.shadowRoot.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-l]'); if (b) t = setTimeout(() => this.moreInfo(c.lights[b.dataset.l].entity), 550); });
    this.shadowRoot.addEventListener('pointerup', () => clearTimeout(t));
  }
  update() {
    const c = this._config;
    (c.lights || []).forEach((l, i) => {
      const on = this.val(l.entity) === 'on';
      this.$(`[data-l="${i}"]`).classList.toggle('on', on);
      this.$(`[data-g="${i}"]`).classList.toggle('on', on);
    });
    (c.rooms || []).forEach((r, i) => {
      const t = this.num(r.temperature), h = this.num(r.humidity);
      this.$(`[data-i="${i}"] .t`).innerHTML = [!isNaN(t) ? `<i class="${t < (r.cold ?? 19.5) ? 'cold' : t > (r.warm ?? 24) ? 'warm' : ''}">${fmt(t, 1)}°</i>` : '',
        !isNaN(h) ? `<i class="${h > (r.humid ?? 60) ? 'warm' : ''}">${Math.round(h)}%</i>` : ''].join('');
    });
    this.$('.tl').innerHTML = (c.locks || []).map((id) => {
      const st = this.val(id), locked = st === 'locked' || st === 'off';
      return `<button class="chip ${locked ? 'ok' : st === 'unlocked' || st === 'on' || st === 'open' ? 'bad' : ''}" data-id="${id}"><span class="ms fill">${id.startsWith('lock.') ? (locked ? 'lock' : 'lock_open') : 'door_front'}</span>${this.friendly(id)}</button>`;
    }).join('');
    this.$('.tr').innerHTML = (c.energy || []).map((e) => {
      const id = e.entity || e, s = this.st(id); if (!s) return '';
      const ic = e.icon || (s.attributes.device_class === 'water' ? 'water_drop' : s.attributes.device_class === 'gas' ? 'local_fire_department' : 'bolt');
      const col = e.color || { bolt: '#e0a020', water_drop: '#3d8fe6', local_fire_department: '#e46a2c' }[ic] || '#7a858f';
      return `<button class="chip" data-id="${id}"><span class="ms fill" style="color:${col}">${ic}</span><b>${fmt(+s.state, +s.state < 10 ? 1 : 0)} ${s.attributes.unit_of_measurement || ''}</b>${e.name ? `<small>${e.name}</small>` : ''}</button>`;
    }).join('');
    this.dockUpdate();
    const bl = this.$('.bl');
    if (!this._camT || Date.now() - this._camT > 10000) {
      this._camT = Date.now();
      bl.innerHTML = (c.cameras || []).map((id) => {
        const s = this.st(id), tok = s?.attributes?.access_token;
        return `<button class="cam" data-id="${id}" style="background-image:${tok ? cssUrl(`/api/camera_proxy/${id}?token=${tok}&t=${this._camT}`) : 'none'}"><span>${this.friendly(id)}</span></button>`;
      }).join('');
    }
  }
}

/* Panel κάτω από την κάτοψη: τα controls της τρέχουσας όψης (φώτα, σκούπα, κλίμα) */
WallPlanCard.prototype.dockUpdate = function () {
  const c = this._config, ms = this.modes(), box = this.$('.dctl'); if (!box) return;
  const vs = c.vacuum ? this.val(c.vacuum) : '';
  /* αυτόματη όψη: η σκούπα όταν δουλεύει· αλλιώς ό,τι διάλεξε ο χρήστης (για 2 λεπτά) ή η πρώτη */
  const auto = ['cleaning', 'returning'].includes(vs) ? 'vacuum' : ms[0][0];
  if (!this._pin || Date.now() - this._pin > 120000) { this._pin = 0; this._mode = auto; }
  const mode = this._mode;
  this.shadowRoot.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('sel', b.dataset.m === mode));
  let h = '';
  if (mode === 'lights') {
    h = c.lights.map((l) => `<button class="db ${this.val(l.entity) === 'on' ? 'on' : ''}" data-dl="${l.entity}"><span class="ms fill">lightbulb</span>${l.name || this.friendly(l.entity)}</button>`).join('')
      + `<button class="db" data-alloff><span class="ms">light_off</span>Όλα</button>`;
  } else if (mode === 'vacuum') {
    const a = this.st(c.vacuum)?.attributes || {}, run = vs === 'cleaning';
    const GR = { cleaning: 'Καθαρίζει', docked: 'Στη βάση', returning: 'Επιστρέφει', paused: 'Σε παύση', idle: 'Αναμονή', error: 'Σφάλμα' };
    h = `<div class="dinfo"><b>${GR[vs] || vs || '—'}</b><small>${a.battery_level != null ? `μπαταρία ${a.battery_level}%` : ''}</small></div>`
      + `<button class="db pri" data-dv="${run ? 'pause' : 'start'}"><span class="ms fill">${run ? 'pause' : 'play_arrow'}</span>${run ? 'Παύση' : 'Έναρξη'}</button>`
      + `<button class="db" data-dv="return_to_base"><span class="ms fill">home</span>Βάση</button>`
      + `<button class="db ic" data-dv="stop"><span class="ms fill">stop</span></button><button class="db ic" data-dv="locate"><span class="ms">location_searching</span></button>`;
  } else if (mode === 'climate') {
    h = c.climates.map((id) => {
      const s = this.st(id), a = s?.attributes || {}, off = !s || s.state === 'off';
      return `<div class="dcl"><span>${this.friendly(id)}</span><button class="db" data-dt="dn" data-id="${id}"><span class="ms">remove</span></button><b>${off ? '—' : fmt(+a.temperature, 1) + '°'}</b><button class="db" data-dt="up" data-id="${id}"><span class="ms">add</span></button><button class="db ${off ? '' : 'on'}" data-dt="pw" data-id="${id}"><span class="ms">power_settings_new</span></button></div>`;
    }).join('');
  }
  if (h !== this._dk) { this._dk = h; box.innerHTML = h; }
};

/* ── Ειδοποιήσεις: ως 4 θέσεις, η πιο επείγουσα έντονη ── */
class WallNoticeCard extends Wall2Card {
  static css2 = XP_CSS + `
.card.v2{padding:12px}
.hd{display:flex;align-items:center;gap:8px;font:800 14px var(--w-font);margin-bottom:2px}.hd .ms{font-size:20px;color:var(--faint)}
.hd small{font:800 11px var(--w-font);color:var(--mut);background:var(--chip);border-radius:8px;padding:1px 7px}
.n{display:flex;align-items:center;gap:10px;height:44px;padding:0 6px 0 10px;border-radius:13px;background:color-mix(in srgb,var(--n) 10%,var(--box));margin-top:6px;cursor:pointer}
.n .ms{font-size:21px;color:var(--n)}.n .tx{flex:1;min-width:0;font:700 13px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.n .tx small{display:block;font:600 11px var(--w-font);color:var(--mut)}
.n.hot{background:var(--n);color:#fff}.n.hot .ms,.n.hot small{color:rgba(255,255,255,.9)}
.n.empty{background:none;border:1.5px dashed var(--line);color:var(--faint);justify-content:center;font:700 12px var(--w-font);cursor:default}
.card.v2.bar{flex-direction:row;align-items:center;gap:12px;padding:0 12px 0 14px;cursor:pointer;background:none;box-shadow:none}
.card.v2.bar.open{background:var(--box);box-shadow:var(--w-shadow,0 4px 14px rgba(0,0,0,.08))}
.bar .bi{font-size:24px;color:var(--n)}.bar .bt{flex:1;min-width:0;line-height:1.2}
.bar .bt b{display:block;font:800 15px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar .bt small{font:600 12px var(--w-font);color:var(--mut)}
.bar .cnt{font:800 12px var(--w-font);padding:3px 9px;border-radius:10px;background:var(--chip);color:var(--mut)}
.bar .chev{color:var(--faint)}
.xp .n{margin-top:6px}.card.v2.bar.open .chev{transform:rotate(180deg)}.chev{transition:transform .3s}
.bar.hot .bi{animation:nring 1.6s ease-in-out infinite}.bar.hot .cnt{background:var(--n);color:#fff}@keyframes nring{0%,60%,100%{transform:none}10%,30%{transform:rotate(14deg)}20%,40%{transform:rotate(-14deg)}}
`;
  static getConfigForm() {
    return form([['mode', 'Μορφή', { select: { mode: 'dropdown', options: [{ value: 'list', label: 'Λίστα' }, { value: 'bar', label: 'Μπάρα (η πιο πρόσφατη + panel)' }] } }],
      ['slots', 'Θέσεις (λίστα)', { number: { min: 1, max: 6, mode: 'box' } }], ['title', 'Τίτλος', TEXT]]);
  }
  static getStubConfig() { return { mode: 'bar', items: [] }; }
  isBar() { return this._config.mode === 'bar'; }
  panel() {
    openPopup(this, {
      icon: 'notifications', size: 'md', title: this._config.title || 'Ειδοποιήσεις',
      status: () => { const n = this.active().length; return n ? `${n} ενεργές` : 'Όλα ήσυχα'; },
      render: (pp) => {
        const list = this.active();
        if (!list.length) { popSection(pp).append(el('p', 'grp', 'Δεν υπάρχει κάτι που θέλει προσοχή.')); return; }
        popChips(popSection(pp), list.map((it) => ({ label: `${this.text(it)} · ${it.subtitle || since(it.when)}`, icon: it.icon || 'info',
          tap: () => { pp.close(true); it.tap ? this.trigger(it.tap) : this.moreInfo(it.entity); } })));
      },
    });
  }
  fillXp() {
    const list = this.active(), xp = this.$('.xp');
    xp.innerHTML = list.length ? list.map((it) => `<div class="n${it.urgent ? ' hot' : ''}" data-i="${it.i}" style="--n:${it.color || '#2f5fa8'}"><span class="ms">${it.icon || 'info'}</span><div class="tx">${this.text(it)}<small>${it.subtitle || since(it.when)}</small></div><span class="ms" style="color:var(--faint)">chevron_right</span></div>`).join('')
      : '<div class="n empty">Όλα ήσυχα</div>';
  }
  disconnectedCallback() { super.disconnectedCallback?.(); (this._xpOff || []).forEach((f) => f()); this._xpOff = []; }
  text(it) { const s = this.st(it.entity); return (it.text || '{state}').replace('{state}', s ? grState(s.state) : '').replace('{name}', this.friendly(it.entity)); }
  getGridOptions() { return { columns: 6, rows: 3 }; }
  watched() { return [...(this._config.items || []).map((i) => i.entity), ...Object.keys(this._hass?.states || {}).filter((k) => k.startsWith('persistent_notification.'))]; }
  template() {
    if (this.isBar()) return `<div class="card bar"><span class="ms bi">notifications</span><div class="bt"><b></b><small></small></div><span class="cnt"></span><span class="ms chev">expand_more</span></div><div class="xp" hidden></div>`;
    return `<div class="card"><div class="hd"><span class="ms">notifications</span><span class="ttl"></span><small></small></div><div class="list"></div></div>`;
  }
  bind() {
    if (this.isBar()) {
      const xp = this.$('.xp'), x = expander(this, xp, () => this.fillXp());
      this.$('.card').addEventListener('click', (e) => { e.stopPropagation(); x.toggle(); });
      xp.addEventListener('click', (e) => { e.stopPropagation(); const n = e.target.closest('[data-i]'); if (!n) return; const it = this._config.items[n.dataset.i]; x.close(); it.tap ? this.trigger(it.tap) : this.moreInfo(it.entity); });
      return;
    }
    this.$('.list').addEventListener('click', (e) => {
      const n = e.target.closest('[data-id]'); if (!n) return;
      const it = (this._config.items || [])[n.dataset.i];
      if (it?.tap) this.trigger(it.tap); else this.moreInfo(n.dataset.id);
    });
  }
  active() {
    return (this._config.items || []).map((it, i) => {
      const s = this.st(it.entity); if (!s) return null;
      const v = s.state, n = parseFloat(v);
      const hit = it.state != null ? [].concat(it.state).map(String).includes(v) : it.above != null ? n > it.above : it.below != null ? n < it.below : v === 'on';
      return hit ? { ...it, i, when: s.last_changed } : null;
    }).filter(Boolean).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  }
  update() {
    if (this.isBar()) {
      const list = this.active(), top = list[0], card = this.$('.card');
      card.classList.toggle('hot', !!top?.urgent);
      card.style.setProperty('--n', top?.color || '#5f6b76');
      this.$('.bi').textContent = top?.icon || 'notifications';
      this.$('.bt b').textContent = top ? this.text(top) : 'Όλα ήσυχα';
      this.$('.bt small').textContent = top ? (top.subtitle || since(top.when)) : '';
      this.$('.cnt').textContent = list.length > 1 ? `+${list.length - 1}` : '';
      this.$('.cnt').hidden = list.length < 2;
      return;
    }
    const c = this._config, list = this.active(), slots = c.slots ?? 4;
    this.$('.ttl').textContent = c.title || 'Ειδοποιήσεις';
    this.$('.hd small').textContent = list.length || '';
    this.$('.hd small').hidden = !list.length;
    const rows = list.slice(0, slots).map((it) => {
      const s = this.st(it.entity), txt = (it.text || '{state}').replace('{state}', s.state).replace('{name}', this.friendly(it.entity));
      return `<div class="n${it.urgent ? ' hot' : ''}" data-id="${it.entity}" data-i="${it.i}" style="--n:${it.color || '#2f5fa8'}"><span class="ms fill">${it.icon || 'info'}</span><div class="tx">${txt}<small>${it.subtitle || since(it.when)}</small></div></div>`;
    });
    while (rows.length < slots) rows.push(`<div class="n empty">${rows.length ? '' : 'Όλα ήσυχα'}</div>`);
    this.$('.list').innerHTML = rows.join('');
  }
}

/* ── Λίστα ψωνιών (todo) ── */
class WallShopCard extends Wall2Card {
  static css2 = `
.card.v2{padding:12px}
.hd{display:flex;align-items:center;gap:8px;font:800 14px var(--w-font);margin-bottom:4px}.hd .ms{font-size:20px;color:var(--faint)}
.hd small{font:800 11px var(--w-font);color:var(--mut);background:var(--chip);border-radius:8px;padding:1px 7px}
.add{margin-left:auto;color:var(--accent)}
.it{display:flex;align-items:center;gap:10px;min-height:32px;font:600 14px var(--w-font);border-top:1px solid var(--line);cursor:pointer}
.cb{width:20px;height:20px;border-radius:6px;border:2px solid var(--faint);flex:none;display:grid;place-items:center}
.done .cb{background:#3f9a62;border-color:#3f9a62}.done .cb::after{content:'';width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
.done span:last-child{color:var(--faint);text-decoration:line-through}
.more{font:600 12px var(--w-font);color:var(--mut);padding-top:6px}
.card.v2.cmp{flex-direction:row;align-items:center;gap:12px;padding:0 12px 0 14px}
.cmp .ic{font-size:24px;color:var(--faint)}.cmp .ct{flex:1;min-width:0;cursor:pointer}.cmp .ttl{font:800 15px var(--w-font)}
.cmp .one{font:600 13px var(--w-font);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.8}
.cmp .one.fade{animation:sfade 7s ease-in-out}@keyframes sfade{0%{opacity:0}18%,82%{opacity:.85}100%{opacity:0}}
.card.v2.cmp.multi{flex-direction:column;align-items:stretch;justify-content:center;gap:0;padding:4px 10px 4px 14px}
.cmp .row{display:flex;align-items:center;gap:12px;flex:1;min-height:0}.cmp .row+.row{border-top:1px solid var(--line)}
`;
  static getConfigForm() {
    return form([['entity', 'Λίστα', ent('todo'), true], ['reminders', 'Υπενθυμίσεις (2η λίστα, συμπαγής)', ent('todo')], ['mode', 'Μορφή', { select: { mode: 'dropdown', options: [{ value: 'list', label: 'Λίστα' }, { value: 'compact', label: 'Συμπαγής: αριθμός και ένα προϊόν τη φορά' }] } }],
      ['max', 'Πόσα να φαίνονται (λίστα)', { number: { min: 1, max: 12, mode: 'box' } }]]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'todo') }; }
  getGridOptions() { return { columns: 6, rows: 3 }; }
  lists() {
    const c = this._config, l = [{ entity: c.entity, title: c.title || 'Ψώνια', icon: 'shopping_cart', ask: 'Τι χρειάζεται;' }];
    if (c.reminders) l.push({ entity: c.reminders, title: c.reminders_title || 'Υπενθυμίσεις', icon: 'event_note', ask: 'Τι να θυμηθώ;' });
    return l;
  }
  watched() { return this.lists().map((l) => l.entity); }
  template() {
    if (this._config.mode === 'compact') return `<div class="card cmp${this._config.reminders ? ' multi' : ''}">${this.lists().map((l, i) => `<div class="row" data-r="${i}"><span class="ms fill ic">${l.icon}</span><div class="ct"><b class="ttl"></b><div class="one"></div></div><button class="btn ms add">add</button></div>`).join('')}</div>`;
    return `<div class="card"><div class="hd"><span class="ms fill">shopping_cart</span><span class="ttl"></span><small></small><button class="btn ms add">add</button></div><div class="list"></div></div>`;
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._rot); this._rot = null; }
  rotate() {
    this.shadowRoot.querySelectorAll('.row').forEach((row, k) => {
      const one = row.querySelector('.one'), open = ((this._itemsBy || [])[k] || []).filter((i) => i.status === 'needs_action');
      if (!open.length) { one.textContent = k ? 'τίποτα για τώρα' : 'η λίστα είναι άδεια'; one.classList.remove('fade'); return; }
      this._ri = this._ri || []; this._ri[k] = ((this._ri[k] ?? -1) + 1) % open.length;
      one.classList.remove('fade'); void one.offsetWidth;
      one.textContent = open[this._ri[k]].summary; one.classList.add('fade');
    });
  }
  bind() {
    if (this._config.mode === 'compact') {
      this.shadowRoot.querySelectorAll('.row').forEach((row) => {
        const l = this.lists()[row.dataset.r];
        row.querySelector('.add').addEventListener('click', () => { const v = prompt(l.ask); if (v && v.trim()) this.call('todo', 'add_item', { entity_id: l.entity, item: v.trim() }); });
        row.querySelector('.ct').addEventListener('click', () => this.moreInfo(l.entity));
      });
      this._rot = setInterval(() => this.rotate(), 7000); return;
    }
    this.$('.add').addEventListener('click', () => {
      const v = prompt('Τι χρειάζεται;');
      if (v && v.trim()) this.call('todo', 'add_item', { entity_id: this._config.entity, item: v.trim() });
    });
    this.$('.list').addEventListener('click', (e) => {
      const r = e.target.closest('[data-uid]'); if (!r) return;
      this.call('todo', 'update_item', { entity_id: this._config.entity, item: r.dataset.uid, status: r.classList.contains('done') ? 'needs_action' : 'completed' });
    });
  }
  async update() {
    const c = this._config;
    if (c.mode === 'compact') {
      const ls = this.lists(), first = !this._itemsBy;
      this._itemsBy = await Promise.all(ls.map((l) => this._hass.callWS({ type: 'todo/item/list', entity_id: l.entity }).then((r) => r?.items || []).catch(() => [])));
      this.shadowRoot.querySelectorAll('.row').forEach((row, k) => { row.querySelector('.ttl').textContent = `${ls[k].title} · ${this._itemsBy[k].filter((i) => i.status === 'needs_action').length}`; });
      if (first) this.rotate();
      return;
    }
    this.$('.ttl').textContent = c.title || 'Ψώνια';
    let items = [];
    try { items = (await this._hass.callWS({ type: 'todo/item/list', entity_id: c.entity }))?.items || []; } catch (e) { /* μη διαθέσιμη λίστα */ }
    if (c.mode === 'compact') {
      const first = !this._items; this._items = items;
      this.$('.ttl').textContent = `${c.title || 'Ψώνια'} · ${items.filter((i) => i.status === 'needs_action').length}`;
      if (first) this.rotate();
      return;
    }
    const open = items.filter((i) => i.status === 'needs_action'), done = items.filter((i) => i.status === 'completed').slice(0, 2);
    const show = [...open, ...done].slice(0, c.max ?? 3);
    this.$('.hd small').textContent = open.length;
    this.$('.list').innerHTML = show.map((i) => `<div class="it${i.status === 'completed' ? ' done' : ''}" data-uid="${i.uid}"><span class="cb"></span><span>${i.summary}</span></div>`).join('')
      + (open.length > show.length ? `<div class="more">+${open.length - show.filter((i) => i.status !== 'completed').length} ακόμα</div>` : '')
      + (!items.length ? '<div class="more">Η λίστα είναι άδεια</div>' : '');
  }
}

/* ── Family Matters: ψώνια, υπενθυμίσεις, δουλειές σε μία κάρτα με καρτέλες ── */
class WallFamilyCard extends Wall2Card {
  static css2 = `
.card.v2{padding:10px 12px 8px;gap:6px}
.tabs{display:flex;gap:4px;background:var(--chip);border-radius:14px;padding:3px}
.tab{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:5px;height:36px;border:0;border-radius:11px;background:none;color:var(--mut);font:700 12px var(--w-font);cursor:pointer;transition:background .25s,color .25s}
.tab .ms{font-size:19px;color:var(--tc)}.tab i{font:800 11px var(--w-font);font-style:normal;min-width:18px;padding:1px 5px;border-radius:9px;background:color-mix(in srgb,var(--tc) 18%,transparent);color:var(--tc)}
.tab.sel{background:var(--box);color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,.08)}.tab .tn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tab .tn{display:none}.ft b{font:800 13px var(--w-font);color:var(--tc)}
.body{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;display:flex;flex-direction:column;animation:ffade .3s}
@keyframes ffade{from{opacity:0;transform:translateY(4px)}}
.it{display:flex;align-items:center;gap:10px;min-height:36px;font:600 14px var(--w-font);cursor:pointer;flex:none}.it+.it{border-top:1px solid var(--line)}
.cb{width:20px;height:20px;border-radius:6px;border:2px solid var(--faint);flex:none;display:grid;place-items:center;transition:all .2s}
.done .cb{background:#3f9a62;border-color:#3f9a62}.done .cb::after{content:'';width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}
.done .tx{color:var(--faint);text-decoration:line-through}
.tx{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.due{font:700 11px var(--w-font);color:var(--mut);white-space:nowrap}.due.late{color:#d9573b}.due.today{color:#c98a1e}
.empty{margin:auto;font:600 13px var(--w-font);color:var(--faint);text-align:center}.empty .ms{display:block;font-size:30px;margin-bottom:4px}
.ft{display:flex;align-items:center;gap:6px}.ft small{flex:1;font:600 12px var(--w-font);color:var(--mut)}
.add{height:34px;padding:0 12px 0 8px;border:0;border-radius:11px;background:var(--chip);color:var(--ink);font:700 13px var(--w-font);display:flex;align-items:center;gap:4px;cursor:pointer}.add .ms{font-size:20px;color:var(--tc)}
`;
  static getConfigForm() {
    return form([['shopping', 'Ψώνια', ent('todo')], ['reminders', 'Υπενθυμίσεις', ent('todo')], ['chores', 'Δουλειές', ent('todo')], ['title', 'Τίτλος', TEXT]]);
  }
  static getStubConfig(hass) { return { shopping: firstEntity(hass, 'todo') }; }
  getGridOptions() { return { columns: 6, rows: 4 }; }
  lists() {
    const c = this._config;
    return [['shopping', 'Ψώνια', 'shopping_cart', '#2f9a76', 'Τι χρειάζεται;'], ['reminders', 'Υπενθυμίσεις', 'notifications_active', '#c98a1e', 'Τι να θυμηθούμε;'], ['chores', 'Δουλειές', 'cleaning_services', '#7a5fd0', 'Ποια δουλειά;']]
      .filter(([k]) => c[k]).map(([k, title, icon, color, ask]) => ({ k, entity: c[k], title: c[`${k}_title`] || title, icon, color, ask }));
  }
  watched() { return this.lists().map((l) => l.entity); }
  template() {
    return `<div class="card"><div class="tabs">${this.lists().map((l, i) => `<button class="tab" data-t="${i}" style="--tc:${l.color}"><span class="ms fill">${l.icon}</span><span class="tn">${l.title}</span><i></i></button>`).join('')}</div>
<div class="body"></div><div class="ft"><small></small><button class="add"><span class="ms">add</span>Προσθήκη</button></div></div>`;
  }
  bind() {
    this._sel = 0;
    this.$('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { this._sel = +b.dataset.t; this._bk = ''; this.paint(); } });
    this.$('.add').addEventListener('click', () => { const l = this.lists()[this._sel], v = prompt(l.ask); if (v && v.trim()) this.call('todo', 'add_item', { entity_id: l.entity, item: v.trim() }); });
    this.$('.body').addEventListener('click', (e) => {
      const r = e.target.closest('[data-uid]'); if (!r) return;
      r.classList.toggle('done');
      this.call('todo', 'update_item', { entity_id: this.lists()[this._sel].entity, item: r.dataset.uid, status: r.classList.contains('done') ? 'completed' : 'needs_action' });
    });
  }
  due(i) {
    if (!i.due) return '';
    const d = new Date(i.due.length <= 10 ? i.due + 'T23:59' : i.due), now = new Date();
    const days = Math.floor((new Date(d.toDateString()) - new Date(now.toDateString())) / 864e5);
    const txt = days < 0 ? (days === -1 ? 'χθες' : `πριν ${-days} μέρες`) : days === 0 ? (i.due.length > 10 ? d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : 'σήμερα') : days === 1 ? 'αύριο' : d.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric' });
    return `<span class="due ${days < 0 ? 'late' : days === 0 ? 'today' : ''}">${txt}</span>`;
  }
  async update() {
    const ls = this.lists();
    this._items = await Promise.all(ls.map((l) => this._hass.callWS({ type: 'todo/item/list', entity_id: l.entity }).then((r) => r?.items || []).catch(() => [])));
    this.paint();
  }
  paint() {
    const ls = this.lists(), all = this._items || [];
    const open = all.map((it) => it.filter((i) => i.status === 'needs_action'));
    this.shadowRoot.querySelectorAll('.tab').forEach((b, k) => { b.classList.toggle('sel', k === this._sel); const n = (open[k] || []).length; b.querySelector('i').textContent = n; b.querySelector('i').hidden = !n; });
    const l = ls[this._sel]; if (!l) return;
    this.$('.card').style.setProperty('--tc', l.color);
    const o = [...(open[this._sel] || [])].sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1);
    const done = (all[this._sel] || []).filter((i) => i.status === 'completed').slice(0, 2);
    const h = o.length || done.length ? [...o, ...done].map((i) => `<div class="it${i.status === 'completed' ? ' done' : ''}" data-uid="${i.uid}"><span class="cb"></span><span class="tx">${i.summary}</span>${i.status === 'completed' ? '' : this.due(i)}</div>`).join('')
      : `<div class="empty"><span class="ms" style="color:${l.color}">${l.icon}</span>${{ shopping: 'Δεν λείπει τίποτα', reminders: 'Καμία υπενθύμιση', chores: 'Όλες οι δουλειές έγιναν' }[l.k]}</div>`;
    if (h !== this._bk) { this._bk = h; this.$('.body').innerHTML = h; }
    const late = o.filter((i) => i.due && new Date(i.due.length <= 10 ? i.due + 'T23:59' : i.due) < new Date()).length;
    this.$('.ft small').innerHTML = `<b>${l.title}</b> · ` + (late ? `${late} εκπρόθεσμ${late === 1 ? 'η' : 'α'}` : o.length ? `${o.length} ανοιχτ${o.length === 1 ? 'ό' : 'ά'}` : 'όλα εντάξει');
  }
}

/* ── Μουσική και τηλεόραση: ό,τι παίζει τώρα, και κάτω οι υπόλοιπες πηγές ── */
class WallMediaCard extends Wall2Card {
  static css2 = `
.card.v2{padding:12px;gap:10px}
.now{display:grid;grid-template-columns:52px 1fr;gap:12px;align-items:center}
.art{width:52px;height:52px;border-radius:12px;background:linear-gradient(140deg,#c0653a,#6b2d1a) center/cover;display:grid;place-items:center;color:#fff}
.mt{min-width:0}.mt b{display:block;font:800 14px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mt small{font:600 12px var(--w-font);color:var(--mut);white-space:nowrap}
.mp{height:4px;border-radius:2px;background:var(--line);margin-top:7px;overflow:hidden}.mp i{display:block;height:100%;background:#c0653a;width:0}
.mc{display:flex;justify-content:space-around;align-items:center}.mc button .ms{font-size:28px;color:var(--mut)}
.mc .pp{width:44px;height:44px;border-radius:50%;background:#c0653a;color:#fff;display:grid;place-items:center}.mc .pp .ms{color:#fff;font-size:26px}
.src{display:flex;gap:6px}.src button{flex:1;height:36px;border-radius:11px;border:1.5px solid color-mix(in srgb,var(--ink) 16%,transparent);display:flex;align-items:center;justify-content:center;gap:6px;font:700 12px var(--w-font);color:var(--mut);white-space:nowrap;overflow:hidden}
.src button.on{border-color:#c0653a;color:#c0653a}.src .ms{font-size:18px}
`;
  static getConfigForm() { return form([['entities', 'Ηχεία και τηλεοράσεις', { entity: { multiple: true, filter: { domain: 'media_player' } } }]]); }
  static getStubConfig(hass) { return { entities: [firstEntity(hass, 'media_player')].filter(Boolean) }; }
  getGridOptions() { return { columns: 6, rows: 3 }; }
  setConfig(c) { if (!c?.entities?.length) throw new Error('Χρειάζεται τουλάχιστον ένα media_player'); super.setConfig(c); }
  watched() { return this._config.entities; }
  template() {
    return `<div class="card"><div class="now"><div class="art"><span class="ms fill">music_note</span></div><div class="mt"><b></b><small></small><div class="mp"><i></i></div></div></div>
  <div class="mc"><button class="prev"><span class="ms fill">skip_previous</span></button><button class="pp"><span class="ms fill">play_arrow</span></button><button class="next"><span class="ms fill">skip_next</span></button></div>
  <div class="src"></div></div>`;
  }
  cur() {
    const ids = this._config.entities;
    return ids.find((id) => this.val(id) === 'playing') || (this._pick && ids.includes(this._pick) ? this._pick : null) || ids.find((id) => ['paused', 'on', 'idle'].includes(this.val(id))) || ids[0];
  }
  bind() {
    const go = (svc) => () => this.call('media_player', svc, { entity_id: this.cur() });
    this.$('.prev').addEventListener('click', go('media_previous_track'));
    this.$('.next').addEventListener('click', go('media_next_track'));
    this.$('.pp').addEventListener('click', go('media_play_pause'));
    this.$('.art').addEventListener('click', () => this.moreInfo(this.cur()));
    this.$('.src').addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]'); if (!b) return;
      this._pick = b.dataset.id;
      if (this.val(b.dataset.id) === 'off') this.call('media_player', 'turn_on', { entity_id: b.dataset.id });
      this.update();
    });
  }
  update() {
    const id = this.cur(), s = this.st(id), a = s?.attributes || {}, st = s?.state;
    const art = this.$('.art');
    art.style.backgroundImage = a.entity_picture ? cssUrl(a.entity_picture) : '';
    art.querySelector('.ms').hidden = !!a.entity_picture;
    art.querySelector('.ms').textContent = (a.device_class === 'tv' || /tv/i.test(id)) ? 'tv' : 'music_note';
    this.$('.mt b').textContent = a.media_title || (st === 'off' ? 'Σβηστό' : a.source || this.friendly(id));
    this.$('.mt small').textContent = [a.media_artist || a.app_name, a.friendly_name].filter(Boolean).join(' · ');
    const p = mediaProgress(s);
    this.$('.mp i').style.width = p != null ? `${p}%` : '0';
    this.$('.pp .ms').textContent = st === 'playing' ? 'pause' : 'play_arrow';
    this.$('.src').innerHTML = this._config.entities.map((e) => {
      const ss = this.st(e), tv = ss?.attributes?.device_class === 'tv' || /tv/i.test(e);
      return `<button data-id="${e}" class="${e === id && ss?.state !== 'off' ? 'on' : ''}"><span class="ms${ss?.state === 'playing' ? ' fill' : ''}">${tv ? 'tv' : 'speaker'}</span>${(ss?.attributes?.friendly_name || e).split(' ')[0]}</button>`;
    }).join('');
    this.tick(st === 'playing');
  }
}

/* ── Γρήγορες ενέργειες ── */
class WallActionsCard extends Wall2Card {
  static css2 = XP_CSS + `
:host{box-shadow:none}
.card.v2{padding:0;background:none;box-shadow:none;display:grid;gap:8px;grid-template-columns:var(--cols,1fr)}
button{border-radius:14px;background:var(--box);box-shadow:var(--sh);display:flex;align-items:center;gap:8px;padding:0 12px;font:700 13px var(--w-font);color:var(--ink);min-height:44px}
.icons button{justify-content:center;padding:0;width:52px}
:host{overflow:visible;position:relative;z-index:7}
.card.v2.mnu{height:100%}.mnu .tg{width:56px;height:100%;justify-content:center;padding:0;background:var(--box)}.mnu .tg .ms{font-size:24px;color:var(--accent)}
.mdrop{position:absolute;right:0;top:calc(100% + 8px);width:300px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;border-radius:20px;background:#f4f6f8;box-shadow:0 18px 40px rgba(20,30,40,.25);animation:mdin .25s cubic-bezier(.3,1.4,.5,1)}
.mdrop.v2{--box:#fff;--ink:#1c2228;--accent:#2f5fa8;--sh:0 1px 3px rgba(0,0,0,.08)}.mdrop.v2.dark{--box:#252d35;--ink:#e9eef2;--accent:#8fb5ef;background:#1b2127}
.mdrop button{min-height:56px}
@keyframes mdin{from{opacity:0;transform:translateY(-8px)}}.icons{grid-auto-flow:column;grid-template-columns:none!important}
button .ms{font-size:22px;color:var(--accent)}
.card.v2.rl{width:46px;height:46px;padding:0}.rl .tg{width:46px;height:46px;min-height:0;border-radius:14px;background:none;box-shadow:none;justify-content:center;padding:0}
.rl .tg .ms{color:#ffc15e;font-size:24px}.card.v2.rl.open .tg{background:#2f3a44}
.card.v2.rl.open{border-radius:14px}
.rdrop{left:calc(100% + 12px);right:auto;top:-6px;bottom:auto;width:300px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;border-radius:22px;transform-origin:left top}
.rdrop:not([hidden]){animation:rin .3s cubic-bezier(.2,.9,.25,1)}
@keyframes rin{from{clip-path:inset(0 100% 0 0 round 22px);opacity:.3}to{clip-path:inset(-40px -40px -40px 0 round 22px)}}
.rdrop .rh{grid-column:1/-1;font:800 11px var(--w-font);letter-spacing:.6px;color:var(--faint);text-transform:uppercase;margin:2px 4px 0}
.rdrop button{min-height:56px;background:var(--chip);box-shadow:none;border:0;border-radius:14px;display:flex;align-items:center;gap:8px;padding:0 12px;font:700 13px var(--w-font);color:var(--ink);cursor:pointer}
`;
  static getConfigForm() {
    return form([['mode', 'Μορφή', { select: { mode: 'dropdown', options: [{ value: 'grid', label: 'Κουμπιά' }, { value: 'menu', label: 'Ένα κουμπί που ανοίγει μενού' }] } }],
      ['columns', 'Στήλες', { number: { min: 1, max: 6, mode: 'box' } }], ['icons_only', 'Μόνο εικονίδια', { boolean: {} }]]);
  }
  static getStubConfig() { return { items: [] }; }
  getGridOptions() { return { columns: 3, rows: 4 }; }
  watched() { return []; }
  template() {
    const ic = this._config.icons_only;
    if (this._config.mode === 'rail') return `<div class="card rl"><button class="tg"><span class="ms fill">${this._config.icon || 'bolt'}</span></button></div>
  <div class="xp rdrop" hidden><div class="rh">Γρήγορες ενέργειες</div>${(this._config.items || []).map((it, i) => `<button data-i="${i}"><span class="ms">${it.icon || 'play_arrow'}</span>${it.name || ''}</button>`).join('')}</div>`;
    if (this._config.mode === 'menu') return `<div class="card mnu"><button class="tg"><span class="ms fill">${this._config.icon || 'bolt'}</span></button></div>
  <div class="mdrop v2" hidden>${(this._config.items || []).map((it, i) => `<button data-i="${i}"><span class="ms">${it.icon || 'play_arrow'}</span>${it.name || ''}</button>`).join('')}</div>`;
    return `<div class="card${ic ? ' icons' : ''}" style="--cols:repeat(${this._config.columns || 1},1fr)">${(this._config.items || []).map((it, i) =>
      `<button data-i="${i}" title="${it.name || ''}"><span class="ms">${it.icon || 'play_arrow'}</span>${ic ? '' : it.name || ''}</button>`).join('')}</div>`;
  }
  bind() {
    const run = (e) => { const b = e.target.closest('[data-i]'); if (b) { this.trigger(this._config.items[b.dataset.i].entity); if (this._config.mode === 'menu') this.$('.mdrop').hidden = true; } };
    if (this._config.mode === 'rail') {
      const x = expander(this, this.$('.rdrop'));
      this.$('.tg').addEventListener('click', (e) => { e.stopPropagation(); x.toggle(); });
      this.$('.rdrop').addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-i]'); if (b) { this.trigger(this._config.items[b.dataset.i].entity); x.close(); } });
      return;
    }
    if (this._config.mode !== 'menu') { this.$('.card').addEventListener('click', run); return; }
    const drop = this.$('.mdrop');
    this.$('.tg').addEventListener('click', (e) => { e.stopPropagation(); drop.hidden = !drop.hidden; });
    drop.addEventListener('click', run);
    this._away = (e) => { if (!drop.hidden && !e.composedPath().includes(this)) drop.hidden = true; };
    document.addEventListener('click', this._away);
  }
  disconnectedCallback() { super.disconnectedCallback?.(); if (this._away) document.removeEventListener('click', this._away); (this._xpOff || []).forEach((f) => f()); this._xpOff = []; }
  applyTheme() { super.applyTheme(); const d = this.$('.mdrop'); if (d) d.classList.toggle('dark', this.$('.card').classList.contains('dark')); }
  update() {}
}


/* ── Μπάρα κατάστασης: καιρός ή συνθήκες σπιτιού, σαν εικονίδιο· με πάτημα ανοίγει panel ── */
class WallStatusCard extends Wall2Card {
  static css2 = XP_CSS + `
.card.v2.sb{flex-direction:row;align-items:center;padding:0 4px;background:none;box-shadow:none;height:100%}
.it{border:0;background:none;color:var(--ink);display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:14px;cursor:pointer;font-family:var(--w-font);height:100%}
.it:active{background:var(--chip)}
.it .ms{font-size:34px;color:var(--ic,var(--mut))}
.it b{font:800 30px var(--w-font);letter-spacing:-1px;line-height:1}.it b small{font:700 15px var(--w-font);color:var(--mut);letter-spacing:0}
.it .tx{display:flex;flex-direction:column;line-height:1.15;text-align:left}.it .tx small{font:700 13px var(--w-font);color:var(--mut);white-space:nowrap}
.it .sep{width:1px;height:28px;background:var(--line);margin:0 2px}
.card.v2.sb.open{border-radius:20px 20px 0 0}
.xp.wide{right:auto;width:380px}
.xp h4{margin:8px 2px 6px;font:800 11px var(--w-font);letter-spacing:.6px;color:var(--faint);text-transform:uppercase}
.wfx{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.wfx div{background:var(--chip);border-radius:12px;padding:8px 6px;text-align:center;font:800 15px var(--w-font)}
.wfx small{display:block;font:700 10px var(--w-font);color:var(--mut);margin-bottom:2px}.wfx .ms{font-size:18px;color:var(--faint);display:block}
.hrs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}.hrs div{flex:1 0 46px;background:var(--chip);border-radius:12px;padding:6px 2px;text-align:center;font:800 14px var(--w-font)}
.hrs small{display:block;font:700 11px var(--w-font);color:var(--mut)}.hrs .ms{font-size:20px;display:block;color:var(--mut);margin:2px 0}.hrs i{display:block;font:700 10px var(--w-font);color:#3d8fe6;font-style:normal;min-height:12px}
.big{display:flex;gap:8px}.big>div{flex:1;background:var(--chip);border-radius:14px;padding:10px 12px}
.big b{font:800 28px var(--w-font);letter-spacing:-1px}.big small{display:block;font:700 12px var(--w-font);color:var(--mut)}
.gr{background:var(--chip);border-radius:14px;padding:8px 10px 4px;margin-top:6px}.gr svg{width:100%;height:84px;display:block}
.gr .ax{display:flex;justify-content:space-between;font:700 11px var(--w-font);color:var(--faint)}
.wsky{position:relative;height:150px;border-radius:16px;overflow:hidden;margin-top:4px}
.av{position:relative;width:54px;height:54px;flex:none;border-radius:50%;padding:3px;background:var(--rg,#c3cad0);transition:background .4s}
.av>span{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;border:2px solid var(--bg,#fff);background:var(--pc) center/cover;color:#fff;font:800 20px var(--w-font);box-sizing:border-box}
.av.away>span{filter:grayscale(.7);opacity:.7}.av.drv{--rg:#3d8fe6;animation:avp 1.6s ease-in-out infinite}
@keyframes avp{50%{box-shadow:0 0 0 5px rgba(61,143,230,.25)}}
.av i{position:absolute;right:-3px;bottom:-3px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--rg,#8b959e);color:#fff;font:normal 14px 'Material Symbols Rounded';font-feature-settings:'liga';border:2px solid var(--bg,#fff)}
.ppl{display:flex;flex-direction:column;gap:8px}.ppl>*{display:block;height:128px}
`;
  static getConfigForm() {
    return form([['kind', 'Είδος', { select: { mode: 'dropdown', options: [{ value: 'weather', label: 'Καιρός' }, { value: 'home', label: 'Συνθήκες σπιτιού' }, { value: 'people', label: 'Άτομα (avatars)' }] } }],
      ['entity', 'Καιρός', ent('weather')], ['temperature', 'Θερμοκρασία σπιτιού', ent('sensor')], ['humidity', 'Υγρασία σπιτιού', ent('sensor')]]);
  }
  static getStubConfig(hass) { return { kind: 'weather', entity: firstEntity(hass, 'weather') }; }
  getGridOptions() { return { columns: 3, rows: 1 }; }
  watched() { const c = this._config; return [c.entity, c.temperature, c.humidity, ...(c.extra || []).map((x) => x.entity), ...(c.people || []).flatMap((p) => [p.entity, p.driving_entity])]; }
  template() { return `<div class="card sb"><button class="it"></button></div><div class="xp wide" hidden></div>`; }
  bind() { const x = expander(this, this.$('.xp'), () => this.panel()); this.$('.it').addEventListener('click', (e) => { e.stopPropagation(); x.toggle(); }); this.$('.xp').addEventListener('click', (e) => e.stopPropagation()); }
  disconnectedCallback() { super.disconnectedCallback?.(); (this._xpOff || []).forEach((f) => f()); this._xpOff = []; this._unsub?.then?.((u) => u?.()); this._unsub = null; }
  update() {
    const c = this._config, it = this.$('.it');
    if (c.kind === 'people') {
      it.style.gap = '8px';
      it.innerHTML = (c.people || []).map((p) => {
        const s = this.st(p.entity), home = s?.state === 'home', drv = p.driving_entity && this.val(p.driving_entity) === 'on';
        const pic = s?.attributes?.entity_picture, nm = p.name || this.friendly(p.entity);
        return `<span class="av ${home ? '' : 'away'} ${drv ? 'drv' : ''}" style="--pc:${p.color || '#5f6b76'};${home ? '--rg:#3f9a62' : ''}" title="${nm}"><span style='${pic ? `background-image:${cssUrl(pic)}` : ''}'>${pic ? '' : nm[0]}</span><i>${drv ? 'directions_car' : home ? 'home' : 'location_on'}</i></span>`;
      }).join('');
      if (!this.$('.xp').hidden) (this._pc || []).forEach((e) => { e.hass = this._hass; });
      return;
    }
    if (c.kind === 'home') {
      const tv = this.num(c.temperature), hv = this.num(c.humidity);
      it.innerHTML = `<span class="ms fill" style="--ic:#e0702a">home</span><b>${isNaN(tv) ? '—' : fmt(tv, 1)}°</b><span class="sep"></span><span class="ms" style="--ic:#3d8fe6;font-size:24px">humidity_percentage</span><b>${isNaN(hv) ? '—' : Math.round(hv)}<small>%</small></b>`;
    } else {
      const s = this.st(c.entity), a = s?.attributes || {}, w = WX[s?.state] || ['', 'cloud'];
      it.innerHTML = `<span class="ms fill" style="--ic:${/sun|clear/.test(s?.state) ? '#f0a020' : '#8fa6bd'}">${w[1]}</span><b>${a.temperature != null ? Math.round(a.temperature) : '—'}°</b><span class="tx"><small>${w[0]}</small><small>${this._fc?.[0] ? `${Math.round(this._fc[0].templow ?? '')}° / ${Math.round(this._fc[0].temperature)}°` : ''}</small></span>`;
      if (!this._unsub && this._hass?.connection) {
        this._unsub = this._hass.connection.subscribeMessage((m) => { this._fc = m.forecast; this.update(); }, { type: 'weather/subscribe_forecast', forecast_type: 'daily', entity_id: c.entity }).catch(() => null);
        this._hass.connection.subscribeMessage((m) => { this._hr = m.forecast; if (!this.$('.xp').hidden) this.panel(); }, { type: 'weather/subscribe_forecast', forecast_type: 'hourly', entity_id: c.entity }).catch(() => null);
      }
    }
    if (!this.$('.xp').hidden && Date.now() - (this._pt || 0) > 60000) this.panel();
  }
  async panel() {
    this._pt = Date.now();
    const c = this._config, xp = this.$('.xp');
    if (c.kind === 'people') {
      if (!this._pc) this._pc = (c.people || []).map((p) => { const e = document.createElement('wall-person-tile'); e.setConfig({ type: 'custom:wall-person-tile', ...p }); return e; });
      if (!xp.querySelector('.ppl')) { xp.innerHTML = '<div class="ppl"></div>'; xp.firstChild.append(...this._pc); }
      this._pc.forEach((e) => { e.hass = this._hass; });
      return;
    }
    if (c.kind === 'home') {
      const tv = this.num(c.temperature), hv = this.num(c.humidity);
      xp.innerHTML = `<h4>Τώρα στο σπίτι</h4><div class="big"><div><small>Θερμοκρασία</small><b>${isNaN(tv) ? '—' : fmt(tv, 1)}°</b></div><div><small>Υγρασία</small><b>${isNaN(hv) ? '—' : Math.round(hv)}%</b></div></div>
${(c.extra || []).length ? `<div class="wfx" style="margin-top:6px">${c.extra.map((x) => `<div><small>${x.name || ''}</small>${this.val(x.entity) || '—'}</div>`).join('')}</div>` : ''}
<h4>Θερμοκρασία, 24 ώρες</h4><div class="gr" data-g="t"></div><h4>Υγρασία, 24 ώρες</h4><div class="gr" data-g="h"></div>`;
      const d = await fetchHistory(this._hass, [c.temperature, c.humidity].filter(Boolean), 24);
      const draw = (sel, pts, col, unit, dec) => {
        const box = xp.querySelector(sel); if (!box) return;
        if (!pts || pts.length < 2) { box.innerHTML = '<div class="ax">Δεν υπάρχουν δεδομένα</div>'; return; }
        const v = pts.map((x) => x[1]), lo = Math.min(...v), hi = Math.max(...v), pad = (hi - lo) * .15 || 1;
        const pth = smoothPath(pts, 300, 84, lo - pad, hi + pad, 24);
        box.innerHTML = `<svg viewBox="0 0 300 84" preserveAspectRatio="none"><path d="${pth.area}" fill="${col}" opacity=".16"/><path d="${pth.line}" fill="none" stroke="${col}" stroke-width="2.4" vector-effect="non-scaling-stroke"/></svg><div class="ax"><span>−24ω</span><span>${fmt(lo, dec)}${unit} – ${fmt(hi, dec)}${unit}</span><span>τώρα</span></div>`;
      };
      draw('[data-g="t"]', d[c.temperature], '#e0702a', '°', 1); draw('[data-g="h"]', d[c.humidity], '#3d8fe6', '%', 0);
      return;
    }
    const s = this.st(c.entity), a = s?.attributes || {};
    if (!this._sky) { this._sky = document.createElement('wall-sky'); this._sky.setConfig({ type: 'custom:wall-sky', entity: c.entity }); }
    this._sky.hass = this._hass;
    const hrs = (this._hr || []).slice(0, 8).map((f) => { const d = new Date(f.datetime), w = WX[f.condition] || ['', 'cloud'];
      return `<div><small>${pad2(d.getHours())}:00</small><span class="ms">${w[1]}</span>${Math.round(f.temperature)}°<i>${f.precipitation_probability ? f.precipitation_probability + '%' : ''}</i></div>`; }).join('');
    xp.innerHTML = `<div class="wsky"></div>${hrs ? `<h4>Επόμενες ώρες</h4><div class="hrs">${hrs}</div>` : ''}
<h4>Λεπτομέρειες</h4><div class="wfx"><div><span class="ms">humidity_percentage</span><small>Υγρασία</small>${a.humidity ?? '—'}%</div><div><span class="ms">air</span><small>Άνεμος</small>${a.wind_speed != null ? Math.round(a.wind_speed) : '—'}<small>${a.wind_speed_unit || ''}</small></div>
<div><span class="ms">compress</span><small>Πίεση</small>${a.pressure != null ? Math.round(a.pressure) : '—'}</div><div><span class="ms">thermostat</span><small>Αίσθηση</small>${a.apparent_temperature != null ? Math.round(a.apparent_temperature) + '°' : '—'}</div></div>`;
    xp.querySelector('.wsky').append(this._sky);
  }
}

/* ── Διάταξη της σελίδας: sidebar αριστερά, κέντρο, δεξιά στήλη, με ομάδες καρτών ──
   Κάθε περιοχή είναι λίστα από κάρτες ή ομάδες { group: 'ΚΛΙΜΑ', columns: 2, cards: [...] }. */
class WallLayoutCard extends HTMLElement {
  setConfig(config) {
    this._config = config;
    V2.theme = config.theme || 'auto';
    V2.style = config.style || 'A';
    this._built = false;
    if (this._hass) this.build();
  }
  set hass(hass) {
    this._hass = hass;
    if (!this._built) this.build();
    (this._cards || []).forEach((c) => { c.hass = hass; });
    const dark = V2.theme === 'dark' || (V2.theme === 'auto' && !!hass.themes?.darkMode);
    this.shadowRoot?.querySelector('.page')?.classList.toggle('dark', dark);
  }
  async build() {
    this._built = true;
    const tok = this._tok = (this._tok || 0) + 1;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    ensureFonts();
    const c = this._config, u = c.unit || 148;
    this.shadowRoot.innerHTML = `<style>
:host{display:block}
.page{--bg:#eef1f4;--line:#e3e7eb;--faint:#9aa4ad;--u:${u}px;box-sizing:border-box;height:${c.height || 'calc(100vh - var(--header-height, 56px))'};display:grid;grid-template-columns:${(c.nav || []).length ? '64px ' : ''}${c.columns || 'minmax(260px,20%) 1fr calc(var(--u) * 2 + 44px)'};grid-template-rows:auto 1fr;background:var(--bg);font-family:Manrope,sans-serif;overflow:hidden}
.rail{grid-row:1/3;position:relative;z-index:9;background:#1c2228;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 0}
.rail button{width:46px;height:46px;border-radius:14px;border:0;background:none;display:grid;place-items:center;color:#93a0ab;cursor:pointer;font-family:'Material Symbols Rounded';font-size:24px;font-feature-settings:'liga'}
.rail button.sel{background:#2f3a44;color:#fff}.rail .sp{flex:1}
.top{grid-column:${(c.nav || []).length ? 2 : 1}/-1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;padding:12px 16px 0;min-width:0;position:relative;z-index:20}
.top>div{display:flex;gap:10px;min-width:0}.top>.tl{justify-self:start}.top>.tc{justify-self:center}.top>.tr{justify-self:end}
.top>div>*{min-width:0;flex:none;height:calc(var(--u) / 2)}.top>div>.grow{flex:1}.top>div>.rcol{flex:none;width:calc(var(--u) * 2 + 12px)}.rail>.rc{margin:4px 0}
.side{grid-row:2}
.page.dark{--bg:#0f1316;--line:#2a323a;--faint:#5f6b76}
.area{display:flex;flex-direction:column;gap:10px;padding:14px 16px;min-height:0;min-width:0;overflow:hidden}
.side{padding-right:4px}
.mid{padding-left:4px;padding-right:4px}
.area>*{flex:none;height:auto}
.area>.grow,.grow{flex:1 1 0;min-height:0;height:auto}
.area>.push{margin-top:auto}
.row{display:grid;gap:12px;grid-auto-columns:1fr;grid-auto-flow:column}
.grp{font:800 12px Manrope,sans-serif;color:var(--faint);letter-spacing:.5px;margin:2px 4px -6px;text-transform:uppercase}
.grid{display:grid;gap:12px}
.grid>*{aspect-ratio:1;min-width:0}
.grid.free>*{aspect-ratio:auto}
.grid.fix{grid-template-columns:repeat(var(--c),var(--u))!important}
.grid.fix>*{width:var(--u);height:var(--u);aspect-ratio:auto}
.grid.fix>.span2{grid-column:span 2;width:auto;aspect-ratio:auto}
.grid>.span2{grid-column:span 2;aspect-ratio:2/1}
.bottom{display:flex;gap:14px;align-items:flex-start}
.bottom>div{display:flex;flex-direction:column;gap:10px;flex:1;min-width:0}
.bottom .fillw{flex:none;align-self:stretch}
.bottom .grid{grid-template-columns:repeat(var(--c),1fr)}
.push{margin-top:auto}
</style><div class="page">${(c.nav || []).length ? `<nav class="rail">${c.nav.map((n, i) => `${n.bottom ? '<span class="sp"></span>' : ''}<button data-n="${i}" title="${n.name || ''}">${n.icon}</button>`).join('')}</nav>` : ''}<div class="area side"></div><div class="top"><div class="tl"></div><div class="tc"></div><div class="tr"></div></div><div class="area mid"></div><div class="area right"></div></div>`;
    const helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null;
    if (tok !== this._tok) return; /* νεότερο build ξεκίνησε στο μεταξύ: χωρίς διπλές κάρτες */
    const make = (cfg) => {
      const tag = cfg.type.startsWith('custom:') ? cfg.type.slice(7) : `hui-${cfg.type}-card`;
      let e;
      if (helpers && !customElements.get(tag)) e = helpers.createCardElement(cfg);
      else { e = document.createElement(tag); try { e.setConfig(cfg); } catch (err) { e = document.createElement('div'); e.textContent = err.message; } }
      if (this._hass) e.hass = this._hass;
      this._cards.push(e);
      return e;
    };
    this._cards = [];
    const fill = (host, items) => (items || []).forEach((it) => {
      if (it.group != null || it.cards) {
        if (it.group) host.append(Object.assign(document.createElement('div'), { className: 'grp', textContent: it.group }));
        const g = document.createElement('div');
        g.className = it.row ? 'row' : 'grid';
        if (!it.row) g.style.gridTemplateColumns = `repeat(${it.columns || 2},1fr)`;
        g.style.setProperty('--c', it.columns || 2);
        if (it.fixed !== false && !it.rows && it.square !== false && !it.row) g.classList.add('fix');
        if (it.rows) { g.style.gridTemplateRows = it.rows; g.classList.add('free'); }
        if (it.square === false) g.classList.add('free');
        if (it.height) g.style.height = it.height;
        it.cards.forEach((cc) => { const e = make(cc); if (cc.span === 2) e.classList.add('span2'); g.append(e); });
        host.append(g);
      } else if (it.bottom) {
        const b = document.createElement('div'); b.className = 'bottom';
        it.bottom.forEach((part) => {
          const col = document.createElement('div');
          if (part.fill) col.className = 'fillw';
          if (part.group) col.append(Object.assign(document.createElement('div'), { className: 'grp', textContent: part.group }));
          const g = document.createElement('div');
          g.className = part.fill ? 'fillw' : 'grid';
          g.style.setProperty('--c', part.columns || 2);
          if (part.fill) { g.style.display = 'flex'; g.style.flexDirection = 'column'; }
          part.cards.forEach((cc) => { const e = make(cc); if (part.fill) e.style.flex = '1'; g.append(e); });
          col.append(g); b.append(col);
        });
        host.append(b);
      } else {
        const e = make(it);
        if (it.grow) e.classList.add('grow');
        if (it.push) e.classList.add('push');
        if (it.width === 'right') e.classList.add('rcol');
        if (it.height) e.style.height = it.height;
        host.append(e);
      }
    });
    const [side, mid, right] = this.shadowRoot.querySelectorAll('.area');
    fill(side, c.sidebar); fill(mid, c.center); fill(right, c.right);
    const top = this.shadowRoot.querySelector('.top');
    const slot = { left: '.tl', right: '.tr' };
    (c.top || []).forEach((it) => fill(top.querySelector(slot[it.align] || '.tc'), [it])); top.hidden = !(c.top || []).length;
    const rail = this.shadowRoot.querySelector('.rail');
    if (rail) {
      const mark = () => rail.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('sel', location.pathname === c.nav[b.dataset.n].path || location.pathname.endsWith('/' + c.nav[b.dataset.n].path)));
      rail.addEventListener('click', (e) => {
        const b = e.target.closest('[data-n]'); if (!b) return;
        const n = c.nav[b.dataset.n];
        if (n.entity) return this._hass?.callService(...(n.entity.startsWith('script.') ? ['script', 'turn_on'] : ['homeassistant', 'toggle']), { entity_id: n.entity });
        history.pushState(null, '', n.path);
        window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
        mark();
      });
      mark();
      (c.rail || []).forEach((it) => { const e = make(it); e.classList.add('rc'); rail.insertBefore(e, rail.querySelector('.sp') || null); });
    }
    if (this._hass) this.hass = this._hass;
    /* Ύψος = ό,τι μένει ως το κάτω μέρος της οθόνης, με ή χωρίς τη μπάρα του HA (kiosk) */
    if (!c.height) {
      const page = this.shadowRoot.querySelector('.page');
      const fit = () => { const top = this.getBoundingClientRect().top; if (top >= 0) page.style.height = `${Math.max(400, window.innerHeight - top)}px`; };
      fit(); setTimeout(fit, 300); setTimeout(fit, 1500);
      if (!this._onResize) { this._onResize = () => fit(); window.addEventListener('resize', this._onResize); }
    }
  }
  disconnectedCallback() { if (this._onResize) { window.removeEventListener('resize', this._onResize); this._onResize = null; } }
  connectedCallback() { if (this._built) { this._built = false; this.build(); } }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 'full', rows: 'auto' }; }
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
register('wall-switch-card', WallSwitchCard, 'Wall · Διακόπτης', 'Rocker που γέρνει, κουκκίδες φωτεινότητας και το χρώμα της λάμπας.');
register('wall-lock-card', WallLockCard, 'Wall · Κλειδαριά', 'Μεταλλική κλειδαριά με πόμολο που γυρίζει.');
register('wall-opener-card', WallOpenerCard, 'Wall · Είσοδος', 'Θυροτηλέφωνο: άνοιγμα πόρτας και άνοιγμα στο κουδούνι.');
register('wall-washer-card', WallWasherCard, 'Wall · Πλυντήριο', 'Πρόσοψη πλυντηρίου: πόρτα με νερό, χρόνος στην οθόνη.');
register('wall-dryer-card', WallDryerCard, 'Wall · Στεγνωτήριο', 'Πρόσοψη στεγνωτηρίου: ζεστή πόρτα, χρόνος στην οθόνη.');
register('wall-dishwasher-card', WallDishwasherCard, 'Wall · Πλυντήριο πιάτων', 'Πρόσοψη με χειρολαβή και παράθυρο με πιάτα.');
register('wall-climate-card', WallClimateCard, 'Wall · Κλίμα', 'Στρογγυλός θερμοστάτης ή εσωτερική μονάδα κλιματιστικού.');
register('wall-ac-card', WallAcCard, 'Wall · Κλιματιστικό', 'Εσωτερική μονάδα με οθόνη, −/+ θερμοκρασίας και πλήκτρο ταχύτητας ανεμιστήρα.');
register('wall-boiler-card', WallBoilerCard, 'Wall · Λέβητας', 'Λέβητας αερίου: πρόσοψη με οθόνη στόχου, −/+ και on/off.');
register('wall-heater-card', WallHeaterCard, 'Wall · Θερμοσίφωνας', 'Κύλινδρος που ζεσταίνεται, με χρονοδιακόπτη.');
register('wall-purifier-card', WallPurifierCard, 'Wall · Καθαριστής αέρα', 'Πύργος με φωτεινό δαχτυλίδι στο χρώμα της ποιότητας.');
register('wall-air-card', WallAirCard, 'Wall · Ποιότητα αέρα', 'Επιτοίχιος αισθητήρας: PM2.5 με CO₂, VOC και PM10.');
register('wall-vacuum-card', WallVacuumCard, 'Wall · Σκούπα', 'Το ρομπότ από πάνω, με έναρξη, παύση και επιστροφή.');
register('wall-tv-card', WallTvCard, 'Wall · Τηλεόραση', 'Πλατιά κάρτα: οθόνη με ό,τι παίζει και τηλεχειριστήριο.');
register('wall-music-card', WallMusicCard, 'Wall · Μουσική', 'Πλατιά κάρτα: πικάπ με το εξώφυλλο στον δίσκο.');
register('wall-car-card', WallCarCard, 'Wall · Αυτοκίνητο', 'Πλατιά κάρτα: μπαταρία, αυτονομία, πινακίδα και γρήγορες ενέργειες.');
register('wall-room-card', WallRoomCard, 'Wall · Δωμάτιο', 'Πλατιά κάρτα: θερμοκρασία και υγρασία με ζώνη άνεσης και καμπύλη 24 ωρών· και για όλο το σπίτι.');
register('wall-weather-card', WallWeatherCard, 'Wall · Καιρός', 'Πλατιά κάρτα: ουρανός που αλλάζει με τις συνθήκες, πρόγνωση και insight.');
register('wall-person-card', WallPersonCard, 'Wall · Άτομο', 'Πλατιά κάρτα: χάρτης, avatar με κατάσταση (σπίτι, εκτός, οδηγεί), απόσταση και διεύθυνση.');
register('wall-dehumidifier-card', WallDehumidifierCard, 'Wall · Αφυγραντήρας', 'Φορητή συσκευή με οθόνη υγρασίας· popup με στόχο και επιλογή δωματίου.');

register('wall-tile', WallTileCard, 'Wall v2 · Συσκευή', 'Ήσυχο πλακίδιο 1×1: εικονίδιο, ⏻, τιμή, −/+ ή πρόοδος, για κάθε συσκευή.');
register('wall-today', WallTodayCard, 'Wall v2 · Ημερολόγιο', 'Ώρα, μήνας και τα επόμενα γεγονότα.');
register('wall-sky', WallSkyCard, 'Wall v2 · Καιρός', 'Ουρανός με κίνηση, τρέχουσες συνθήκες και 3 ημέρες.');
register('wall-stat', WallStatCard, 'Wall v2 · Μέτρηση', 'Μικρή κάρτα για θερμοκρασία, υγρασία, CO₂, PM2.5, VOC: τίτλος, τιμή, τάση, γράφημα.');
register('wall-home', WallHomeCard, 'Wall v2 · Συνθήκες σπιτιού', 'Θερμοκρασία, υγρασία, CO₂/VOC, τάση και 24ωρο.');
register('wall-person-tile', WallPersonTile, 'Wall v2 · Άτομο', 'Αχνός χάρτης και κατάσταση· «Έρχεται» με ώρα άφιξης και πρόοδο.');
register('wall-car-tile', WallCarTile, 'Wall v2 · Αυτοκίνητο', 'Μπαταρία, αυτονομία, προθέρμανση ή φθηνότερη τιμή καυσίμου.');
register('wall-plan', WallPlanCard, 'Wall v2 · Κάτοψη', 'Λάμπες και θερμοκρασίες στο σπίτι, με κλειδαριές, κατανάλωση και κάμερες στις γωνίες.');
register('wall-notices', WallNoticeCard, 'Wall v2 · Ειδοποιήσεις', 'Ως 4 θέσεις για ό,τι θέλει προσοχή.');
register('wall-shopping', WallShopCard, 'Wall v2 · Ψώνια', 'Λίστα ψωνιών από todo, με τικ και προσθήκη.');
register('wall-media', WallMediaCard, 'Wall v2 · Μουσική και TV', 'Ό,τι παίζει τώρα, με εναλλαγή πηγής.');
register('wall-actions', WallActionsCard, 'Wall v2 · Γρήγορες ενέργειες', 'Κουμπιά για σκηνές και scripts.');
register('wall-status', WallStatusCard, 'Wall v2 · Μπάρα κατάστασης', 'Καιρός ή συνθήκες σπιτιού σαν εικονίδιο στη μπάρα· με πάτημα ανοίγει panel με πρόγνωση ή διαγράμματα.');
register('wall-family', WallFamilyCard, 'Wall v2 · Family Matters', 'Ψώνια, υπενθυμίσεις και δουλειές σε μία κάρτα με καρτέλες.');
register('wall-layout', WallLayoutCard, 'Wall v2 · Σελίδα', 'Η σελίδα του tablet: sidebar, κέντρο και δεξιά στήλη, με θέμα και στιλ.');

/* Για τη σελίδα δοκιμής και για πειραματισμό από την κονσόλα */
window.wallCards = { VERSION, openPopup, popSection, popChips, popSwatches, popSlider, popStepper };

console.info(`%c WALL-CARDS %c v${VERSION} `, 'background:#1c2228;color:#fff;border-radius:4px 0 0 4px', 'background:#e1e6eb;color:#1c2228;border-radius:0 4px 4px 0');
