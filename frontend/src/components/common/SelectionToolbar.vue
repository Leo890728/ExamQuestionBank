<template>
    <transition name="slide-up">
        <div class="selection-toolbar-wrapper" v-if="selectedCount > 0">
            <div class="selection-toolbar">
                <div class="toolbar-content">
                    <div class="toolbar-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                        <span class="toolbar-text">已選取</span>
                        <span class="toolbar-count">{{ selectedCount }}</span>
                        <span class="toolbar-text">{{ itemUnit }}</span>
                    </div>

                    <div class="toolbar-divider"></div>

                    <div class="toolbar-actions">
                        <!-- Clear Selection Button -->
                        <button v-if="showClear" class="toolbar-btn toolbar-btn-secondary" @click="$emit('clear')"
                            title="清除選取">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span>清除</span>
                        </button>

                        <!-- Custom Actions Slot -->
                        <slot></slot>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
defineProps({
    selectedCount: {
        type: Number,
        required: true
    },
    itemUnit: {
        type: String,
        default: '項'
    },
    showClear: {
        type: Boolean,
        default: true
    }
})

defineEmits(['clear'])
</script>

<style scoped>
.selection-toolbar-wrapper {
    position: sticky;
    bottom: 100px;
    z-index: 1000;
    width: 100%;
    max-width: 900px;
    margin: 24px auto 0;
}

.selection-toolbar {
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border, #CBD5E1);
    pointer-events: auto;
    /* Re-enable pointer events for the toolbar itself */
}

.toolbar-content {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    gap: 16px;
}

.toolbar-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: var(--primary-soft, #EEF2FF);
    border-radius: 10px;
}

.toolbar-info svg {
    color: var(--primary, #476996);
    flex-shrink: 0;
}

.toolbar-text {
    font-size: 14px;
    color: var(--text-secondary, #64748B);
    font-weight: 500;
}

.toolbar-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 10px;
    background: var(--primary, #476996);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
}

.toolbar-divider {
    width: 1px;
    height: 32px;
    background: #e5e7eb;
}

.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

/* Button Styles - made available for slotted content via deep selector or global utility classes approach, 
   but since scoped styles don't penetrate slots easily, we use :deep() here for standard buttons passed in slot */

:deep(.toolbar-btn) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

:deep(.toolbar-btn svg) {
    flex-shrink: 0;
}

/* Secondary Button */
.toolbar-btn-secondary,
:deep(.toolbar-btn-secondary) {
    background: #f3f4f6;
    color: var(--text-secondary, #64748B);
}

.toolbar-btn-secondary:hover,
:deep(.toolbar-btn-secondary:hover) {
    background: #e5e7eb;
    color: var(--text-primary, #1E293B);
    transform: translateY(-1px);
}

/* Primary Button */
:deep(.toolbar-btn-primary) {
    background: var(--primary, #476996);
    color: white;
}

:deep(.toolbar-btn-primary:hover) {
    background: var(--primary-dark, #35527a);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(71, 105, 150, 0.2);
}

/* Danger Button */
:deep(.toolbar-btn-danger) {
    background: #fef2f2;
    color: #dc2626;
}

:deep(.toolbar-btn-danger:hover:not(:disabled)) {
    background: #fee2e2;
    color: #b91c1c;
    transform: translateY(-1px);
}

/* Accent Button (for primary actions like Practice) */
:deep(.toolbar-btn-accent) {
    background: linear-gradient(135deg, var(--primary, #476996), #35527a);
    color: white;
    box-shadow: 0 2px 8px rgba(71, 105, 150, 0.2);
}

:deep(.toolbar-btn-accent:hover:not(:disabled)) {
    background: linear-gradient(135deg, #35527a, var(--primary, #476996));
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(71, 105, 150, 0.3);
}

:deep(.toolbar-btn:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Loading Spinner */
:deep(.toolbar-spinner) {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: toolbar-spin 0.8s linear infinite;
}

/* Danger Spinner specific */
:deep(.toolbar-btn-danger .toolbar-spinner) {
    border-color: rgba(220, 38, 38, 0.3);
    border-top-color: #dc2626;
}

@keyframes toolbar-spin {
    to {
        transform: rotate(360deg);
    }
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .selection-toolbar-wrapper {
        width: 100%;
    }

    .toolbar-content {
        padding: 12px 16px;
        flex-direction: column;
        /* Stack info and actions */
        gap: 12px;
        align-items: stretch;
    }

    .toolbar-info {
        justify-content: center;
        width: 100%;
    }

    .toolbar-divider {
        display: none;
    }

    .toolbar-actions {
        width: 100%;
        justify-content: space-between;
        /* Spread buttons */
    }

    :deep(.toolbar-btn) {
        flex: 1;
        /* Equal width buttons */
        justify-content: center;
        padding: 8px 12px;
    }

    /* Hide specific text labels if buttons get too crowded? 
       For now, equal width is good. */
}
</style>
