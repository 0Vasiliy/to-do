export default defineNuxtRouteMiddleware((to) => {
  // Middleware runs on server too; localStorage is only available in the browser.
  if (!process.client) return

  const token = localStorage.getItem('token')

  if (to.path === '/login') {
    if (token) return navigateTo('/')
    return
  }

  if (!token) {
    return navigateTo('/login')
  }
})

