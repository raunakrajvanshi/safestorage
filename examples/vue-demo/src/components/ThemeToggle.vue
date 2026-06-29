<script setup lang="ts">
import { useStorage } from '@safestorage/vue';

type Theme = 'light' | 'dark' | 'system';
const themes: Theme[] = ['light', 'dark', 'system'];

const { value: theme, set: setTheme } = useStorage<Theme>('theme', 'system', {
  password: 'vue-demo-secret-key',
  namespace: 'vue-demo::',
});
</script>

<template>
  <div class="row">
    <button
      v-for="t in themes"
      :key="t"
      :class="['pill', { active: theme === t }]"
      @click="setTheme(t)"
    >
      {{ t }}
    </button>
  </div>
</template>

<style scoped>
.row { display: flex; gap: 0.5rem; }
.pill {
  background: #0f172a; color: #94a3b8; border: 1px solid #334155;
  border-radius: 20px; padding: 0.4rem 1.1rem; cursor: pointer; text-transform: capitalize;
}
.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
</style>
