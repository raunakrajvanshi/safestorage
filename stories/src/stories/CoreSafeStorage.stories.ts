import type { Meta, StoryObj } from '@storybook/html';
import { createApp, defineComponent, ref, computed, onUnmounted } from 'vue';
import { SafeStorage } from '@safestorage/core';

function mountVue(comp: ReturnType<typeof defineComponent>, props: Record<string, unknown>): HTMLElement {
  const el = document.createElement('div');
  createApp(comp, props).mount(el);
  return el;
}

const css = `
  .demo{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:1.5rem;border-radius:12px;min-width:480px;max-width:640px}
  .demo h3{color:#38bdf8;font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.25rem}
  .sub{font-size:.8rem;color:#475569;margin-bottom:1rem}
  .row{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:.75rem}
  .inp{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:.45rem .75rem;color:#e2e8f0;font-size:.875rem;flex:1;min-width:120px;outline:none}
  .inp:focus{border-color:#38bdf8}
  .btn{background:#0284c7;color:#fff;border:none;border-radius:8px;padding:.45rem 1rem;font-size:.875rem;font-weight:500;cursor:pointer}
  .btn:hover{background:#0369a1}.btn.red{background:#dc2626}.btn.ghost{background:transparent;border:1px solid #334155;color:#94a3b8}
  .div{height:1px;background:#1e293b;margin:1rem 0}
  .lbl{font-size:.75rem;color:#64748b;margin-bottom:.25rem}
  .box{background:#1e293b;border-radius:8px;padding:.75rem 1rem;font-family:monospace;font-size:.8rem;word-break:break-all;color:#86efac;min-height:2.5rem}
  .box.cipher{color:#fbbf24}.box.muted{color:#475569;font-style:italic}
  .hint{font-size:.75rem;color:#475569;margin-top:.4rem}
  .tag{font-size:.7rem;padding:.15rem .5rem;border-radius:4px;font-weight:600;display:inline-block}
  .tag.enc{background:#451a03;color:#fbbf24}.tag.dec{background:#052e16;color:#86efac}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
`;

// ─── Basic Usage ──────────────────────────────────────────────────────────────
const BasicComp = defineComponent({
  props: { password: String, namespace: String },
  setup(p) {
    const s = computed(() => new SafeStorage({ password: p.password!, namespace: p.namespace }));
    const k = ref('greeting'); const v = ref('Hello, SafeStorage!');
    const got = ref<string|null>(null); const exists = ref<boolean|null>(null); const msg = ref('');
    const doSet = async () => { await s.value.set(k.value, v.value); msg.value = `set "${k.value}"`; doGet(); };
    const doGet = async () => { got.value = (await s.value.get<string>(k.value)) ?? null; exists.value = s.value.has(k.value); };
    const doRemove = async () => { await s.value.remove(k.value); got.value = null; exists.value = false; msg.value = `removed "${k.value}"`; };
    return { k, v, got, exists, msg, doSet, doGet, doRemove };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Basic Usage</h3><p class="sub">set · get · remove · has — the full synchronous-feeling async API</p>
    <div class="row"><input class="inp" v-model="k" placeholder="key" style="max-width:140px"/><input class="inp" v-model="v" placeholder="value"/></div>
    <div class="row">
      <button class="btn" @click="doSet">set()</button>
      <button class="btn ghost" @click="doGet">get()</button>
      <button class="btn red" @click="doRemove">remove()</button>
    </div>
    <div v-if="msg" class="hint">✓ {{msg}}</div>
    <div class="div"/>
    <div class="lbl">get() result</div>
    <div :class="['box',got===null?'muted':'']">{{got??'undefined'}}</div>
    <div v-if="exists!==null" class="hint">has() → <b>{{exists}}</b></div>
  </div>`,
});

// ─── Encrypted Output ─────────────────────────────────────────────────────────
const EncComp = defineComponent({
  props: { password: String, valueToStore: String },
  setup(p) {
    const raw = ref(''); const dec = ref(''); const msg = ref('Click the button to encrypt and inspect');
    const run = async () => {
      const s = new SafeStorage({ password: p.password! });
      const k = '_enc_demo_sb_';
      let val: unknown; try { val = JSON.parse(p.valueToStore!); } catch { val = p.valueToStore; }
      await s.set(k, val);
      raw.value = localStorage.getItem(k) ?? '';
      dec.value = JSON.stringify(await s.get(k), null, 2);
      msg.value = '✓ Stored · Inspected · Decrypted';
      await s.remove(k);
    };
    return { raw, dec, msg, run };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Encrypted Output</h3><p class="sub">AES-256-GCM · 100k PBKDF2 iterations · per-item random salt &amp; IV</p>
    <button class="btn" @click="run">Encrypt &amp; Store</button>
    <div class="hint" style="margin:.5rem 0 1rem">{{msg}}</div>
    <div class="div"/>
    <div style="margin-bottom:.3rem"><span class="lbl" style="margin:0">Raw localStorage value  </span><span class="tag enc">encrypted</span></div>
    <div :class="['box cipher',raw?'':'muted']">{{raw||'— run above to generate —'}}</div>
    <div style="height:.75rem"/>
    <div style="margin-bottom:.3rem"><span class="lbl" style="margin:0">After get()  </span><span class="tag dec">decrypted</span></div>
    <div :class="['box',dec?'':'muted']" style="white-space:pre">{{dec||'—'}}</div>
  </div>`,
});

// ─── TTL ──────────────────────────────────────────────────────────────────────
const TtlComp = defineComponent({
  props: { password: String, ttlMs: Number },
  setup(p) {
    const s = new SafeStorage({ password: p.password! });
    const cur = ref<string|null>(null); const left = ref(0); const msg = ref('');
    let t: ReturnType<typeof setInterval>|null = null; let exp = 0;
    const store = async () => {
      await s.set('_ttl_sb_', 'I will self-destruct!', { ttl: p.ttlMs });
      exp = Date.now() + p.ttlMs!; cur.value = 'I will self-destruct!'; msg.value = `stored with ${p.ttlMs}ms TTL`;
      if (t) clearInterval(t);
      t = setInterval(async () => {
        left.value = Math.max(0, exp - Date.now());
        const v = await s.get<string>('_ttl_sb_'); cur.value = v ?? null;
        if (!v) { msg.value = '✓ Expired — get() returned undefined'; clearInterval(t!); }
      }, 100);
    };
    onUnmounted(() => { if (t) clearInterval(t); });
    return { cur, left, msg, store, ttlMs: computed(() => p.ttlMs) };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>TTL &amp; Expiry</h3><p class="sub">Items auto-delete after their TTL. Expiry is checked lazily on get().</p>
    <button class="btn" @click="store">Store with {{ttlMs}}ms TTL</button>
    <div class="div"/>
    <div class="lbl">Current value</div>
    <div :class="['box',cur===null?'muted':'']">{{cur??'undefined — expired or not yet stored'}}</div>
    <div v-if="left>0" class="hint" style="color:#fbbf24">⏱ {{left}}ms remaining</div>
    <div v-if="msg" class="hint">{{msg}}</div>
  </div>`,
});

// ─── Namespace ────────────────────────────────────────────────────────────────
const NsComp = defineComponent({
  props: { password: String },
  setup(p) {
    const a = new SafeStorage({ password: p.password!, namespace: 'app::' });
    const u = new SafeStorage({ password: p.password!, namespace: 'user::' });
    const ak = ref<string[]>([]); const uk = ref<string[]>([]); const msg = ref('');
    const refresh = () => { ak.value = a.keys(); uk.value = u.keys(); };
    const seedA = async () => { await a.set('theme','dark'); await a.set('locale','en-US'); refresh(); msg.value = 'Seeded app::'; };
    const seedU = async () => { await u.set('name','Alice'); await u.set('role','admin'); refresh(); msg.value = 'Seeded user::'; };
    const clear = async () => { await a.clear(); await u.clear(); refresh(); msg.value = 'Cleared both'; };
    return { ak, uk, msg, seedA, seedU, clear };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Namespace Scoping</h3><p class="sub">Multiple instances, same storage area, zero key collisions.</p>
    <div class="row">
      <button class="btn" @click="seedA">Seed app::</button>
      <button class="btn" @click="seedU">Seed user::</button>
      <button class="btn red" @click="clear">Clear all</button>
    </div>
    <div class="div"/>
    <div class="grid2">
      <div><div style="margin-bottom:.3rem"><span class="tag enc">app::</span></div><div class="box" style="min-height:4rem;white-space:pre">{{ak.length?ak.join('\n'):'—'}}</div></div>
      <div><div style="margin-bottom:.3rem"><span class="tag dec">user::</span></div><div class="box" style="min-height:4rem;white-space:pre">{{uk.length?uk.join('\n'):'—'}}</div></div>
    </div>
    <div v-if="msg" class="hint">{{msg}}</div>
  </div>`,
});

// ─── Change Events ────────────────────────────────────────────────────────────
const EventsComp = defineComponent({
  props: { password: String },
  setup(p) {
    const s = new SafeStorage({ password: p.password!, namespace: 'ev::' });
    const evts = ref<{type:string;key:string|null;val:string}[]>([]);
    const k = ref('watched'); const v = ref('hello');
    const off = s.onChange(e => {
      evts.value.unshift({ type: e.type, key: e.key, val: e.newValue !== undefined ? JSON.stringify(e.newValue) : '—' });
      if (evts.value.length > 8) evts.value.pop();
    });
    onUnmounted(() => off());
    return { evts, k, v, doSet: () => s.set(k.value, v.value), doRemove: () => s.remove(k.value), doClear: () => s.clear() };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Change Events</h3><p class="sub">Subscribe to any write, remove, expire, or clear — fires in the same tick.</p>
    <div class="row"><input class="inp" v-model="k" placeholder="key" style="max-width:130px"/><input class="inp" v-model="v" placeholder="value"/></div>
    <div class="row">
      <button class="btn" @click="doSet">set()</button>
      <button class="btn ghost" @click="doRemove">remove()</button>
      <button class="btn red" @click="doClear">clear()</button>
    </div>
    <div class="div"/>
    <div class="lbl">Event log (newest first)</div>
    <div v-if="!evts.length" class="box muted">— no events yet —</div>
    <div v-for="(e,i) in evts" :key="i" class="box" :style="{color:e.type==='set'?'#86efac':e.type==='remove'?'#fca5a5':'#fbbf24',marginBottom:'.4rem'}">
      <span style="color:#94a3b8;display:inline-block;width:4rem">{{e.type}}</span>{{e.key}} → {{e.val}}
    </div>
  </div>`,
});

// ─── Meta ─────────────────────────────────────────────────────────────────────
const meta: Meta = {
  title: 'SafeStorage/Core',
  tags: ['autodocs'],
  argTypes: {
    password: { control: 'text', description: 'PBKDF2 passphrase' },
    namespace: { control: 'text', description: 'Key prefix' },
    ttlMs: { control: { type: 'range', min: 500, max: 10000, step: 500 }, description: 'TTL in ms' },
    valueToStore: { control: 'text', description: 'JSON value to encrypt' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const BasicUsage: Story = { name: 'Basic Usage', args: { password: 'demo-key', namespace: 'sb::' }, render: (a) => mountVue(BasicComp, a as Record<string,unknown>) };
export const EncryptedOutput: Story = { name: 'Encrypted Output', args: { password: 'demo-key', valueToStore: '{"id":1,"name":"Alice","role":"admin"}' }, render: (a) => mountVue(EncComp, a as Record<string,unknown>) };
export const TtlExpiry: Story = { name: 'TTL & Expiry', args: { password: 'demo-key', ttlMs: 3000 }, render: (a) => mountVue(TtlComp, a as Record<string,unknown>) };
export const NamespaceScoping: Story = { name: 'Namespace Scoping', args: { password: 'demo-key' }, render: (a) => mountVue(NsComp, a as Record<string,unknown>) };
export const ChangeEvents: Story = { name: 'Change Events', args: { password: 'demo-key' }, render: (a) => mountVue(EventsComp, a as Record<string,unknown>) };
