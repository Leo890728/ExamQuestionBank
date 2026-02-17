<template>
    <div class="modal-overlay" @click.self="close">
        <div class="modal-container">
            <div class="modal-header">
                <div class="header-content">
                    <div class="icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                        </svg>
                    </div>
                    <h3 class="modal-title">批次修改分數</h3>
                </div>
                <button class="close-btn" @click="close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div class="modal-body">
                <div class="info-banner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>將為所選的 <strong>{{ questions.length }}</strong> 題統一設定分數</span>
                </div>

                <div class="form-section">
                    <label class="section-label">要修改的欄位</label>
                    <div class="field-grid">
                        <div class="field-row">
                            <label class="field-toggle" :class="{ active: applyScore }">
                                <input type="checkbox" v-model="applyScore">
                                <span>分數</span>
                            </label>
                            <div class="input-wrapper" :class="{ active: applyScore }">
                                <input v-model.number="scoreValue" class="field-input" type="number" min="0" max="100"
                                    step="1" placeholder="輸入分數" :disabled="!applyScore" />
                                <span class="input-suffix">分</span>
                            </div>
                        </div>
                    </div>
                    <div class="field-hint">輸入 0~100 的整數，只會套用已勾選的欄位</div>
                </div>

                <div v-if="applyScore && isValidScore" class="preview-section">
                    <div class="preview-label">變更預覽</div>
                    <div class="preview-box">
                        <div class="preview-row">
                            <span class="preview-key">影響題數</span>
                            <span class="preview-val"><strong>{{ questions.length }}</strong> 題</span>
                        </div>
                        <div class="preview-divider" />
                        <div class="preview-row">
                            <span class="preview-key">每題分數</span>
                            <span class="preview-val change">
                                <span class="old">{{ avgOldScore }} 分</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                                <span class="new">{{ scoreValue }} 分</span>
                            </span>
                        </div>
                        <div class="preview-divider" />
                        <div class="preview-row">
                            <span class="preview-key">總分變動</span>
                            <span class="preview-val change">
                                <span class="old">{{ oldTotalScore }} 分</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                                <span class="new"
                                    :class="{ up: newTotalScore > oldTotalScore, down: newTotalScore < oldTotalScore }">
                                    {{ newTotalScore }} 分
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-apply" :disabled="!canApply" @click="apply">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    套用分數
                </button>
                <button class="btn-cancel" @click="close">取消</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    /** Selected exam questions – each must have { id, points } */
    questions: { type: Array, required: true },
    /** Total score of ALL exam questions (not just selected) */
    examTotalScore: { type: Number, default: 0 }
})

const emit = defineEmits(['close', 'applied'])

const applyScore = ref(true)
const scoreValue = ref(props.questions.length ? props.questions[0].points : 1)

const isValidScore = computed(() => {
    const v = scoreValue.value
    return Number.isFinite(v) && v >= 0 && v <= 100 && Number.isInteger(v)
})

const canApply = computed(() => applyScore.value && isValidScore.value)

// ---- Preview computations ----
const avgOldScore = computed(() => {
    if (!props.questions.length) return 0
    const total = props.questions.reduce((s, q) => s + (q.points ?? 0), 0)
    return Math.round(total / props.questions.length * 10) / 10
})

const oldTotalScore = computed(() => props.examTotalScore)

const newTotalScore = computed(() => {
    const selectedOldTotal = props.questions.reduce((s, q) => s + (q.points ?? 0), 0)
    const selectedNewTotal = props.questions.length * (scoreValue.value ?? 0)
    return props.examTotalScore - selectedOldTotal + selectedNewTotal
})

// ---- Actions ----
const apply = () => {
    if (!canApply.value) return
    emit('applied', {
        points: scoreValue.value,
        questionIds: props.questions.map(q => q.id)
    })
    close()
}

const close = () => emit('close')
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 2147483647;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.modal-container {
    width: 92%;
    max-width: 480px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Header */
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
}

.header-content {
    display: flex;
    gap: 12px;
    align-items: center;
}

.icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #fef3c7;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
    flex-shrink: 0;
}

.modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.close-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.close-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
}

/* Body */
.modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.info-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    color: #1e40af;
    font-size: 14px;
}

.info-banner svg {
    color: #3b82f6;
    flex-shrink: 0;
}

.info-banner strong {
    font-weight: 700;
}

/* Form */
.form-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-label {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
}

.field-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.field-row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 12px;
    align-items: center;
}

.field-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s;
}

.field-toggle.active {
    color: #1e293b;
}

.field-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #d97706;
}

.input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    transition: all 0.2s;
}

.input-wrapper.active {
    background: white;
    border-color: #d97706;
}

.field-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    min-width: 0;
}

.field-input:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
}

.field-input::placeholder {
    font-weight: 400;
    color: #cbd5e1;
}

/* Remove number input spinners */
.field-input::-webkit-outer-spin-button,
.field-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.input-suffix {
    font-size: 14px;
    color: #94a3b8;
    flex-shrink: 0;
}

.field-hint {
    font-size: 12px;
    color: #94a3b8;
}

/* Preview Section */
.preview-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.preview-label {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
}

.preview-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.preview-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-key {
    font-size: 13px;
    color: #64748b;
}

.preview-val {
    font-size: 13px;
    color: #1e293b;
}

.preview-val strong {
    font-weight: 600;
}

.preview-val.change {
    display: flex;
    align-items: center;
    gap: 8px;
}

.preview-val .old {
    color: #94a3b8;
    text-decoration: line-through;
}

.preview-val .new {
    font-weight: 700;
    color: #d97706;
}

.preview-val .new.up {
    color: #166534;
}

.preview-val .new.down {
    color: #dc2626;
}

.preview-val svg {
    color: #64748b;
    flex-shrink: 0;
}

.preview-divider {
    height: 1px;
    background: #e2e8f0;
}

/* Footer */
.modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 16px 24px 20px;
    border-top: 1px solid #f1f5f9;
}

.btn-apply,
.btn-cancel {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
}

.btn-apply {
    background: #d97706;
    color: white;
}

.btn-apply:hover:not(:disabled) {
    background: #b45309;
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
    transform: translateY(-1px);
}

.btn-apply:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.btn-cancel {
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
    background: #f9fafb;
    border-color: #94a3b8;
}

@media (max-width: 480px) {
    .field-row {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
</style>
