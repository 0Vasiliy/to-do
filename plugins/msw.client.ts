export default defineNuxtPlugin(async () => {
  if (process.env.NODE_ENV !== 'development') return

  // MSW client worker (intercepts requests to /api/* during dev)
  const { worker } = await import('~/mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
  })
})

