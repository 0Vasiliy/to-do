import { http, HttpResponse, delay } from 'msw'
import { users } from '../data/users.data'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json()
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    await delay(500)

    return HttpResponse.json({
      token: String(user.id),
      user: { id: user.id, email: user.email, role: user.role },
    })
  }),
]
