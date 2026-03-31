<template>
  <div class="page">
    <header class="topbar">
      <div class="topbar-left">
        <div class="title">To-Do List</div>
      </div>
      <div class="topbar-right">
        <button class="btn btn-primary" @click="openCreate">
          + Добавить задачу
        </button>
      </div>
    </header>

    <section class="toolbar">
      <div class="tabs">
        <button class="tab" :class="{ active: tab === 'all' }" @click="tab = 'all'">
          Все задачи
        </button>
        <button
          class="tab"
          :class="{ active: tab === 'active' }"
          @click="tab = 'active'"
        >
          Активные
        </button>
        <button
          class="tab"
          :class="{ active: tab === 'completed' }"
          @click="tab = 'completed'"
        >
          Выполненные
        </button>
        <button
          class="tab"
          :class="{ active: tab === 'overdue' }"
          @click="tab = 'overdue'"
        >
          Просроченные
        </button>
      </div>

      <div class="controls">
        <div class="search">
          <input
            v-model="searchInput"
            class="search-input"
            placeholder="Поиск задач..."
          />
        </div>

        <div class="selects">
          <label class="select-label">
            <span>Сортировка</span>
            <select v-model="sortBy" class="select">
              <option value="createdDesc">По дате (создания)</option>
              <option value="createdAsc">По дате (создания, возр.)</option>
              <option value="dueAsc">По дедлайну (возв.)</option>
              <option value="dueDesc">По дедлайну (убыв.)</option>
              <option value="status">По статусу</option>
              <option value="titleAsc">По названию</option>
            </select>
          </label>

          <label class="select-label">
            <span>Дата создания</span>
            <select v-model="createdRange" class="select">
              <option value="all">Любые даты</option>
              <option value="7d">Последние 7 дней</option>
              <option value="30d">Последние 30 дней</option>
              <option value="month">Этот месяц</option>
            </select>
          </label>

          <label class="select-label">
            <span>Автор</span>
            <select v-model="authorFilter" class="select">
              <option value="all">Все</option>
              <option v-for="a in authors" :key="a.id" :value="a.id">
                {{ a.name }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </section>

    <div class="content">
      <div class="list">
        <div class="list-header">
          <div class="col checkbox-col"></div>
          <div class="col title-col">Название</div>
          <div class="col prio-col">Приоритет</div>
          <div class="col date-col">Дата</div>
          <div class="col author-col">Автор</div>
          <div class="col actions-col">Действия</div>
        </div>

        <div v-if="loading" class="loading-center">
          <span class="spinner spinner-lg" aria-hidden="true" />
          <div class="loading-text">Загрузка задач...</div>
        </div>

        <div v-else-if="error" class="empty-state">
          <div class="empty-title">Ошибка загрузки</div>
          <div class="empty-sub">{{ error }}</div>
          <button class="btn btn-secondary" @click="fetchTasks">Повторить</button>
        </div>

        <div v-else>
          <div v-if="tasks.length === 0" class="empty-state">
            <div class="empty-title">Результаты не найдены</div>
            <div class="empty-sub">Попробуйте изменить фильтры или поиск.</div>
          </div>

          <div v-else class="rows">
            <div
              v-for="t in tasks"
              :key="t.Id"
              class="row"
              :class="{ selected: selectedTaskId === t.Id }"
              @click="selectTask(t.Id)"
            >
              <div class="cell checkbox-col" @click.stop>
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="t.IsCompleted"
                  :disabled="!canEdit(t) || rowLoading[t.Id]"
                  @change="onToggleCompleted(t, $event)"
                />
              </div>

              <div class="cell title-col">
                {{ t.Title }}
              </div>

              <div class="cell prio-col">
                <span class="badge" :class="t.IsCompleted ? 'badge-soft' : 'badge-important'">
                  {{ t.IsCompleted ? 'Обычный' : 'Важно' }}
                </span>
              </div>

              <div class="cell date-col">
                {{ formatDate(t.DueDate) }}
              </div>

              <div class="cell author-col">
                <div class="author">
                  <span class="avatar" aria-hidden="true">
                    {{ authorById(t.CreatedBy).initials }}
                  </span>
                  <div class="author-meta">
                    <div class="author-name">{{ authorById(t.CreatedBy).name }}</div>
                    <div class="author-role">({{ authorById(t.CreatedBy).email }})</div>
                  </div>
                </div>
              </div>

              <div class="cell actions-col" @click.stop>
                <button
                  v-if="canEdit(t)"
                  class="link-btn"
                  @click="openEdit(t)"
                >
                  Редактировать
                </button>
                <button
                  v-if="canEdit(t)"
                  class="link-btn danger"
                  @click="onDelete(t)"
                >
                  {{ deletingId === t.Id ? 'Удаление...' : 'Удалить' }}
                </button>
              </div>
            </div>
          </div>

          <div class="pagination">
            <button class="page-btn" :disabled="page <= 1" @click="setPage(page - 1)">
              ←
            </button>
            <button
              v-for="p in paginationPages"
              :key="p.key"
              class="page-num"
              :class="{ active: p.value === page }"
              :disabled="p.value === null"
              @click="p.value !== null && setPage(p.value)"
            >
              <span v-if="p.value === null">...</span>
              <span v-else>{{ p.value }}</span>
            </button>
            <button
              class="page-btn"
              :disabled="page >= totalPages"
              @click="setPage(page + 1)"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <aside class="details">
        <div v-if="selectedTask" class="details-card">
          <div class="details-top">
            <button class="back" @click="selectedTaskId = null">← Назад</button>
            <div class="details-actions" v-if="canEdit(selectedTask)">
              <button class="btn btn-small btn-secondary" @click="openEdit(selectedTask)">
                Редактировать
              </button>
              <button class="btn btn-small btn-danger" @click="onDelete(selectedTask)">
                Удалить
              </button>
            </div>
          </div>

          <div class="details-title">
            {{ selectedTask.Title }}
            <span class="badge badge-inline" :class="selectedTask.IsCompleted ? 'badge-soft' : 'badge-important'">
              {{ selectedTask.IsCompleted ? 'Выполнено' : 'Активно' }}
            </span>
          </div>

          <div class="details-author">
            <span class="avatar avatar-lg" aria-hidden="true">
              {{ authorById(selectedTask.CreatedBy).initials }}
            </span>
            <div>
              <div class="details-author-name">{{ authorById(selectedTask.CreatedBy).name }}</div>
              <div class="details-author-email">{{ authorById(selectedTask.CreatedBy).email }}</div>
            </div>
          </div>

          <div class="details-body">
            <div class="label-muted">Описание</div>
            <div class="details-text">{{ selectedTask.Description }}</div>

            <div class="meta-grid">
              <div class="meta-item">
                <div class="label-muted">Дата</div>
                <div class="meta-value">{{ formatDate(selectedTask.DueDate) }}</div>
              </div>
              <div class="meta-item">
                <div class="label-muted">Создано</div>
                <div class="meta-value">{{ formatDate(selectedTask.CreatedAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="details-empty">
          <div class="empty-title">Выберите задачу</div>
          <div class="empty-sub">Нажмите на строку слева.</div>
        </div>
      </aside>
    </div>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">
            {{ modalMode === 'create' ? 'Добавить задачу' : 'Редактировать задачу' }}
          </div>
          <button class="icon-btn" @click="closeModal" :disabled="formLoading">✕</button>
        </div>

        <form class="modal-body" @submit.prevent="onSave">
          <label class="label">
            Название
            <input
              v-model.trim="form.title"
              class="input"
              placeholder="Например: Сделать отчет"
            />
          </label>

          <label class="label">
            Описание
            <textarea v-model.trim="form.description" class="textarea" placeholder="Краткое описание" />
          </label>

          <div class="form-row">
            <label class="label">
              Дедлайн
              <input v-model="form.dueDate" type="date" class="input" />
            </label>

            <label class="label status-label">
              Статус выполнения
              <select v-model="form.isCompleted" class="select">
                <option :value="false">Активно</option>
                <option :value="true">Выполнено</option>
              </select>
            </label>
          </div>

          <p v-if="formError" class="error">{{ formError }}</p>

          <div class="modal-actions">
            <button class="btn btn-secondary" type="button" @click="closeModal" :disabled="formLoading">
              Отмена
            </button>
            <button class="btn btn-primary" type="submit" :disabled="formLoading">
              <span v-if="!formLoading">{{ modalMode === 'create' ? 'Создать' : 'Сохранить' }}</span>
              <span v-else class="spinner" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type Role = 'admin' | 'user'

interface Task {
  Id: number
  Title: string
  Description: string
  DueDate: string
  IsCompleted: boolean
  CreatedBy: number
  CreatedAt: string
}

const { user } = useAuth()
const { $api } = useNuxtApp()

const loading = ref(false)
const error = ref<string | null>(null)

const tasks = ref<Task[]>([])
const meta = ref<{ total: number; page: number; pageSize: number } | null>(null)
const selectedTaskId = ref<number | null>(null)

const tab = ref<'all' | 'active' | 'completed' | 'overdue'>('all')
const searchInput = ref('')
const debouncedSearch = ref('')
let debounceTimer: number | null = null

watch(searchInput, (v) => {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    debouncedSearch.value = v
  }, 350)
})

const sortBy = ref<
  'createdDesc' | 'createdAsc' | 'dueAsc' | 'dueDesc' | 'status' | 'titleAsc'
>('createdDesc')
const authorFilter = ref<'all' | number>('all')
const createdRange = ref<'all' | '7d' | '30d' | 'month'>('all')

const page = ref(1)
const pageSize = 5

const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalTaskId = ref<number | null>(null)
const formLoading = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
  title: '',
  description: '',
  dueDate: '',
  isCompleted: false as boolean,
})

const deletingId = ref<number | null>(null)
const rowLoading = reactive<Record<number, boolean>>({})

function authorById(id: number) {
  if (id === 1) return { id, name: 'Иван Иванов', email: 'ivan.ivanov@mail.com', initials: 'ИВ' }
  if (id === 2) return { id, name: 'Анастасия Смирнова', email: 'smirnova@mail.com', initials: 'АС' }
  if (id === 3) return { id, name: 'Василий Васильевич', email: 'vasiliy@mail.com', initials: 'АС' }
  return { id, name: `Пользователь #${id}`, email: `user${id}@mail.com`, initials: '#' + id }
}

function canEdit(t: Task) {
  if (!user.value) return false
  return user.value.role === 'admin' || t.CreatedBy === user.value.id
}

function formatDate(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function fetchTasks() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, unknown> = {
      status: tab.value,
      sort: sortBy.value,
      page: page.value,
      pageSize,
    }

    if (authorFilter.value !== 'all') params.authorId = authorFilter.value
    if (createdRange.value !== 'all') params.createdRange = createdRange.value

    const s = debouncedSearch.value.trim()
    if (s) params.search = s

    const res = await $api.get('/tasks', { params })
    const payload = res.data as { data?: Task[]; meta?: { total: number; page: number; pageSize: number } }

    tasks.value = (payload.data ?? []) as Task[]
    meta.value = payload.meta ?? { total: tasks.value.length, page: page.value, pageSize }

    // If the currently selected task isn't in the current page result set,
    // fall back to the first task on this page.
    if (selectedTaskId.value == null) {
      selectedTaskId.value = tasks.value[0]?.Id ?? null
    } else {
      const stillExists = tasks.value.some(t => t.Id === selectedTaskId.value)
      if (!stillExists) selectedTaskId.value = tasks.value[0]?.Id ?? null
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Не удалось получить задачи'
  } finally {
    loading.value = false
  }
}

function selectTask(id: number) {
  selectedTaskId.value = id
}

const authors = computed(() => [authorById(1), authorById(2)])

const totalPages = computed(() => {
  const total = meta.value?.total ?? 0
  return Math.max(1, Math.ceil(total / pageSize))
})

function setPage(next: number) {
  const tp = totalPages.value
  if (next < 1 || next > tp) return
  if (next === page.value) return
  page.value = next
  fetchTasks()
}

watch([tab, debouncedSearch, sortBy, authorFilter, createdRange], () => {
  page.value = 1
  fetchTasks()
})

const paginationPages = computed(() => {
  const tp = totalPages.value
  const pages: Array<{ key: string; value: number | null }> = []

  if (tp <= 5) {
    for (let i = 1; i <= tp; i++) pages.push({ key: 'p' + i, value: i })
    return pages
  }

  // Example: 1 2 ... 4 5
  pages.push({ key: 'p1', value: 1 })
  pages.push({ key: 'p2', value: 2 })

  const middleStart = tp - 2
  if (middleStart > 2) pages.push({ key: 'dots', value: null })

  pages.push({ key: 'plast1', value: tp - 1 })
  pages.push({ key: 'plast', value: tp })
  return pages
})

const selectedTask = computed(() => {
  if (selectedTaskId.value == null) return null
  return tasks.value.find(t => t.Id === selectedTaskId.value) ?? null
})

function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function validateForm() {
  if (!form.title.trim()) return 'Название не может быть пустым'
  if (!form.dueDate) return 'Дедлайн обязателен'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate)) return 'Дедлайн имеет неверный формат'
  return null
}

function openCreate() {
  formError.value = null
  modalMode.value = 'create'
  modalTaskId.value = null
  form.title = ''
  form.description = ''
  form.dueDate = todayISO()
  form.isCompleted = false
  modalOpen.value = true
}

function openEdit(t: Task) {
  formError.value = null
  modalMode.value = 'edit'
  modalTaskId.value = t.Id
  selectedTaskId.value = t.Id
  form.title = t.Title
  form.description = t.Description
  form.dueDate = t.DueDate
  form.isCompleted = t.IsCompleted
  modalOpen.value = true
}

function closeModal() {
  if (formLoading.value) return
  modalOpen.value = false
}

async function onSave() {
  formError.value = null
  const v = validateForm()
  if (v) {
    formError.value = v
    return
  }

  try {
    formLoading.value = true

    if (modalMode.value === 'create') {
      const res = await $api.post('/tasks', {
        Title: form.title,
        Description: form.description,
        DueDate: form.dueDate,
        IsCompleted: form.isCompleted,
      })

      modalOpen.value = false
      await fetchTasks()
    } else {
      if (modalTaskId.value == null) return
      await $api.put(`/tasks/${modalTaskId.value}`, {
        Title: form.title,
        Description: form.description,
        DueDate: form.dueDate,
        IsCompleted: form.isCompleted,
      })
      modalOpen.value = false
      await fetchTasks()
    }
  } catch (e: any) {
    formError.value = e?.response?.data?.message || 'Не удалось сохранить задачу'
  } finally {
    formLoading.value = false
  }
}

async function onDelete(t: Task) {
  if (!canEdit(t)) return
  const ok = window.confirm(`Удалить задачу "${t.Title}"?`)
  if (!ok) return

  try {
    deletingId.value = t.Id
    await $api.delete(`/tasks/${t.Id}`)
    await fetchTasks()
  } catch (e: any) {
    // Delete errors are rare in the mock; still show something if it happens.
    error.value = e?.response?.data?.message || 'Не удалось удалить задачу'
  } finally {
    deletingId.value = null
  }
}

async function onToggleCompleted(t: Task, ev: Event) {
  if (!canEdit(t)) return
  const input = ev.target as HTMLInputElement
  const next = input.checked

  if (rowLoading[t.Id]) return
  rowLoading[t.Id] = true
  try {
    await $api.put(`/tasks/${t.Id}`, {
      Title: t.Title,
      Description: t.Description,
      DueDate: t.DueDate,
      IsCompleted: next,
    })
    await fetchTasks()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Не удалось обновить статус'
  } finally {
    rowLoading[t.Id] = false
  }
}

onMounted(fetchTasks)
</script>

<style scoped>
.page {
  padding: 20px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
}

.title {
  font-size: 18px;
  font-weight: 800;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.05s ease;
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-secondary {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #111827;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-small {
  padding: 8px 10px;
  font-size: 13px;
  border-radius: 7px;
}

.link-btn {
  background: transparent;
  border: none;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
}

.link-btn:hover {
  background: rgba(37, 99, 235, 0.08);
}

.link-btn.danger {
  color: #dc2626;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tab {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px 10px;
  cursor: pointer;
  color: #4b5563;
  font-weight: 700;
  font-size: 13px;
}

.tab.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.search-input {
  width: 260px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  background: #f8fafc;
}

.search-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.25);
  background: #fff;
}

.selects {
  display: flex;
  gap: 10px;
}

.select-label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.select {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 9px 12px;
  background: #f8fafc;
  font-size: 13px;
  outline: none;
}

.content {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;
  gap: 16px;
  align-items: start;
}

.list {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 34px 1.5fr 0.8fr 0.9fr 1.1fr 0.7fr;
  gap: 10px;
  padding: 6px 8px;
  color: #6b7280;
  font-weight: 800;
  font-size: 12px;
}

.rows {
  display: grid;
}

.row {
  display: grid;
  grid-template-columns: 34px 1.5fr 0.8fr 0.9fr 1.1fr 0.7fr;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid #f1f5f9;
  cursor: pointer;
}

.row:hover {
  background: #f8fafc;
}

.row.selected {
  background: #eff6ff;
  outline: 1px solid rgba(59, 130, 246, 0.25);
}

.cell {
  align-self: center;
  font-size: 13px;
}

.checkbox {
  width: 16px;
  height: 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  font-weight: 800;
}

.badge-important {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-soft {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.badge-inline {
  margin-left: 10px;
}

.author {
  display: flex;
  gap: 10px;
  align-items: center;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #111827;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.avatar-lg {
  width: 44px;
  height: 44px;
  font-size: 14px;
}

.author-meta {
  display: grid;
  gap: 2px;
}

.author-name {
  font-weight: 800;
  color: #111827;
}

.author-role {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.actions-col {
  justify-self: end;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.loading-center {
  padding: 40px 10px;
  display: grid;
  place-items: center;
  gap: 10px;
}

.loading-text {
  color: #6b7280;
  font-weight: 800;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(37, 99, 235, 0.25);
  border-top-color: #2563eb;
  animation: spin 0.7s linear infinite;
}

.spinner-lg {
  width: 28px;
  height: 28px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  padding: 40px 10px;
  text-align: center;
  display: grid;
  gap: 6px;
}

.empty-title {
  font-weight: 900;
  color: #111827;
}

.empty-sub {
  color: #6b7280;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 14px 0 4px;
}

.page-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 900;
  color: #111827;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-num {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 900;
  color: #111827;
  min-width: 40px;
}

.page-num.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.page-num:disabled {
  opacity: 0.6;
  cursor: default;
}

.details {
  position: sticky;
  top: 20px;
}

.details-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
}

.details-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.back {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  font-weight: 900;
}

.details-actions {
  display: flex;
  gap: 8px;
}

.details-title {
  font-size: 20px;
  font-weight: 900;
  color: #111827;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.details-author {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 0 10px;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}

.details-author-name {
  font-weight: 900;
}

.details-author-email {
  font-size: 13px;
  color: #6b7280;
}

.details-body {
  display: grid;
  gap: 10px;
}

.label-muted {
  color: #6b7280;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.details-text {
  line-height: 1.35;
  font-size: 14px;
  color: #111827;
}

.meta-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.meta-item {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
}

.meta-value {
  font-weight: 900;
  margin-top: 3px;
  color: #111827;
}

.details-empty {
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 18px;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: grid;
  place-items: center;
  padding: 18px;
}

.modal {
  width: 560px;
  max-width: 100%;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 14px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title {
  font-weight: 900;
  font-size: 16px;
}

.icon-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.modal-body {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  font-weight: 800;
}

.input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.textarea {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  min-height: 90px;
  resize: vertical;
}

.status-label {
  margin-top: 2px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.error {
  margin: 0;
  color: #b91c1c;
  font-size: 13px;
  background: rgba(185, 28, 28, 0.06);
  border: 1px solid rgba(185, 28, 28, 0.2);
  padding: 10px 12px;
  border-radius: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}

@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
  }
  .details {
    position: static;
  }
  .search-input {
    width: 200px;
  }
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>

