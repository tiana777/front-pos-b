<template>
  <div class="space-y-6">
    <section class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="card in statCards"
        :key="card.id"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <span :class="['flex h-12 w-12 items-center justify-center rounded-xl', card.iconBg]">
              <FontAwesomeIcon :icon="card.icon" class="text-xl" />
            </span>
            <div>
              <p class="text-sm font-medium text-slate-500">{{ card.title }}</p>
              <p class="text-3xl font-semibold text-slate-900">{{ card.value }}</p>
            </div>
          </div>
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
              card.positive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600',
            ]"
          >
            <FontAwesomeIcon :icon="card.positive ? faArrowTrendUp : faArrowTrendDown" class="mr-1" />
            {{ card.change }}
          </span>
        </div>
        <p class="mt-4 text-sm text-slate-500">{{ card.description }}</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Monthly Target</p>
            <p class="mt-1 text-base font-semibold text-slate-900">Target you've set for each month</p>
          </div>
          <button type="button" class="text-slate-300 transition hover:text-slate-500">
            <FontAwesomeIcon :icon="faEllipsis" />
          </button>
        </div>

        <div class="mt-6 flex flex-col items-center">
          <div class="relative h-40 w-40">
            <svg viewBox="0 0 120 120" class="h-full w-full">
              <circle
                cx="60"
                cy="60"
                r="52"
                class="text-slate-200"
                stroke="currentColor"
                stroke-width="12"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                class="text-indigo-500"
                stroke="url(#targetGradient)"
                stroke-width="12"
                stroke-linecap="round"
                fill="none"
                :stroke-dasharray="gaugeStroke"
                :stroke-dashoffset="gaugeOffset"
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="targetGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stop-color="#6366F1" />
                  <stop offset="100%" stop-color="#6366F1" stop-opacity="0.6" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="41" fill="white" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-3xl font-semibold text-slate-900">{{ monthlyTargetProgress.toFixed(2) }}%</p>
              <span class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                <FontAwesomeIcon :icon="faArrowTrendUp" />
                {{ monthlyTargetDelta }}
              </span>
            </div>
          </div>
          <p class="mt-4 text-center text-sm text-slate-500 max-w-xs">
            You earn $3287 today, it's higher than last month. Keep up your good work!
          </p>
        </div>

        <div class="mt-6 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-3">
          <div v-for="item in monthlyTargetStats" :key="item.label" class="text-center sm:text-left">
            <p class="text-xs uppercase tracking-wide text-slate-400">{{ item.label }}</p>
            <p class="mt-1 text-base font-semibold text-slate-900">{{ item.value }}</p>
            <span
              :class="[
                'mt-1 inline-flex items-center gap-1 text-xs font-medium',
                item.positive ? 'text-emerald-600' : 'text-rose-600',
              ]"
            >
              <FontAwesomeIcon :icon="item.positive ? faArrowTrendUp : faArrowTrendDown" />
              {{ item.change }}
            </span>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-base font-semibold text-slate-900">Monthly Sales</p>
            <p class="text-sm text-slate-500">Track how much you earn for each month</p>
          </div>
          <button type="button" class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600">
            Download Report
          </button>
        </header>
        <div class="mt-6 flex h-56 items-end gap-3">
          <div
            v-for="month in monthlySales"
            :key="month.label"
            class="flex flex-1 flex-col items-center gap-3"
          >
            <div class="flex h-full w-full items-end justify-center rounded-t-full bg-indigo-100">
              <div
                class="w-10 rounded-t-full bg-indigo-500"
                :style="{ height: getMonthlySalesHeight(month.value) }"
              ></div>
            </div>
            <span class="text-xs font-medium text-slate-500">{{ month.label }}</span>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header class="flex items-start justify-between">
          <div>
            <p class="text-base font-semibold text-slate-900">Top Channels</p>
            <p class="text-sm text-slate-500">Where your sales are coming from</p>
          </div>
          <button type="button" class="text-slate-300 transition hover:text-slate-500">
            <FontAwesomeIcon :icon="faEllipsis" />
          </button>
        </header>

        <ul class="mt-6 space-y-4">
          <li
            v-for="channel in salesByChannel"
            :key="channel.label"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span :class="['flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold', channel.color]">
                {{ channel.initials }}
              </span>
              <div>
                <p class="text-sm font-semibold text-slate-700">{{ channel.label }}</p>
                <p class="text-xs text-slate-400">{{ channel.description }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-slate-900">{{ channel.value }}</p>
              <span
                :class="['text-xs font-medium', channel.positive ? 'text-emerald-600' : 'text-rose-600']"
              >
                {{ channel.change }}
              </span>
            </div>
          </li>
        </ul>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-base font-semibold text-slate-900">Statistics</p>
            <p class="text-sm text-slate-500">Target you've set for each month</p>
          </div>
          <div class="flex items-center gap-2 rounded-full bg-slate-100 p-1">
            <button
              v-for="tab in statisticsTabs"
              :key="tab"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              :class="tab === activeStatisticsTab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-50 to-white p-6">
          <svg viewBox="0 0 100 100" class="h-56 w-full">
            <defs>
              <linearGradient id="statsGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#6366F1" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#6366F1" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path
              v-if="statisticsChart.area"
              :d="statisticsChart.area"
              fill="url(#statsGradient)"
            />
            <path
              v-if="statisticsChart.line"
              :d="statisticsChart.line"
              fill="none"
              stroke="#6366F1"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-500 sm:text-sm">
            <div v-for="point in statisticsData" :key="point.label" class="text-center">
              <p class="font-medium text-slate-500">{{ point.label }}</p>
              <p class="mt-1 text-sm font-semibold text-slate-900 sm:text-base">{{ point.value }}</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faArrowTrendDown,
  faArrowTrendUp,
  faBoxOpen,
  faEllipsis,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons'

defineOptions({ name: 'DashboardOverview' })

const statCards = [
  {
    id: 'customers',
    title: 'Customers',
    value: '3,782',
    change: '+11.01%',
    positive: true,
    description: 'You have added 48 new customers this month.',
    icon: faUserGroup,
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'orders',
    title: 'Orders',
    value: '5,359',
    change: '-9.05%',
    positive: false,
    description: 'Orders decreased slightly compared to last month.',
    icon: faBoxOpen,
    iconBg: 'bg-blue-100 text-blue-600',
  },
]

const monthlyTargetProgress = ref(75.55)
const monthlyTargetDelta = ref('10%')

const gaugeRadius = 52
const gaugeCircumference = 2 * Math.PI * gaugeRadius

const gaugeStroke = `${gaugeCircumference} ${gaugeCircumference}`
const gaugeOffset = computed(() => {
  const value = Math.min(Math.max(monthlyTargetProgress.value, 0), 100)
  return ((100 - value) / 100) * gaugeCircumference
})

const monthlyTargetStats = [
  { label: 'Target', value: '$20K', change: '-2%', positive: false },
  { label: 'Revenue', value: '$20K', change: '+5%', positive: true },
  { label: 'Today', value: '$20K', change: '+3%', positive: true },
]

const monthlySales = [
  { label: 'Jan', value: 120 },
  { label: 'Feb', value: 320 },
  { label: 'Mar', value: 210 },
  { label: 'Apr', value: 280 },
  { label: 'May', value: 190 },
  { label: 'Jun', value: 300 },
  { label: 'Jul', value: 250 },
  { label: 'Aug', value: 140 },
  { label: 'Sep', value: 220 },
  { label: 'Oct', value: 360 },
  { label: 'Nov', value: 240 },
  { label: 'Dec', value: 110 },
]

const monthlySalesMax = computed(() => {
  if (!monthlySales.length) return 0
  return Math.max(...monthlySales.map((entry) => entry.value))
})

const getMonthlySalesHeight = (value) => {
  if (!monthlySalesMax.value) return '0%'
  const ratio = value / monthlySalesMax.value
  return `${Math.round(ratio * 100)}%`
}

const salesByChannel = [
  { label: 'Online Store', value: '$12,420', change: '+12%', positive: true, initials: 'OS', description: 'Tailadmin.com', color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Marketplace', value: '$9,814', change: '+8%', positive: true, initials: 'MP', description: 'External partners', color: 'bg-blue-100 text-blue-600' },
  { label: 'Point of Sale', value: '$6,932', change: '-4%', positive: false, initials: 'POS', description: 'Retail stores', color: 'bg-amber-100 text-amber-600' },
]

const statisticsTabs = ['Monthly', 'Quarterly', 'Annually']
const activeStatisticsTab = ref('Monthly')

const statisticsData = [
  { label: 'Jan', value: 148 },
  { label: 'Feb', value: 162 },
  { label: 'Mar', value: 174 },
  { label: 'Apr', value: 158 },
  { label: 'May', value: 185 },
  { label: 'Jun', value: 192 },
  { label: 'Jul', value: 206 },
]

const statisticsChart = computed(() => {
  if (!statisticsData.length) {
    return { line: '', area: '' }
  }

  const values = statisticsData.map((point) => point.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const padding = 12
  const chartHeight = 100 - padding * 2
  const stepX = statisticsData.length > 1 ? 100 / (statisticsData.length - 1) : 0

  const yFor = (value) => {
    const normalized = (value - min) / range
    return (100 - padding) - normalized * chartHeight
  }

  let line = `M0 ${yFor(statisticsData[0].value).toFixed(2)}`

  statisticsData.slice(1).forEach((point, index) => {
    const x = ((index + 1) * stepX).toFixed(2)
    const y = yFor(point.value).toFixed(2)
    line += ` L${x} ${y}`
  })

  const baseline = (100 - padding).toFixed(2)
  const area = `${line} L100 ${baseline} L0 ${baseline} Z`

  return { line, area }
})
</script>

<style scoped>
</style>
