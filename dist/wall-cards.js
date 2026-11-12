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
const VERSION = '0.2.0';

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
  --w-hot:oklch(0.62 0.17 35); --w-cold:oklch(0.55 0.13 240);
  --w-font:'Manrope',sans-serif;
  --w-spring:cubic-bezier(.3,1.4,.5,1);
  display:block; height:100%;
  font-family:var(--w-font); color:var(--w-ink);
  -webkit-font-smoothing:antialiased;
}
*{box-sizing:border-box}
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
.sub{font:500 13px var(--w-font);color:var(--w-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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

  /* Πάτημα στο σώμα της κάρτας (όχι σε κουμπί) ανοίγει τις λεπτομέρειες */
  tapMore() {
    const card = this.$('.card');
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.composedPath().some((n) => n.tagName === 'BUTTON')) return;
      this.moreInfo(this._config.entity);
    });
  }

  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 4, min_columns: 4, min_rows: 4 }; }
}

/* Πλατιά κάρτα (2 × 1) */
class WallWideCard extends WallBaseCard {
  getGridOptions() { return { columns: 12, rows: 4, min_columns: 8, min_rows: 4 }; }
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

/* ── Φως: ψηλή κάρτα, σύρσιμο πάνω-κάτω για φωτεινότητα, διακόπτης κάτω ── */
class WallLightCard extends WallBaseCard {
  static css = `
:host{--w-min-h:468px}
.card{padding:0;border-radius:22px;color:#2d2a24;justify-content:flex-start;
  background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:0 14px 28px rgba(40,45,55,.16),0 3px 6px rgba(40,45,55,.10),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05)}
.card.on{background:linear-gradient(180deg,#fdfdfb,#f1efea)}
.zone{flex:1;position:relative;overflow:hidden;touch-action:none;cursor:ns-resize}
.zone.nodim{cursor:default}
.glow{position:absolute;left:0;right:0;bottom:0;transition:height .12s,opacity .35s;
  background:linear-gradient(180deg,oklch(0.93 0.07 85),oklch(0.88 0.1 80))}
.grip{position:absolute;left:0;right:0;display:flex;justify-content:center;transition:bottom .12s,opacity .35s}
.grip span{width:40px;height:4px;border-radius:2px;background:rgba(80,60,20,.25);margin-bottom:-12px}
.top{padding:18px 18px 0}
.name{font:600 18px var(--w-font)}
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

  static getConfigForm() {
    return form([
      ['entity', 'Φως', ent('light'), true],
      ['name', 'Όνομα (προαιρετικό)', TEXT],
    ]);
  }
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
    <div class="top"><span class="name"></span><button class="tune ms" aria-label="Ρυθμίσεις">tune</button></div>
    <div class="leds">${'<span></span>'.repeat(8)}</div>
    <span class="pct"></span>
  </div>
  <button class="rocker" aria-label="Άναμμα/Σβήσιμο"><span class="ms">power_settings_new</span></button>
</div>`;
  }

  bind() {
    const zone = this.$('.zone');
    this.$('.tune').addEventListener('pointerdown', (e) => e.stopPropagation());
    this.$('.tune').addEventListener('click', () => this.moreInfo(this._config.entity));
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
    this.$('.name').textContent = this._config.name || this.friendly(id);
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

/* ── Διακόπτης: μικρή κάρτα-πλήκτρο τοίχου για οτιδήποτε ανάβει και σβήνει ── */
class WallSwitchCard extends WallBaseCard {
  static css = `
.card{padding:0;border-radius:22px;color:#2d2a24;cursor:pointer;transition:background .2s,box-shadow .2s,opacity .3s;
  background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:0 14px 28px rgba(40,45,55,.16),0 3px 6px rgba(40,45,55,.10),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05)}
.card.on{background:linear-gradient(180deg,#ebe8e1,#f3f1ec);box-shadow:inset 0 3px 8px rgba(0,0,0,.12),0 2px 4px rgba(40,45,55,.08)}
.name{position:absolute;left:14px;top:12px;right:44px;font:600 15px var(--w-font)}
.tune{position:absolute;right:6px;top:6px;width:40px;height:40px;border-radius:50%;color:#a8a296;font-size:22px}
.pwr{position:absolute;left:0;right:0;bottom:18%;display:grid;place-items:center;font-size:34px;transition:color .3s,text-shadow .3s}
.on .pwr{color:oklch(0.62 0.15 70);text-shadow:0 0 12px oklch(0.8 0.14 80 / .8)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Συσκευή', ent(['light', 'switch', 'input_boolean', 'fan']), true],
      ['name', 'Όνομα (προαιρετικό)', TEXT],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'switch') || firstEntity(hass, 'light') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card" role="button" aria-label="Άναμμα/Σβήσιμο">
  <span class="name"></span>
  <button class="tune ms" aria-label="Ρυθμίσεις">tune</button>
  <span class="pwr ms">power_settings_new</span>
</div>`;
  }

  bind() {
    this.$('.tune').addEventListener('click', (e) => { e.stopPropagation(); this.moreInfo(this._config.entity); });
    this.$('.card').addEventListener('click', () => {
      if (this.available(this._config.entity)) this.call('homeassistant', 'toggle', { entity_id: this._config.entity });
    });
  }

  update() {
    const id = this._config.entity;
    const card = this.$('.card');
    card.classList.toggle('unavail', !this.available(id));
    card.classList.toggle('on', this.val(id) === 'on');
    this.$('.name').textContent = this._config.name || this.friendly(id);
  }
}

/* ── Κλειδαριά: μεταλλική πλάκα με πόμολο που γυρίζει ── */
const LOCK_LABELS = {
  locked: 'Κλειδωμένη', unlocked: 'Ξεκλείδωτη', locking: 'Κλειδώνει…', unlocking: 'Ξεκλειδώνει…',
  jammed: 'Μπλοκαρισμένη', open: 'Ανοιχτή', opening: 'Ανοίγει…',
};

class WallLockCard extends WallBaseCard {
  static css = `
.card.open{background:oklch(0.93 0.05 60)}
.col{position:relative;display:flex;flex-direction:column;gap:6px;align-items:center;height:100%;justify-content:space-between;flex:1}
.head{align-self:stretch}
.plate{flex:none;width:68px;height:100px;border-radius:34px;position:relative;
  background:linear-gradient(145deg,#f7f8f9 0%,#d5d9dd 45%,#eceff1 60%,#bfc5ca 100%);
  box-shadow:0 8px 16px rgba(30,40,50,.22),0 2px 3px rgba(30,40,50,.18),inset 0 1px 1px #fff,inset 0 -2px 3px rgba(0,0,0,.12)}
.led{position:absolute;top:7px;left:50%;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;
  transition:background .3s,box-shadow .3s;background:var(--c);box-shadow:0 0 6px var(--c),inset 0 1px 1px rgba(255,255,255,.5)}
.ring{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-23px 0 0 -26px;border-radius:50%;
  background:linear-gradient(160deg,#c9ced3,#f3f5f6);box-shadow:inset 0 3px 6px rgba(0,0,0,.25),inset 0 -1px 1px #fff}
.knob{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-19px 0 0 -22px;border-radius:50%;
  transition:transform .5s var(--w-spring);
  background:radial-gradient(circle at 35% 30%,#ffffff,#dfe3e6 40%,#aeb5bb 100%);box-shadow:0 4px 8px rgba(0,0,0,.3),inset 0 1px 1px #fff}
.locked .knob{transform:rotate(90deg)}
.knob span{position:absolute;left:50%;top:5px;bottom:5px;width:14px;margin-left:-7px;border-radius:7px;
  background:linear-gradient(90deg,#b4bbc1,#f4f6f7 45%,#c3c9ce);box-shadow:0 2px 3px rgba(0,0,0,.3),inset 0 1px 0 #fff}
.slot{position:absolute;bottom:7px;left:50%;width:5px;height:10px;margin-left:-3px;border-radius:3px;background:#3a4148;box-shadow:inset 0 2px 2px #000,0 1px 0 #fff}
.foot{display:flex;flex-direction:column;gap:1px;min-width:0;align-items:center;text-align:center}
.state{font:700 16px var(--w-font);line-height:1.2;transition:color .3s;color:var(--c)}
.batt{font:500 12px var(--w-font);color:var(--w-muted);display:flex;align-items:center;gap:2px}
.batt .ms{font-size:14px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Κλειδαριά', ent('lock'), true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['subtitle', 'Υπότιτλος (προαιρετικό)', TEXT],
      ['battery_entity', 'Μπαταρία (προαιρετικό)', ent('sensor', 'battery')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'lock') }; }

  watched() { return [this._config.entity, this._config.battery_entity]; }

  template() {
    return `
<div class="card"><div class="col">
  <div class="head"><span class="title"></span><span class="sub"></span></div>
  <button class="plate press" aria-label="Κλείδωμα/Ξεκλείδωμα">
    <span class="led"></span><span class="ring"></span><span class="knob"><span></span></span><span class="slot"></span>
  </button>
  <div class="foot"><span class="state"></span><span class="batt"><span class="ms"></span><span class="bv"></span></span></div>
</div></div>`;
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
    card.classList.toggle('open', ok && !locked);
    card.style.setProperty('--c', !ok ? 'var(--w-faint)' : locked ? 'var(--w-ok)' : 'var(--w-warn)');
    this.$('.title').textContent = c.name || 'Κλειδαριά';
    this.$('.sub').textContent = c.subtitle || this.friendly(c.entity);
    this.$('.state').textContent = ok ? LOCK_LABELS[s] || s : 'Μη διαθέσιμη';

    const lvl = this.num(c.battery_entity);
    this.$('.batt').hidden = isNaN(lvl);
    if (!isNaN(lvl)) {
      const bars = Math.round((lvl / 100) * 6);
      this.$('.batt .ms').textContent = bars >= 6 ? 'battery_full' : `battery_${bars}_bar`;
      this.$('.bv').textContent = Math.round(lvl) + '%';
    }
  }
}

/* ── Είσοδος πολυκατοικίας: θυροτηλέφωνο με χρυσό κουμπί και «άνοιγμα στο κουδούνι» ── */
class WallOpenerCard extends WallBaseCard {
  static css = `
@keyframes bld-ring{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.9);opacity:0}}
@keyframes bld-buzz{0%,100%{translate:0 0}25%{translate:-1.5px 0}75%{translate:1.5px 0}}
.card,.card.on{padding:14px 16px;background:linear-gradient(160deg,#f1f3f4,#d6dadd 60%,#c3c8cc);
  box-shadow:inset 0 1px 0 #fff,inset 0 -2px 4px rgba(0,0,0,.12)}
.title{text-shadow:0 1px 0 #fff}
.sub{transition:color .3s;color:var(--fg,var(--w-muted))}
.bell{flex:none;width:44px;height:44px;margin:-6px -6px 0 0;border-radius:50%;display:grid;place-items:center;font-size:22px;
  transition:background .3s,color .3s,box-shadow .2s;color:#3b4148;
  background:linear-gradient(180deg,#fbfcfc,#dfe3e6);box-shadow:0 2px 4px rgba(0,0,0,.18),inset 0 1px 0 #fff}
.rto .bell{background:oklch(0.78 0.15 75);color:#3a2a08;box-shadow:inset 0 2px 4px rgba(0,0,0,.25),0 0 10px oklch(0.78 0.15 75 / .5)}
.panel{display:flex;align-items:center;justify-content:space-between;gap:8px}
.grille{display:grid;grid-template-columns:repeat(3,4px);gap:4px;flex:none}
.grille span{width:4px;height:4px;border-radius:50%;background:#5f676e;box-shadow:inset 0 1px 1px rgba(0,0,0,.5),0 1px 0 #fff}
.socket{flex:none;width:96px;height:96px;border-radius:50%;display:grid;place-items:center;position:relative;
  background:linear-gradient(160deg,#aeb5ba,#e8ebed);box-shadow:inset 0 3px 6px rgba(0,0,0,.28),0 1px 0 #fff}
.wave{position:absolute;inset:8px;border-radius:50%;border:2px solid oklch(0.72 0.15 80);pointer-events:none;opacity:0}
.opening .wave{animation:bld-ring 1.2s ease-out infinite}
.key{position:relative;width:80px;height:80px;border-radius:50%;display:grid;place-items:center;font-size:34px;color:#5a4317;
  transition:transform .12s,box-shadow .12s,color .3s;
  background:radial-gradient(circle at 35% 30%,#f7e2a8,#d1a752 50%,#9c7428 100%);
  box-shadow:0 4px 6px rgba(0,0,0,.5),inset 0 1px 1px #fff8de,inset 0 -2px 3px rgba(0,0,0,.25)}
.opening .key{transform:translateY(2px) scale(.96);color:#2f2410;animation:bld-buzz .07s linear infinite;
  box-shadow:0 1px 2px rgba(0,0,0,.5),inset 0 2px 4px rgba(0,0,0,.35)}
.bar{flex:none;width:4px;height:36px;border-radius:2px;transition:background .3s,box-shadow .3s;background:var(--led);box-shadow:0 0 8px var(--led)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Θυροτηλέφωνο (lock)', ent('lock'), true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['subtitle', 'Υπότιτλος σε ηρεμία (προαιρετικό)', TEXT],
      ['rto_entity', 'Άνοιγμα στο κουδούνι (προαιρετικό)', ent(['switch', 'input_boolean', 'lock'])],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'lock') }; }
  watched() { return [this._config.entity, this._config.rto_entity]; }

  template() {
    return `
<div class="card">
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub"></span></div>
    <button class="bell ms fill" aria-label="Άνοιγμα στο κουδούνι">notifications_active</button>
  </div>
  <div class="panel">
    <span class="grille">${'<span></span>'.repeat(12)}</span>
    <span class="socket">
      <span class="wave"></span><span class="wave" style="animation-delay:.4s"></span><span class="wave" style="animation-delay:.8s"></span>
      <button class="key ms" aria-label="Άνοιγμα εισόδου">key</button>
    </span>
    <span class="bar"></span>
  </div>
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
    card.style.setProperty('--fg', opening ? 'oklch(0.5 0.13 150)' : rto ? 'oklch(0.55 0.13 65)' : 'var(--w-muted)');
    this.$('.title').textContent = c.name || 'Είσοδος';
    this.$('.sub').textContent = !ok ? 'Μη διαθέσιμη' : opening ? 'Ανοιχτή' : rto ? 'Ανοίγει στο κουδούνι' : c.subtitle || 'Πολυκατοικία';
  }
}

/* ── Οικιακές συσκευές με πρόγραμμα: πλυντήριο, στεγνωτήριο, πλυντήριο πιάτων ── */
const APPL_IDLE = ['off', 'idle', 'standby', 'power off', 'ready', 'none', '-', ''];
const APPL_DONE = ['finished', 'complete', 'completed', 'end', 'done'];
const APPL_PAUSED = ['pause', 'paused'];

class WallApplianceCard extends WallBaseCard {
  static label = 'Πλυντήριο';
  static kind = 'washer';
  static art = '<div class="water"></div><div class="holes"></div>';
  static css = `
.k-washer{--acc:var(--w-blue);--tint:var(--w-blue-bg)}
.k-dryer{--acc:oklch(0.58 0.12 50);--ring:oklch(0.6 0.12 50);--tint:oklch(0.95 0.03 65)}
.k-dish{--acc:oklch(0.58 0.12 190);--ring:oklch(0.6 0.12 190);--tint:oklch(0.95 0.025 190)}
.water{position:absolute;width:140px;height:140px;left:50%;top:64px;border-radius:42%;
  background:oklch(0.72 0.09 228 / .55);transition:top .8s;animation:wm-wave 3.2s linear infinite}
.on .water{top:30px}
.k-dish .water{background:oklch(0.75 0.08 190 / .5);animation-duration:3.6s}
.k-dish.on .water{top:44px}
.card:not(.on) .water{animation-play-state:paused}
.holes{position:absolute;inset:8px;border-radius:50%;border:2px dashed rgba(28,34,40,.18)}
.on .holes{animation:wm-spin 2.4s linear infinite}
.k-dryer .holes{border-color:rgba(28,34,40,.22)}
.k-dryer.on .holes{animation-duration:1.6s}
.warm{position:absolute;inset:0;border-radius:50%;opacity:0;transition:opacity .8s;
  background:radial-gradient(circle at 50% 70%,oklch(0.88 0.1 60 / .8),transparent 70%)}
.on .warm{opacity:1}
.arm{position:absolute;left:50%;top:50%;width:44px;height:5px;margin:-2.5px 0 0 -22px;border-radius:3px;background:rgba(28,34,40,.35)}
.on .arm{animation:wm-spin 1.1s linear infinite}
`;

  static getConfigForm() {
    const sensor = ent(['sensor', 'input_select', 'input_text', 'select']);
    const action = ent(['button', 'input_button', 'script', 'switch']);
    return form([
      ['entity', 'Κατάσταση (τρέχει / σβηστό / τελείωσε)', ANY, true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['remaining_entity', 'Υπόλοιπος χρόνος', sensor],
      ['total_entity', 'Συνολικός χρόνος προγράμματος', sensor],
      ['program_entity', 'Πρόγραμμα', sensor],
      ['temp_entity', 'Θερμοκρασία', sensor],
      ['pause_entity', 'Κουμπί παύσης', action],
      ['start_entity', 'Κουμπί έναρξης', action],
    ]);
  }
  static getStubConfig() { return { entity: '' }; }

  watched() {
    const c = this._config;
    return [c.entity, c.remaining_entity, c.total_entity, c.program_entity, c.temp_entity, c.pause_entity, c.start_entity];
  }

  template() {
    const k = this.constructor;
    return `
<div class="card k-${k.kind}">
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub state"></span></div>
    <button class="pbtn ms fill" aria-label="Έναρξη/Παύση"></button>
  </div>
  <div class="row">
    <div class="dial"><div class="drum">${k.art}</div></div>
    <div class="time"><span class="big"></span><span class="sub end"></span></div>
  </div>
</div>`;
  }

  bind() {
    this.$('.pbtn').addEventListener('click', () => this.trigger(this._action));
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
    this.$('.title').textContent = c.name || this.constructor.label;
    const program = [this.val(c.program_entity), this.val(c.temp_entity)].filter(Boolean).join(' ');
    this.$('.state').textContent =
      !ok ? 'Μη διαθέσιμο' : paused ? 'Σε παύση' : done ? 'Ολοκληρώθηκε' : run ? program || 'Σε λειτουργία' : 'Ανενεργό';

    /* Κουμπί: παύση όταν τρέχει, έναρξη αλλιώς — μόνο αν έχει οριστεί το αντίστοιχο entity */
    const btn = this.$('.pbtn');
    this._action = run ? c.pause_entity : c.start_entity;
    btn.hidden = !c.pause_entity && !c.start_entity;
    btn.disabled = !this._action || this.st(this._action)?.state === 'unavailable';
    btn.textContent = run ? 'pause' : 'play_arrow';

    const active = run || paused;
    const rem = active ? toMinutes(this.st(c.remaining_entity)) : null;
    const total = active ? toMinutes(this.st(c.total_entity)) : null;
    const m = rem == null ? null : Math.round(rem);
    this.$('.big').textContent = m == null ? '—' : m >= 60 ? `${Math.floor(m / 60)}:${pad2(m % 60)}` : `${m}′`;
    this.$('.end').textContent = m != null && run ? `τέλος ${hhmm(new Date(Date.now() + m * 60000))}` : '';
    const pct = done ? 100 : rem != null && total ? clamp((1 - rem / total) * 100, 0, 100) : 0;
    card.style.setProperty('--pct', pct + '%');
  }
}
class WallWasherCard extends WallApplianceCard {}
class WallDryerCard extends WallApplianceCard {
  static label = 'Στεγνωτήριο';
  static kind = 'dryer';
  static art = '<div class="warm"></div><div class="holes"></div>';
}
class WallDishwasherCard extends WallApplianceCard {
  static label = 'Πλυντήριο πιάτων';
  static kind = 'dish';
  static art = '<div class="water"></div><div class="arm"></div>';
}

/* ── Κλίμα: θερμοστάτης, λέβητας ή κλιματιστικό, με θερμότητα/ψύχος στο φόντο ── */
const COOL_MODES = ['cool', 'dry', 'fan_only'];

class WallClimateCard extends WallBaseCard {
  static css = `
.title{font-size:19px}
.mid{position:relative;display:flex;justify-content:center}
.sp{font:400 44px var(--w-font);letter-spacing:-1.5px;line-height:1;transition:color .3s;color:var(--acc,#9aa4ad)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Θερμοστάτης / κλιματιστικό', ent('climate'), true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'climate') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">${fxHTML()}
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub"></span></div>
    <button class="pbtn ms" aria-label="On/Off">power_settings_new</button>
  </div>
  <div class="mid"><span class="sp"></span></div>
  <div class="steps">
    <button class="ms dn" aria-label="Χαμηλότερα">keyboard_arrow_down</button>
    <button class="ms up" aria-label="Ψηλότερα">keyboard_arrow_up</button>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    this.$('.pbtn').addEventListener('click', () => {
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
    const cool = action ? action === 'cooling' : COOL_MODES.includes(s?.state);
    const active = on && (action ? action === 'heating' || action === 'cooling' : true);

    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.style.setProperty('--acc', !on ? '#9aa4ad' : cool ? 'var(--w-cold)' : 'var(--w-hot)');
    card.style.setProperty('--tint', cool ? 'oklch(0.93 0.035 235)' : 'oklch(0.94 0.035 60)');
    const fx = this.$('.fx');
    fx.classList.toggle('show', active);
    fx.classList.toggle('cool', cool);
    fx.classList.toggle('heat', !cool);

    this.$('.title').textContent = this._config.name || this.friendly(id);
    const room = a.current_temperature != null ? `χώρος ${fmt(a.current_temperature, 1)}°` : '';
    this.$('.sub').textContent = !ok ? 'Μη διαθέσιμο' : !on ? ['Κλειστό', room].filter(Boolean).join(' · ') : room;

    const held = this._hold && Date.now() < this._hold.until;
    if (!held) this._hold = null;
    const sp = held ? this._hold.v : a.temperature;
    const dec = (a.target_temp_step || 0.5) < 1 ? 1 : 0;
    this.$('.sp').textContent = sp != null ? `${fmt(sp, dec)}°` : '—';
    this.$('.steps').style.visibility = a.temperature != null || held ? 'visible' : 'hidden';
  }
}

/* ── Θερμοσίφωνας: διακόπτης με αντίστροφη μέτρηση ── */
class WallHeaterCard extends WallBaseCard {
  static css = `
.card{--acc:var(--w-hot);--tint:oklch(0.95 0.03 50)}
.big{font-size:36px}
.steps button{font-size:24px}
.bub{position:absolute;inset:0;opacity:0;transition:opacity .8s}
.on .bub{opacity:1}
.bub i{position:absolute;bottom:-10px;width:26px;height:26px;margin-left:-13px;border-radius:50%;
  background:radial-gradient(circle,oklch(0.82 0.13 50 / .8),transparent 70%);animation:heat-rise 3.6s ease-in infinite}
.card:not(.on) .bub i{animation-play-state:paused}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Διακόπτης θερμοσίφωνα', ent(['switch', 'input_boolean']), true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['timer_entity', 'Χρονόμετρο (timer helper)', ent('timer')],
      ['default_minutes', 'Προεπιλεγμένη διάρκεια (λεπτά)', { number: { min: 5, max: 180, step: 5, mode: 'box' } }],
      ['max_minutes', 'Μέγιστη διάρκεια (λεπτά)', { number: { min: 10, max: 240, step: 5, mode: 'box' } }],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'switch') }; }
  watched() { return [this._config.entity, this._config.timer_entity]; }

  template() {
    return `
<div class="card">
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub state"></span></div>
    <button class="pbtn ms fill" aria-label="On/Off">power_settings_new</button>
  </div>
  <div class="row">
    <div class="dial"><div class="drum"><div class="bub">
      <i style="left:30%"></i><i style="left:55%;animation-delay:1.4s"></i><i style="left:42%;animation-delay:2.6s"></i>
    </div></div></div>
    <div class="time"><span class="big"></span><span class="sub hint"></span></div>
  </div>
  <div class="steps">
    <button class="ms dn" aria-label="−5 λεπτά">remove</button>
    <button class="ms up" aria-label="+5 λεπτά">add</button>
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
    this.$('.pbtn').addEventListener('click', () => {
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
        const secs = clamp(left + dir * 300, 60, this.max() * 60);
        this.call('timer', 'start', { entity_id: this._config.timer_entity, duration: hms(secs) });
      } else {
        this._dur = clamp(this._dur + dir * 5, 5, this.max());
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
    this.$('.title').textContent = c.name || 'Θερμοσίφωνας';
    this.$('.state').textContent = !ok ? 'Μη διαθέσιμος' : on ? 'Ζεσταίνει' : 'Κλειστός';
    this.$('.steps').hidden = !c.timer_entity;

    let big, hint, pct;
    if (left != null) {
      const total = toMinutes({ state: this.st(c.timer_entity).attributes.duration || '' }) || this._dur;
      big = `${Math.floor(left / 60)}:${pad2(left % 60)}`;
      hint = `τέλος ${hhmm(new Date(this.st(c.timer_entity).attributes.finishes_at))}`;
      pct = clamp((left / (total * 60)) * 100, 0, 100);
    } else if (on) {
      big = 'On'; hint = c.timer_entity ? 'χωρίς χρονόμετρο' : ''; pct = 100;
    } else if (c.timer_entity) {
      big = `${this._dur}′`; hint = 'διάρκεια'; pct = (this._dur / this.max()) * 100;
    } else {
      big = '—'; hint = ''; pct = 0;
    }
    this.$('.big').textContent = big;
    this.$('.hint').textContent = hint;
    card.style.setProperty('--pct', pct + '%');
  }
}

/* ── Καθαριστής αέρα: φτερωτή που γυρίζει, χρώμα ανάλογα με την ποιότητα ── */
class WallPurifierCard extends WallBaseCard {
  static css = `
.card{--acc:oklch(0.58 0.13 var(--h,150));--ring:oklch(0.65 0.13 var(--h,150));--tint:oklch(0.95 0.03 var(--h,150))}
.fan{position:absolute;inset:8px}
.on .fan{animation:wm-spin 1.2s linear infinite}
.fan i{position:absolute;left:50%;top:2px;width:12px;height:24px;margin-left:-6px;border-radius:50% 50% 40% 40%;
  background:oklch(0.7 0.1 var(--h,150) / .55);transform-origin:6px 24px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Καθαριστής (fan)', ent(['fan', 'switch']), true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['pm25_entity', 'Αισθητήρας PM2.5 (προαιρετικό)', ent('sensor')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'fan') }; }
  watched() { return [this._config.entity, this._config.pm25_entity]; }

  template() {
    return `
<div class="card">
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub state"></span></div>
    <button class="pbtn ms fill" aria-label="On/Off">power_settings_new</button>
  </div>
  <div class="row">
    <div class="dial"><div class="drum"><div class="fan">
      ${[0, 72, 144, 216, 288].map((d) => `<i style="transform:rotate(${d}deg)"></i>`).join('')}
    </div></div></div>
    <div class="time"><span class="big"></span><span class="sub unit"></span></div>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    this.$('.pbtn').addEventListener('click', () => {
      if (this.available(this._config.entity)) this.call('homeassistant', 'toggle', { entity_id: this._config.entity });
    });
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const on = this.val(c.entity) === 'on';
    const a = this.st(c.entity)?.attributes || {};
    const pm = this.num(c.pm25_entity);
    const [quality, hue] = isNaN(pm) ? ['', 150] : airQuality(pm);
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', on);
    card.style.setProperty('--h', hue);
    this.$('.title').textContent = c.name || 'Καθαριστής αέρα';
    this.$('.state').textContent = !ok ? 'Μη διαθέσιμος' : !on ? 'Κλειστός'
      : [quality && quality + ' ποιότητα', a.preset_mode].filter(Boolean).join(' · ') || 'Σε λειτουργία';
    if (!isNaN(pm)) {
      this.$('.big').textContent = fmt(pm, pm < 10 ? 1 : 0).replace(',0', '');
      this.$('.unit').textContent = 'PM2.5 µg/m³';
      card.style.setProperty('--pct', (on ? Math.max(8, 100 - pm * 2) : 0) + '%');
    } else {
      this.$('.big').textContent = on && a.percentage != null ? a.percentage + '%' : '—';
      this.$('.unit').textContent = on && a.percentage != null ? 'ταχύτητα' : '';
      card.style.setProperty('--pct', (on ? a.percentage ?? 100 : 0) + '%');
    }
  }
}

/* ── Ποιότητα αέρα: κύρια μέτρηση PM2.5 και έως τρεις δευτερεύουσες ── */
class WallAirCard extends WallBaseCard {
  static css = `
.card{background:oklch(0.96 0.025 var(--h,150))}
.badge{height:28px;padding:0 10px;border-radius:9px;background:oklch(0.55 0.12 var(--h,150));color:#fff;display:flex;align-items:center;font:700 12px var(--w-font);flex:none}
.row{gap:10px}
.dial{width:56px;height:56px;--ring:oklch(0.62 0.13 var(--h,150))}
.drum{inset:5px;display:grid;place-items:center;color:oklch(0.5 0.12 var(--h,150));font-size:26px}
.big{font-size:34px;letter-spacing:-1px}
.unit{font-size:12px}
.tiles{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:6px}
.tiles div{background:#fff;border-radius:12px;padding:6px 8px;display:flex;flex-direction:column;min-width:0}
.tiles span{font:600 10px var(--w-font);color:var(--w-muted)}
.tiles b{font:700 14px var(--w-font);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;

  static getConfigForm() {
    const sensor = ent('sensor');
    return form([
      ['entity', 'PM2.5', sensor, true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['subtitle', 'Χώρος (προαιρετικό)', TEXT],
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
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub place"></span></div>
    <span class="badge"></span>
  </div>
  <div class="row">
    <div class="dial"><div class="drum ms">air</div></div>
    <div class="time"><span class="big"></span><span class="sub unit">PM2.5 µg/m³</span></div>
  </div>
  <div class="tiles">
    <div data-k="co2_entity"><span>CO₂</span><b></b></div>
    <div data-k="voc_entity"><span>VOC</span><b></b></div>
    <div data-k="pm10_entity"><span>PM10</span><b></b></div>
  </div>
</div>`;
  }

  bind() { this.tapMore(); }

  update() {
    const c = this._config;
    const pm = this.num(c.entity);
    const ok = !isNaN(pm);
    const [quality, hue] = ok ? airQuality(pm) : ['—', 150];
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.style.setProperty('--h', hue);
    card.style.setProperty('--pct', (ok ? Math.max(8, 100 - pm * 2) : 0) + '%');
    this.$('.title').textContent = c.name || 'Ποιότητα αέρα';
    this.$('.place').textContent = c.subtitle || '';
    this.$('.badge').textContent = quality;
    this.$('.big').textContent = ok ? String(Math.round(pm)) : '—';
    let shown = 0;
    this.shadowRoot.querySelectorAll('.tiles div').forEach((tile) => {
      const v = this.val(c[tile.dataset.k]);
      tile.hidden = !v;
      if (!v) return;
      shown++;
      const n = parseFloat(v);
      tile.querySelector('b').textContent = isNaN(n) ? v : String(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).replace('.', ',');
    });
    this.$('.tiles').hidden = !shown;
  }
}

/* ── Σκούπα ρομπότ: ρομπότ στη βάση του, έναρξη/παύση και επιστροφή ── */
const VAC_LABELS = {
  docked: 'Στη βάση', cleaning: 'Καθαρίζει', paused: 'Σε παύση', returning: 'Επιστρέφει', idle: 'Σε αναμονή', error: 'Σφάλμα',
};

class WallVacuumCard extends WallBaseCard {
  static css = `
.card{--acc:oklch(0.55 0.12 150);--ring:oklch(0.7 0.06 150);--tint:oklch(0.95 0.025 150)}
.card.on{--ring:oklch(0.72 0.14 150)}
.home{position:absolute;right:16px;top:66px;width:44px;height:44px;border-radius:50%;background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.08);display:grid;place-items:center;font-size:22px;transition:transform .15s}
.home:active{transform:scale(.94)}
.row{gap:12px}
.big{font-size:30px;letter-spacing:-1px}
.dock{position:absolute;left:14px;right:14px;top:8px;height:24px;border-radius:8px 8px 3px 3px;
  background:linear-gradient(180deg,#d5dbe0,#b9c1c8);opacity:0;transform:translateY(-8px);transition:opacity .4s,transform .4s}
.docked .dock{opacity:1;transform:none}
.dock span{position:absolute;left:50%;top:6px;width:12px;height:3px;margin-left:-6px;border-radius:2px;
  background:oklch(0.75 0.14 150);box-shadow:0 0 6px oklch(0.75 0.14 150)}
.bot{position:absolute;left:50%;top:18px;width:40px;height:40px;margin-left:-20px;border-radius:50%;transition:top .6s;
  background:radial-gradient(circle at 40% 30%,#4a525a,#0e1114);box-shadow:0 2px 4px rgba(0,0,0,.5)}
.docked .bot{top:20px}
.on .bot{animation:wm-shake .4s linear infinite}
.bot span{position:absolute;left:13px;top:6px;width:14px;height:14px;border-radius:50%;background:#20262b;box-shadow:inset 0 1px 1px rgba(255,255,255,.15)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Σκούπα', ent('vacuum'), true],
      ['name', 'Τίτλος (προαιρετικό)', TEXT],
      ['battery_entity', 'Μπαταρία (προαιρετικό)', ent('sensor', 'battery')],
      ['area_entity', 'Καθαρισμένη επιφάνεια (προαιρετικό)', ent('sensor')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'vacuum') }; }
  watched() { const c = this._config; return [c.entity, c.battery_entity, c.area_entity]; }

  template() {
    return `
<div class="card">
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub state"></span></div>
    <button class="pbtn ms fill" aria-label="Έναρξη/Παύση"></button>
  </div>
  <button class="home ms fill" aria-label="Επιστροφή στη βάση">home</button>
  <div class="row">
    <div class="dial"><div class="drum"><div class="dock"><span></span></div><div class="bot"><span></span></div></div></div>
    <div class="time"><span class="big"></span><span class="sub unit"></span></div>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    const id = () => this._config.entity;
    this.$('.pbtn').addEventListener('click', () => {
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
    const active = cleaning || s === 'paused';
    const batt = !isNaN(this.num(c.battery_entity)) ? this.num(c.battery_entity) : this.st(c.entity)?.attributes?.battery_level;
    const area = this.num(c.area_entity);
    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('on', cleaning);
    card.classList.toggle('docked', s === 'docked');
    this.$('.title').textContent = c.name || 'Σκούπα';
    this.$('.state').textContent = ok ? VAC_LABELS[s] || s : 'Μη διαθέσιμη';
    this.$('.pbtn').textContent = cleaning ? 'pause' : 'play_arrow';
    this.$('.home').hidden = s === 'docked';
    if (active && !isNaN(area)) {
      this.$('.big').textContent = `${Math.round(area)} m²`;
      this.$('.unit').textContent = 'καθαρίστηκαν';
    } else {
      this.$('.big').textContent = batt != null ? `${Math.round(batt)}%` : '—';
      this.$('.unit').textContent = batt != null ? 'μπαταρία' : '';
    }
    card.style.setProperty('--pct', (batt != null ? batt : 0) + '%');
  }
}

/* ── Τηλεόραση (πλατιά): τι παίζει τώρα, on/off, σίγαση ── */
class WallTvCard extends WallWideCard {
  static css = `
.card{padding:0;flex-direction:row;justify-content:flex-start}
.thumb{width:150px;flex:none;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:12px;color:#fff;
  background:#c9d1d8 center/cover no-repeat;transition:background-color .4s}
.on .thumb{background-color:#10141a;background-image:linear-gradient(135deg,oklch(0.45 0.12 var(--h,240)),#10141a)}
.src{align-self:flex-start;max-width:100%;height:24px;padding:0 8px;border-radius:7px;background:rgba(0,0,0,.35);display:flex;align-items:center;
  font:700 11px var(--w-font);letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase}
.logo{font:800 22px var(--w-font);letter-spacing:-.5px;text-shadow:0 2px 8px rgba(0,0,0,.3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.body{flex:1;min-width:0;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between}
.top{gap:8px}
.kick{font:600 11px var(--w-font);color:var(--w-muted);letter-spacing:.4px}
.title{font-weight:700}
.pwr{flex:none;width:44px;height:44px;margin:-4px -6px 0 0;border-radius:50%;display:grid;place-items:center;font-size:24px;
  background:#fff;transition:background .3s,color .3s,transform .15s}
.pwr:active{transform:scale(.94)}
.on .pwr{background:var(--w-ink);color:#fff}
.prog{height:4px;border-radius:2px;background:rgba(0,0,0,.08);overflow:hidden}
.prog i{display:block;height:100%;border-radius:2px;background:var(--w-ink);width:var(--pct,0%)}
.btns{display:flex;gap:8px}
.btns button{flex:1;height:44px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.08);transition:background .2s,color .2s,transform .15s}
.btns button:active{transform:scale(.96)}
.btns .mute.muted{background:oklch(0.6 0.17 30);color:#fff}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Τηλεόραση', ent('media_player'), true],
      ['name', 'Όνομα (προαιρετικό)', TEXT],
      ['remote_entity', 'Χειριστήριο (προαιρετικό)', ent('remote')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'media_player') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="thumb"><span class="src"></span><span class="logo"></span></div>
  <div class="body">
    <div class="top">
      <div class="head"><span class="kick"></span><span class="title"></span><span class="sub"></span></div>
      <button class="pwr ms" aria-label="On/Off">power_settings_new</button>
    </div>
    <div class="prog"><i></i></div>
    <div class="btns">
      <button class="mute ms" aria-label="Σίγαση"></button>
      <button class="remote ms" aria-label="Χειριστήριο">settings_remote</button>
    </div>
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
    this.$('.remote').addEventListener('click', () => this.moreInfo(this._config.remote_entity || id()));
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
    this.$('.thumb').style.backgroundImage = on && a.entity_picture ? cssUrl(a.entity_picture) : '';
    this.$('.src').textContent = this._config.name || this.friendly(id);
    this.$('.logo').textContent = on && !a.entity_picture ? source : '';
    this.$('.kick').textContent = on ? 'ΤΩΡΑ ΠΑΙΖΕΙ' : '';
    this.$('.title').textContent = !ok ? 'Μη διαθέσιμη' : !on ? 'Κλειστή' : a.media_title || source || 'Ανοιχτή';
    this.$('.sub').textContent = !on ? '' : a.media_series_title || a.media_artist || (a.media_title ? source : '');
    const pct = on ? mediaProgress(s) : null;
    this.$('.prog').style.opacity = pct == null ? 0 : 1;
    card.style.setProperty('--pct', (pct || 0) + '%');
    this.tick(pct != null && s.state === 'playing');
    const mute = this.$('.mute');
    mute.textContent = a.is_volume_muted ? 'volume_off' : 'volume_up';
    mute.classList.toggle('muted', !!a.is_volume_muted);
  }
}

/* ── Μουσική (πλατιά): εξώφυλλο, τίτλος, προηγούμενο / παύση / επόμενο ── */
class WallMusicCard extends WallWideCard {
  static css = `
.card,.card.on{padding:14px;flex-direction:row;justify-content:flex-start;gap:14px;color:#fff;
  background:linear-gradient(135deg,oklch(0.42 0.1 var(--h,25)),oklch(0.26 0.06 calc(var(--h,25) + 30)))}
.art{width:96px;height:96px;flex:none;align-self:center;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.3);
  display:grid;place-items:center;color:rgba(255,255,255,.55);font-size:40px;
  background:linear-gradient(135deg,oklch(0.62 0.14 var(--h,25)),oklch(0.4 0.12 calc(var(--h,25) + 40))) center/cover no-repeat}
.body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between}
.kick{font:600 11px var(--w-font);opacity:.7;letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase}
.title{font-weight:700}
.sub{color:inherit;opacity:.75}
.prog{height:4px;border-radius:2px;background:rgba(255,255,255,.2);overflow:hidden}
.prog i{display:block;height:100%;border-radius:2px;background:#fff;width:var(--pct,0%)}
.ctl{display:flex;align-items:center;justify-content:space-between;gap:4px}
.ctl button{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:24px;
  background:rgba(255,255,255,.12);color:#fff;transition:transform .15s}
.ctl button:active{transform:scale(.94)}
.ctl .play{width:52px;height:52px;font-size:30px;background:#fff;color:var(--w-ink)}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Ηχείο / player', ent('media_player'), true],
      ['name', 'Όνομα (προαιρετικό)', TEXT],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'media_player') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card">
  <div class="art ms fill"></div>
  <div class="body">
    <div class="head"><span class="kick"></span><span class="title"></span><span class="sub"></span></div>
    <div class="prog"><i></i></div>
    <div class="ctl">
      <button class="prev ms fill" aria-label="Προηγούμενο">skip_previous</button>
      <button class="play ms fill" aria-label="Αναπαραγωγή/Παύση"></button>
      <button class="next ms fill" aria-label="Επόμενο">skip_next</button>
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
    card.style.setProperty('--h', [...(a.media_title || '')].reduce((n, ch) => n + ch.charCodeAt(0), 25) % 360);
    const art = this.$('.art');
    art.style.backgroundImage = has && a.entity_picture ? cssUrl(a.entity_picture) : '';
    art.textContent = has && a.entity_picture ? '' : 'album';
    this.$('.kick').textContent = [this._config.name || this.friendly(id), a.app_name].filter(Boolean).join(' · ');
    this.$('.title').textContent = !ok ? 'Μη διαθέσιμο' : has ? a.media_title : 'Δεν παίζει τίποτα';
    this.$('.sub').textContent = has ? a.media_artist || a.media_album_name || '' : '';
    this.$('.play').textContent = playing ? 'pause' : 'play_arrow';
    const pct = has ? mediaProgress(s) : null;
    this.$('.prog').style.opacity = pct == null ? 0 : 1;
    card.style.setProperty('--pct', (pct || 0) + '%');
    this.tick(pct != null && playing);
  }
}

/* ── Αυτοκίνητο (πλατιά): φωτογραφία, μπαταρία ή καύσιμο, γρήγορες ενέργειες ── */
class WallCarCard extends WallWideCard {
  static css = `
.card,.card.on{padding:0;background:linear-gradient(160deg,#f9fafb,#e4e9ee)}
.pic{position:absolute;right:-22px;bottom:10px;width:270px;max-height:90%;object-fit:contain;mix-blend-mode:multiply;pointer-events:none}
.col{position:relative;height:100%;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;width:220px;flex:1}
.lvl{display:flex;flex-direction:column;gap:6px}
.nums{display:flex;align-items:baseline;gap:8px}
.range{font:600 14px var(--w-font);color:var(--w-muted);white-space:nowrap}
.bar{height:6px;width:180px;border-radius:3px;background:rgba(0,0,0,.08);overflow:hidden}
.bar i{display:block;height:100%;border-radius:3px;background:var(--w-ink);width:var(--pct,0%);transition:width .4s,background .3s}
.charging .bar i{background:oklch(0.62 0.15 150)}
.btns{display:flex;gap:8px;min-height:44px}
.btns button{width:44px;height:44px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:22px;background:#fff;
  box-shadow:0 1px 3px rgba(0,0,0,.1);transition:background .2s,color .2s,transform .15s}
.btns button:active{transform:scale(.94)}
.btns button.act{background:oklch(0.55 0.12 var(--bh,150));color:#fff}
.clima{--bh:230}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Μπαταρία ή καύσιμο (%)', ent('sensor'), true],
      ['name', 'Όνομα', TEXT],
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
  static getStubConfig() { return { entity: '', name: 'Αυτοκίνητο' }; }
  watched() {
    const c = this._config;
    return [c.entity, c.range_entity, c.location_entity, c.charging_entity, c.lock_entity, c.climate_entity, c.charger_entity, c.locate_entity];
  }

  template() {
    return `
<div class="card">
  <img class="pic" alt="" hidden>
  <div class="col">
    <div class="head"><span class="title"></span><span class="sub"></span></div>
    <div class="lvl">
      <div class="nums"><span class="big"></span><span class="range"></span></div>
      <span class="bar"><i></i></span>
    </div>
    <div class="btns">
      <button class="lock" aria-label="Κλείδωμα"><span class="ms fill"></span></button>
      <button class="clima" aria-label="Κλιματισμός"><span class="ms fill">mode_fan</span></button>
      <button class="chg" aria-label="Φόρτιση"><span class="ms fill">ev_station</span></button>
      <button class="find" aria-label="Εντοπισμός"><span class="ms fill">near_me</span></button>
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
    card.style.setProperty('--pct', (ok ? clamp(lvl, 0, 100) : 0) + '%');
    const pic = this.$('.pic');
    pic.hidden = !c.image;
    if (c.image && pic.getAttribute('src') !== c.image) pic.setAttribute('src', c.image);

    this.$('.title').textContent = c.name || 'Αυτοκίνητο';
    const loc = this.val(c.location_entity);
    const place = loc === 'home' ? 'Σπίτι' : loc === 'not_home' ? 'Εκτός' : loc;
    this.$('.sub').textContent = [place, charging ? 'φορτίζει' : ''].filter(Boolean).join(' · ');
    this.$('.big').textContent = ok ? `${Math.round(lvl)}%` : '—';
    const range = this.st(c.range_entity);
    this.$('.range').textContent = this.available(c.range_entity)
      ? `${Math.round(parseFloat(range.state))} ${range.attributes.unit_of_measurement || 'km'}` : '';

    const btn = (sel, id, active) => {
      const b = this.$(sel);
      b.hidden = !id;
      b.classList.toggle('act', !!active);
    };
    const locked = this.val(c.lock_entity) === 'locked';
    btn('.lock', c.lock_entity, locked);
    this.$('.lock .ms').textContent = locked ? 'lock' : 'lock_open';
    btn('.clima', c.climate_entity, this.available(c.climate_entity) && !['off'].includes(this.val(c.climate_entity)));
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
register('wall-switch-card', WallSwitchCard, 'Wall · Διακόπτης', 'Μικρό πλήκτρο τοίχου για φως, πρίζα ή ό,τι ανάβει και σβήνει.');
register('wall-lock-card', WallLockCard, 'Wall · Κλειδαριά', 'Μεταλλική κλειδαριά με πόμολο που γυρίζει.');
register('wall-opener-card', WallOpenerCard, 'Wall · Είσοδος', 'Θυροτηλέφωνο: άνοιγμα πόρτας και άνοιγμα στο κουδούνι.');
register('wall-washer-card', WallWasherCard, 'Wall · Πλυντήριο', 'Τύμπανο, υπόλοιπος χρόνος και πρόοδος προγράμματος.');
register('wall-dryer-card', WallDryerCard, 'Wall · Στεγνωτήριο', 'Ζεστό τύμπανο, υπόλοιπος χρόνος και πρόοδος.');
register('wall-dishwasher-card', WallDishwasherCard, 'Wall · Πλυντήριο πιάτων', 'Βραχίονας ψεκασμού, υπόλοιπος χρόνος και πρόοδος.');
register('wall-climate-card', WallClimateCard, 'Wall · Κλίμα', 'Θερμοστάτης, λέβητας ή κλιματιστικό με ρύθμιση θερμοκρασίας.');
register('wall-heater-card', WallHeaterCard, 'Wall · Θερμοσίφωνας', 'Διακόπτης με αντίστροφη μέτρηση.');
register('wall-purifier-card', WallPurifierCard, 'Wall · Καθαριστής αέρα', 'Φτερωτή που γυρίζει και μέτρηση PM2.5.');
register('wall-air-card', WallAirCard, 'Wall · Ποιότητα αέρα', 'PM2.5 με CO₂, VOC και PM10.');
register('wall-vacuum-card', WallVacuumCard, 'Wall · Σκούπα', 'Ρομπότ στη βάση του, έναρξη, παύση και επιστροφή.');
register('wall-tv-card', WallTvCard, 'Wall · Τηλεόραση', 'Πλατιά κάρτα: τι παίζει, on/off, σίγαση.');
register('wall-music-card', WallMusicCard, 'Wall · Μουσική', 'Πλατιά κάρτα: εξώφυλλο, τίτλος και χειρισμός αναπαραγωγής.');
register('wall-car-card', WallCarCard, 'Wall · Αυτοκίνητο', 'Πλατιά κάρτα: μπαταρία ή καύσιμο, αυτονομία και γρήγορες ενέργειες.');

console.info(`%c WALL-CARDS %c v${VERSION} `, 'background:#1c2228;color:#fff;border-radius:4px 0 0 4px', 'background:#e1e6eb;color:#1c2228;border-radius:0 4px 4px 0');
