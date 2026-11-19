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
const VERSION = '0.5.0';

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
.air{position:absolute;left:8%;right:8%;top:calc(46% + 8px);height:50px;opacity:0;transition:opacity .5s;
  -webkit-mask-image:linear-gradient(180deg,#000 20%,transparent);mask-image:linear-gradient(180deg,#000 20%,transparent)}
.air i{position:absolute;top:0;width:3px;height:100%;border-radius:2px;background:repeating-linear-gradient(180deg,var(--a) 0 8px,transparent 8px 16px);opacity:.8}
.on .air{opacity:1}
.on .air i{animation:ac-blow var(--sp,1s) linear infinite}
@keyframes ac-blow{to{background-position:0 16px}}
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
<div class="card">
  <div class="unit"><div class="vent"><i></i><i></i><i></i></div><div class="led"></div><div class="seg"></div><div class="flap"></div></div>
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="air">${[10, 30, 50, 70, 90].map((l, i) => `<i style="left:${l}%;animation-delay:${(i * 0.17).toFixed(2)}s"></i>`).join('')}</div>
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
    /* Πιο γρήγορος αέρας σε μεγαλύτερη ταχύτητα */
    const m = String(mode || '').toLowerCase();
    const lvl = /^\d+$/.test(m) ? +m : m === 'silence' ? 0.5 : 3;
    card.style.setProperty('--sp', (1.6 - lvl * 0.2).toFixed(2) + 's');
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
  <div class="hot"><i style="left:22%"></i><i style="left:66%;animation-delay:1.3s"></i><i style="left:44%;animation-delay:2.3s"></i></div>
  ${TAG}
  <button class="pw ms" aria-label="On/Off">power_settings_new</button>
  <div class="arc"></div>
  <div class="ring"><div class="ticks"></div><div class="ptr"></div><div class="face"><div><span class="big"></span><span class="hint"></span></div></div></div>
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
    /* Περιστροφή του δακτυλίου: ένας πλήρης κύκλος = μέγιστη διάρκεια, κάθε γραμμούλα = 1 λεπτό */
    const ring = this.$('.ring');
    const angle = (e) => {
      const r = ring.getBoundingClientRect();
      return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    };
    const commit = (mins) => {
      if (this.left() != null) this.call('timer', 'start', { entity_id: this._config.timer_entity, duration: hms(Math.max(1, mins) * 60) });
      else this._dur = Math.max(1, mins);
    };
    ring.addEventListener('pointerdown', (e) => {
      if (!this._config.timer_entity || !this.available(this._config.entity)) return;
      ring.setPointerCapture(e.pointerId);
      ring.classList.add('live');
      let last = angle(e);
      const left = this.left();
      this._drag = left != null ? left / 60 : this._dur;
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
      if (!this._config.timer_entity) return;
      e.preventDefault();
      const left = this.left();
      const cur = left != null ? Math.ceil(left / 60) : this._dur;
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
    this.$('.ring').style.cursor = c.timer_entity ? '' : 'default';

    const held = this._hold && Date.now() < this._hold.until ? this._hold.mins : null;
    if (held == null) this._hold = null;
    let mins, hint, fill;
    if (this._drag != null || held != null) {
      mins = this._drag != null ? Math.round(this._drag) : held;
      hint = on ? 'απομένουν' : 'διάρκεια';
      fill = on ? 60 : 0;
    } else if (left != null) {
      const total = (toMinutes({ state: this.st(c.timer_entity).attributes.duration || '' }) || this._dur) * 60;
      mins = Math.ceil(left / 60);
      hint = 'απομένουν';
      fill = clamp((1 - left / total) * 100, 12, 100);
    } else if (on) {
      mins = null; hint = ''; fill = 100;
    } else {
      mins = c.timer_entity ? this._dur : null; hint = !ok ? 'Μη διαθέσιμος' : c.timer_entity ? 'διάρκεια' : ''; fill = 0;
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
.card:not(.on) .seg{color:#2c3a46;text-shadow:none}
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
    const run = on && (c.running_entity ? this.val(c.running_entity) === 'on' : isNaN(w) || w > 5);
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

/* Για τη σελίδα δοκιμής και για πειραματισμό από την κονσόλα */
window.wallCards = { VERSION, openPopup, popSection, popChips, popSwatches, popSlider, popStepper };

console.info(`%c WALL-CARDS %c v${VERSION} `, 'background:#1c2228;color:#fff;border-radius:4px 0 0 4px', 'background:#e1e6eb;color:#1c2228;border-radius:0 4px 4px 0');
