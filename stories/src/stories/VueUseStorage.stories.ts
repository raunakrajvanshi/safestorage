import type { Meta, StoryObj } from '@storybook/html';
import { createApp, defineComponent, ref, computed } from 'vue';
import { useStorage } from '@safestorage/vue';

function mountVue(comp: ReturnType<typeof defineComponent>, props: Record<string, unknown>): HTMLElement {
  const el = document.createElement('div');
  createApp(comp, props).mount(el);
  return el;
}

const css = `
  .demo{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:1.5rem;border-radius:12px;min-width:480px;max-width:640px}
  .demo h3{color:#a78bfa;font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.25rem}
  .sub{font-size:.8rem;color:#475569;margin-bottom:1rem}
  .row{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:.75rem}
  .inp{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:.45rem .75rem;color:#e2e8f0;font-size:.875rem;flex:1;min-width:120px;outline:none}
  .inp:focus{border-color:#a78bfa}
  .btn{background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:.45rem 1rem;font-size:.875rem;font-weight:500;cursor:pointer}
  .btn.icon{width:2.5rem;height:2.5rem;font-size:1.25rem;font-weight:700;padding:0}
  .btn:hover{background:#6d28d9}.btn.red{background:#dc2626}.btn.ghost{background:transparent;border:1px solid #334155;color:#94a3b8}
  .div{height:1px;background:#1e293b;margin:1rem 0}
  .lbl{font-size:.75rem;color:#64748b;margin-bottom:.25rem}
  .box{background:#1e293b;border-radius:8px;padding:.75rem 1rem;font-family:monospace;font-size:.8rem;word-break:break-all;color:#c4b5fd;min-height:2.5rem}
  .box.muted{color:#475569;font-style:italic}
  .hint{font-size:.75rem;color:#475569;margin-top:.4rem}
  .pill{background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:20px;padding:.3rem 1rem;cursor:pointer;font-size:.85rem}
  .pill.on{background:#7c3aed;color:#fff;border-color:#7c3aed}
  .count{font-size:2.5rem;font-weight:700;min-width:80px;text-align:center;color:#c4b5fd}
  .frow{display:flex;flex-direction:column;gap:.25rem;margin-bottom:.75rem}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
  .tag-s{background:#451a03;color:#fbbf24;font-size:.7rem;padding:.15rem .5rem;border-radius:4px;font-weight:600}
  .tag-l{background:#052e16;color:#86efac;font-size:.7rem;padding:.15rem .5rem;border-radius:4px;font-weight:600}
`;

// ─── Counter ──────────────────────────────────────────────────────────────────
const CounterComp = defineComponent({
  props: { password: String, namespace: String, step: Number },
  setup(p) {
    const { value: count, set: setCount, ready } = useStorage('counter', 0, { password: p.password!, namespace: p.namespace });
    const inc = () => setCount(count.value + (p.step ?? 1));
    const dec = () => setCount(count.value - (p.step ?? 1));
    const reset = () => setCount(0);
    return { count, ready, inc, dec, reset, step: computed(() => p.step ?? 1) };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Counter</h3><p class="sub">Reactive ref backed by encrypted localStorage. Survives page refreshes.</p>
    <div v-if="!ready" class="hint">Loading from storage…</div>
    <div v-else class="row" style="align-items:center">
      <button class="btn icon" @click="dec">−</button>
      <span class="count">{{count}}</span>
      <button class="btn icon" @click="inc">+</button>
      <button class="btn ghost" @click="reset" style="margin-left:.5rem">Reset</button>
    </div>
    <div class="hint" style="margin-top:.5rem">Step: {{step}} · Refresh the page — value persists.</div>
  </div>`,
});

// ─── User Profile ─────────────────────────────────────────────────────────────
const ProfileComp = defineComponent({
  props: { password: String, namespace: String },
  setup(p) {
    interface P { name: string; email: string; role: string }
    const { value: profile, set, remove, ready } = useStorage<P|null>('profile', null, { password: p.password!, namespace: p.namespace });
    const name = ref(''); const email = ref(''); const role = ref('viewer');
    const roles = ['viewer','editor','admin'];
    const save = () => { if (!name.value || !email.value) return; set({ name: name.value, email: email.value, role: role.value }); name.value = ''; email.value = ''; };
    return { profile, ready, name, email, role, roles, save, remove };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>User Profile</h3><p class="sub">Structured object — JSON-serialised then AES-256-GCM encrypted.</p>
    <div v-if="!ready" class="hint">Loading…</div>
    <template v-else>
      <template v-if="profile">
        <div class="grid2" style="margin-bottom:.75rem">
          <div><div class="lbl">Name</div><div class="box">{{profile.name}}</div></div>
          <div><div class="lbl">Email</div><div class="box">{{profile.email}}</div></div>
          <div><div class="lbl">Role</div><div class="box">{{profile.role}}</div></div>
        </div>
        <button class="btn red" @click="remove">Clear Profile</button>
      </template>
      <template v-else>
        <div class="frow"><div class="lbl">Name</div><input class="inp" v-model="name" placeholder="Alice"/></div>
        <div class="frow"><div class="lbl">Email</div><input class="inp" v-model="email" placeholder="alice@example.com"/></div>
        <div class="frow">
          <div class="lbl">Role</div>
          <div class="row" style="margin:0">
            <button v-for="r in roles" :key="r" :class="['pill',{on:role===r}]" @click="role=r">{{r}}</button>
          </div>
        </div>
        <button class="btn" @click="save" style="margin-top:.5rem">Save Profile</button>
      </template>
    </template>
  </div>`,
});

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const ThemeComp = defineComponent({
  props: { password: String, namespace: String },
  setup(p) {
    type T = 'light'|'dark'|'system';
    const themes: T[] = ['light','dark','system'];
    const { value: theme, set } = useStorage<T>('theme', 'system', { password: p.password!, namespace: p.namespace });
    const bg = computed(() => ({ light:'#f8fafc', dark:'#0f172a', system:'#1e293b' }[theme.value]));
    const fg = computed(() => theme.value === 'light' ? '#0f172a' : '#e2e8f0');
    return { theme, themes, bg, fg, set };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Theme Preference</h3><p class="sub">String enum persisted with encryption. Refresh to confirm it sticks.</p>
    <div class="row" style="margin-bottom:1.25rem">
      <button v-for="t in themes" :key="t" :class="['pill',{on:theme===t}]" @click="set(t)">{{t}}</button>
    </div>
    <div :style="{background:bg,color:fg,borderRadius:'10px',padding:'1.25rem',transition:'all .3s',border:'1px solid #334155'}">
      <div style="font-size:.875rem;font-weight:600;margin-bottom:.25rem">{{theme}} theme preview</div>
      <div style="font-size:.75rem;opacity:.6">This area reflects the stored preference.</div>
    </div>
  </div>`,
});

// ─── Session Storage ──────────────────────────────────────────────────────────
const SessionComp = defineComponent({
  props: { password: String },
  setup(p) {
    const { value: note, set, remove, ready } = useStorage('note', '', { password: p.password!, storage: 'session' });
    const draft = ref('');
    const save = () => { if (draft.value.trim()) { set(draft.value); draft.value = ''; } };
    return { note, ready, draft, save, remove };
  },
  template: `<div class="demo"><style>${css}</style>
    <h3>Session Storage</h3><p class="sub">Pass <code>storage: 'session'</code> to use sessionStorage — same encryption, wiped on tab close.</p>
    <div class="row">
      <input class="inp" v-model="draft" placeholder="Enter a note…" @keydown.enter="save"/>
      <button class="btn" @click="save">Save</button>
      <button class="btn red" @click="remove">Clear</button>
    </div>
    <div class="div"/>
    <div class="lbl">Stored in sessionStorage (encrypted)</div>
    <div :class="['box',!note?'muted':'']">{{note||'— nothing stored yet —'}}</div>
    <div class="hint" style="margin-top:.75rem">
      <span class="tag-s">sessionStorage</span> Close this tab and reopen — data is gone.
      <span class="tag-l" style="margin-left:.25rem">localStorage</span> Would survive.
    </div>
  </div>`,
});

// ─── Meta ─────────────────────────────────────────────────────────────────────
const meta: Meta = {
  title: 'SafeStorage/Vue useStorage',
  tags: ['autodocs'],
  argTypes: {
    password: { control: 'text', description: 'Encryption passphrase' },
    namespace: { control: 'text', description: 'Key prefix for scoping' },
    step: { control: { type: 'range', min: 1, max: 10, step: 1 }, description: 'Counter step' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Counter: Story = { name: 'Counter', args: { password: 'vue-key', namespace: 'vue-sb::', step: 1 }, render: (a) => mountVue(CounterComp, a as Record<string,unknown>) };
export const UserProfile: Story = { name: 'User Profile', args: { password: 'vue-key', namespace: 'vue-sb::' }, render: (a) => mountVue(ProfileComp, a as Record<string,unknown>) };
export const ThemeToggle: Story = { name: 'Theme Toggle', args: { password: 'vue-key', namespace: 'vue-sb::' }, render: (a) => mountVue(ThemeComp, a as Record<string,unknown>) };
export const SessionStorage: Story = { name: 'Session Storage', args: { password: 'vue-key' }, render: (a) => mountVue(SessionComp, a as Record<string,unknown>) };
