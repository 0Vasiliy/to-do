import axios from 'axios'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const api = axios.create({
    baseURL: runtimeConfig.public.apiBaseUrl,
    timeout: 15000,
  })

  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    response => response,
    err => {
      const status = err?.response?.status
      if (status === 401) {
        // Clear auth data and force login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigateTo('/login')
      }
      return Promise.reject(err)
    },
  )

  return {
    provide: {
      api,
    },
  }
})

