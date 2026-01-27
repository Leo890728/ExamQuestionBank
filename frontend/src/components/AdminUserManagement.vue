<template>
  <div class="user-admin">
    <div class="user-filters">
      <div class="filter-search">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜尋使用者（Email / ID）"
          class="filter-input"
        />
      </div>
      <button class="action-btn action-btn-secondary" @click="loadUsers" :disabled="loading">
        重新整理
      </button>
    </div>

    <p class="helper-text">管理員權限變更後，使用者需重新登入才會生效。</p>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <h3>沒有符合條件的使用者</h3>
      <p>請調整搜尋條件或重新整理。</p>
    </div>

    <div v-else class="user-table">
      <div class="table-header">
        <div class="col-user">使用者</div>
        <div class="col-date">建立時間</div>
        <div class="col-role">角色</div>
        <div class="col-actions">操作</div>
      </div>
      <div class="table-body">
        <div v-for="user in filteredUsers" :key="user.id" class="table-row">
          <div class="col-user">
            <div class="user-email">{{ user.email || '-' }}</div>
            <div class="user-id">{{ user.id }}</div>
          </div>
          <div class="col-date">{{ formatDate(user.created_at) }}</div>
          <div class="col-role">
            <span :class="['role-badge', { admin: user.is_admin }]">
              {{ user.is_admin ? '管理員' : '一般使用者' }}
            </span>
          </div>
          <div class="col-actions">
            <button
              class="action-btn"
              :class="user.is_admin ? 'action-btn-danger' : 'action-btn-primary'"
              :disabled="savingUserId === user.id || user.id === currentUserId"
              @click="toggleAdmin(user)"
            >
              {{ savingUserId === user.id
                ? '處理中...'
                : user.is_admin
                  ? '移除管理員'
                  : '設為管理員'
              }}
            </button>
            <div v-if="user.id === currentUserId" class="hint-text">目前登入帳號</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import adminUserService from '@/services/adminUserService'

const users = ref([])
const loading = ref(true)
const savingUserId = ref(null)
const searchQuery = ref('')
const currentUserId = ref(null)

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await adminUserService.getUsers()
    users.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return users.value
  return users.value.filter((user) => {
    const email = user.email?.toLowerCase() || ''
    const id = user.id?.toLowerCase() || ''
    return email.includes(query) || id.includes(query)
  })
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleAdmin = async (user) => {
  const nextValue = !user.is_admin
  const actionLabel = nextValue ? '設為管理員' : '移除管理員'

  if (!confirm(`確定要${actionLabel}嗎？`)) return

  savingUserId.value = user.id
  try {
    await adminUserService.setUserAdmin(user.id, nextValue)
    user.is_admin = nextValue
  } catch (error) {
    console.error('Failed to update user role:', error)
    alert('更新失敗，請稍後再試。')
  } finally {
    savingUserId.value = null
  }
}

onMounted(async () => {
  try {
    const { data } = await supabase.auth.getUser()
    currentUserId.value = data.user?.id || null
  } catch (error) {
    console.error('Failed to load current user:', error)
  }

  await loadUsers()
})

defineExpose({ loadUsers })
</script>

<style scoped>
.user-admin {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-search {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: #94a3b8;
}

.filter-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 10px;
  font-size: 14px;
  background: var(--surface, #fff);
  color: var(--text-primary, #1e293b);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn-primary {
  background: var(--primary, #476996);
  color: #fff;
  box-shadow: 0 2px 4px rgba(71, 105, 150, 0.2);
}

.action-btn-primary:hover {
  background: var(--primary-hover, #35527a);
}

.action-btn-secondary {
  background: #f3f4f6;
  color: var(--text-secondary, #64748b);
}

.action-btn-secondary:hover {
  background: #e5e7eb;
  color: var(--text-primary, #1e293b);
}

.action-btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.action-btn-danger:hover {
  background: #fecaca;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.helper-text {
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  margin: 0;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  border-radius: 12px;
  border: 1px dashed var(--border, #cbd5e1);
  background: var(--surface, #fff);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: var(--primary, #476996);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-table {
  border-radius: 12px;
  border: 1px solid var(--border, #cbd5e1);
  overflow: hidden;
  background: var(--surface, #fff);
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 18px;
}

.table-header {
  background: var(--surface-muted, #f1f5f9);
  color: var(--text-secondary, #64748b);
  font-weight: 600;
  font-size: 13px;
}

.table-row {
  border-top: 1px solid var(--border, #e2e8f0);
}

.user-email {
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.user-id {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  word-break: break-all;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: #e2e8f0;
  color: #475569;
}

.role-badge.admin {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.col-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
}

@media (max-width: 900px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .col-actions {
    align-items: flex-start;
  }
}
</style>
