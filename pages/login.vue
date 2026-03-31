<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title">To-Do List</div>

      <form class="form" @submit.prevent="onSubmit">
        <label class="label">
          Email
          <input
            v-model.trim="email"
            type="email"
            class="input"
            autocomplete="username"
            placeholder="admin@test.com"
          />
        </label>

        <label class="label">
          Пароль
          <input
            v-model.trim="password"
            type="password"
            class="input"
            autocomplete="current-password"
            placeholder="123456"
          />
        </label>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button class="btn btn-primary" :disabled="loading">
          <span v-if="!loading">Войти</span>
          <span v-else class="spinner" aria-hidden="true" />
        </button>

        <div class="hint">
          Тестовые пользователи: <b>admin@test.com</b> / <b>123456</b>, <b>user@test.com</b> / <b>123456</b> <b>vasiliy@test.com</b> / <b>123456</b>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { login } = useAuth()

const email = ref('admin@test.com')
const password = ref('123456')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

function validate() {
  if (!email.value) return 'Email обязателен'
  if (!password.value) return 'Пароль обязателен'
  return null
}

async function onSubmit() {
  errorMessage.value = null

  const v = validate()
  if (v) {
    errorMessage.value = v
    return
  }

  try {
    loading.value = true
    await login(email.value, password.value)
    await navigateTo('/')
  } catch (e: any) {
    errorMessage.value = e?.response?.data?.message || 'Ошибка авторизации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 420px;
  max-width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 10px 25px rgba(17, 24, 39, 0.06);
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
}

.form {
  display: grid;
  gap: 12px;
}

.label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25);
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

.btn {
  border: none;
  border-radius: 10px;
  padding: 11px 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: rgba(255, 255, 255, 1);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

@media (max-width: 420px) {
  .login-wrap {
    padding: 14px;
  }
  .login-card {
    padding: 16px;
  }
  .login-title {
    font-size: 18px;
  }
}
</style>

