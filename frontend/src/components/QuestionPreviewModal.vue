<template>
    <div v-if="visible" class="qpm-overlay" @click.self="emitClose">
        <div class="qpm-card" role="dialog" aria-modal="true" aria-label="題目預覽">
            <!-- Header -->
            <div class="qpm-header">
                <div class="qpm-header-left">
                    <div class="qpm-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <h3 class="qpm-title">題目預覽</h3>
                </div>
                <button class="qpm-close-btn" type="button" @click="emitClose" aria-label="關閉">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            <!-- Body (scrollable) -->
            <div class="qpm-body">
                <!-- Meta Info Grid -->
                <div class="qpm-meta-grid">
                    <div class="qpm-meta-row">
                        <div class="qpm-meta-field">
                            <span class="qpm-meta-label">類科</span>
                            <span class="qpm-meta-value">{{ question?.category || '—' }}</span>
                        </div>
                        <div class="qpm-meta-field">
                            <span class="qpm-meta-label">科目</span>
                            <span class="qpm-meta-value">{{ question?.subject || '—' }}</span>
                        </div>
                        <div class="qpm-meta-field">
                            <span class="qpm-meta-label">年分</span>
                            <span class="qpm-meta-value">{{ question?.year || '—' }}</span>
                        </div>
                    </div>
                    <div class="qpm-meta-row">
                        <div class="qpm-meta-field">
                            <span class="qpm-meta-label">來源</span>
                            <span class="qpm-meta-value">{{ question?.source || '—' }}</span>
                        </div>
                        <div class="qpm-meta-field">
                            <span class="qpm-meta-label">題型</span>
                            <span class="qpm-badge" :class="typeBadgeClass">{{ typeLabel }}</span>
                        </div>
                        <div class="qpm-meta-field">
                            <span class="qpm-meta-label">難度</span>
                            <span class="qpm-badge" :class="diffBadgeClass">{{ diffLabel }}</span>
                        </div>
                    </div>
                </div>

                <!-- Question Content -->
                <div class="qpm-section-label">題目內容</div>
                <div class="qpm-content-card">
                    <p class="qpm-content-text" v-html="formattedContent"></p>
                </div>

                <!-- Options (MCQ only) -->
                <template v-if="isMCQ && question?.options?.length">
                    <div class="qpm-section-label">選項</div>
                    <div class="qpm-options-list">
                        <div v-for="(opt, idx) in question.options" :key="opt.id ?? idx" class="qpm-option"
                            :class="{ 'qpm-option--correct': opt.is_correct }">
                            <div class="qpm-option-label" :class="{ 'qpm-option-label--correct': opt.is_correct }">
                                {{ optionLetter(idx) }}
                            </div>
                            <span class="qpm-option-text" :class="{ 'qpm-option-text--correct': opt.is_correct }">
                                {{ opt.content }}
                            </span>
                            <svg v-if="opt.is_correct" class="qpm-option-check" xmlns="http://www.w3.org/2000/svg"
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    </div>
                </template>

                <!-- Explanation -->
                <template v-if="question?.explanation">
                    <div class="qpm-section-label">解析</div>
                    <div class="qpm-explanation">
                        <svg class="qpm-explanation-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                            <path d="M9 18h6" />
                            <path d="M10 22h4" />
                        </svg>
                        <p class="qpm-explanation-text" v-html="formattedExplanation"></p>
                    </div>
                </template>
            </div>

            <!-- Footer -->
            <div class="qpm-footer">
                <button class="qpm-btn qpm-btn--primary" :class="{ 'qpm-btn--added': isInExam }" @click="handleAdd"
                    :disabled="isInExam">
                    <template v-if="isInExam">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        已加入
                    </template>
                    <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                        加入考卷
                    </template>
                </button>
                <button class="qpm-btn qpm-btn--secondary" @click="emitClose">關閉</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    question: { type: Object, default: null },
    isInExam: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'add'])

const emitClose = () => emit('close')
const handleAdd = () => {
    if (!props.isInExam && props.question) {
        emit('add', props.question)
    }
}

const isMCQ = computed(() => {
    const t = props.question?.question_type || props.question?.type || ''
    return t === 'multipleChoice' || t === 'multiple_choice'
})

const typeLabel = computed(() => {
    return isMCQ.value ? '選擇題' : '簡答題'
})

const typeBadgeClass = computed(() => {
    return isMCQ.value ? 'qpm-badge--mcq' : 'qpm-badge--essay'
})

const diffLabel = computed(() => {
    const map = { easy: '簡單', normal: '普通', hard: '困難', insane: '地獄' }
    return map[props.question?.difficulty] || props.question?.difficulty || '—'
})

const diffBadgeClass = computed(() => {
    const d = props.question?.difficulty
    if (d === 'easy') return 'qpm-badge--easy'
    if (d === 'normal') return 'qpm-badge--normal'
    if (d === 'hard') return 'qpm-badge--hard'
    if (d === 'insane') return 'qpm-badge--insane'
    return ''
})

const optionLetter = (idx) => String.fromCharCode(65 + idx)

const formattedContent = computed(() => {
    return (props.question?.content || '').replace(/\n/g, '<br>')
})

const formattedExplanation = computed(() => {
    return (props.question?.explanation || '').replace(/\n/g, '<br>')
})
</script>

<style scoped>
/* ====== Overlay ====== */
.qpm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(30, 41, 59, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
    animation: qpm-fade-in 0.2s ease;
}

@keyframes qpm-fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* ====== Card ====== */
.qpm-card {
    background: #fff;
    border-radius: 16px;
    width: min(640px, 100%);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 16px 40px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06);
    animation: qpm-slide-up 0.25s ease;
}

@keyframes qpm-slide-up {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* ====== Header ====== */
.qpm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    flex-shrink: 0;
}

.qpm-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.qpm-icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #eef2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #476996;
}

.qpm-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.qpm-close-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #f1f5f9;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: background 0.15s, color 0.15s;
}

.qpm-close-btn:hover {
    background: #e2e8f0;
    color: #334155;
}

/* ====== Body ====== */
.qpm-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* ====== Meta Grid ====== */
.qpm-meta-grid {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.qpm-meta-row {
    display: flex;
    gap: 16px;
}

.qpm-meta-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.qpm-meta-label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
}

.qpm-meta-value {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

/* ====== Badges ====== */
.qpm-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 6px;
    width: fit-content;
}

.qpm-badge--mcq {
    background: #eef2ff;
    color: #4338ca;
}

.qpm-badge--essay {
    background: #fef3c7;
    color: #92400e;
}

.qpm-badge--easy {
    background: #dcfce7;
    color: #166534;
}

.qpm-badge--normal {
    background: #fef3c7;
    color: #92400e;
}

.qpm-badge--hard {
    background: #fee2e2;
    color: #991b1b;
}

.qpm-badge--insane {
    background: #ede9fe;
    color: #5b21b6;
}

/* ====== Section label ====== */
.qpm-section-label {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
}

/* ====== Content Card ====== */
.qpm-content-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
}

.qpm-content-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #1e293b;
}

/* ====== Options ====== */
.qpm-options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.qpm-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: border-color 0.15s, background 0.15s;
}

.qpm-option--correct {
    background: #f0fdf4;
    border: 2px solid #22c55e;
}

.qpm-option-label {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    flex-shrink: 0;
}

.qpm-option-label--correct {
    background: #22c55e;
    color: #fff;
}

.qpm-option-text {
    flex: 1;
    font-size: 14px;
    color: #1e293b;
}

.qpm-option-text--correct {
    font-weight: 600;
    color: #166534;
}

.qpm-option-check {
    color: #22c55e;
    flex-shrink: 0;
}

/* ====== Explanation ====== */
.qpm-explanation {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.qpm-explanation-icon {
    color: #d97706;
    flex-shrink: 0;
    margin-top: 2px;
}

.qpm-explanation-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #92400e;
}

/* ====== Footer ====== */
.qpm-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 16px 24px 20px;
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
}

.qpm-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
}

.qpm-btn:active {
    transform: scale(0.97);
}

.qpm-btn--primary {
    background: #476996;
    color: #fff;
}

.qpm-btn--primary:hover {
    background: #3a5a85;
    box-shadow: 0 2px 8px rgba(71, 105, 150, 0.3);
}

.qpm-btn--added {
    background: #dcfce7;
    color: #166534;
    cursor: default;
}

.qpm-btn--added:hover {
    background: #dcfce7;
    box-shadow: none;
}

.qpm-btn--secondary {
    background: #fff;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.qpm-btn--secondary:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

/* ====== Responsive ====== */
@media (max-width: 640px) {
    .qpm-overlay {
        padding: 0;
        align-items: flex-end;
    }

    .qpm-card {
        width: 100%;
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
    }

    .qpm-meta-row {
        flex-direction: column;
        gap: 12px;
    }
}
</style>
