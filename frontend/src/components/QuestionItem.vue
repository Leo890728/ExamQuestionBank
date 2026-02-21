<template>
  <div
    class="question-item"
    :class="{
      active: isActive,
      pending: item.isPending,
      'has-pending-edit': hasPendingEdit,
      checked: isChecked
    }"
    @click="$emit('select', item)"
  >
    <input
      v-if="showCheckbox"
      type="checkbox"
      :checked="isChecked"
      class="form-check-input item-checkbox"
      @click.stop
      @change="$emit('toggle-check', item.id)"
    />
    <div
      class="question-number"
      :class="{
        pending: item.isPending,
        draft: item.status === 'draft',
        'has-pending-edit': hasPendingEdit && !item.isPending
      }"
    >
      {{ item.order }}
    </div>
    <div class="question-content">
      <div class="question-text">
        {{ item.question_content }}
        <span v-if="item.isPending" class="pending-badge">暫存</span>
        <span v-else-if="hasPendingEdit" class="pending-badge neutral">暫存</span>
      </div>
      <div class="question-meta">
        <span class="badge">{{ item.question_subject }}</span>
        <span class="badge">{{ item.question_category }}</span>
        <span class="points">{{ item.points }} 分</span>
        <button 
          class="btn-note" 
          @click.stop="handleOpenNote"
          title="筆記"
        >
          <i class="bi bi-journal-plus"></i>
        </button>
      </div>
    </div>
    <button
      class="btn-delete"
      @click.stop="$emit('remove', item.id)"
      title="移除題目"
    >
      ×
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  hasPendingEdit: {
    type: Boolean,
    default: false
  },
  isChecked: {
    type: Boolean,
    default: false
  },
  showCheckbox: {
    type: Boolean,
    default: false
  }
})



const emit = defineEmits(['select', 'remove', 'toggle-check'])

// Direct integration with Note Store
import { useNoteStore } from '../stores/noteStore'
const noteStore = useNoteStore()

function handleOpenNote() {
    noteStore.openDrawer({ 
        type: 'question', 
        id: props.item.id,
        order: props.item.order 
    })
}
</script>

<style scoped>
.question-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: var(--surface);
}

.question-item:hover {
  border-color: rgba(47, 95, 144, 0.35);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.question-item.active {
  border-color: var(--primary);
  background: #eef3f9;
}

.question-item.checked {
  background: #f0f9ff;
}

.question-item.pending {
  border-color: #d89b32;
  border-style: dashed;
  background: #fff7eb;
}

.question-item.pending.active {
  background: #fdeed9;
}

.item-checkbox {
  flex-shrink: 0;
  margin-top: 4px;
  cursor: pointer;
}

.question-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
}

.question-number.pending {
  background: #d89b32;
}

.pending-badge {
  display: inline-block;
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 3px 8px;
  background: #d89b32;
  color: white;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.pending-badge.neutral {
  background: var(--primary);
}

.question-item.has-pending-edit:not(.pending) {
  border-color: var(--primary);
  border-style: dashed;
  background: #eef3f9;
}

.question-item.has-pending-edit:not(.pending).active {
  background: #e5edf7;
}

.question-number.has-pending-edit {
  background: var(--primary);
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-text {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.question-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 12px;
  font-size: 12px;
}

.points {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.btn-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: #c0392b;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
}

.question-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: #a83226;
  transform: scale(1.05);
}

/* Mobile styles */
@media (max-width: 768px) {
  .question-item {
    padding: 10px;
    gap: 10px;
  }

  .question-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }


  /* Always show delete button on mobile (no hover) */
  .btn-delete {
    opacity: 1;
    width: 28px;
    height: 28px;
    background: #ffe5e5; /* Softer background for always-visible */
    color: #c0392b;
  }
}

.btn-note {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-note:hover {
  background: var(--surface-muted);
  color: var(--primary);
  transform: scale(1.1);
}
</style>
