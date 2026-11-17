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


/* Σκευόμορφα κοινά: οθόνη LCD, στρογγυλό πλήκτρο, χαραγμένο ταμπελάκι, γραμμή κατάστασης */
.lcd{background:#1b2622;color:#9ff0c0;border-radius:6px;font:600 15px var(--w-font);letter-spacing:.5px;
  display:grid;place-items:center;white-space:nowrap;font-variant-numeric:tabular-nums}
.kb{flex:none;border-radius:50%;display:grid;place-items:center;color:var(--w-ink);
  background:radial-gradient(circle at 35% 30%,#fff,#dfe3e6 45%,#aeb5bb);
  box-shadow:0 3px 6px rgba(0,0,0,.28),inset 0 1px 1px #fff;transition:transform .12s,color .3s}
.kb:active{transform:scale(.94)}
.kb:disabled{opacity:.4;cursor:default}
.kb.lit{color:#fff;background:radial-gradient(circle at 35% 30%,color-mix(in oklch,var(--acc,var(--w-blue)) 55%,#fff),var(--acc,var(--w-blue)))}
.tag{position:absolute;z-index:2;max-width:70%;font:600 11px var(--w-font);letter-spacing:.6px;text-transform:uppercase;
  color:var(--w-muted);background:linear-gradient(180deg,#eef0f2,#cfd4d8);padding:2px 8px;border-radius:4px;
  box-shadow:inset 0 1px 0 #fff,0 1px 1px rgba(0,0,0,.2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note{position:absolute;left:0;right:0;bottom:8px;padding:0 12px;text-align:center}
.shell,.shell.on{padding:0;background:linear-gradient(180deg,#fcfdfd,#e6eaed);box-shadow:inset 0 1px 0 #fff,inset 0 -3px 5px rgba(0,0,0,.08)}

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
  background:linear-gradient(180deg,oklch(0.93 0.07 85),oklch(0.88 0.1 80))}
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

  static getConfigForm() { return form([['entity', 'Φως', ent('light'), true], LABEL]); }
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
    this.label();
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

/* ── Διακόπτης: πλάκα τοίχου με πλήκτρο που πατιέται ── */
class WallSwitchCard extends WallBaseCard {
  static css = `
.card,.card.on{padding:0;border-radius:22px;color:#2d2a24;cursor:pointer;
  background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:0 14px 28px rgba(40,45,55,.16),0 3px 6px rgba(40,45,55,.10),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05)}
.key{position:absolute;left:50%;top:26px;width:96px;height:138px;margin-left:-48px;border-radius:14px;display:grid;place-items:center;
  font-size:36px;transition:background .2s,box-shadow .2s,color .3s,text-shadow .3s;
  background:linear-gradient(180deg,#ffffff,#eeece6);box-shadow:0 4px 8px rgba(40,45,55,.18),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.06)}
.on .key{background:linear-gradient(180deg,#ebe8e1,#f6f4ef);box-shadow:inset 0 3px 7px rgba(0,0,0,.14),0 1px 0 #fff;
  color:oklch(0.62 0.15 70);text-shadow:0 0 12px oklch(0.8 0.14 80 / .8)}
.tune{position:absolute;right:4px;top:4px;width:40px;height:40px;border-radius:50%;color:#a8a296;font-size:20px}
.tag{left:50%;transform:translateX(-50%);bottom:16px}
`;

  static getConfigForm() {
    return form([['entity', 'Συσκευή', ent(['light', 'switch', 'input_boolean', 'fan']), true], LABEL]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'switch') || firstEntity(hass, 'light') }; }
  watched() { return [this._config.entity]; }

  template() {
    return `
<div class="card" role="button" aria-label="Άναμμα/Σβήσιμο">
  <span class="key ms">power_settings_new</span>
  <button class="tune ms" aria-label="Ρυθμίσεις">tune</button>
  ${TAG}
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
    this.label();
  }
}

/* ── Κλειδαριά: μεταλλική πλάκα με πόμολο που γυρίζει ── */
const LOCK_LABELS = {
  locked: 'Κλειδωμένη', unlocked: 'Ξεκλείδωτη', locking: 'Κλειδώνει…', unlocking: 'Ξεκλειδώνει…',
  jammed: 'Μπλοκαρισμένη', open: 'Ανοιχτή', opening: 'Ανοίγει…',
};

class WallLockCard extends WallBaseCard {
  static css = `
.card{align-items:center;justify-content:center;gap:10px}
.card.open{background:oklch(0.93 0.05 60)}
.tag{left:12px;top:12px}
.plate{flex:none;width:76px;height:112px;border-radius:38px;position:relative;
  background:linear-gradient(145deg,#f7f8f9 0%,#d5d9dd 45%,#eceff1 60%,#bfc5ca 100%);
  box-shadow:0 8px 16px rgba(30,40,50,.22),0 2px 3px rgba(30,40,50,.18),inset 0 1px 1px #fff,inset 0 -2px 3px rgba(0,0,0,.12)}
.led{position:absolute;top:8px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;
  transition:background .3s,box-shadow .3s;background:var(--c);box-shadow:0 0 6px var(--c),inset 0 1px 1px rgba(255,255,255,.5)}
.ring{position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-26px 0 0 -29px;border-radius:50%;
  background:linear-gradient(160deg,#c9ced3,#f3f5f6);box-shadow:inset 0 3px 6px rgba(0,0,0,.25),inset 0 -1px 1px #fff}
.knob{position:absolute;left:50%;top:50%;width:50px;height:50px;margin:-22px 0 0 -25px;border-radius:50%;
  transition:transform .5s var(--w-spring);
  background:radial-gradient(circle at 35% 30%,#ffffff,#dfe3e6 40%,#aeb5bb 100%);box-shadow:0 4px 8px rgba(0,0,0,.3),inset 0 1px 1px #fff}
.locked .knob{transform:rotate(90deg)}
.knob span{position:absolute;left:50%;top:5px;bottom:5px;width:15px;margin-left:-7.5px;border-radius:8px;
  background:linear-gradient(90deg,#b4bbc1,#f4f6f7 45%,#c3c9ce);box-shadow:0 2px 3px rgba(0,0,0,.3),inset 0 1px 0 #fff}
.slot{position:absolute;bottom:8px;left:50%;width:5px;height:10px;margin-left:-3px;border-radius:3px;background:#3a4148;box-shadow:inset 0 2px 2px #000,0 1px 0 #fff}
.foot{display:flex;flex-direction:column;gap:1px;min-width:0;align-items:center;text-align:center}
.state{font:700 16px var(--w-font);line-height:1.2;transition:color .3s;color:var(--c)}
.batt{font:500 12px var(--w-font);color:var(--w-muted);display:flex;align-items:center;gap:2px}
.batt .ms{font-size:14px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Κλειδαριά', ent('lock'), true],
      LABEL,
      ['battery_entity', 'Μπαταρία (προαιρετικό)', ent('sensor', 'battery')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'lock') }; }

  watched() { return [this._config.entity, this._config.battery_entity]; }

  template() {
    return `
<div class="card">
  ${TAG}
  <button class="plate press" aria-label="Κλείδωμα/Ξεκλείδωμα">
    <span class="led"></span><span class="ring"></span><span class="knob"><span></span></span><span class="slot"></span>
  </button>
  <div class="foot"><span class="state"></span><span class="batt"><span class="ms"></span><span class="bv"></span></span></div>
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
    card.classList.toggle('open', ok && !locked);
    card.style.setProperty('--c', !ok ? 'var(--w-faint)' : locked ? 'var(--w-ok)' : 'var(--w-warn)');
    this.label();
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
.top{min-height:44px;align-items:center}
.tag{position:static}
.bell{flex:none;width:44px;height:44px;margin:-6px -6px 0 auto;border-radius:50%;display:grid;place-items:center;font-size:22px;
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
.state{text-align:center;min-height:17px;font-weight:600;transition:color .3s;color:var(--fg,var(--w-muted))}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Θυροτηλέφωνο (lock)', ent('lock'), true],
      LABEL,
      ['rto_entity', 'Άνοιγμα στο κουδούνι (προαιρετικό)', ent(['switch', 'input_boolean', 'lock'])],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'lock') }; }
  watched() { return [this._config.entity, this._config.rto_entity]; }

  template() {
    return `
<div class="card">
  <div class="top">${TAG}<button class="bell ms fill" aria-label="Άνοιγμα στο κουδούνι">notifications_active</button></div>
  <div class="panel">
    <span class="grille">${'<span></span>'.repeat(12)}</span>
    <span class="socket">
      <span class="wave"></span><span class="wave" style="animation-delay:.4s"></span><span class="wave" style="animation-delay:.8s"></span>
      <button class="key ms" aria-label="Άνοιγμα εισόδου">key</button>
    </span>
    <span class="bar"></span>
  </div>
  <span class="sub state"></span>
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
    this.label();
    this.$('.state').textContent = !ok ? 'Μη διαθέσιμη' : opening ? 'Ανοιχτή' : rto ? 'Ανοίγει στο κουδούνι' : '';
  }
}

/* ── Συσκευές με πρόγραμμα: η κάρτα είναι η πρόσοψη της συσκευής ── */
const APPL_IDLE = ['off', 'idle', 'standby', 'power off', 'ready', 'none', '-', ''];
const APPL_DONE = ['finished', 'complete', 'completed', 'end', 'done'];
const APPL_PAUSED = ['pause', 'paused'];
const KNOB = '<button class="kb knob ms fill" aria-label="Έναρξη/Παύση"></button>';
const DOOR = (art) => `<div class="door"><div class="rim"></div><div class="glass">${art}<span class="shine"></span></div></div>`;

class WallApplianceCard extends WallBaseCard {
  static css = `
.strip{position:absolute;left:12px;right:12px;top:12px;height:44px;display:flex;align-items:center;gap:8px}
.strip .lcd{flex:1;height:28px}
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
.tag{left:10px;bottom:30px}
.k-washer{--ring:#2f7fa8}
.k-dryer{--ring:#c9792e}
.k-dryer .glass{background:#3a2a20}
.warm{position:absolute;inset:0;opacity:0;transition:opacity .8s;background:radial-gradient(circle at 50% 70%,#f2b266,#7a3d12 75%)}
.on .warm{opacity:1}
.k-dryer.on .holes{animation-duration:1.6s}
.k-dish{--ring:#2f9aa0}
.band{position:absolute;left:0;right:0;top:0;height:50px;padding:0 10px 0 14px;display:flex;align-items:center;gap:8px;background:linear-gradient(180deg,#39424a,#252c32)}
.band .lcd{flex:1;height:28px;background:#101a1c;color:#8fe0e6}
.handle{position:absolute;left:14px;right:14px;top:60px;height:12px;border-radius:6px;background:linear-gradient(180deg,#f6f8f9,#b9c0c6);box-shadow:0 3px 5px rgba(0,0,0,.25)}
.win{position:absolute;left:22px;right:22px;top:86px;bottom:34px;border-radius:12px;background:#17313a;overflow:hidden;box-shadow:inset 0 4px 10px rgba(0,0,0,.6)}
.win .fillw{position:absolute;left:0;right:0;bottom:0;height:0;background:rgba(110,200,205,.45);transition:height .8s}
.on .win .fillw{height:46%}
.plates{position:absolute;left:14px;right:14px;top:12px;bottom:26px;display:flex;justify-content:space-between}
.plates i{width:8px;border-radius:4px;background:#e9eef0}
.arm{position:absolute;left:50%;bottom:10px;width:84px;height:6px;margin-left:-42px;border-radius:3px;background:#aeb9bf}
.on .arm{animation:wm-spin 1.4s linear infinite}
.bar{position:absolute;left:22px;right:22px;bottom:26px;height:3px;border-radius:2px;background:linear-gradient(90deg,var(--ring) var(--pct,0%),#c3cad0 var(--pct,0%))}
`;
  static kind = 'washer';
  static face = `<div class="strip"><div class="drawer"></div><div class="lcd"></div>${KNOB}</div>${DOOR('<div class="water"></div><div class="holes"></div>')}`;

  static getConfigForm() {
    const sensor = ent(['sensor', 'input_select', 'input_text', 'select']);
    const action = ent(['button', 'input_button', 'script', 'switch']);
    return form([
      ['entity', 'Κατάσταση (τρέχει / σβηστό / τελείωσε)', ANY, true],
      LABEL,
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
    return `<div class="card shell k-${k.kind}">${k.face}${TAG}<span class="sub note"></span></div>`;
  }

  bind() {
    this.tapMore();
    this.$('.knob').addEventListener('click', () => this.trigger(this._action));
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
    this.label();
    const program = [this.val(c.program_entity), this.val(c.temp_entity)].filter(Boolean).join(' ');
    this.$('.note').textContent =
      !ok ? 'Μη διαθέσιμο' : paused ? 'Σε παύση' : done ? 'Ολοκληρώθηκε' : run ? program || 'Σε λειτουργία' : '';

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
    this.$('.lcd').textContent = done ? 'ΤΕΛΟΣ' : m == null ? '--:--' : `${Math.floor(m / 60)}:${pad2(m % 60)}`;
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
<div class="win"><div class="fillw"></div><div class="plates">${'<i></i>'.repeat(7)}</div><div class="arm"></div></div><div class="bar"></div>`;
}

/* ── Κλίμα: στρογγυλός θερμοστάτης τοίχου, ή εσωτερική μονάδα κλιματιστικού ── */
const COOL_MODES = ['cool', 'dry', 'fan_only'];

class WallClimateCard extends WallBaseCard {
  static css = `
.steps{align-items:center}
.steps .pw{flex:none;width:44px;height:44px;border-radius:50%;font-size:22px;
  background:radial-gradient(circle at 35% 30%,#fff,#dfe3e6 45%,#aeb5bb);box-shadow:0 3px 6px rgba(0,0,0,.28),inset 0 1px 1px #fff}
.on .steps .pw{color:#fff;background:radial-gradient(circle at 35% 30%,color-mix(in oklch,var(--acc) 55%,#fff),var(--acc))}
.room{text-align:center;position:relative}
/* θερμοστάτης */
.th .ring{position:relative;flex:none;width:140px;height:140px;margin:-6px auto 0;border-radius:50%;
  background:conic-gradient(from 225deg,var(--acc,#9aa4ad) 0 var(--deg,0deg),#c9cfd4 var(--deg,0deg) 270deg,transparent 270deg)}
.bez{position:absolute;inset:8px;border-radius:50%;background:linear-gradient(145deg,#f7f8f9,#c4cad0);box-shadow:0 4px 8px rgba(40,40,40,.2)}
.face{position:absolute;inset:18px;border-radius:50%;background:radial-gradient(circle at 40% 30%,#2e353b,#0f1215);
  display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
.flame{font-size:16px;color:#ff9a57;opacity:0;transition:opacity .4s}
.heating .flame{opacity:1}
.th .sp{font:500 29px var(--w-font);letter-spacing:-1px;line-height:1.1}
.th .room{font:500 11px var(--w-font);color:#b9c1c8}
.th .tag{left:10px;top:10px}
/* κλιματιστικό */
.unit{position:relative;flex:none;height:62px;margin:-2px -4px 0;border-radius:14px 14px 8px 8px;
  background:linear-gradient(180deg,#fff,#e8ecef);box-shadow:0 6px 12px rgba(40,60,90,.22),inset 0 1px 0 #fff}
.vents{position:absolute;left:12px;top:13px;display:flex;flex-direction:column;gap:4px}
.vents i{width:76px;height:2px;background:#c9d0d6}
.unit .lcd{position:absolute;right:10px;top:9px;width:70px;height:28px;background:#16222e;color:var(--lcd,#6b7a86);transition:color .3s}
.flap{position:absolute;left:8px;right:8px;bottom:-3px;height:9px;border-radius:3px;transform-origin:50% 0;transition:transform .6s;
  background:linear-gradient(180deg,#f7f9fa,#cdd4da);box-shadow:0 2px 3px rgba(0,0,0,.2)}
.on .flap{transform:perspective(60px) rotateX(-35deg)}
.ac .tag{left:26px;top:56px}
.ac .fx{top:70px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Θερμοστάτης / κλιματιστικό', ent('climate'), true],
      LABEL,
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
    this.tapMore();
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
    this.$('.room').textContent = !ok ? 'Μη διαθέσιμο' : !on && this._ac ? ['Κλειστό', room].filter(Boolean).join(' · ') : room;

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
      LABEL,
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
  <div class="tank"><div class="well"><div class="hot"></div><i style="left:32%"></i><i style="left:62%;animation-delay:1.4s"></i></div></div>
  ${TAG}
  <div class="side">
    <div class="dialr"><button class="kb pw ms fill" aria-label="On/Off"><span class="ptr"></span>power_settings_new</button></div>
    <span class="big"></span><span class="sub hint"></span>
    <div class="steps">
      <button class="ms dn" aria-label="−5 λεπτά">remove</button>
      <button class="ms up" aria-label="+5 λεπτά">add</button>
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

/* ── Καθαριστής αέρα: πύργος με γρίλια και φωτεινό δαχτυλίδι στο χρώμα της ποιότητας ── */
class WallPurifierCard extends WallBaseCard {
  static css = `
.card{padding:0;--acc:oklch(0.58 0.13 var(--h,150));--tint:oklch(0.95 0.03 var(--h,150))}
.tower{position:absolute;left:20px;top:22px;bottom:14px;width:88px;border-radius:26px 26px 14px 14px;
  background:linear-gradient(90deg,#dfe4e7,#ffffff 45%,#d3d9dd);box-shadow:0 6px 12px rgba(30,60,40,.22)}
.halo{position:absolute;left:10px;right:10px;top:10px;height:22px;border-radius:50%;background:#20262b;
  box-shadow:0 0 0 3px #b8c2cb;transition:box-shadow .4s}
.on .halo{box-shadow:0 0 0 3px oklch(0.72 0.15 var(--h,150)),0 0 10px oklch(0.72 0.15 var(--h,150))}
.grille{position:absolute;left:12px;right:12px;top:48px;bottom:14px;border-radius:8px;
  background:radial-gradient(circle,#8f989f 1.5px,transparent 2px) 0 0/8px 8px}
.side{position:absolute;left:118px;right:10px;top:22px;bottom:14px;display:flex;flex-direction:column;align-items:center;gap:2px}
.pw{width:48px;height:48px;font-size:24px;margin-bottom:4px}
.big{line-height:1.15}
.sub{font-size:12px;max-width:100%}
.state{font-weight:600;color:oklch(0.5 0.12 var(--h,150))}
.tag{left:24px;bottom:20px;max-width:80px}
`;

  static getConfigForm() {
    return form([
      ['entity', 'Καθαριστής (fan)', ent(['fan', 'switch']), true],
      LABEL,
      ['pm25_entity', 'Αισθητήρας PM2.5 (προαιρετικό)', ent('sensor')],
    ]);
  }
  static getStubConfig(hass) { return { entity: firstEntity(hass, 'fan') }; }
  watched() { return [this._config.entity, this._config.pm25_entity]; }

  template() {
    return `
<div class="card">
  <div class="tower"><div class="halo"></div><div class="grille"></div></div>
  ${TAG}
  <div class="side">
    <button class="kb pw ms fill" aria-label="On/Off">power_settings_new</button>
    <span class="big"></span><span class="sub unit"></span><span class="sub state"></span>
  </div>
</div>`;
  }

  bind() {
    this.tapMore();
    this.$('.pw').addEventListener('click', () => {
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
    this.$('.pw').classList.toggle('lit', on);
    this.label();
    this.$('.state').textContent = !ok ? 'Μη διαθέσιμος' : !on ? 'Κλειστός' : [quality, a.preset_mode].filter(Boolean).join(' · ');
    if (!isNaN(pm)) {
      this.$('.big').textContent = String(pm < 10 ? Math.round(pm * 10) / 10 : Math.round(pm)).replace('.', ',');
      this.$('.unit').textContent = 'PM2.5';
    } else {
      this.$('.big').textContent = on && a.percentage != null ? a.percentage + '%' : '—';
      this.$('.unit').textContent = on && a.percentage != null ? 'ταχύτητα' : '';
    }
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
      LABEL,
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
      LABEL,
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
      LABEL,
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

  static getConfigForm() { return form([['entity', 'Ηχείο / player', ent('media_player'), true], LABEL]); }
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

console.info(`%c WALL-CARDS %c v${VERSION} `, 'background:#1c2228;color:#fff;border-radius:4px 0 0 4px', 'background:#e1e6eb;color:#1c2228;border-radius:0 4px 4px 0');
