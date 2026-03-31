import { http, HttpResponse, delay } from 'msw'
import { tasks } from '../data/tasks.data'
import type { Task } from '../data/tasks.data'
import { getUserFromAuthHeader } from '../utils/auth'

let lastId = tasks.length

function parseId(id: string | undefined) {
  const n = Number(id)
  return Number.isFinite(n) ? n : null
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(d.getTime())
}

export const taskHandlers = [
  http.get('/api/tasks', async ({ request }) => {
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) return new HttpResponse(null, { status: 401 })

    // MSW in browsers may provide relative URLs; keep a safe base.
    const url = new URL(request.url, 'http://localhost')
    const search = String(url.searchParams.get('search') ?? '').trim().toLowerCase()
    const status = String(url.searchParams.get('status') ?? 'all') as
      | 'all'
      | 'active'
      | 'completed'
      | 'overdue'

    const sort = String(url.searchParams.get('sort') ?? 'createdDesc') as
      | 'createdDesc'
      | 'createdAsc'
      | 'dueAsc'
      | 'dueDesc'
      | 'status'
      | 'titleAsc'

    const createdRange = String(url.searchParams.get('createdRange') ?? 'all') as
      | 'all'
      | '7d'
      | '30d'
      | 'month'

    const authorIdRaw = url.searchParams.get('authorId')
    const authorId = authorIdRaw && authorIdRaw !== 'all' ? Number(authorIdRaw) : null

    const pageRaw = url.searchParams.get('page')
    const pageSizeRaw = url.searchParams.get('pageSize')
    const page = Math.max(1, Number(pageRaw) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(pageSizeRaw) || 5))

    let list =
      user.role === 'admin' ? [...tasks] : tasks.filter(t => t.CreatedBy === user.id)

    const todayMs = (() => {
      const now = new Date()
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
      return d.getTime()
    })()

    if (status === 'active') {
      list = list.filter(t => !t.IsCompleted)
    } else if (status === 'completed') {
      list = list.filter(t => t.IsCompleted)
    } else if (status === 'overdue') {
      list = list.filter(t => {
        if (t.IsCompleted) return false
        const due = new Date(t.DueDate + 'T00:00:00Z').getTime()
        return !Number.isNaN(due) && due < todayMs
      })
    }

    if (authorId && Number.isFinite(authorId)) list = list.filter(t => t.CreatedBy === authorId)

    if (search) {
      list = list.filter(t => {
        const haystack = (t.Title + ' ' + t.Description).toLowerCase()
        return haystack.includes(search)
      })
    }

    if (createdRange !== 'all') {
      const now = new Date()
      let from: Date | null = null

      if (createdRange === '7d') {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (createdRange === '30d') {
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      } else if (createdRange === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      if (from) {
        const fromMs = from.getTime()
        list = list.filter(t => {
          // CreatedAt is stored as YYYY-MM-DD
          const createdMs = new Date(t.CreatedAt + 'T00:00:00Z').getTime()
          return !Number.isNaN(createdMs) && createdMs >= fromMs
        })
      }
    }

    const dateToMs = (iso: string) => {
      // DueDate and CreatedAt are in YYYY-MM-DD
      const d = new Date(iso + 'T00:00:00Z')
      return Number.isNaN(d.getTime()) ? 0 : d.getTime()
    }

    list.sort((a, b) => {
      if (sort === 'createdDesc') return dateToMs(b.CreatedAt) - dateToMs(a.CreatedAt)
      if (sort === 'createdAsc') return dateToMs(a.CreatedAt) - dateToMs(b.CreatedAt)
      if (sort === 'dueAsc') return dateToMs(a.DueDate) - dateToMs(b.DueDate)
      if (sort === 'dueDesc') return dateToMs(b.DueDate) - dateToMs(a.DueDate)
      if (sort === 'status') {
        // Completed first (matching "Выполнено" higher)
        if (a.IsCompleted !== b.IsCompleted) return Number(b.IsCompleted) - Number(a.IsCompleted)
        return dateToMs(b.CreatedAt) - dateToMs(a.CreatedAt)
      }
      if (sort === 'titleAsc') return a.Title.localeCompare(b.Title, 'ru')
      return 0
    })

    const total = list.length
    const start = (page - 1) * pageSize
    const data = list.slice(start, start + pageSize)

    await delay(300)
    return HttpResponse.json(
      {
        data,
        meta: { total, page, pageSize },
      },
      { status: 200 },
    )
  }),

  http.post('/api/tasks', async ({ request }) => {
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) return new HttpResponse(null, { status: 401 })

    const body = await request.json()

    if (!body?.Title || typeof body.Title !== 'string' || !body.Title.trim()) {
      return HttpResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    if (!isValidDate(body?.DueDate)) {
      return HttpResponse.json({ message: 'DueDate is invalid' }, { status: 400 })
    }

    const isCompleted = Boolean(body?.IsCompleted)

    const task: Task = {
      Id: ++lastId,
      Title: body.Title,
      Description: body.Description || '',
      DueDate: body.DueDate,
      IsCompleted: isCompleted,
      CreatedBy: user.id,
      CreatedAt: new Date().toISOString().slice(0, 10),
    }

    tasks.push(task)
    await delay(50)
    return HttpResponse.json(task, { status: 201 })
  }),

  http.put('/api/tasks/:id', async ({ request, params }) => {
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) return new HttpResponse(null, { status: 401 })

    const id = parseId(params.id)
    if (!id) return HttpResponse.json({ message: 'Invalid id' }, { status: 400 })

    const task = tasks.find(t => t.Id === id)
    if (!task) return new HttpResponse(null, { status: 404 })

    const canEdit = user.role === 'admin' || task.CreatedBy === user.id
    if (!canEdit) return new HttpResponse(null, { status: 403 })

    const body = await request.json()

    if (!body?.Title || typeof body.Title !== 'string' || !body.Title.trim()) {
      return HttpResponse.json({ message: 'Title is required' }, { status: 400 })
    }

    if (!isValidDate(body?.DueDate)) {
      return HttpResponse.json({ message: 'DueDate is invalid' }, { status: 400 })
    }

    task.Title = body.Title
    task.Description = body.Description || ''
    task.DueDate = body.DueDate
    task.IsCompleted = Boolean(body?.IsCompleted)

    await delay(200)
    return HttpResponse.json(task, { status: 200 })
  }),

  http.delete('/api/tasks/:id', async ({ request, params }) => {
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) return new HttpResponse(null, { status: 401 })

    const id = parseId(params.id)
    if (!id) return HttpResponse.json({ message: 'Invalid id' }, { status: 400 })

    const task = tasks.find(t => t.Id === id)
    if (!task) return new HttpResponse(null, { status: 404 })

    const canEdit = user.role === 'admin' || task.CreatedBy === user.id
    if (!canEdit) return new HttpResponse(null, { status: 403 })

    const idx = tasks.findIndex(t => t.Id === id)
    if (idx >= 0) tasks.splice(idx, 1)

    await delay(150)
    return HttpResponse.json(null, { status: 204 })
  }),
]
