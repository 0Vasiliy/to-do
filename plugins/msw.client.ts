export default defineNuxtPlugin(async () => {
  const runtimeConfig = useRuntimeConfig()
  const shouldUseMsw =
    runtimeConfig.public.useMsw || process.env.NODE_ENV === 'development'

  if (!shouldUseMsw) return

  // MSW client worker (intercepts requests to /api/* during dev)
  const { worker } = await import('~/mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${runtimeConfig.app.baseURL}mockServiceWorker.js`,
    },
  })
})

