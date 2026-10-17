<script setup lang="ts">
import type { LeaderboardEntry } from '@/types'

export interface RowHighlight {
  playerName: string
  score: number
  /** Kategori sekmesinde sıra da eşleşmeli; genel sekmede null */
  rank: number | null
}

const props = defineProps<{
  entries: LeaderboardEntry[]
  highlight?: RowHighlight | null
}>()

const MEDAL_CLASS: Record<number, string> = {
  1: 'bg-medal-gold/20 text-medal-gold border-medal-gold/60',
  2: 'bg-medal-silver/20 text-medal-silver border-medal-silver/60',
  3: 'bg-medal-bronze/20 text-medal-bronze border-medal-bronze/60',
}
const MEDAL_NAME: Record<number, string> = { 1: 'Altın', 2: 'Gümüş', 3: 'Bronz' }

function cell(entry: LeaderboardEntry): string {
  return isHighlighted(entry) ? 'border-primary bg-primary/15' : 'border-transparent bg-surface'
}

function isHighlighted(entry: LeaderboardEntry): boolean {
  const h = props.highlight
  if (!h) return false
  return (
    entry.player_name === h.playerName &&
    entry.score === h.score &&
    (h.rank === null || entry.rank === h.rank)
  )
}
</script>

<template>
  <table class="w-full border-separate border-spacing-y-2 text-left">
    <caption class="sr-only">
      Skor tablosu
    </caption>
    <thead class="sr-only">
      <tr>
        <th scope="col">Sıra</th>
        <th scope="col">Oyuncu</th>
        <th scope="col">Doğru sayısı</th>
        <th scope="col">Puan</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="entry in entries"
        :key="entry.rank"
        :data-highlight="isHighlighted(entry)"
        :aria-current="isHighlighted(entry) ? 'true' : undefined"
      >
        <td
          class="w-14 rounded-l-(--radius-control) border-y border-l py-3 pl-3"
          :class="cell(entry)"
        >
          <span
            v-if="MEDAL_CLASS[entry.rank]"
            class="flex size-9 items-center justify-center rounded-full border font-heading font-bold"
            :class="MEDAL_CLASS[entry.rank]"
            :title="`${MEDAL_NAME[entry.rank]} madalya`"
            :data-medal="MEDAL_NAME[entry.rank]"
          >
            {{ entry.rank }}
          </span>
          <span
            v-else
            class="flex size-9 items-center justify-center font-semibold text-text-muted"
          >
            {{ entry.rank }}
          </span>
        </td>
        <td class="min-w-0 border-y py-3 pr-2" :class="cell(entry)">
          <span class="block max-w-[10rem] truncate font-semibold sm:max-w-xs">
            {{ entry.player_name }}
          </span>
          <span v-if="isHighlighted(entry)" class="text-[13px] font-medium text-primary">Sen</span>
        </td>
        <td
          class="border-y py-3 pr-2 text-right text-[13px] whitespace-nowrap text-text-muted"
          :class="cell(entry)"
        >
          {{ entry.correct_count }} doğru
        </td>
        <td
          class="rounded-r-(--radius-control) border-y border-r py-3 pr-4 text-right font-heading text-xl font-bold tabular-nums"
          :class="cell(entry)"
        >
          {{ entry.score }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
