<template>
    <div class="tag-filter-container">
        <div class="input-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="tags-icon">
                <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
                <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
            </svg>
            <multiselect :model-value="modelValue" :options="options" :multiple="true" :close-on-select="false"
                :clear-on-select="false" :preserve-search="true" :placeholder="placeholder" track-by="id"
                label="name" class="tag-multiselect" @update:model-value="$emit('update:modelValue', $event)" />
        </div>
    </div>
</template>

<script setup>
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    mode: {
        type: String,
        default: 'or'
    },
    options: {
        type: Array,
        default: () => []
    },
    placeholder: {
        type: String,
        default: '選擇標籤...'
    }
})

defineEmits(['update:modelValue', 'update:mode'])
</script>

<style scoped>
.tag-filter-container {
    width: 100%;
}

.input-icon-wrapper {
    position: relative;
    width: 100%;
}

.tags-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    color: var(--text-secondary, #94A3B8);
    pointer-events: none;
}

/* ===== Multiselect Container ===== */
.tag-multiselect {
    width: 100%;
}

.tag-multiselect :deep(.multiselect) {
    min-height: 44px;
}

.tag-multiselect :deep(.multiselect__tags) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 8px 40px 8px 40px;
    background: var(--bg-page, #F1F5F9);
    min-height: 44px;
    transition: all 0.2s ease;
}

.tag-multiselect :deep(.multiselect--active .multiselect__tags) {
    border-color: var(--primary, #476996);
    background: var(--surface, #FFFFFF);
    box-shadow: 0 0 0 3px rgba(71, 105, 150, 0.1);
}

/* ===== Tags (Selected Chips) ===== */
.tag-multiselect :deep(.multiselect__tag) {
    position: relative;
    background: var(--primary, #476996);
    color: white;
    border-radius: 6px;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    padding: 5px 26px 5px 10px;
    margin: 2px 4px 2px 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.3;
}

.tag-multiselect :deep(.multiselect__tag-icon) {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 0 4px 4px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    line-height: 1;
}

.tag-multiselect :deep(.multiselect__tag-icon:after) {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

.tag-multiselect :deep(.multiselect__tag-icon:hover) {
    background: var(--primary-hover, #35527a);
}

.tag-multiselect :deep(.multiselect__tag-icon:hover:after) {
    color: white;
}

/* ===== Input & Placeholder ===== */
.tag-multiselect :deep(.multiselect__input) {
    background: transparent;
    border: none;
    font-size: 14px;
    color: var(--text-primary, #1E293B);
    padding: 0;
    margin: 0;
    min-height: auto;
    line-height: 1.4;
}

.tag-multiselect :deep(.multiselect__input::placeholder) {
    color: var(--text-secondary, #94A3B8);
}

.tag-multiselect :deep(.multiselect__placeholder) {
    color: var(--text-secondary, #94A3B8);
    font-size: 14px;
    margin: 0;
    padding: 0;
    line-height: 1.4;
}

/* ===== Dropdown ===== */
.tag-multiselect :deep(.multiselect__content-wrapper) {
    border: 1px solid var(--border, #CBD5E1);
    border-radius: 12px;
    margin-top: 6px;
    box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.1);
    background: var(--surface, #FFFFFF);
    overflow: hidden;
}

.tag-multiselect :deep(.multiselect__element) {
    margin: 0;
}

.tag-multiselect :deep(.multiselect__option) {
    padding: 10px 14px;
    font-size: 14px;
    color: var(--text-primary, #1E293B);
    min-height: auto;
    line-height: 1.4;
    transition: background 0.15s ease;
}

.tag-multiselect :deep(.multiselect__option--highlight) {
    background: var(--bg-page, #F1F5F9);
    color: var(--text-primary, #1E293B);
}

.tag-multiselect :deep(.multiselect__option--selected) {
    background: var(--primary-soft, #EEF2FF);
    color: var(--primary, #476996);
    font-weight: 600;
}

.tag-multiselect :deep(.multiselect__option--selected.multiselect__option--highlight) {
    background: rgba(239, 68, 68, 0.05);
    color: var(--primary, #476996);
}

.tag-multiselect :deep(.multiselect__option--selected::after),
.tag-multiselect :deep(.multiselect__option--selected.multiselect__option--highlight::after) {
    content: '✓' !important;
    color: var(--primary, #476996) !important;
    background: none !important;
    font-weight: 700;
    padding-left: 8px;
    font-size: 14px;
}

/* ===== Select Caret ===== */
.tag-multiselect :deep(.multiselect__select) {
    position: absolute;
    right: 1px;
    top: 1px;
    height: 42px;
    width: 36px;
    padding: 0;
}

.tag-multiselect :deep(.multiselect__select::before) {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    border-style: solid;
    border-width: 5px 5px 0 5px;
    border-color: var(--text-secondary, #94A3B8) transparent transparent transparent;
    content: '';
}

.tag-multiselect :deep(.multiselect--active .multiselect__select::before) {
    top: 50%;
    transform: translateY(-50%) rotate(180deg);
}

/* ===== Spinner ===== */
.tag-multiselect :deep(.multiselect__spinner) {
    background: var(--bg-page, #F1F5F9);
    border-radius: 0 12px 12px 0;
}

/* ===== No Results ===== */
.tag-multiselect :deep(.multiselect__option--disabled) {
    background: transparent;
    color: var(--text-secondary, #94A3B8);
    font-size: 13px;
}

/* ===== Dark Mode ===== */
:global(.dark) .tag-multiselect :deep(.multiselect__content-wrapper) {
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.3);
}
</style>
