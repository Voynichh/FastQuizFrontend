<script setup lang="ts">
import { computed, ref } from 'vue'

import { NAME_MAX, validatePlayerName } from '@/lib/playerName'

import AppButton from './AppButton.vue'

defineProps<{
  loading?: boolean
  /** Sunucudan dönen hata (ör. uygunsuz isim) */
  serverError?: string | null
}>()

const emit = defineEmits<{ submit: [name: string] }>()

const name = ref('')
const touched = ref(false)

// Yazarken anlık doğrulama; boş alanda henüz hata gösterme
const clientError = computed(() => (touched.value ? validatePlayerName(name.value) : null))

function onSubmit() {
  touched.value = true
  if (validatePlayerName(name.value)) return
  emit('submit', name.value.trim())
}
</script>

<template>
  <form class="flex flex-col gap-3" novalidate @submit.prevent="onSubmit">
    <label for="player-name" class="text-[13px] font-medium text-text-muted">
      Skor tablosu için takma adın
    </label>
    <input
      id="player-name"
      v-model="name"
      type="text"
      name="player_name"
      autocomplete="nickname"
      enterkeyhint="done"
      :maxlength="NAME_MAX + 10"
      placeholder="Örn. Ece"
      class="min-h-14 rounded-(--radius-control) border bg-surface-raised px-4 text-[17px] text-text placeholder:text-text-muted/60"
      :class="clientError || serverError ? 'border-danger' : 'border-border'"
      :aria-invalid="Boolean(clientError || serverError)"
      aria-describedby="player-name-help"
      :disabled="loading"
      @input="touched = true"
    />
    <p
      id="player-name-help"
      class="min-h-5 text-[13px]"
      :class="clientError || serverError ? 'text-danger' : 'text-text-muted'"
      role="status"
    >
      <template v-if="clientError || serverError">
        <span aria-hidden="true">✕ </span>{{ clientError ?? serverError }}
      </template>
      <template v-else>2–20 karakter; Latin harf, rakam, boşluk ve _ - .</template>
    </p>
    <AppButton type="submit" :loading="loading" class="w-full">Skoru kaydet</AppButton>
  </form>
</template>
