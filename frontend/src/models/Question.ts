export type QuestionType = 'multipleChoice' | 'essay'
export const QuestionTypeList: QuestionType[] = ['multipleChoice', 'essay']
export type QuestionDifficulty = 'easy' | 'normal' | 'hard' | 'insane'
export const QuestionDifficultyList: QuestionDifficulty[] = ['easy', 'normal', 'hard', 'insane']

export interface QuestionOptionRpc {
  id?: number
  content: string
  is_correct?: boolean
  order?: number
}

export interface QuestionTagRpc {
  id: number
  name: string
}

export interface QuestionRpc {
  id?: number
  content?: string | null
  explanation?: string | null
  type?: string | null
  question_type?: string | null
  difficulty?: string | null
  subject?: string | null
  category?: string | null
  year?: number | null
  source?: string | null
  created_at?: string | null
  updated_at?: string | null
  options?: QuestionOptionRpc[] | null
  tags?: QuestionTagRpc[] | null
  tag_ids?: number[] | null
}

export class QuestionModel {
  id: number | null
  content: string
  explanation: string | null
  question_type: QuestionType
  difficulty: QuestionDifficulty
  subject: string | null
  category: string | null
  year: number | null
  source: string | null
  options: QuestionOptionRpc[]
  tags: QuestionTagRpc[]
  created_at: string | null
  updated_at: string | null

  constructor(data: Partial<QuestionModel> = {}) {
    this.id = data.id ?? null
    this.content = data.content ?? ''
    this.explanation = data.explanation ?? null
    this.question_type = data.question_type ?? 'essay'
    this.difficulty = data.difficulty ?? 'normal'
    this.subject = data.subject ?? null
    this.category = data.category ?? null
    this.year = data.year ?? null
    this.source = data.source ?? null
    this.options = data.options ?? []
    this.tags = data.tags ?? []
    this.created_at = data.created_at ?? null
    this.updated_at = data.updated_at ?? null
  }

  static fromRpcWithExtras(raw: QuestionRpc & Record<string, unknown>): QuestionModel & Record<string, unknown> {
    const safe = raw && typeof raw === 'object' ? raw : ({} as QuestionRpc)
    const model = QuestionModel.fromRpc(safe)
    Object.keys(safe).forEach((key) => {
      if (!(key in model)) {
        model[key] = safe[key]
      }
    })
    return model as QuestionModel & Record<string, unknown>
  }

  static fromRpc(raw: QuestionRpc): QuestionModel {
    const options = this.normalizeOptions(raw.options || [])
    return new QuestionModel({
      id: raw.id ?? null,
      content: this.normalizeText(raw.content) ?? '',
      explanation: this.normalizeText(raw.explanation),
      question_type: this.normalizeType(raw.question_type ?? raw.type, options),
      difficulty: this.normalizeDifficulty(raw.difficulty),
      subject: this.normalizeText(raw.subject),
      category: this.normalizeText(raw.category),
      year: this.normalizeYear(raw.year),
      source: this.normalizeText(raw.source),
      options,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      created_at: raw.created_at ?? null,
      updated_at: raw.updated_at ?? null
    })
  }

  static fromRpcList(list: QuestionRpc[]): QuestionModel[] {
    if (!Array.isArray(list)) return []
    return list.map(item => this.fromRpc(item))
  }

  static toAddPayload(input: QuestionRpc): {
    content: string | null
    explanation: string | null
    question_type: QuestionType
    difficulty: QuestionDifficulty
    subject: string | null
    category: string | null
    year: number | null
    source: string | null
    options: QuestionOptionRpc[]
    tag_ids: number[] | null
  } {
    const options = this.normalizeOptions(input?.options || [])
    return {
      content: this.normalizeText(input?.content),
      explanation: this.normalizeText(input?.explanation),
      question_type: this.normalizeType(input?.question_type ?? input?.type, options),
      difficulty: this.normalizeDifficulty(input?.difficulty),
      subject: this.normalizeText(input?.subject),
      category: this.normalizeText(input?.category),
      year: this.normalizeYear(input?.year),
      source: this.normalizeText(input?.source),
      options,
      tag_ids: this.extractTagIds(input)
    }
  }

  static toUpdatePayload(questionId: number | string, input: QuestionRpc): {
    p_id: number
    p_content: string | null
    p_explanation: string | null
    p_question_type: QuestionType
    p_difficulty: QuestionDifficulty
    p_subject: string | null
    p_category: string | null
    p_year: number | null
    p_source: string | null
    p_options: QuestionOptionRpc[]
    p_tag_ids: number[] | null
  } {
    const options = this.normalizeOptions(input?.options || [])
    return {
      p_id: Number(questionId),
      p_content: this.normalizeText(input?.content),
      p_explanation: this.normalizeText(input?.explanation),
      p_question_type: this.normalizeType(input?.question_type ?? input?.type, options),
      p_difficulty: this.normalizeDifficulty(input?.difficulty),
      p_subject: this.normalizeText(input?.subject),
      p_category: this.normalizeText(input?.category),
      p_year: this.normalizeYear(input?.year),
      p_source: this.normalizeText(input?.source),
      p_options: options,
      p_tag_ids: this.extractTagIds(input)
    }
  }

  private static normalizeType(value: unknown, options: QuestionOptionRpc[]): QuestionType {
    const text = typeof value === 'string' ? value.trim() : ''
    const lower = text.toLowerCase()
    if (lower === 'multiplechoice' || lower === 'multiple_choice') return 'multipleChoice'
    if (lower === 'essay') return 'essay'
    if (lower.includes('choice')) return 'multipleChoice'
    const chineseMultiple = [
      '\u9078\u64c7\u984c',
      '\u55ae\u9078\u984c',
      '\u591a\u9078\u984c',
      '\u662f\u975e\u984c'
    ]
    const chineseEssay = [
      '\u554f\u7b54\u984c',
      '\u7533\u8ad6\u984c'
    ]
    if (chineseMultiple.some(label => text.includes(label))) return 'multipleChoice'
    if (chineseEssay.some(label => text.includes(label))) return 'essay'
    if (options.length > 0) return 'multipleChoice'
    return 'essay'
  }

  private static normalizeDifficulty(value: unknown): QuestionDifficulty {
    if (value === 'medium') return 'normal'
    if (value === 'easy' || value === 'normal' || value === 'hard' || value === 'insane') return value
    return 'normal'
  }

  private static normalizeYear(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  private static normalizeText(value: unknown): string | null {
    if (value === null || value === undefined) return null
    const text = value.toString().trim()
    return text.length ? text : null
  }

  private static normalizeOptions(options: unknown): QuestionOptionRpc[] {
    if (!Array.isArray(options)) return []
    return options
      .map((option, index) => ({
        id: Number.isFinite(Number(option?.id)) ? Number(option?.id) : undefined,
        content: option?.content?.toString().trim() || '',
        is_correct: Boolean(option?.is_correct),
        order: Number.isFinite(option?.order) ? option.order : index + 1
      }))
      .filter(option => option.content.length > 0)
  }

  private static extractTagIds(input: QuestionRpc): number[] | null {
    if (Array.isArray(input?.tag_ids)) return input.tag_ids
    if (Array.isArray(input?.tags)) return input.tags.map(tag => tag.id)
    return null
  }
}
