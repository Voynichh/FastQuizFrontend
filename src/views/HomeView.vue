<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="flex flex-1 flex-col items-center justify-center gap-8 py-8 text-center">
    <div class="flex flex-col items-center gap-4">
      <div
        class="flex size-20 items-center justify-center rounded-3xl border border-border bg-surface"
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" class="size-12">
          <path d="M35 8 16 36h14l-3 20 21-30H34z" fill="var(--color-primary)" />
        </svg>
      </div>
      <h1 class="text-5xl sm:text-6xl">Fast Quiz</h1>
      <p class="max-w-sm text-lg text-text-muted">
        Her soru için sadece 5 saniyen var. 20 soruda ne kadar hızlısın?
      </p>
    </div>

    <ul class="flex flex-wrap justify-center gap-2 text-[13px] text-text-muted">
      <li class="rounded-full border border-border bg-surface px-3 py-1">20 soru</li>
      <li class="rounded-full border border-border bg-surface px-3 py-1">5 saniye</li>
      <li class="rounded-full border border-border bg-surface px-3 py-1">Üyelik yok</li>
    </ul>

    <div class="flex w-full max-w-xs flex-col items-center gap-3">
      <AppButton to="/kategoriler" class="w-full">Başla</AppButton>
      <RouterLink
        to="/skor-tablosu"
        class="inline-flex min-h-11 items-center px-4 text-text-muted underline-offset-4 hover:text-text hover:underline"
      >
        Skor tablosu
      </RouterLink>
    </div>
  </main>
</template>
