/// <reference types="node" />
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  experimental: {
    appManifest: false,
  },
  nitro: {
    preset: 'github_pages',
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      useMsw:
        (process.env.NUXT_PUBLIC_USE_MSW || '').toLowerCase() === 'true' ||
        process.env.NUXT_PUBLIC_USE_MSW === '1',
    },
  },
  app: {
    baseURL: '/to-do/',
    head: {
      title: 'To-Do List'
    },
  }
})
