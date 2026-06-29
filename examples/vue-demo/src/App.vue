<script setup lang="ts">
import UserProfile from './components/UserProfile.vue';
import Counter from './components/Counter.vue';
import ThemeToggle from './components/ThemeToggle.vue';
</script>

<template>
  <div class="root">
    <header class="header">
      <h1 class="title">SafeStorage — Vue Demo</h1>
      <p class="subtitle">
        All values below are encrypted in localStorage. Open DevTools → Application → Local Storage to see the ciphertext.
      </p>
    </header>

    <main class="main">
      <section class="section">
        <h2 class="section-title">useStorage — User Profile</h2>
        <p class="hint">Persists a structured object. Refresh the page — values survive.</p>
        <UserProfile />
      </section>

      <section class="section">
        <h2 class="section-title">useStorage — Counter</h2>
        <p class="hint">Reactive ref backed by encrypted storage. Refresh to confirm.</p>
        <Counter />
      </section>

      <section class="section">
        <h2 class="section-title">useStorage — Theme Preference</h2>
        <p class="hint">Simple string preference persisted with encryption.</p>
        <ThemeToggle />
      </section>
    </main>
  </div>
</template>

<style scoped>
.root { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding: 2rem; }
.header { max-width: 760px; margin: 0 auto 2.5rem; text-align: center; }
.title { font-size: 2rem; font-weight: 700; color: #a78bfa; margin-bottom: 0.75rem; }
.subtitle { color: #94a3b8; line-height: 1.6; }
.main { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
.section { background: #1e293b; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; }
.section-title { font-size: 1.1rem; font-weight: 600; color: #c4b5fd; margin-bottom: 0.4rem; }
.hint { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
</style>
