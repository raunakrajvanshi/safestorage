<script setup lang="ts">
import { useStorage } from '@safestorage/vue';

const { value: count, set: setCount } = useStorage('counter', 0, {
  password: 'vue-demo-secret-key',
  namespace: 'vue-demo::',
});

function increment() { setCount(count.value + 1); }
function decrement() { setCount(count.value - 1); }
function reset() { setCount(0); }
</script>

<template>
  <div class="row">
    <button class="btn" @click="decrement">−</button>
    <span class="count">{{ count }}</span>
    <button class="btn" @click="increment">+</button>
    <button class="reset" @click="reset">Reset</button>
  </div>
</template>

<style scoped>
.row { display: flex; align-items: center; gap: 1rem; }
.btn {
  background: #7c3aed; color: #fff; border: none; border-radius: 8px;
  width: 40px; height: 40px; font-size: 1.25rem; cursor: pointer; font-weight: 700;
}
.count { font-size: 2rem; font-weight: 700; min-width: 60px; text-align: center; }
.reset {
  background: transparent; color: #64748b; border: 1px solid #334155;
  border-radius: 8px; padding: 0.4rem 0.75rem; cursor: pointer;
}
</style>
