export interface ExamOptionRpc {
  id?: number
  content?: string | null
  is_correct?: boolean
  isCorrect?: boolean
  order?: number
}

export interface ExamQuestionRpc {
  id?: number
  exam_question_id?: number
  question_id?: number
  question?: number
  order?: number
  points?: number | null
  content?: string | null
  question_content?: string | null
  subject?: string | null
  question_subject?: string | null
  category?: string | null
  question_category?: string | null
  explanation?: string | null
  question_explanation?: string | null
  type?: string | null
  question_type?: string | null
  difficulty?: string | null
  question_difficulty?: string | null
  options?: ExamOptionRpc[] | null
}

export interface ExamQuestion {
  id: number | null
  order: number
  content: string
  options: ExamOptionRpc[]
  subject?: string | null
  category?: string | null
  points?: number | null
  explanation?: string | null
  type?: string | null
  difficulty?: string | null
}

export interface ExamRpc {
  id?: number
  name?: string | null
  description?: string | null
  time_limit?: number | null
  timeLimit?: number | null
  publish?: boolean
  created_at?: string | null
  exam_questions?: ExamQuestionRpc[] | null
  questions?: ExamQuestionRpc[] | ExamQuestion[] | null
}

const toNumber = (value: unknown): number | null => {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export class ExamModel {
  static normalizeOption(raw: ExamOptionRpc, index: number): ExamOptionRpc {
    const safe = raw && typeof raw === 'object' ? raw : {}
    const isCorrect = Boolean(safe.isCorrect ?? safe.is_correct)
    return {
      ...safe,
      id: toNumber(safe.id) ?? safe.id,
      content: safe.content ?? '',
      order: Number.isFinite(Number(safe.order)) ? Number(safe.order) : index + 1,
      is_correct: isCorrect,
      isCorrect
    }
  }

  static normalizeQuestion(raw: ExamQuestionRpc, index: number): ExamQuestion {
    const safe = raw && typeof raw === 'object' ? raw : {}
    return {
      id: toNumber(safe.id ?? safe.question_id ?? safe.question),
      order: Number.isFinite(Number(safe.order)) ? Number(safe.order) : index + 1,
      content: (safe.content ?? safe.question_content ?? '').toString(),
      options: Array.isArray(safe.options)
        ? safe.options.map((opt, optIndex) => this.normalizeOption(opt, optIndex))
        : [],
      subject: safe.subject ?? safe.question_subject ?? null,
      category: safe.category ?? safe.question_category ?? null,
      points: safe.points ?? null,
      explanation: safe.explanation ?? safe.question_explanation ?? null,
      type: safe.type ?? safe.question_type ?? null,
      difficulty: safe.difficulty ?? safe.question_difficulty ?? null
    }
  }

  static normalizeExamQuestion(raw: ExamQuestionRpc, index: number): ExamQuestionRpc & Record<string, unknown> {
    const safe = raw && typeof raw === 'object' ? raw : {}
    const questionId = toNumber(safe.question_id ?? safe.question ?? safe.id)
    const examQuestionId = toNumber(
      safe.exam_question_id ?? (safe.question_id || safe.question ? safe.id : null)
    )

    const order = Number.isFinite(Number(safe.order)) ? Number(safe.order) : index + 1
    const points = Number.isFinite(Number(safe.points)) ? Number(safe.points) : (safe.points ?? null)

    return {
      ...safe,
      id: examQuestionId ?? safe.id ?? null,
      exam_question_id: examQuestionId ?? safe.exam_question_id ?? null,
      question: questionId ?? safe.question ?? safe.question_id ?? null,
      question_id: questionId ?? safe.question_id ?? safe.question ?? null,
      order,
      points,
      question_content: safe.question_content ?? safe.content ?? '',
      question_subject: safe.question_subject ?? safe.subject ?? null,
      question_category: safe.question_category ?? safe.category ?? null,
      question_explanation: safe.question_explanation ?? safe.explanation ?? null,
      question_type: safe.question_type ?? safe.type ?? null,
      question_difficulty: safe.question_difficulty ?? safe.difficulty ?? null,
      options: Array.isArray(safe.options)
        ? safe.options.map((opt, optIndex) => this.normalizeOption(opt, optIndex))
        : []
    }
  }

  static fromRpcDetail(raw: ExamRpc): ExamRpc & {
    timeLimit: number | null
    exam_questions: (ExamQuestionRpc & Record<string, unknown>)[]
    questions: ExamQuestion[]
  } {
    const safe = raw && typeof raw === 'object' ? raw : {}
    const timeLimit = toNumber((safe as ExamRpc).timeLimit ?? (safe as ExamRpc).time_limit)
    const sourceExamQuestions = Array.isArray((safe as ExamRpc).exam_questions)
      ? (safe as ExamRpc).exam_questions as ExamQuestionRpc[]
      : []
    const rawQuestions = Array.isArray((safe as ExamRpc).questions)
      ? (safe as ExamRpc).questions as ExamQuestionRpc[]
      : []

    const examQuestions = (sourceExamQuestions.length > 0 ? sourceExamQuestions : rawQuestions)
      .map((item, index) => this.normalizeExamQuestion(item, index))

    const questions = sourceExamQuestions.length > 0
      ? rawQuestions.map((item, index) => this.normalizeQuestion(item, index))
      : examQuestions.map((item, index) => this.normalizeQuestion(item, index))

    return {
      ...(safe as ExamRpc),
      timeLimit: Number.isFinite(Number(timeLimit)) ? Number(timeLimit) : null,
      exam_questions: examQuestions,
      questions
    }
  }
}
