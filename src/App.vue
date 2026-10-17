<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Çentikli ekranlar için güvenli alan boşlukları -->
  <div
    class="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
  >
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>
