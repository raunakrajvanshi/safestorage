<script setup lang="ts">
import { ref } from 'vue';
import { useStorage } from '@safestorage/vue';

interface Profile {
  name: string;
  email: string;
}

const { value: profile, set: setProfile, remove: removeProfile, ready } = useStorage<Profile | null>(
  'profile',
  null,
  { password: 'vue-demo-secret-key', namespace: 'vue-demo::' },
);

const name = ref('');
const email = ref('');

async function save() {
  if (!name.value.trim() || !email.value.trim()) return;
  await setProfile({ name: name.value, email: email.value });
  name.value = '';
  email.value = '';
}
</script>

<template>
  <div v-if="!ready" class="hint">Loading…</div>
  <div v-else-if="profile" class="card">
    <div class="row"><span class="label">Name</span> {{ profile.name }}</div>
    <div class="row"><span class="label">Email</span> {{ profile.email }}</div>
    <button class="btn danger" @click="removeProfile">Clear Profile</button>
  </div>
  <div v-else class="form">
    <input class="input" placeholder="Name" v-model="name" />
    <input class="input" placeholder="Email" v-model="email" />
    <button class="btn" @click="save">Save Profile</button>
  </div>
</template>

<style scoped>
.card { display: flex; flex-direction: column; gap: 0.5rem; }
.row { display: flex; gap: 1rem; align-items: center; }
.label { color: #64748b; width: 60px; flex-shrink: 0; }
.form { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.input {
  background: #0f172a; border: 1px solid #334155; border-radius: 8px;
  padding: 0.5rem 0.75rem; color: #e2e8f0; flex: 1; min-width: 140px; outline: none;
}
.btn {
  background: #7c3aed; color: #fff; border: none; border-radius: 8px;
  padding: 0.5rem 1.25rem; cursor: pointer; font-weight: 500;
}
.danger { background: #dc2626; margin-top: 0.5rem; align-self: flex-start; }
.hint { color: #64748b; font-size: 0.875rem; }
</style>
