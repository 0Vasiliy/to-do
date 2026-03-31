type Role = 'admin' | 'user'

export interface AuthUser {
  id: number
  email: string
  role: Role
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth.user', () => null)
  const token = useState<string | null>('auth.token', () => null)

  function loadFromStorage() {
    if (!process.client) return
    const storedToken = localStorage.getItem('token')
    const storedUserRaw = localStorage.getItem('user')
    if (storedToken) token.value = storedToken
    if (storedUserRaw) {
      try {
        user.value = JSON.parse(storedUserRaw) as AuthUser
      } catch {
        user.value = null
      }
    }
  }

  if (process.client) loadFromStorage()

  async function login(email: string, password: string) {
    const { $api } = useNuxtApp()
    const res = await $api.post('/auth/login', { email, password })

    token.value = String(res.data.token)
    user.value = res.data.user as AuthUser

    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    if (!process.client) return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    token.value = null
    user.value = null
  }

  const isAdmin = computed(() => user.value?.role === 'admin')

  return {
    user,
    token,
    isAdmin,
    login,
    logout,
    loadFromStorage,
  }
}

