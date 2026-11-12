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
 */
const VERSION = '0.1.0';

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
  --w-font:'Manrope',sans-serif;
  --w-spring:cubic-bezier(.3,1.4,.5,1);
  display:block; height:100%;
  font-family:var(--w-font); color:var(--w-ink);
  -webkit-font-smoothing:antialiased;
}
*{box-sizing:border-box}
button{font:inherit;border:0;padding:0;cursor:pointer;color:inherit;-webkit-tap-highlight-color:transparent}
.card{
  height:100%; min-height:var(--w-min-h,228px);
  border-radius:24px; padding:16px 18px; position:relative; overflow:hidden;
  display:flex; flex-direction:column; justify-content:space-between;
  background:var(--w-card); transition:background .4s, opacity .3s;
}
.card.unavail{opacity:.5}
.head{display:flex;flex-direction:column;min-width:0}
.title{font:600 17px var(--w-font)}
.sub{font:500 13px var(--w-font);color:var(--w-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ms{
  font-family:'Material Symbols Rounded'; font-weight:400; font-style:normal; line-height:1;
  letter-spacing:normal; text-transform:none; white-space:nowrap; direction:ltr;
  -webkit-font-feature-settings:'liga'; font-feature-settings:'liga';
}
.fill{font-variation-settings:'FILL' 1}
.press{transition:transform .15s}
.press:active{transform:scale(.95)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const UNAVAILABLE = ['unavailable', 'unknown', undefined, null];

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

  $(sel) { return this.shadowRoot.querySelector(sel); }
  st(id) { return id ? this._hass.states[id] : undefined; }
  available(id) { const s = this.st(id); return !!s && !UNAVAILABLE.includes(s.state); }
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

  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 4, min_columns: 4, min_rows: 4 }; }
}

/* Φόρμα ρυθμίσεων από απλή περιγραφή πεδίων: [όνομα, ετικέτα, selector, required] */
function form(fields) {
  const labels = Object.fromEntries(fields.map((f) => [f[0], f[1]]));
  return {
    schema: fields.map(([name, , selector, required]) => ({ name, selector, required: !!required })),
    computeLabel: (s) => labels[s.name] || s.name,
  };
}
const firstEntity = (hass, domain) => Object.keys(hass.states).find((id) => id.startsWith(domain + '.')) || '';

/* ───────────────────────── 2. Κάρτες ───────────────────────── */

/* ── Φως: ψηλή κάρτα, σύρσιμο πάνω-κάτω για φωτεινότητα, διακόπτης κάτω ── */
class WallLightCard extends WallBaseCard {
  static css = `
:host{--w-min-h:468px}
.card{padding:0;border-radius:22px;color:#2d2a24;justify-content:flex-start;
  background:linear-gradient(180deg,#fdfdfb,#f1efea);
  box-shadow:0 14px 28px rgba(40,45,55,.16),0 3px 6px rgba(40,45,55,.10),inset 0 1px 0 #fff,inset 0 -3px 4px rgba(0,0,0,.05)}
.zone{flex:1;position:relative;overflow:hidden;touch-action:none;cursor:ns-resize}
.zone.nodim{cursor:default}
.glow{position:absolute;left:0;right:0;bottom:0;transition:height .12s,opacity .35s;
  background:linear-gradient(180deg,oklch(0.93 0.07 85),oklch(0.88 0.1 80))}
.grip{position:absolute;left:0;right:0;display:flex;justify-content:center;transition:bottom .12s,opacity .35s}
.grip span{width:40px;height:4px;border-radius:2px;background:rgba(80,60,20,.25);margin-bottom:-12px}
.top{position:relative;padding:18px 18px 0;display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.name{font:600 18px var(--w-font)}
.tune{width:40px;height:40px;flex:none;margin:-6px -8px 0 0;border-radius:50%;background:transparent;color:#a8a296;font-size:22px}
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
      ['entity', 'Φως', { entity: { domain: 'light' } }, true],
      ['name', 'Όνομα (προαιρετικό)', { text: {} }],
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
        this._drag = Math.round(Math.max(1, Math.min(100, ((r.bottom - ev.clientY) / r.height) * 100)));
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
      ['entity', 'Κλειδαριά', { entity: { domain: 'lock' } }, true],
      ['name', 'Τίτλος (προαιρετικό)', { text: {} }],
      ['subtitle', 'Υπότιτλος (προαιρετικό)', { text: {} }],
      ['battery_entity', 'Μπαταρία (προαιρετικό)', { entity: { domain: 'sensor', device_class: 'battery' } }],
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

    const batt = this.$('.batt');
    const lvl = this.available(c.battery_entity) ? parseFloat(this.st(c.battery_entity).state) : NaN;
    batt.style.display = isNaN(lvl) ? 'none' : 'flex';
    if (!isNaN(lvl)) {
      const bars = Math.round((lvl / 100) * 6);
      batt.querySelector('.ms').textContent = bars >= 6 ? 'battery_full' : `battery_${bars}_bar`;
      this.$('.bv').textContent = Math.round(lvl) + '%';
    }
  }
}

/* ── Πλυντήριο: τύμπανο που γυρίζει, νερό, δαχτυλίδι προόδου ── */
const WASH_IDLE = ['off', 'idle', 'standby', 'power off', 'ready', 'none', '-', ''];
const WASH_DONE = ['finished', 'complete', 'completed', 'end', 'done'];
const WASH_PAUSED = ['pause', 'paused'];

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

class WallWasherCard extends WallBaseCard {
  static css = `
@keyframes wm-spin{to{transform:rotate(360deg)}}
@keyframes wm-wave{to{transform:translateX(-50%) rotate(360deg)}}
.card.run{background:var(--w-blue-bg)}
.top{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:6px}
.btn{flex:none;width:56px;height:56px;margin:-8px -8px 0 0;border-radius:50%;display:grid;place-items:center;
  font-size:30px;transition:background .3s,color .3s,transform .15s;background:#fff;color:var(--w-ink)}
.run .btn{background:var(--w-blue);color:#fff}
.btn[hidden]{display:none}
.btn:disabled{opacity:.4;cursor:default}
.row{display:flex;align-items:center;gap:14px}
.dial{position:relative;width:76px;height:76px;flex:none;border-radius:50%}
.drum{position:absolute;inset:6px;border-radius:50%;background:#f4f6f8;overflow:hidden}
.water{position:absolute;width:140px;height:140px;left:50%;top:64px;border-radius:42%;
  background:oklch(0.72 0.09 228 / .55);transition:top .8s;animation:wm-wave 3.2s linear infinite}
.run .water{top:30px}
.holes{position:absolute;inset:8px;border-radius:50%;border:2px dashed rgba(28,34,40,.18)}
.run .holes{animation:wm-spin 2.4s linear infinite}
.time{display:flex;flex-direction:column;min-width:0}
.big{font:400 40px var(--w-font);letter-spacing:-1.5px;line-height:1}
`;

  static getConfigForm() {
    const sensor = { entity: { domain: ['sensor', 'input_select', 'input_text', 'select'] } };
    const action = { entity: { domain: ['button', 'input_button', 'script', 'switch'] } };
    return form([
      ['entity', 'Κατάσταση (τρέχει / σβηστό / τελείωσε)', { entity: {} }, true],
      ['name', 'Τίτλος (προαιρετικό)', { text: {} }],
      ['remaining_entity', 'Υπόλοιπος χρόνος', sensor],
      ['total_entity', 'Συνολικός χρόνος προγράμματος', sensor],
      ['program_entity', 'Πρόγραμμα', sensor],
      ['temp_entity', 'Θερμοκρασία νερού', sensor],
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
    return `
<div class="card">
  <div class="top">
    <div class="head"><span class="title"></span><span class="sub"></span></div>
    <button class="btn ms fill" aria-label="Έναρξη/Παύση"></button>
  </div>
  <div class="row">
    <div class="dial"><div class="drum"><div class="water"></div><div class="holes"></div></div></div>
    <div class="time"><span class="big"></span><span class="sub end"></span></div>
  </div>
</div>`;
  }

  bind() {
    this.$('.btn').addEventListener('click', () => this.trigger(this._action));
  }

  update() {
    const c = this._config;
    const ok = this.available(c.entity);
    const raw = ok ? String(this.st(c.entity).state).toLowerCase() : '';
    const paused = WASH_PAUSED.includes(raw);
    const done = WASH_DONE.includes(raw);
    const run = ok && !paused && !done && !WASH_IDLE.includes(raw);
    const val = (id) => (this.available(id) ? this.st(id).state : '');

    const card = this.$('.card');
    card.classList.toggle('unavail', !ok);
    card.classList.toggle('run', run);
    this.$('.title').textContent = c.name || 'Πλυντήριο';
    const program = [val(c.program_entity), val(c.temp_entity)].filter(Boolean).join(' ');
    this.$('.top .sub').textContent =
      !ok ? 'Μη διαθέσιμο' : paused ? 'Σε παύση' : done ? 'Ολοκληρώθηκε' : run ? program || 'Σε λειτουργία' : 'Ανενεργό';

    /* Κουμπί: παύση όταν τρέχει, έναρξη αλλιώς — μόνο αν έχει οριστεί το αντίστοιχο entity */
    const btn = this.$('.btn');
    this._action = run ? c.pause_entity : c.start_entity;
    btn.hidden = !c.pause_entity && !c.start_entity;
    btn.disabled = !this._action || this.st(this._action)?.state === 'unavailable';
    btn.textContent = run ? 'pause' : 'play_arrow';

    const active = run || paused;
    const rem = active ? toMinutes(this.st(c.remaining_entity)) : null;
    const total = active ? toMinutes(this.st(c.total_entity)) : null;
    const m = rem == null ? null : Math.round(rem);
    this.$('.big').textContent = m == null ? '—' : m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : `${m}′`;
    let end = '';
    if (m != null && run) {
      const t = new Date(Date.now() + m * 60000);
      end = `τέλος ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }
    this.$('.end').textContent = end;
    const pct = done ? 100 : rem != null && total ? Math.max(0, Math.min(100, (1 - rem / total) * 100)) : 0;
    this.$('.dial').style.background =
      `conic-gradient(var(--w-blue) 0 ${pct}%,rgba(0,0,0,.08) ${pct}% 100%)`;
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
register('wall-lock-card', WallLockCard, 'Wall · Κλειδαριά', 'Μεταλλική κλειδαριά με πόμολο που γυρίζει.');
register('wall-washer-card', WallWasherCard, 'Wall · Πλυντήριο', 'Τύμπανο, υπόλοιπος χρόνος και πρόοδος προγράμματος.');

console.info(`%c WALL-CARDS %c v${VERSION} `, 'background:#1c2228;color:#fff;border-radius:4px 0 0 4px', 'background:#e1e6eb;color:#1c2228;border-radius:0 4px 4px 0');
